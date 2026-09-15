# Migrate Production Off AWS to Railway + Cloudflare Workers

Date: 2026-09-13
Task slug: aws-to-railway-cloudflare-migration
Status: Draft

## 0) Summary

- **Objective:** Move the Athlete Arc production deployment off AWS (ECS Fargate + ALB + NAT + RDS + CloudFront/S3) onto Railway (API + Postgres) behind a Cloudflare Worker front door serving the static client, cutting spend from ~$139/mo to ~$12–16/mo.
- **Why now:** AWS credits were exhausted at the end of July 2026. August 2026 was the first fully-paid month at **$212.30**, and September is tracking the same. A verified **54% of the pre-tax bill is infrastructure plumbing** (NAT, ALB, public IPv4, Container Insights, Secrets Manager) that delivers no user value at current traffic. The product has very few users and is deliberately not scaling right now.
- **Primary outcomes:**
  - Production runs at ~$12–16/mo with no loss of user-facing functionality.
  - `athletearc.ca` keeps serving the same routes, and the Stripe webhook URL is unchanged.
  - All AWS production resources are torn down, including retained ones.

---

## 1) Success criteria

- `https://athletearc.ca` and `https://www.athletearc.ca` serve the static client with every route that works today still working (verified against the route list in `cdk/lib/web-stack.ts:52`).
- `https://athletearc.ca/v1/health/ready` returns `200` through the Cloudflare Worker proxy to Railway.
- A Stripe Connect webhook delivered to `https://athletearc.ca/v1/webhooks/stripe` verifies its signature successfully — proving the raw request body survives the Worker proxy byte-for-byte.
- Sign-up, email verification (Resend), sign-in, athlete profile publish with an image upload, and a Stripe test-mode donation all complete end-to-end.
- `aws cloudformation describe-stacks` in `us-east-1` returns no `Arc-prod-*` stacks, and the retained-resource sweep is complete.
- The AWS bill for the first full month after cutover is under $2 (Route 53 zone only, if retained).

**Acceptance criteria (definition of done):**
- Railway hosts the API and Postgres; the Cloudflare Worker hosts the static assets and proxies `/v1/*`.
- No AWS credential, ARN, or region appears in any active deploy path.
- `npm run ci` passes at repo root.
- `docs/infrastructure-and-scaling.md` and `cdk/README.md` describe the new architecture, not the old one.

---

## 2) Scope and non-goals

**In scope:**
- Making the API container image amd64-portable (Railway requires `linux/amd64`).
- Railway service configuration: API service, Postgres service, env vars, pre-deploy migration command.
- A Cloudflare Worker with static assets that serves `client/out` and proxies `/v1/*` to Railway.
- Replacing the CloudFront Function route-rewrite logic with Workers static-asset routing plus `_redirects`.
- Rewriting the deploy pipelines and retiring the AWS ones.
- DNS cutover for `athletearc.ca` with a documented rollback.
- Full AWS production teardown including retained resources.
- Updating the infrastructure documentation.

**Out of scope:**
- Any change to application behavior, API contracts, Prisma schema, or UI.
- Migrating existing production data. **The user has explicitly accepted data loss** — the new database is seeded from `app/prisma/seed.ts`.
- Moving images out of Postgres into object storage (see *Future work* below).
- The `test` environment, which is being destroyed separately and before this task begins.
- Re-implementing the WAF, the six CloudWatch alarms, or Container Insights dashboards. Railway and Cloudflare provide their own basic observability; richer monitoring is deferred until there is traffic to justify it.

**Out-of-scope edge cases:**
- Multi-region or HA failover — a single Railway region is appropriate at this scale and matches the current single-AZ RDS posture.
- Zero-downtime cutover. A few minutes of downtime during DNS propagation is acceptable and far cheaper than engineering around it.
- Preserving the CloudFront distribution IDs or the S3 bucket contents; both are rebuildable from source.

---

## 3) Background and motivation

