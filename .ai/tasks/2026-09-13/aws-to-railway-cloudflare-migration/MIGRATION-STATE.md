# Migration live state — resume here

Rolling record of what is actually true in the infrastructure right now, so work survives a context reset. **Plan and rationale live in the context and steps docs; this file holds only live state and the resume point.**

- Context: `.ai/tasks/2026-09-13/aws-to-railway-cloudflare-migration/aws-to-railway-cloudflare-migration-context.md`
- Steps guide: `.ai/tasks/2026-09-13/aws-to-railway-cloudflare-migration/aws-to-railway-cloudflare-migration-steps-guide.md`

**Last updated:** 2026-09-14 (Railway live)

---

## Resume point

**Steps 1–5 are complete on the Railway side. The API is live and verified.**
Nothing is committed — the run is under `$step-loop-no-commit`.

**Blocked on:** the user clicking the verification email link (Step 6c). That is
the only outstanding item before DNS cutover.

---

## Cloudflare — LIVE (preview)

| Thing | Value |
|---|---|
| Account | `f7579c35ce9e565979eaf2de0187b568` |
| workers.dev subdomain | `athletearc` (created via API 2026-09-14; the account had none) |
| Worker | `athlete-arc` → **https://athlete-arc.athletearc.workers.dev** |
| `API_ORIGIN` | `https://athletedreams-production.up.railway.app` |
| Zones | **none yet** — `athletearc.ca` still needs adding for Step 7 |

**Verified against the hosted preview:** `route-sweep.sh` **39/39 PASS**,
`smoke-test.sh` **13/13 PASS**. Client bundle was rebuilt against the
workers.dev origin and grep-confirmed to contain **no** reference to
`https://athletearc.ca` or `localhost:4000` as an API base.

> A brand-new workers.dev subdomain takes a few minutes to get its TLS cert. The
> first sweep returned **HTTP 000 / `sslv3 alert handshake failure` on all 39
> routes** — that is cert provisioning, not a Worker fault. It cleared on its own
> after ~3 minutes. Do not debug the Worker on a 000.

---

---

## Railway — LIVE

| Thing | Value |
|---|---|
| Project | `exquisite-flexibility` (`fc60407d-3321-44af-aee6-068eebc0d522`) |
| Environment | `production` (`00b9dfb1-d622-43cf-9610-0bc3bf2cc3b6`) |
| API service | `athlete_dreams` (`06b51d28-cf19-42bb-be05-264b17da8e0d`) |
| Postgres service | `Postgres` (`d7d5010c-673f-468a-9246-7c358aa89bca`) |
| API URL | `https://athletedreams-production.up.railway.app` |
| Region | `us-east4-eqdc4a` (Virginia — matches the retired `us-east-1`) |
| Postgres image | `ghcr.io/railwayapp-templates/postgres-ssl:17`, 5 GB volume at `/var/lib/postgresql/data` |

**Verified:** all 4 Prisma migrations applied via the pre-deploy hook; seed run
once (6 athletes, 5 campaigns, 30 race results, 24 personal bests);
`scripts/smoke-test.sh` **13/13 PASS** against the Railway URL.

The supplied Railway credential is a **project token**, not an account token.
It authenticates with the `Project-Access-Token` header (not `Authorization:
Bearer`), and `railway whoami` fails by design. It can create services, volumes,
domains, and variables, but **cannot** disconnect a repo (`serviceDisconnect` →
"Bad Access") or list regions.

---

## Open items needing the user

1. **Click the verification link** sent to `tillson27+arcverify@gmail.com`
   (Step 6c). Sent 2026-09-14 via Resend, `resendEmailId`
   `49f0398a-7192-49b2-9c1a-9d13db633db9`.
2. ~~Railway GitHub auto-deploy~~ — **RESOLVED 2026-09-14 by the user.**
   `repoTriggers` is empty on `athlete_dreams`, verified via the API.
3. **`APP_URL` is currently the workers.dev URL** for the 6c email test. It must
   become `https://athletearc.ca` at cutover.
