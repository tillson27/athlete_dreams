# Migrate Production Off AWS to Railway + Cloudflare Workers - Steps 1-5

## Step 1 - Make the API image amd64-portable

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** small
**Owner:** ai
**Completed At:** 2026-09-13
**Completion Notes:**
- `app/Dockerfile` now has no architecture-pinned path. The single offending line became `COPY --from=builder /repo/app/node_modules/@esbuild ./node_modules/@esbuild` (whole scope — npm installs only the platform-matching optional dep).
- Header and builder-stage comments rewritten: the image is architecture-agnostic, and the Debian base is retained because argon2 is a native glibc addon.
- Verified with `docker buildx build --platform linux/amd64 --file app/Dockerfile -t arc-api-amd64 --load .` — build succeeded.
- Inside the amd64 image: `process.arch` = `x64`, `node_modules/@esbuild` = `linux-x64`, Prisma engine = `libquery_engine-debian-openssl-3.0.x.so.node`, `npx prisma migrate deploy --help` resolves, `npx tsx --version` = 4.22.3, and `npx tsx` actually executes a `.ts` file (proving the native esbuild binary loads — the real risk of the scope-wide copy).
- `node dist/index.js` reaches `validateProductionConfig` and exits listing the missing env vars — the expected bare-run outcome. That error list is the authoritative boot-gated variable set for Step 2.
- Remaining `arm64` pins in the repo are all in code later steps retire: `scripts/deploy-prod.sh` and `.github/workflows/deploy-api.yml` (deleted/rewritten in Step 4) and `cdk/lib/api-stack.ts` (archived in Step 9). None were touched here.
- `npm run ci` exit 0.

### Context

**Objective:** Remove the arm64/Graviton assumption from `app/Dockerfile` so the same file produces a working `linux/amd64` image for Railway.

**Done When:**
- `docker buildx build --platform linux/amd64 --file app/Dockerfile -t arc-api-amd64 .` succeeds from the repo root.
- No path in `app/Dockerfile` contains a literal architecture string.
- The built image starts and `node dist/index.js` reaches the `validateProductionConfig` gate (failing on missing env vars is the expected and correct outcome of a bare run).
- `npx prisma migrate deploy --help` and `npx tsx --version` both resolve inside the image, proving the migrate/seed tooling survived the arch change.

**References:**
- Context section 4 (Gaps), section 6 (Constraints)
- `app/Dockerfile`
- Railway requires `linux/amd64`: https://www.answeroverflow.com/m/1141939466827726898

### Plan
- Replace the architecture-pinned esbuild copy with the whole scoped directory, which is arch-agnostic because only the matching platform package is ever installed.
    - Snippet:
      ```dockerfile
      # Before:
      # COPY --from=builder /repo/app/node_modules/@esbuild/linux-arm64 ./node_modules/@esbuild/linux-arm64
      # After:
      COPY --from=builder /repo/app/node_modules/@esbuild ./node_modules/@esbuild
      ```