`docs/infrastructure-and-scaling.md` designed the current architecture for 1,000–10,000 users and correctly predicted a ~$130–160/mo lean cost. The design is sound for that target. The problem is that the target has not arrived, the credits have, and the bill is now real.

Verified August 2026 spend by usage type:

| Usage type | Aug 2026 | Category |
|---|---|---|
| `InstanceUsage:db.t4g.small` (×2 envs) | $45.41 | workload |
| `Fargate-ARM-vCPU/GB-Hours` | $41.33 | workload |
| `LoadBalancerUsage` (×2 ALBs) | $31.95 | plumbing |
| `NatGateway-Hours` | $30.42 | plumbing |
| `USE1-PublicIPv4:InUseAddress` (6 addresses) | $21.28 | plumbing |
| `CW:MetricMonitorUsage` (Container Insights) | $18.83 | plumbing |
| Tax | $10.11 | |
| `RDS:GP3-Storage` + `ChargedBackupUsage` | $5.39 | workload |
| `BoxUsage:t4g.nano` + EBS (test NAT instance) | $3.76 | plumbing |
| `USE1-AWSSecretsManager-Secrets` (7) | $2.57 | plumbing |
| CloudWatch alarms, Route 53, ECR, S3 | $1.22 | |
| **Total** | **$212.30** | |

The three product pillars in the root `AGENTS.md` — crowdfunding, corporate sponsorships, managed ambassador programs — are unaffected by where the container runs. The **Transparency**, **Athlete stories**, and **Minimalist UX** differentiators are application-level concerns and are preserved untouched by this task.

Related prior plan: `.ai/tasks/2026-07-13/completed/backend-foundation-test-deploy/` authored the AWS deployment this task reverses. Its decisions are documented in `docs/aws-architecture-and-orchestration.md`.

---

## 4) Current state and gaps

### Current state

- **API:** Express 5 + tsyringe + Prisma in an arm64 container on ECS Fargate (`cdk/lib/api-stack.ts`), 2 tasks at 512 CPU / 1024 MiB, behind an internet-facing ALB in private subnets with NAT egress.
- **Database:** `db.t4g.small` single-AZ RDS Postgres 16, 20 GiB gp3 (`cdk/lib/data-stack.ts`).
- **Client:** Next.js 15 static export (`output: 'export'` when `STATIC_EXPORT=true`, `client/next.config.ts`) in S3 behind CloudFront with Origin Access Control (`cdk/lib/web-stack.ts`).
- **Front door:** One CloudFront distribution (`E285Q0T2X1PA4R`) serves static assets and routes `/v1/*` and `/v1/webhooks/stripe` to the ALB, making the whole site same-origin. A CloudFront Function (`cdk/lib/web-stack.ts:52`) rewrites extensionless paths to `.html`.
- **Secrets/config:** 5 prod Secrets Manager secrets + 7 SSM Parameter Store values, injected into the task definition by CDK.
- **Deploys:** `scripts/deploy-prod.sh` locally; `.github/workflows/deploy-api.yml` and `deploy-web.yml` for test via GitHub OIDC.
- **Migrations:** two discrete Fargate RunTask definitions (`npx prisma migrate deploy`, `npx prisma db seed`), run pre-traffic by `.github/scripts/run-ecs-task.sh`.

**Verified portability facts (these make the migration tractable):**
- **Zero AWS SDK usage in `app/src/`.** The only `s3`/`bucket` grep hits are variable names in `app/src/middleware/rateLimit.ts`.
- **No object storage.** Images are downscaled client-side to WebP `data:` URLs and stored as strings in Postgres (`client/lib/imageUploads.ts:176`, `AthleteMedia.mediaUrl`).
- Email is Resend, payments are Stripe, auth is self-issued JWT — all host-agnostic.

### Gaps