4. **Rotate both tokens after the migration** — the Railway project token and two
   Cloudflare tokens were pasted into an agent transcript. The first Cloudflare
   token is unusable anyway and should just be deleted.
5. **Add `athletearc.ca` as a Cloudflare zone** (Step 7b), then repoint
   nameservers at the registrar. Zone creation can be done by the agent if the
   token carries Account→Zone:Edit; the registrar change cannot.

---


---

## Decisions made by the user (authoritative)

| Decision | Detail |
|---|---|
| **Database** | **Railway Postgres**, confirmed 2026-09-14. Resolves context §15. Reference as `${{Postgres.DATABASE_URL}}`. |
| **Step ownership** | User overrode the plan's "user-executed" rule for Steps 5–8; the agent executes them. Recorded in the steps guide. |
| **Stripe** | All Stripe verification dropped (*"not working anyways"*). Removes Steps 6d and 6e. |
| **Teardown** | *"aws teardown should happen regardless."* Agent still sequences prod teardown after the new stack is live, to keep a rollback target. |
| **Email check** | User will click the verification link in Step 6c when asked. |

---

## AWS state

### Destroyed — test environment teardown COMPLETE (2026-09-14)
`Arc-test-Web`, `Arc-test-Api`, `Arc-test-Data`, `Arc-test-Network` are all
`DELETE_COMPLETE`. That removed the test CloudFront distribution, the test ALB,
the test RDS instance, and the test NAT gateway.

Driven by `/private/tmp/.../scratchpad/teardown-test.sh`, which calls `aws cloudformation delete-stack` directly.

> **`cdk destroy` does not work on this machine.** It fails with `CredentialsProviderError: Could not load credentials from any providers` — the CDK's Node SDK cannot read this credential source, although the AWS CLI can (IAM user `JTilson`, account `154932391130`). **Use `aws cloudformation delete-stack` for the prod teardown too.** Also note a `cdk destroy ... | tee` pipeline reports `tee`'s exit code, which masked this failure once; check the log body, not the exit status.

### Still live — untouched, still serving `athletearc.ca`
`Arc-prod-Api`, `Arc-prod-Cicd`, `Arc-prod-Data`, `Arc-prod-Network`, `Arc-prod-Web`, `CDKToolkit`, and `Arc-test-Cicd`.

> `Arc-test-Cicd` is held back **deliberately**: it owns the shared GitHub OIDC provider that `Arc-prod-Cicd` also references, so it must be destroyed *after* `Arc-prod-Cicd`.

### Retained resources needing a manual sweep after the stacks go
`arc-prod-api` ECR repo (the `arc-test-api` repo and the three orphaned test log groups were deleted 2026-09-14), the `arc-prod-web` bucket (RETAIN under the `snapshot` policy), the five `arc/prod/*` Secrets Manager secrets, the seven `/arc/prod/*` SSM parameters, the prod RDS final snapshot, and the CDK bootstrap (`CDKToolkit`, `cdk-hnb659fds-assets-*` bucket, `cdk-hnb659fds-container-assets-*` ECR repo).

Prod RDS `arc-prod-data-databaseb269d8bb-zdkemzlft9cr` has **deletion protection ON** and must be disabled before its stack will delete.

---

## DNS — `athletearc.ca`, Route 53 zone `Z09125813QDW7R0WM4HV`

Backup: `~/arc-migration-backup-2026-09-13/route53-athletearc-backup.json` (18 record sets).

**Seven records are email-critical.** Full table with values is in Step 7a of the steps-6-10 doc. Summary: Google Workspace `MX` + SPF + DKIM + DMARC, and Resend's `resend._domainkey` DKIM plus the `send.athletearc.ca` MX/SPF pair. **`resend._domainkey` is what signs the app's verification emails** — Step 6c fails if it is mangled on import.

Only the apex and `www` A/AAAA records should change at cutover (currently ALIAS → `d2z7fyjadq4mtn.cloudfront.net`). The two `_*.acm-validations.aws` CNAMEs are disposable.

---

## Verification assets built during Steps 1–4