- Update the file header comment, which currently claims the image is arm64-only for a Graviton Fargate runtime. Per the repo comment rules this is a "why/intent" comment and should stay, but it must state the truth: the image is built for the deploy target's architecture and the base is Debian because argon2 is a native glibc addon.
- Confirm nothing else pins an architecture: the `.prisma` and `@prisma/engines` copies are generated per-build in the builder stage and inherit the build platform, so they need no change. Verify by grepping for `arm64`, `x64`, and `amd64` across `app/Dockerfile`.
- Do **not** change the base image. `node:22.22.2-bookworm-slim` is multi-arch and Debian-based, which the argon2 native addon requires.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run — Mode A (uncommitted, general); only `app/Dockerfile` changed, no `app/AGENTS.md` violations, no fixes needed
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`) — none
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** run under `$step-loop-no-commit`, so `$ci` replaced the commit; changes left uncommitted.)

---

## Step 2 - Railway service config + env var contract

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** ai
**Completed At:** 2026-09-13
**Completion Notes:**
- Added `railway.json` at the repo root: `DOCKERFILE` builder on `app/Dockerfile`, pre-deploy `npx prisma migrate deploy`, start `node dist/index.js`, healthcheck `/v1/health/ready`, `numReplicas: 1`, `restartPolicyType: ON_FAILURE`. Added beyond the plan snippet: `healthcheckTimeout: 300` (Prisma opens its pool on boot — the retired ALB used a 60s grace period) and `numReplicas: 1` (the NFR requires always-on, no cold start).
- Added `docs/deployment-railway-cloudflare.md` with the full env var contract in four sections: boot-gated, also-required, optional, intentionally dropped. **No real secret values.**
- **Coverage verified programmatically.** All 14 `containerEnvironment` keys and all 8 `containerSecrets` keys from `cdk/lib/api-stack.ts:L171-L229` are present in the doc (script-checked, 23/23 including `DATABASE_URL`), and all 10 variables gated by `validateProductionConfig` are in the boot-gated table.
- **Finding — six env vars the app reads that no source documented.** `POSTHOG_API_KEY`, `POSTHOG_HOST`, `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX_REQUESTS`, `PASSWORD_RESET_TOKEN_TTL_MINUTES`, `EMAIL_VERIFICATION_TOKEN_TTL_HOURS` are read by `app/src/` but were never injected by CDK, so production has been running on their in-code defaults. Documented as an **Optional** table (unset = current behavior preserved), and the four that were also missing from `app/.env.example` were added there per the root `AGENTS.md` env-var rule. Note this means **server-side PostHog capture is not currently enabled in production** — pre-existing, not a regression, and not changed by this task.
- Documented that `PORT` must **not** be set manually — Railway assigns it and `app/src/index.ts:19` already honours it; a hardcoded mismatch would fail the health check.
- Documented `DATABASE_URL` as the Railway reference `${{Postgres.DATABASE_URL}}`, and that `npx prisma db seed` is deliberately manual rather than wired into the deploy path.
- No Railway project created and no values set — that is Step 5.
- `npm run ci` exit 0.

### Context

**Objective:** Add the Railway service definition to the repo and document the complete, authoritative environment-variable contract for the API service, derived from `validateProductionConfig` and the current CDK task definition.

**Done When:**
- `railway.json` exists at the repo root, builds from `app/Dockerfile` with the repo root as context, and sets the pre-deploy command to `npx prisma migrate deploy`.
- `docs/deployment-railway-cloudflare.md` contains a table of every required env var, its source, and an example value, with **no real secret values**.
- Every variable that `validateProductionConfig` (`app/src/config/productionConfig.ts`) requires in production is present in the table.
- Every variable that `cdk/lib/api-stack.ts` injects into `containerEnvironment` or `containerSecrets` is either in the table or explicitly documented as intentionally dropped.

**References:**
- Context section 6 (Constraints), section 14 (SSM values table)
- `app/src/config/productionConfig.ts` — the hard boot gate
- `cdk/lib/api-stack.ts` — `containerEnvironment` and `containerSecrets` are the source list
- Railway pre-deploy command: https://docs.railway.com/guides/pre-deploy-command

### Plan
- Add `railway.json` at the repo root.
    - Snippet:
      ```json
      {
        "$schema": "https://railway.com/railway.schema.json",
        "build": { "builder": "DOCKERFILE", "dockerfilePath": "app/Dockerfile" },
        "deploy": {
          "preDeployCommand": "npx prisma migrate deploy",
          "startCommand": "node dist/index.js",
          "healthcheckPath": "/v1/health/ready",
          "restartPolicyType": "ON_FAILURE"
        }
      }
      ```
- Write the env var contract into `docs/deployment-railway-cloudflare.md`. The required set, cross-checked against both sources:
    - **Boot-gated by `validateProductionConfig`:** `APP_URL`, `CORS_ALLOWED_ORIGINS`, `STRIPE_SECRET_KEY`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STRIPE_ACCOUNT_ONBOARDING_RETURN_URL`, `STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL`, `STRIPE_CHECKOUT_SUCCESS_URL`, `STRIPE_CHECKOUT_CANCEL_URL`
    - **Also required by the app:** `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `PORT`, `LOG_LEVEL=info`, `JWT_ACCESS_TOKEN_TTL_SECONDS=3600`, `DONATION_MINIMUM_CENTS=500`, `DEFAULT_CURRENCY=cad`, `SIGNUP_EMAIL_ALLOWLIST` (empty for prod — open signup)
    - **Intentionally dropped:** `DATABASE_USER` / `DATABASE_PASSWORD` / `DATABASE_HOST` / `DATABASE_PORT`. These existed only so CDK could inject the RDS secret piecemeal and reassemble `DATABASE_URL` in the container command. Railway provides `DATABASE_URL` directly by service reference.
- Document that `DATABASE_URL` should be set as a Railway **variable reference** to the Postgres service (`${{Postgres.DATABASE_URL}}`) rather than a pasted literal, so a database recreate does not silently break the API.
- Note in the doc that `PORT` is supplied by Railway at runtime and the app already honours it (`app/src/index.ts:19`), so it should not be hardcoded.
- Do not create the Railway project or set any values — that is Step 5.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run — Mode A; the only `app/` change is `app/.env.example` (documentation of existing vars). No `app/AGENTS.md` violations, no source changes, no fixes needed.
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`) — none
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** run under `$step-loop-no-commit`, so `$ci` replaced the commit; changes left uncommitted.)

