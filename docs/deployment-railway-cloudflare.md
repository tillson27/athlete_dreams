# Deployment — Railway + Cloudflare

Operational reference for the production deployment: the Railway API + Postgres services and the Cloudflare Worker front door.

Companion documents:
- `docs/infrastructure-and-scaling.md` — architecture, cost model, and scaling triggers.
- `docs/aws-architecture-and-orchestration.md` — the retired AWS design, kept for history.

Migration plan of record: `.ai/tasks/2026-09-13/aws-to-railway-cloudflare-migration/`.

---

## Topology

```
athletearc.ca ───▶ Cloudflare Worker + static assets (client/out)
www.athletearc.ca      run_worker_first: ["/v1/*"]
                             │  /v1/* proxied, body streamed
                             ▼
                       Railway
                         ├─ API service  (Docker, linux/amd64)
                         └─ Postgres service
```

Everything is same-origin: the client and the API share `athletearc.ca`, so `CORS_ALLOWED_ORIGINS` stays a single entry and the Stripe webhook URL (`https://athletearc.ca/v1/webhooks/stripe`) is unchanged from the AWS deployment.

---

## Railway service configuration

`.railway/railway.ts` is the Infrastructure-as-Code source for the project. It
declares the API service, the Postgres database, and the Postgres volume.

> Railway's older config-as-code (`railway.json` / `railway.toml`) is deprecated
> and stops working **2026-12-01**. This repo used `railway.json` briefly during
> the migration and has since moved to `.railway/railway.ts`; do not reintroduce
> the JSON form.

Verify the file still matches the live project with `npm run railway:plan`. A
clean run prints *"Your Railway configuration is already up to date."*

| Field | Value | Why |
|---|---|---|
| `build.builder` | `DOCKERFILE` | The API image is defined by `app/Dockerfile`. |
| `build.dockerfilePath` | `app/Dockerfile` | Build context is the repo root, which the Dockerfile requires — `fad-common` is a `file:../common` workspace dependency. |
| `preDeploy` | `npx prisma migrate deploy` | Runs in a separate container after build and **before the new deployment takes traffic**; a non-zero exit fails the deploy and the previous revision keeps serving. |
| `start` | `node dist/index.js` | Matches the Dockerfile `CMD`; the image `WORKDIR` is `/repo/app`. |
| `healthcheck` | `/v1/health/ready` | Same probe the retired ALB target group used. Returns 503 when Postgres is unreachable, so a broken `DATABASE_URL` fails the deploy instead of serving errors. |
| `replicas` | `1` | Always-on, so there is no cold start. In-memory rate-limit buckets are per-process, so a single replica is strictly more consistent than the two Fargate tasks it replaces. |
| `restartPolicyType` | `ON_FAILURE` | Crash-loop on a failed boot gate rather than silently degrading. |

Environment variable **values are never written into `.railway/railway.ts`** —
each key is declared as `preserve()`, which tells Railway to keep whatever value
is already set on the service. The file is therefore safe to commit.

The Postgres image is pinned to `ghcr.io/railwayapp-templates/postgres-ssl:17`.
The SDK's `postgres()` helper would default to a bare `postgres:18`, which both
drops SSL and points an 18 binary at a PGDATA directory created by 17 — Postgres
refuses to start in that state. Never bump the major version without a
dump/restore.

The image must be `linux/amd64` — Railway does not run arm64 images. `app/Dockerfile` is architecture-agnostic and builds correctly for both.

### [STRICT] Pick one deploy path

`.github/workflows/deploy-api.yml` runs the shared CI gate and then `railway up`, which uploads the checked-out tree — so the deployed revision is exactly the SHA that passed CI.

Railway's own GitHub integration can *also* auto-deploy the service on every push. If both are active, deploys arrive from two paths and **the auto-deploy path bypasses the CI gate entirely**. Turn Railway's auto-deploy off on the API service and deploy through the workflow, or accept ungated deploys deliberately. Do not leave it ambiguous.

| Path | CI gate | Triggered by |
|---|---|---|
| `deploy-api.yml` (recommended) | Yes — `ci.yml` must pass first | Manual `workflow_dispatch` |
| Railway GitHub auto-deploy | **No** | Every push to the connected branch |

### Deploy workflow inputs