- **`app/Dockerfile` hardcodes arm64.** Line `COPY --from=builder /repo/app/node_modules/@esbuild/linux-arm64 ./node_modules/@esbuild/linux-arm64` will fail on an amd64 build, and Railway requires `linux/amd64`.
- **No Railway or Cloudflare configuration exists** in the repo.
- **`_redirects` cannot proxy external origins** on Cloudflare, so the same-origin `/v1/*` routing needs a Worker script, not a static rewrite rule.
- **`cdk/` and the AWS workflows have no replacement** and would go stale.
- **In-memory rate limiting** (`app/src/middleware/rateLimit.ts`) is per-process. This is already true on Fargate with 2 tasks, so a single Railway replica is a strict improvement, not a regression.

---

## 5) Changes and considerations

**Significant changes:**
- **Architecture platform swap.** Railway replaces Fargate + ALB + NAT + RDS + ECR + Secrets Manager + SSM. Cloudflare Workers replaces CloudFront + S3 + the CloudFront Function.
- **Same-origin preserved via a Worker proxy.** This is the load-bearing design decision: it keeps `CORS_ALLOWED_ORIGINS` semantics unchanged, keeps client fetch paths unchanged, and — critically — **keeps the Stripe webhook URL at `https://athletearc.ca/v1/webhooks/stripe`, so no Stripe dashboard change is required.**
- **Migrations move from a discrete RunTask to Railway's pre-deploy command**, which runs in a separate container before the new deployment takes traffic and fails the deploy on a non-zero exit — the same pre-traffic gate semantics as `run-ecs-task.sh`.
- **`cdk/` is archived, not deleted**, so the AWS design remains reconstructible if the business ever needs to scale back onto it.

**Impact and considerations:**
- **Downtime:** a few minutes during DNS propagation. Acceptable per scope.
- **Data:** the production database is discarded. Existing accounts stop working. The user has explicitly accepted this.
- **Observability regression:** the six CloudWatch alarms in `cdk/lib/api-stack.ts:402-451` disappear. Railway provides deploy logs, metrics, and crash notifications; Cloudflare provides Worker analytics. Accepted at this scale.
- **Rate-limit buckets reset on every deploy** (already true today).
- **GitHub Actions no longer needs AWS**, so the OIDC provider and both `Arc-*-Cicd` stacks can go last.

---

## 6) Constraints, assumptions, dependencies

**Constraints:**
- **[STRICT]** AI must never run deployments, `cdk destroy`, Prisma CLI applies, or destructive AWS commands (root `AGENTS.md`). Every provisioning, deploy, migration, DNS, and teardown action is authored as a user-executed runbook step.
- **Railway requires `linux/amd64`.** ARM images are not supported.
- **argon2 is a native glibc addon**, so the runtime must be a real container on a Debian-family base. This rules out Cloudflare Workers, Vercel Edge, and any edge runtime for the API. The existing `node:22.22.2-bookworm-slim` base is correct and must stay Debian, not Alpine.
- **Prisma wants persistent connections**, so the API must be an always-on container, not per-request serverless.
- **The Stripe webhook needs the raw request body.** `app/src/app.ts:43` mounts the webhook router with its own `express.raw` parser before the global JSON parser. The Worker proxy must stream the body through without reading or re-serializing it.
- `validateProductionConfig` (`app/src/config/productionConfig.ts`) throws at boot when `NODE_ENV=production` and any required env var is missing or non-HTTPS. This is a hard gate on the Railway env var set.

**Assumptions:**
- The user has, or will create, a Railway account and a Cloudflare account.
- `athletearc.ca` DNS can be moved to Cloudflare nameservers (it currently sits in Route 53 zone `Z09125813QDW7R0WM4HV` with 15 records, having been delegated from GoDaddy).
- Stripe remains in whichever mode it is in today; this task does not change Stripe keys, only verifies the webhook still validates.
- The `test` environment teardown has already happened and is not a prerequisite for any code change here.

**Dependencies (ordered):**
1. Test environment destroyed (separate, already actioned).
2. Railway account + project created.
3. Cloudflare account created and `athletearc.ca` added as a zone.
4. All five prod secrets and seven SSM values retrieved from AWS **before** any AWS teardown begins.