---

## Step 3 - Cloudflare Worker front door (static assets + `/v1/*` proxy)

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** ai
**Completed At:** 2026-09-13
**Completion Notes:**

Added `wrangler.jsonc`, `worker/index.ts`, `worker/tsconfig.json`, `worker/worker-configuration.d.ts` (generated), and `client/public/_redirects`. Everything below was verified empirically against `npx wrangler dev --local`, not inferred from docs.

**[IMPORTANT] Plan correction — the `_redirects` targets must be canonical paths, not `.html` files.** The plan's snippet (`/athletes/* /athletes.html 200`) is wrong and was caught in local testing: with `html_handling: "auto-trailing-slash"`, Cloudflare canonicalizes the *target* `/athletes.html` → `/athletes` and emits a **307 redirect** instead of a 200 rewrite. That strips the slug from the address bar (`/athletes/emma-chen` → `/athletes`), which would have broken every athlete deep link and the client router that reads the slug from the path — a silent, production-only failure. Targeting the canonical `/athletes` instead rewrites in place with the URL intact. The final rules are:
```
/favicon.ico        /icon      200
/athletes/*/manage  /athletes  200
/athletes/*         /athletes  200
```

**Route coverage — 37/37 pass** against `wrangler dev`. All 24 `staticRoutes` entries from `cdk/lib/web-stack.ts:52` plus `/`; all four athlete-slug shapes (known slug, unknown slug, each with and without `/manage`) serve `athletes.html` content at a 200 with the URL unchanged; `/favicon.ico` serves the `/icon` bytes (5104 B, identical to `/icon`); `/icon`, `/apple-icon`, `/opengraph-image` serve natively; `/nope-not-a-page` serves `404.html` with a real 404 status; `/robots.txt` and `/sitemap.xml` serve as assets; `/about/` 307s to `/about` (correct canonicalization, matching the CloudFront Function's trailing-slash strip).

**Raw-body proxy verified byte-for-byte** — the highest-risk detail in the task. A 98-byte JSON payload containing non-ASCII (`café — ünïcode ✓`) POSTed to `/v1/webhooks/stripe` arrived at the origin with an identical SHA-256 (`f0c31eff…4563`) and identical byte count, with `Stripe-Signature` intact. A GET to `/v1/athletes?limit=5&cursor=abc%20def` preserved the percent-encoded query string and the `Authorization` header exactly.

**Findings worth carrying forward:**
- **Per-slug athlete pages are pre-rendered** (`client/out/athletes/emma-chen.html` etc., via `generateStaticParams`) but the `/athletes/*` splat shadows them, so the generic shell is served — exactly what CloudFront does today, so **no regression**. Serving the pre-rendered pages instead would improve SEO/OG tags for seeded athletes; deliberately not done here because the step specifies `athletes.html` and the change needs its own validation. Logged as future work.
- **An `admin/` section exists in the export** (`admin.html`, `admin/users.html`, `admin/allowlist.html`, `admin/campaigns.html`, `admin/donations.html`, `admin/athletes.html`) that is **absent from the CloudFront `staticRoutes` map**, meaning `/admin` currently returns `404.html` in production. Under Workers `auto-trailing-slash` these now resolve to 200. This is a **behavior change** — arguably fixing an oversight, but it exposes the admin portal at the edge, so flagging rather than assuming. No auth change is implied (the pages gate client-side), but it should be a conscious decision before cutover.
- `run_worker_first: ["/v1/*"]` confirmed valid as an array (max 100 patterns, `!` negation supported). Static assets never invoke the Worker, so they stay free.

**Supporting work beyond the plan:** the Worker is a TypeScript deliverable that nothing type-checked. Added `worker/tsconfig.json`, generated the binding types via `wrangler types`, and wired `type-check:worker` into the root `type-check` script so `npm run ci` now covers it. Added root devDeps `wrangler` and `typescript`, the `worker:types` / `worker:dev` scripts, and `.wrangler/` to `.gitignore`.

`npm run ci` exit 0.

### Context

**Objective:** Build the Cloudflare Worker that serves the static export and proxies `/v1/*` to Railway, reproducing every routing behavior the CloudFront Function provides today while keeping the site same-origin.

**Done When:**
- `wrangler.jsonc` exists with an `assets` block pointing at `client/out` and `run_worker_first` set to exactly `["/v1/*"]`.
- A Worker entry script proxies `/v1/*` to `API_ORIGIN` with method, headers, query string, and **raw body** preserved.
- Every route in the CloudFront Function's `staticRoutes` map (`cdk/lib/web-stack.ts:52`) resolves, verified by a checklist in the PR description or step notes.
- `/athletes/<slug>` and `/athletes/<slug>/manage` serve `athletes.html`.
- `/favicon.ico` serves the `/icon` asset.
- An unknown path serves `/404.html`.
- `npx wrangler dev` serves the built `client/out` locally and proxies `/v1/health/ready` to a configured origin.

**References:**
- Context section 8 (Proposed approach), section 11 (Edge cases)
- `cdk/lib/web-stack.ts:52` — `STATIC_ROUTE_REWRITE_CODE`, the behavior to reproduce
- `app/src/app.ts:43` — the Stripe raw-body constraint
- `run_worker_first` accepts an array of patterns: https://developers.cloudflare.com/workers/static-assets/binding/
- Static asset requests are free and unlimited: https://developers.cloudflare.com/workers/platform/pricing/

### Plan
- Add `wrangler.jsonc` at the repo root.
    - Snippet:
      ```jsonc
      {
        "name": "athlete-arc",
        "compatibility_date": "2026-09-01",
        "main": "worker/index.ts",
        "assets": {
          "directory": "client/out",
          "binding": "ASSETS",
          "html_handling": "auto-trailing-slash",
          "not_found_handling": "404-page",
          // Only the API paths invoke the Worker; every static asset is served
          // directly by Cloudflare, which is free and uncounted.
          "run_worker_first": ["/v1/*"]
        }
      }
      ```
- Write `worker/index.ts` as a thin pass-through proxy. The body must stream — never call `request.text()` or `request.json()`, which would break Stripe signature verification.
    - Snippet:
      ```ts
      export default {
        async fetch(request: Request, env: Env): Promise<Response> {
          const url = new URL(request.url);
          if (!url.pathname.startsWith('/v1/')) {
            return env.ASSETS.fetch(request);
          }
          const target = new URL(url.pathname + url.search, env.API_ORIGIN);
          // Constructing from the original Request streams the body through
          // untouched, which the Stripe webhook signature depends on.
          return fetch(new Request(target, request));
        },
      };
      ```
- Add `client/public/_redirects` for the rules Workers static-asset routing cannot express — the athlete slug rewrite and the favicon alias. These are internal same-project rewrites, which Cloudflare does support. Note that `client/public/` **does not exist yet**; it is the standard Next.js directory for pass-through static files and its contents land at the root of `client/out`. The project currently has no such directory because it uses App Router metadata routes (`client/app/icon.tsx`) instead, which is also why `/favicon.ico` needs an explicit alias to `/icon`.
    - Snippet:
      ```
      /favicon.ico        /icon      200
      /athletes/*/manage  /athletes  200
      /athletes/*         /athletes  200
      ```
    - **CORRECTED during execution.** The original snippet targeted `/athletes.html`
      and `/icon`; `html_handling` canonicalizes an `.html` target and downgrades the
      rewrite to a 307 redirect, dropping the slug from the URL. Targets must be the
      canonical extensionless paths. See the Step 3 completion notes.
- Confirm ordering: `_redirects` rules are evaluated against the assets, and the more specific `/manage` rule must precede the bare slug rule.
- Cross-check the full `staticRoutes` list from `cdk/lib/web-stack.ts:52` against what `html_handling: "auto-trailing-slash"` resolves automatically. Any route it does not cover gets an explicit `_redirects` line. Record the checked list in the completion notes.
- Add `API_ORIGIN` as a `vars` entry documented as the Railway public URL, so it can be pointed at the preview deployment first and the production URL later.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run — the only `client/` change is the new static `client/public/_redirects`; no React/TS touched, no `client/AGENTS.md` rules apply, no fixes needed
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`) — none
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** run under `$step-loop-no-commit`, so `$ci` replaced the commit; changes left uncommitted.)

---

## Step 4 - Replace the deploy pipelines

### Metadata
**Status:** Complete
**Prereqs:** 1, 2, 3
**Size:** medium
**Owner:** ai
**Completed At:** 2026-09-13
**Completion Notes:**
- **`.github/workflows/deploy-api.yml`** rewritten for Railway: keeps `jobs.ci` reusing `./.github/workflows/ci.yml` and keeps `workflow_dispatch`; drops OIDC/ECR/CDK entirely; deploys with `railway up --service "$RAILWAY_SERVICE" --ci` authenticated by the `RAILWAY_TOKEN` secret. A header comment states explicitly that migrations run via the `railway.json` pre-deploy command so the missing migration step reads as deliberate.
- **`.github/workflows/deploy-web.yml`** rewritten for Cloudflare: keeps the `STATIC_EXPORT=true` build and the `NEXT_PUBLIC_*` passthrough, replaces the S3 sync + CloudFront invalidation with `cloudflare/wrangler-action@v3`, authenticated by `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`. `NEXT_PUBLIC_API_BASE_URL` defaults to `https://athletearc.ca` and stays overridable by variable for preview deploys; `RAILWAY_API_ORIGIN` optionally overrides the Worker's `API_ORIGIN` the same way. No invalidation step — Cloudflare versions assets per deployment, so it has no equivalent.
- **Deleted** `.github/scripts/run-ecs-task.sh` (and the now-empty `.github/scripts/`), `scripts/deploy-prod.sh`, `scripts/port-forward-prod-rds.sh`.
- **Root `package.json`:** `cdk` removed from `build`, `type-check`, `ci`, and `postinstall`; `deploy` (which pointed at `scripts/deploy-prod.sh`) replaced by `deploy:api` and `deploy:web`. Added `build:static` to `client/package.json` so the local and CI static-export paths are the same command.
- **`.github/workflows/ci.yml`:** dropped the `Synth CDK test stacks` step and `cdk/package-lock.json` from the npm cache key, since root `ci` no longer builds CDK. Did **not** add a separate worker type-check step — `npm run type-check` already includes `type-check:worker`, so a second step would be duplication.
- **Verified:** all four workflows parse as YAML; a precise grep for `aws-actions|AWS_DEPLOY_ROLE_ARN|amazonaws|ECR|ecr-login|cloudfront|aws s3|aws cloudformation|AWS_REGION` across `.github/workflows/` returns nothing; `build`/`type-check`/`ci`/`postinstall` are all cdk-free; `npm run build:static --prefix client` exits 0 and `npx wrangler deploy --dry-run` resolves 242 assets and both bindings.
- **Finding — GitHub Pages is still enabled.** `gh api repos/:owner/:repo/pages` reports the site live at `https://tillson27.github.io/athlete_dreams/` with `build_type: workflow`, `public: true`, but `status: null` (never successfully built). `deploy-client-pages.yml` is `workflow_dispatch`-only, touches no AWS, and is orthogonal to this migration, so per the plan it was **left untouched** and the finding recorded rather than guessed at. Decide separately whether to retire it.
- **Finding — two possible deploy paths.** Step 5c adds the Railway service *from the GitHub repo*, which enables Railway's own auto-deploy on push. That path bypasses the `ci.yml` gate that `deploy-api.yml` enforces. Documented in `docs/deployment-railway-cloudflare.md` with a recommendation to disable Railway auto-deploy and deploy through the workflow. **This needs a decision during Step 5.**
- **Note for Step 8:** `postinstall` no longer installs `cdk/` dependencies. Existing `cdk/node_modules` is untouched, so `npx cdk destroy` still works, but a fresh clone would need `npm --prefix cdk install` first.
- `npm run ci` exit 0.

### Context

**Objective:** Replace the AWS deploy automation with Railway and Wrangler equivalents, and remove the AWS-specific scripts and workflows.

**Done When:**
- `.github/workflows/deploy-api.yml` deploys the API to Railway and still runs the existing `ci.yml` gate first.
- `.github/workflows/deploy-web.yml` builds the static export and deploys the Worker with `wrangler deploy`.
- `.github/scripts/run-ecs-task.sh`, `scripts/deploy-prod.sh`, and `scripts/port-forward-prod-rds.sh` are deleted.
- Root `package.json` no longer references `cdk` in `build`, `type-check`, `ci`, or `postinstall`, and `deploy` no longer points at `scripts/deploy-prod.sh`.
- `npm run ci` passes.
- No workflow references `aws-actions/*`, `AWS_DEPLOY_ROLE_ARN`, or an ECR registry.

**References:**
- Context section 10 (Package-level impact)
- `.github/workflows/deploy-api.yml`, `.github/workflows/deploy-web.yml` — the reuse-`ci.yml` pattern and the `vars`/`secrets` conventions to preserve
- `package.json` — root scripts

### Plan
- Rewrite `.github/workflows/deploy-api.yml`: keep the `jobs.ci` reuse of `./.github/workflows/ci.yml`, keep `workflow_dispatch`, drop the OIDC/ECR/CDK steps, and deploy with the Railway CLI authenticated by a `RAILWAY_TOKEN` secret. Migrations run via the pre-deploy command configured in Step 2, so the workflow does not run them separately — note this in a comment so the removal is not mistaken for an omission.
- Rewrite `.github/workflows/deploy-web.yml`: keep the `STATIC_EXPORT=true` build and the `NEXT_PUBLIC_*` variable passthrough, replace the S3 sync and CloudFront invalidation with `wrangler deploy`, authenticated by `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Set `NEXT_PUBLIC_API_BASE_URL` to the site origin (`https://athletearc.ca`). It must be an absolute URL — `client/lib/api.ts:127` throws on an empty string — but pointing it at the site origin keeps every request same-origin through the Worker.
- Delete the three AWS scripts and update root `package.json`.
- Leave `.github/workflows/deploy-client-pages.yml` alone unless it is already dead; check whether GitHub Pages is still in use before touching it, and note the finding rather than guessing.
- Update `.github/workflows/ci.yml` only if it references `cdk` build/test/synth steps that Step 9 will archive.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$e2e-review` (`/e2e-review`) run — traced the full deploy path across `app/` (image), `client/` (static export), `worker/` (front door), and the two workflows; verified no dangling references to the deleted scripts in active files (the only hit is `cdk/README.md`, which Step 9 marks historical) and removed the redundant worker type-check step from `ci.yml`
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`) — none
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** run under `$step-loop-no-commit`, so `$ci` replaced the commit; changes left uncommitted.)