| Asset | Covers |
|---|---|
| `scripts/route-sweep.sh <base-url>` | All 24 static routes, trailing-slash canonicalisation, all four athlete-slug shapes (asserts **200, not 307**), icons, `/favicon.ico`, 404 fallback, `/v1/health/ready` through the proxy. |
| `scripts/smoke-test.sh <base-url>` | Health, directory filter + cursor, profile rich fields, community + campaign feeds, sign-up → sign-in → `/me`, follow round-trip. Already accepted a base-URL arg; needed no changes. Requires `jq`. |

Both were syntax-checked; `route-sweep.sh` passed 37/37 against `wrangler dev` locally.

---

## Traps found the hard way — do not re-introduce

1. **`_redirects` targets must be canonical paths, never `.html`.** `/athletes/* /athletes.html 200` makes Cloudflare canonicalise the target and emit a **307 to `/athletes`**, stripping the slug and breaking every athlete deep link — in production only. Target `/athletes` instead. `route-sweep.sh` guards this.
2. **Build the preview against the preview origin.** `NEXT_PUBLIC_API_BASE_URL` is baked in at build time. Building the preview with the `https://athletearc.ca` default points the preview client at the **live AWS production API**, so the preview looks healthy regardless of Railway's state.
3. **`run_worker_first` must stay `["/v1/*"]`.** `true` or `/*` converts free static-asset requests into billed Worker invocations.
4. **Railway's `Builder` enum has no `DOCKERFILE` value** — it is
   `HEROKU | NIXPACKS | PAKETO | RAILPACK`. Setting `builder: "DOCKERFILE"` via
   `serviceInstanceUpdate` fails with an opaque "Problem processing request".
   Set **`dockerfilePath`** instead; Railway infers the Dockerfile build from it.
5. **The service domain's `targetPort` must be 8080, not 4000.**
   `app/Dockerfile:57` sets `ENV PORT=8080`, which overrides the app's own 4000
   default. A domain created against 4000 returns **502 "Application failed to
   respond"** even though the Railway healthcheck passes — the healthcheck probes
   the container directly and never exercises the public edge. A green deploy is
   therefore **not** evidence the public URL works; always curl it.
6. **`railway config pull` is lossy in two ways that can destroy the database.**
   It reads the Postgres image back as `null`, so the emitted `postgres()` helper
   plans a swap to a bare `postgres:18` — dropping SSL and pointing an 18 binary
   at PGDATA written by 17, which refuses to start. It also reads
   `volumeAttachments` as `null`. Use `database(name, "postgres", { image })` to
   pin the image, express the volume as a standalone `volume()` resource, and
   **never run `railway config apply` until `plan` reports zero changes.**
7. **Never read the request body in the Worker.** Raw-body passthrough was proven byte-for-byte (identical SHA-256, 98-byte non-ASCII payload). Since the Stripe test is dropped, this local proof is the only thing standing behind webhook correctness.

---

## Known gaps, deliberately accepted

- **Stripe end-to-end is unverified.** The raw-body invariant is proven locally, but nothing confirms Stripe accepts the deployed endpoint. Re-run `stripe listen --forward-to .../v1/webhooks/stripe` once Stripe works.
- **`/admin` becomes reachable.** `admin.html` and five `admin/*` pages exist in the export but were absent from the CloudFront route map, so `/admin` currently 404s in production. Under Workers `auto-trailing-slash` these resolve 200. Behaviour change, flagged, not yet decided.
- **Pre-rendered athlete pages are shadowed** by the `/athletes/*` splat, matching CloudFront exactly. Serving them would improve SEO/OG tags — future work.
- **GitHub Pages is still enabled** (`build_type: workflow`, never successfully built). `deploy-client-pages.yml` left untouched per the plan.
- **Six env vars have no production values** (`POSTHOG_API_KEY`, `POSTHOG_HOST`, both `AUTH_RATE_LIMIT_*`, both token-TTL vars). They were never injected by CDK either, so unset preserves current behaviour — but server-side PostHog capture is therefore off in production.