---

## 7) Requirements

**Functional requirements:**
- Every route currently served by the CloudFront Function's `staticRoutes` map must resolve identically.
- `/athletes/<slug>` and `/athletes/<slug>/manage` must serve `athletes.html`.
- `/favicon.ico` must serve the `/icon` asset.
- Unknown paths must serve `/404.html`.
- `/v1/*` must reach the Railway API with method, headers (including `Stripe-Signature` and `Authorization`), query string, and raw body preserved.
- `prisma migrate deploy` must run and succeed before any new API revision takes traffic.
- The seed must be runnable on demand for the first bring-up.

**Non-functional requirements:**
- Total recurring cost ≤ $20/mo.
- Static asset requests must not invoke the Worker — Cloudflare bills Worker invocations but serves static assets free and unlimited, so `run_worker_first` must be scoped to `/v1/*` only.
- API cold-start must not exist: the Railway service runs always-on with at least one replica.
- No secret may be committed to the repo; all secrets live in Railway's env var store and GitHub Actions secrets.

---

## 8) Proposed approach

```
                    ┌─────────────────────────────────┐
  athletearc.ca ───▶│  Cloudflare Worker + Assets     │
  www.athletearc.ca │                                 │
                    │  static (free, no invocation)   │
                    │    client/out/*                 │
                    │                                 │
                    │  run_worker_first: ["/v1/*"]    │
                    └──────────────┬──────────────────┘
                                   │ proxy, body streamed
                                   ▼
                    ┌─────────────────────────────────┐
                    │  Railway                        │
                    │   ├─ API service (amd64)        │
                    │   │   pre-deploy: migrate deploy│
                    │   └─ Postgres service           │
                    └─────────────────────────────────┘
```

**Key patterns and conventions:**
- Keep `app/Dockerfile` as the single build definition; parameterize the architecture rather than forking it.
- Keep the env var *names* identical to what `cdk/lib/api-stack.ts` injects today so no application code changes.
- `DATABASE_URL` becomes a single Railway variable (referencing the Postgres service), replacing the shell assembly from four ECS secrets.
- The Worker is deliberately thin: a pass-through proxy, no business logic, no response rewriting.

**Alternatives considered:**
- **Cloudflare Pages instead of Workers.** Rejected: Cloudflare now recommends Workers with static assets for new projects, and Pages `_redirects` cannot proxy external origins, which would force a Pages Function anyway — the same complexity with a deprecating-in-spirit product.
- **Split domains (`athletearc.ca` + `api.athletearc.ca`) with explicit CORS.** Rejected: it requires a Stripe dashboard webhook URL change, re-enables a CORS surface that is currently empty by design, and changes `NEXT_PUBLIC_API_BASE_URL` semantics. The Worker proxy avoids all three for ~30 lines of code.
- **Neon free tier for Postgres instead of Railway Postgres.** Deferred, not rejected — see *Open questions*.
- **Fly.io instead of Railway.** Would have kept the arm64 image as-is and cost ~$3/mo less, but the user selected Railway.
- **Keeping AWS and stripping it down** (kill Container Insights, drop to 1 task, replace NAT with a public-subnet EC2). Lands at ~$60–100/mo — still 5× the target and retains all the operational complexity.

---

## 9) Data model and contracts

No Prisma schema changes, no API contract changes, no `fad-common` changes. The database is recreated by `prisma migrate deploy` against the existing migration history in `app/prisma/migrations/` and populated by `app/prisma/seed.ts`.

---

## 10) Package-level impact

### app/
- `app/Dockerfile` — make the esbuild platform package and the build architecture parameterized so an amd64 image builds correctly. This is the only change in the package.

### client/
- No source changes. `NEXT_PUBLIC_API_BASE_URL` is set to `https://athletearc.ca` at build time (absolute but same-origin — `client/lib/api.ts:127` throws on an empty string, so it cannot be blanked).

### cdk/
- Archived. Retained in-tree under an `ARCHIVED` note so the AWS design stays reconstructible, and excluded from the root `build`/`type-check`/`ci` scripts.