---

## Step 5 - [USER] Provision Railway + Cloudflare and deploy to preview

### Metadata
**Status:** Incomplete
**Prereqs:** 1, 2, 3, 4
**Size:** medium
**Owner:** user
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Stand up the new production stack on preview URLs, with the AWS stack still live and serving `athletearc.ca` untouched.

> **[STRICT] This is a user-executed step.** The agent authors and refines the runbook, answers questions, and verifies results afterward. The agent must not run the provisioning, deploy, or secret-retrieval commands.

> **[STRICT] Secret handling.** Retrieved secret values go straight from AWS into Railway's env var store. They must never be written to a file in this repo, pasted into a task document, or committed.

**Done When:**
- A Railway project exists with an API service and a Postgres service.
- Every env var from the Step 2 contract is set on the API service.
- `prisma migrate deploy` has run successfully via the pre-deploy command.
- The seed has been run once.
- The Railway public URL returns `200` from `/v1/health/ready`.
- A Cloudflare Worker is deployed on its `workers.dev` preview URL, serving the static client and proxying `/v1/*` to Railway.
- `athletearc.ca` is still served by AWS and completely unaffected.

**References:**
- Context section 14 — the SSM value table (all seven values port over unchanged)
- Context section 15 — confirm the Railway Postgres vs. Neon decision before starting
- `docs/deployment-railway-cloudflare.md` — the env var contract from Step 2

