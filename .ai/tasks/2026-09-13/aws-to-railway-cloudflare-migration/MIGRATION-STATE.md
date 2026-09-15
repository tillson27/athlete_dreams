# Migration live state — resume here

Rolling record of what is actually true in the infrastructure right now, so work survives a context reset. **Plan and rationale live in the context and steps docs; this file holds only live state and the resume point.**

- Context: `.ai/tasks/2026-09-13/aws-to-railway-cloudflare-migration/aws-to-railway-cloudflare-migration-context.md`
- Steps guide: `.ai/tasks/2026-09-13/aws-to-railway-cloudflare-migration/aws-to-railway-cloudflare-migration-steps-guide.md`

**Last updated:** 2026-09-15 (data migration complete)

---

## ✅ DATA MIGRATION COMPLETE — 2026-09-15

The AWS production data now lives in Railway Postgres. `TEARDOWN-PROMPT.md` is
cleared to run.

The task plan's line *"the user has explicitly accepted data loss"*
(context doc line 49) is **SUPERSEDED** — on seeing what the data actually was,
the user reversed that decision on 2026-09-15 and the data was migrated instead.

**What ran:** `pg_dump` of AWS RDS → `DROP SCHEMA public CASCADE` on Railway →
`pg_restore` → CSV re-insert of the two post-cutover profiles → API restart.

| Table | AWS (source) | Railway (before) | Railway (after) |
|---|---|---|---|
| users | 23 | 14 | **25** |
| athlete_profiles | 19 | 8 | **21** |
| — of which published | 12 | 8 | **14** |
| athlete_media | 17 | 35 | **28** |
| personal_bests | 27 | 28 | **31** |
| athlete_race_results | 14 | 30 | **14** |
| athlete_accomplishments | 7 | 24 | **8** |
| athlete_events | 4 | 18 | **4** |
| teams / team_memberships | 23 / 23 | 14 / 14 | **25 / 25** |
| platform_role_assignments | 21 | 8 | **23** |
| email_verification_tokens | 33 | 9 | **36** |
| follows | 5 | 0 | **5** |
| campaigns / donations | 0 / 0 | 5 / 0 | **0 / 0** |

After = AWS + the two preserved profiles. The Railway "before" column was 6 seed
fixtures plus those two profiles; the seed campaigns and inflated media/race
counts were all fictional and are gone by design.

**Preserved across the restore:** `joel-goullet` (created 2026-09-15 14:54 UTC)
and `donny-marchuk`, with their users, teams, memberships, role assignments,
email tokens, 11 media rows, 4 personal bests, and 1 accomplishment. Neither
their emails nor their slugs collide with anything in the AWS data — verified by
grep before the restore.

**Deliberately not preserved:** the 6 seed athletes, 5 `@smoke.athletearc.ca`
throwaways, and `tillson27+arcverify@gmail.com`. That last one was the old
Railway-vs-AWS proof — see the replacement in `TEARDOWN-PROMPT.md`.

**Verified after:** directory serves 14 real athletes with zero seed slugs;
`route-sweep.sh` **39/39**; `smoke-test.sh` **13/13**; all 27 argon2id password
hashes intact at uniform length; zero FK orphans; `_prisma_migrations` still the
same 4 rows, so Prisma will not re-apply on the next deploy.

**Backups** in `~/arc-migration-backup-2026-09-13/` (outside the repo):
`aws-prod-arc.dump` (12 MB) + `.sql` (16 MB), `railway-before-migration.dump`
(4.7 MB) + `.sql` (6.2 MB) — the rollback — and `keepers/` (the extracted CSVs).

> **[STRICT] Never run `prisma db seed` against Railway.** That is what put the
> fictional athletes into production in the first place.

**Open cleanup:** two `@smoke.athletearc.ca` users created by the verification
runs are still in production. Harmless, but they are not real signups.

---

## Resume point

**DNS CUTOVER COMPLETE — 2026-09-15.** `athletearc.ca` and `www` are served by
the Cloudflare Worker, with `/v1/*` proxied to Railway. Verified 52/52 against
the production domain (`route-sweep.sh` 39/39, `smoke-test.sh` 13/13).

**Proof the API is Railway and not the old AWS stack:** signing in at
`https://athletearc.ca/v1/auth/sign-in` as `tillson27+arcverify@gmail.com`
succeeds and returns `emailVerifiedAt 2026-09-15T01:50:35Z`. That account was
created through the workers.dev preview against Railway Postgres and has never
existed in the AWS database. Edge headers confirm `server: cloudflare` + `cf-ray`.

**Route 53 repointed 2026-09-15** (user-approved). The apex and `www` A/AAAA
records were changed from the CloudFront ALIAS to plain records holding
Cloudflare's edge IPs (`104.21.71.20`, `172.67.142.70`, and the two
`2606:4700:30xx::` addresses), TTL 60. Resolvers still caching the old AWS
nameservers therefore also reach the new stack, which closed the window where
sign-ups could land in the retired AWS database. Mail records in Route 53 were
not touched.