### docs/
- `docs/infrastructure-and-scaling.md` — rewritten for the new architecture with the verified August cost table as the historical justification.
- `docs/aws-architecture-and-orchestration.md` — marked historical.
- `cdk/README.md` — superseded by a new Railway + Cloudflare runbook.

### Repo root
- `.github/workflows/deploy-api.yml`, `.github/workflows/deploy-web.yml`, `.github/scripts/run-ecs-task.sh`, `scripts/deploy-prod.sh`, `scripts/port-forward-prod-rds.sh` — removed and replaced.
- `package.json` — `deploy` script retargeted; `cdk` dropped from `build`, `type-check`, `ci`, and `postinstall`.

---

## 11) Edge cases and error handling

- **Stripe webhook body mutation:** if the Worker reads `request.body` before forwarding, signature verification fails silently in production. The Worker must construct the outbound `Request` from the inbound one so the body streams through untouched. This is the single highest-risk detail in the task and gets an explicit verification step.
- **`run_worker_first` too broad:** setting it to `true` or `/*` routes every static asset through the Worker, converting free requests into billed ones and adding latency. It must be exactly `["/v1/*"]`.
- **Trailing slashes:** the CloudFront Function strips a trailing slash before the `staticRoutes` lookup. Workers `html_handling` must be configured to match, or `/about/` will 404.
- **`/favicon.ico`:** the CloudFront Function rewrites this to `/icon`. Next.js emits the icon at `/icon`, not `/favicon.ico`, so without an equivalent rule browsers get a 404.
- **Pre-deploy migration failure:** Railway aborts the deploy and the previous revision keeps serving. This matches the current circuit-breaker behavior and needs no extra handling.
- **Secrets retrieved after teardown:** impossible — the runbook retrieves and stores all secrets before the first destroy command.
- **`validateProductionConfig` boot failure:** if any required env var is missing, the container exits at startup and Railway shows a crash loop rather than a subtle 500. The env var checklist in Step 2 is derived directly from that function to prevent this.

---

## 12) Failure modes and concurrency

**Concurrency/race conditions:**
- Two concurrent deploys could run `prisma migrate deploy` simultaneously. Prisma's migration table takes an advisory lock, so the second waits rather than corrupting state. Railway also serializes deploys per service.

**Idempotency and retries:**
- `prisma migrate deploy` is idempotent — already-applied migrations are skipped.
- `prisma db seed` uses upserts (per `app/prisma/seed.ts`) and is safe to re-run, but is only invoked manually on first bring-up.
- Stripe retries failed webhooks automatically; the `WebhookEvent` model already de-duplicates by event id.

**Failure modes:**
- **Railway API down:** the Worker returns its proxy error; static pages still serve. Degraded, not dark.
- **Cloudflare Worker misconfigured:** the whole site is affected. Mitigated by validating on the `workers.dev` preview URL before the DNS cutover.
- **DNS cutover wrong:** rollback is repointing nameservers back to Route 53, which is why the AWS teardown is deliberately the *last* step and happens only after the new stack is verified live.

---

## 13) Operational readiness

**Observability:**
- Railway deploy logs and service metrics (CPU, memory, network) replace CloudWatch Logs and Container Insights.
- The app's pino logger (`app/src/services/infrastructure/Logger.ts`) writes to stdout, which Railway captures with no code change.
- Cloudflare Worker analytics cover request volume and error rate at the edge.
- PostHog (`posthog-node`, already wired) continues to provide product analytics and is unaffected.
- Deliberately **not** replaced: the six CloudWatch alarms. Revisit when traffic justifies paging.

---

## 14) Research and references