### Plan

**5a. Confirm the database decision.** Context section 15 recommends Railway Postgres. Confirm before provisioning.

**5b. Retrieve the four production secrets from AWS.** (The prose previously said "five" — there are five secrets in the account, but only four are ported. Verified against `aws secretsmanager list-secrets` on 2026-09-13: `arc/prod/stripe/secret-key`, `arc/prod/stripe/connect-webhook-secret`, `arc/prod/rds/master`, `arc/prod/api/jwt`, `arc/prod/resend/api-key`.) `arc/prod/rds/master` is deliberately excluded — the old database credentials are not reused.

**Preferred: pipe each secret straight into Railway so the value is never displayed, logged, or written to a transcript.** This satisfies the secret-handling rule by construction rather than by care:
```bash
set_from_aws() {  # set_from_aws <railway-var-name> <aws-secret-id>
  railway variables --set "$1=$(aws secretsmanager get-secret-value \
    --secret-id "$2" --region us-east-1 --query SecretString --output text)"
}
set_from_aws STRIPE_SECRET_KEY                arc/prod/stripe/secret-key
set_from_aws STRIPE_CONNECT_WEBHOOK_SECRET    arc/prod/stripe/connect-webhook-secret
set_from_aws RESEND_API_KEY                   arc/prod/resend/api-key
set_from_aws JWT_SECRET                       arc/prod/api/jwt
```
Only fall back to printing a value (`--query SecretString --output text`) for manual paste into the Railway dashboard if the CLI path is unavailable.