> **[STRICT] Rollback is now TWO steps, not one.** Reverting nameservers alone no
> longer restores AWS, because Route 53 now points at Cloudflare too. To roll
> back: apply
> `~/arc-migration-backup-2026-09-13/r53-rollback-to-cloudfront.json` via
> `aws route53 change-resource-record-sets --hosted-zone-id Z09125813QDW7R0WM4HV`
> **and** revert the registrar nameservers to the four `awsdns` values. Both are
> required. The CloudFront ALIAS target is `d2z7fyjadq4mtn.cloudfront.net`
> (hosted zone `Z2FDTNDATAQYW2`).

**Next: Step 8 (AWS teardown) — see `TEARDOWN-PROMPT.md`.** The data migration
above is done, so AWS is no longer load-bearing for data. The plan still requires
the production domain to be stable for at least a full day before teardown. AWS
is still running and is the rollback target — but note that rollback would now
serve the AWS database's state as of 2026-09-15, missing anything written to
Railway after the migration.

---

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

**Verified:** all 4 Prisma migrations applied via the pre-deploy hook;
`scripts/smoke-test.sh` **13/13 PASS** against the Railway URL.

The database was seeded once on 2026-09-14 (6 athletes, 5 campaigns, 30 race
results, 24 personal bests). That seed data was **removed on 2026-09-15** by the
data migration and must never be re-applied — see the section at the top.

**No public TCP proxy.** One existed at `thomas.proxy.rlwy.net:10726` for the
migration and was deleted 2026-09-15; the handshake now fails. Reaching Postgres
from a laptop again means creating a new proxy (`tcpProxyCreate`,
`applicationPort: 5432`) and deleting it immediately afterwards.

> **[STRICT] Two different Railway tokens are in play — check which one you have.**
> The token used through 2026-09-14 authenticates with the `Project-Access-Token`
> header. The token issued 2026-09-15 for the data migration authenticates with
> `Authorization: Bearer` and returns **`Not Authorized` on every query** under
> the `Project-Access-Token` header. Both fail `me {}`, so `whoami` cannot tell
> them apart. If queries return `Not Authorized`, swap the header before
> concluding the token is dead.

The 2026-09-14 Railway credential is a **project token**, not an account token.
It authenticates with the `Project-Access-Token` header (not `Authorization:
Bearer`), and `railway whoami` fails by design. It can create services, volumes,
domains, and variables, but **cannot** disconnect a repo (`serviceDisconnect` →
"Bad Access") or list regions.

---

## Open items needing the user

1. **Wait ~24h of stable production**, then authorise the AWS prod teardown.
2. **Push the commits** so GitHub can build the image. Local-only today.
3. **Rotate credentials** — the Railway project token and three Cloudflare tokens
   were pasted into an agent transcript. Delete the two dead Cloudflare tokens.
4. **Keep the Route 53 hosted zone.** It is the rollback path and costs $0.50/mo.
   Explicitly excluded from the Step 8 sweep.

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
7. **Cloudflare's zone scan cannot import Route 53 ALIAS records.** It resolves
   them and writes literal CloudFront IPs instead — 24 A/AAAA records here. The
   site still works, so this fails silently, but it is still AWS-served off IPs
   CloudFront rotates. They also block Worker custom domains with error 100117;
   all 24 must be deleted first.
8. **A `pending` Cloudflare zone serves `100::` for proxied records.** Worker
   custom domains create a proxied AAAA at `100::`, and Cloudflare only swaps in
   its anycast edge IPs once the zone is **active**. Call
   `PUT /zones/<id>/activation_check` as soon as the registrar delegation is
   live rather than waiting for Cloudflare to notice, or there is a window where
   the apex resolves to an unroutable address.
9. **A new hostname's TLS cert lags DNS by minutes.** Both the workers.dev
   subdomain and the apex first failed with
   `sslv3 alert handshake failure` / HTTP 000. That is cert provisioning, not a
   fault. Never debug the Worker on a 000.
10. **Never read the request body in the Worker.** Raw-body passthrough was proven byte-for-byte (identical SHA-256, 98-byte non-ASCII payload). Since the Stripe test is dropped, this local proof is the only thing standing behind webhook correctness.

---

## Known gaps, deliberately accepted

- **Stripe end-to-end is unverified.** The raw-body invariant is proven locally, but nothing confirms Stripe accepts the deployed endpoint. Re-run `stripe listen --forward-to .../v1/webhooks/stripe` once Stripe works.
- **`/admin` becomes reachable.** `admin.html` and five `admin/*` pages exist in the export but were absent from the CloudFront route map, so `/admin` currently 404s in production. Under Workers `auto-trailing-slash` these resolve 200. Behaviour change, flagged, not yet decided.
- **Pre-rendered athlete pages are shadowed** by the `/athletes/*` splat, matching CloudFront exactly. Serving them would improve SEO/OG tags — future work.
- **GitHub Pages is still enabled** (`build_type: workflow`, never successfully built). `deploy-client-pages.yml` left untouched per the plan.
- **Six env vars have no production values** (`POSTHOG_API_KEY`, `POSTHOG_HOST`, both `AUTH_RATE_LIMIT_*`, both token-TTL vars). They were never injected by CDK either, so unset preserves current behaviour — but server-side PostHog capture is therefore off in production.