- Railway requires `linux/amd64`; ARM images are not supported — [Can I run arm64 images in railway?](https://www.answeroverflow.com/m/1141939466827726898)
- Railway pricing: Hobby $5/mo including $5 of usage; RAM $10/GB/mo, CPU $20/vCPU/mo, volume $0.15/GB/mo, egress $0.05/GB — [Railway plans](https://docs.railway.com/reference/pricing/plans)
- Railway pre-deploy command runs after build and **before the deployment takes traffic**, in a separate container, and any non-zero exit fails the deploy — [Pre-deploy command](https://docs.railway.com/guides/pre-deploy-command)
- Cloudflare Pages `_redirects` proxying "will only support relative URLs on your site; you cannot proxy external domains" — [Pages redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
- Cloudflare recommends Workers with static assets over Pages for new projects; `_headers` and `_redirects` are supported natively — [Migrate from Pages to Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)
- "Requests to static assets are free and unlimited." Free plan: 100,000 Worker requests/day; paid: 10M/mo then $0.30/M — [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- `run_worker_first` accepts an array of route patterns, e.g. `["/assets/protected/*"]`, so only those paths invoke the Worker — [Static assets binding](https://developers.cloudflare.com/workers/static-assets/binding/)
- Workers static assets routing modes and `not_found_handling` — [Routing](https://developers.cloudflare.com/workers/static-assets/routing/)

**Live AWS state verified 2026-09-13** (`aws ce get-cost-and-usage`, `describe-stacks`, `describe-db-instances`, `list-secrets`, `get-parameters-by-path`): 10 stacks + CDKToolkit; 2× `db.t4g.small`; 4 Fargate tasks; 2 ALBs; 1 NAT Gateway + 1 `t4g.nano` NAT instance; 6 public IPv4; 7 secrets; Route 53 zone `Z09125813QDW7R0WM4HV` with 15 records; CloudFront `E285Q0T2X1PA4R` (prod, aliased) and `E3BLT592AAHD0N` (test).

**Prod SSM values to port** (`/arc/prod/…`):

| Parameter | Value | Railway env var |
|---|---|---|
| `donations/default-currency` | `cad` | `DEFAULT_CURRENCY` |
| `donations/minimum-cents` | `500` | `DONATION_MINIMUM_CENTS` |
| `email/from-address` | `info@athletearc.ca` | `RESEND_FROM_EMAIL` |
| `stripe/account-onboarding-refresh-url` | `https://athletearc.ca/athletes/me/manage?stripe_refresh=1` | `STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL` |
| `stripe/account-onboarding-return-url` | `https://athletearc.ca/athletes/me/manage?stripe_return=1` | `STRIPE_ACCOUNT_ONBOARDING_RETURN_URL` |
| `stripe/checkout-cancel-url` | `https://athletearc.ca` | `STRIPE_CHECKOUT_CANCEL_URL` |
| `stripe/checkout-success-url` | `https://athletearc.ca/donate/thanks` | `STRIPE_CHECKOUT_SUCCESS_URL` |

All seven values remain correct under the new architecture because the public origin does not change.

---

## 15) Open questions

- ~~**Railway Postgres vs. Neon free tier.**~~ **RESOLVED 2026-09-14 — Railway Postgres**, confirmed by the user. Rationale as originally written: single vendor, `DATABASE_URL` wired by service reference, and no 0.5 GB ceiling. The ceiling mattered because images are stored as base64 `data:` URLs in Postgres, so Neon's free tier would have capped the product at roughly 500 images. Provision as a Railway Postgres service in Step 5c and reference it as `${{Postgres.DATABASE_URL}}`, never a pasted literal.

---

## 16) Future work (explicitly not in this task)

- **Move images out of Postgres.** Base64 `data:` URLs in `AthleteMedia.mediaUrl` inflate row size, bloat backups, and defeat CDN caching. Cloudflare R2 (10 GB free, zero egress) is the natural target and pairs with the Cloudflare front door chosen here. This becomes urgent at roughly 500–1,000 images.
- **Reinstate alerting** once there is traffic worth alerting on.
- **Revisit AWS** only if the business reaches the 10k-user scale `docs/infrastructure-and-scaling.md` was written for; the archived `cdk/` makes that a restore, not a rewrite.