**5c. Create the Railway project**, add a Postgres service, then add the API service from the GitHub repo.

> **REVISED 2026-09-14 — `railway.json` is deprecated.** Railway now warns that
> config-as-code (`railway.json` / `railway.toml`) stops working **2026-12-01**
> and wants Infrastructure-as-Code at `.railway/railway.ts`. Step 2's
> `railway.json` has been deleted and replaced by `.railway/railway.ts`, with
> `railway` added as a root devDependency and `npm run railway:plan` to check
> drift. Build and pre-deploy configuration is unchanged in substance.

**5d. Set the env vars** per the Step 2 contract. Use `${{Postgres.DATABASE_URL}}` as a reference for `DATABASE_URL`, not a literal.

> **REVISED 2026-09-14 — `APP_URL` must NOT be `https://athletearc.ca` yet.** The
> original instruction was wrong. The four Stripe URLs are fine at their final
> values (Stripe testing is dropped, and they are only followed after a redirect
> the preview never initiates), but `APP_URL` is what email verification links
> are built from. Setting it to `athletearc.ca` before cutover makes the Step 6c
> verification email point at the **live AWS site**, so the click would verify
> the account in the old database and the test would prove nothing. Keep it on
> the Railway URL, move it to the workers.dev URL for the 6c test, and only set
> `https://athletearc.ca` at cutover.