| Workflow | Secrets | Variables |
|---|---|---|
| `deploy-api.yml` | `RAILWAY_TOKEN` | `RAILWAY_SERVICE` |
| `deploy-web.yml` | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | `NEXT_PUBLIC_API_BASE_URL` (defaults to `https://athletearc.ca`), `NEXT_PUBLIC_DATA_SOURCE`, `RAILWAY_API_ORIGIN` (overrides the Worker's `API_ORIGIN`, for preview deploys) |

Both are `workflow_dispatch` only, matching the repo's existing deliberate-deploy convention. Locally, `npm run deploy:api` and `npm run deploy:web` do the same two things.

**The seed is not automatic.** `npx prisma db seed` is run manually as a Railway one-off command on first bring-up. It uses upserts (`app/prisma/seed.ts`) and is safe to repeat, but it is deliberately not wired into the deploy path.

---

## Environment variable contract — API service

**[STRICT] No value in this table is a real secret.** Secrets live only in Railway's variable store and in GitHub Actions secrets. Never commit one.

`validateProductionConfig` (`app/src/config/productionConfig.ts`) runs before anything else in `app/src/index.ts` and throws when `NODE_ENV=production` and any gated variable is missing or non-HTTPS. A missing variable is a boot crash, not a subtle 500 — which is why this table is exhaustive.

### Boot-gated — the deploy crash-loops without these

| Variable | Example / value | Source | Notes |
|---|---|---|---|
| `APP_URL` | `https://athletearc.ca` | fixed | Must be HTTPS and must not be a localhost host. |
| `CORS_ALLOWED_ORIGINS` | `https://athletearc.ca` | fixed | Comma-separated. Every entry must be HTTPS and non-localhost. Same-origin through the Worker means this list stays minimal. |
| `STRIPE_SECRET_KEY` | `sk_live_…` / `sk_test_…` | AWS secret `arc/prod/stripe/secret-key` | Must match `^(sk\|rk)_(test\|live)_`. |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | `whsec_…` | AWS secret `arc/prod/stripe/connect-webhook-secret` | Rejected if it contains `replace` or `placeholder`. |
| `RESEND_API_KEY` | `re_…` | AWS secret `arc/prod/resend/api-key` | Rejected if it contains `replace` or `placeholder`. |
| `RESEND_FROM_EMAIL` | `info@athletearc.ca` | SSM `/arc/prod/email/from-address` | Rejected if it contains `resend.dev` — it must be a verified production sender. |
| `STRIPE_ACCOUNT_ONBOARDING_RETURN_URL` | `https://athletearc.ca/athletes/me/manage?stripe_return=1` | SSM `/arc/prod/stripe/account-onboarding-return-url` | |
| `STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL` | `https://athletearc.ca/athletes/me/manage?stripe_refresh=1` | SSM `/arc/prod/stripe/account-onboarding-refresh-url` | |
| `STRIPE_CHECKOUT_SUCCESS_URL` | `https://athletearc.ca/donate/thanks` | SSM `/arc/prod/stripe/checkout-success-url` | `StripeService` appends `?session_id={CHECKOUT_SESSION_ID}&athlete=<slug>`, so store the bare URL. |
| `STRIPE_CHECKOUT_CANCEL_URL` | `https://athletearc.ca` | SSM `/arc/prod/stripe/checkout-cancel-url` | |

All ten public-URL values are already correct for `athletearc.ca` and do **not** change at DNS cutover — the origin is unchanged by design.

### Also required by the application

| Variable | Example / value | Source | Notes |
|---|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway service reference | **Set as a reference, not a pasted literal**, so recreating the database does not silently break the API. |
| `JWT_SECRET` | long random string | AWS secret `arc/prod/api/jwt` | Rotating it invalidates every live session. |
| `NODE_ENV` | `production` | fixed | Also what arms `validateProductionConfig`. |
| `LOG_LEVEL` | `info` | fixed | pino writes to stdout; Railway captures it. |
| `JWT_ACCESS_TOKEN_TTL_SECONDS` | `3600` | fixed | |
| `DONATION_MINIMUM_CENTS` | `500` | SSM `/arc/prod/donations/minimum-cents` | |
| `DEFAULT_CURRENCY` | `cad` | SSM `/arc/prod/donations/default-currency` | Lowercase ISO code, as Stripe expects. |
| `SIGNUP_EMAIL_ALLOWLIST` | *(empty)* | fixed | Empty means open signup. A non-empty value gates both sign-up **and** sign-in. |

`PORT` is supplied by Railway at runtime and the app already honours it (`app/src/index.ts:19`, falling back to `4000`). **Do not set it manually** — a hardcoded value that disagrees with Railway's assigned port makes the health check fail.

### Optional — unset today, and unset means unchanged behavior

These are read by the app but were never injected by `cdk/lib/api-stack.ts`, so leaving them unset on Railway reproduces current production behavior exactly.

| Variable | Default if unset | Read by |
|---|---|---|
| `POSTHOG_API_KEY` | unset — server-side capture disabled, logged once as a warning | `app/src/services/infrastructure/PostHogService.ts` |
| `POSTHOG_HOST` | `https://us.i.posthog.com` | `app/src/services/infrastructure/PostHogService.ts` |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | `app/src/api/auth/AuthRouterFactory.ts` |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | `20` | `app/src/api/auth/AuthRouterFactory.ts` |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | `60` | `app/src/api/auth/AuthService.ts` |
| `EMAIL_VERIFICATION_TOKEN_TTL_HOURS` | `48` | `app/src/api/auth/AuthService.ts` |

### Intentionally dropped

| Variable | Why it is gone |
|---|---|
| `DATABASE_USER` | Existed only so CDK could inject the RDS secret piecemeal. |
| `DATABASE_PASSWORD` | Same — the container entrypoint reassembled `DATABASE_URL` from the four parts. |
| `DATABASE_HOST` | Same. |
| `DATABASE_PORT` | Same. |

Railway supplies a complete `DATABASE_URL` by service reference, so the shell reassembly in `cdk/lib/api-stack.ts` has no equivalent and none is needed.

---

## Cloudflare Worker front door

`wrangler.jsonc` at the repo root defines the Worker. Static assets are served from `client/out`; only `/v1/*` invokes the Worker, because Cloudflare serves static assets free and unlimited but bills Worker invocations.

| Variable | Where | Value |
|---|---|---|
| `API_ORIGIN` | `wrangler.jsonc` `vars` / Worker environment | The Railway public URL. Points at the preview deployment during bring-up, and at the production Railway URL after cutover. |

The Worker must never read the request body — the Stripe webhook signature is computed over the raw bytes. See the raw-body constraint at `app/src/app.ts:L42-L46`, where the webhook router is mounted with its own `express.raw` parser ahead of the global JSON parser.

---

## Client build variables

The static export is built with `STATIC_EXPORT=true`. `NEXT_PUBLIC_API_BASE_URL` is set to `https://athletearc.ca` — absolute, because `resolveBaseUrl` (`client/lib/api.ts:L128-L137`) throws when the variable is set to an empty string, but pointing at the site origin keeps every request same-origin through the Worker.