**5e. Deploy and watch the pre-deploy command.** A non-zero exit fails the deploy and the logs will show the Prisma error. Confirm `Applying migration` lines appear for the full history in `app/prisma/migrations/`.

**5f. Run the seed once.** `railway ssh --service <name> -- npx prisma db seed` is
the clean path. If the environment blocks remote shell execution, create a
temporary TCP proxy on the Postgres service, run `npx tsx prisma/seed.ts` from
`app/` with `DATABASE_URL` set to the resolved `DATABASE_PUBLIC_URL`, then
**delete the proxy immediately** — it exposes Postgres to the public internet
while it exists. The seed uses upserts and is safe to repeat.

**5g. Verify the API directly:**
```bash
curl -i https://<railway-public-url>/v1/health/ready
```

**5h. Deploy the Worker to its preview URL**, with `API_ORIGIN` set to the Railway public URL.

> **[STRICT] Build the preview against the preview origin, not production.** `NEXT_PUBLIC_API_BASE_URL` is baked in at build time. If the preview is built with the production default (`https://athletearc.ca`), the preview client will send every request to the **live AWS production API** — exercising real data and real Stripe while appearing to test the new stack, and making the preview look healthy no matter how broken Railway is. It must be the workers.dev URL until cutover.

```bash
# Two-pass: the workers.dev hostname is only known after the first deploy.
npx wrangler deploy --var API_ORIGIN:"https://<railway-public-url>"
# Note the workers.dev URL it prints, then rebuild the client against it and redeploy:
NEXT_PUBLIC_API_BASE_URL="https://athlete-arc.<subdomain>.workers.dev" \
  npm run build:static --prefix client
npx wrangler deploy --var API_ORIGIN:"https://<railway-public-url>"
```
(`build:static` was added to `client/package.json` in Step 4 and sets `STATIC_EXPORT=true`, so the local and CI export paths are one command.)

**5i. Verify the preview end-to-end plumbing:**
```bash
curl -i https://athlete-arc.<subdomain>.workers.dev/v1/health/ready   # 200 via proxy
curl -i https://athlete-arc.<subdomain>.workers.dev/about             # 200 static
curl -i https://athlete-arc.<subdomain>.workers.dev/nope-not-a-page   # 404.html
```

### Step checklist
- [ ] Runbook authored, reviewed with the user, and handed off
- [ ] User confirms the step is complete
- [ ] Agent verifies the reported outcome (read-only checks only)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
