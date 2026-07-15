# Backend Foundation, Nate Contract Alignment & AWS Test-Deployment Readiness - Steps 16-17

## Step 16 - Deploy workflows (OIDC), smoke suite, deploy runbook

### Metadata
**Status:** Complete
**Prereqs:** 3, 14, 15
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-13

### Completion Notes

- **`cdk/lib/cicd-stack.ts`** — GitHub OIDC provider via the native `AWS::IAM::OIDCProvider` construct (`OidcProviderNative`, no Lambda custom resource) + a least-privilege deploy role. Trust: `sts:AssumeRoleWithWebIdentity` with `StringEquals` on `:aud=sts.amazonaws.com` and `StringLike` on `:sub` = `repo:tillson27/athlete_dreams:ref:refs/heads/{nate,main}` only. Permissions: assume `cdk-*` bootstrap roles (CFN least-privilege deploy path), ECR auth + push to `arc-<env>-api`, `ecs:RunTask`/`DescribeTasks`/`ListTasks` (cluster-scoped condition) + `iam:PassRole` to the `Arc-<env>-Api-*` task roles (`iam:PassedToService=ecs-tasks.amazonaws.com`), S3 sync to `arc-<env>-web`, CloudFront invalidation. Wired first in `bin/fad.ts` (no cross-stack deps); `GithubDeployRoleArn` output. Both `cdk synth -c env=test` and `-c env=prod` exit 0, credential-free.
- **Image-tag mechanism** — `ApiStack` gained an optional `imageTag` prop (default `latest`); `bin/fad.ts` reads `-c imageTag=<sha>`. Immutable per-SHA tag so CloudFormation detects the changed task def and ECS rolls (a mutable `latest` would not). `ApiStack` also emits outputs (cluster, migration/seed task-def ARNs, service SG, private subnets, ECR URI) so the workflow/runbook launch RunTasks without name guessing.
- **`.github/workflows/deploy-api.yml`** — push to `nate` on `app/**`/`common/**`/`cdk/**` (+ `workflow_dispatch` with a `run_seed` flag); `environment: test`; OIDC (`id-token: write`). Reuses `ci.yml` via `jobs.ci.uses` (added `workflow_call:` to ci.yml — not copy-paste). Then buildx `linux/arm64` `docker build -f app/Dockerfile .` → push ECR (tag `github.sha`) → `cdk deploy Arc-test-Api -c imageTag=<sha> --require-approval never` → migration RunTask (wait exit 0) → optional seed RunTask. RunTask launch/poll extracted to `.github/scripts/run-ecs-task.sh` (DRY, injection-safe).
- **`.github/workflows/deploy-web.yml`** — push to `nate` on `client/**`/`common/**` (+ dispatch); `environment: test`; OIDC. `STATIC_EXPORT=true` build → `aws s3 sync client/out/ s3://$WEB_BUCKET --delete` → CloudFront invalidation. Bucket/distribution from env vars. Legacy `deploy-client-pages.yml` untouched. Verified the STATIC_EXPORT build emits `client/out/` locally.
- **`scripts/smoke-test.sh`** — curl + jq only; PASS/FAIL table, non-zero exit on any failure. **Ran for real against the locally-booted API (`http://localhost:4000`, seeded `fad_dev`): 13/13 PASS, exit 0** — health live/ready, directory `?runnerLevel=ELITE` (filter verified + one cursor page walked), `maya-okafor` profile (rich fields present: personalBests/raceResults/roadmap/storyBody/accomplishments/presentation/runnerLevel), community feed (5), campaigns feed (5), auth round-trip (sign-up 201 → sign-in → `GET /v1/users/me` email match), follow round-trip (follow → list contains → unfollow). Non-zero exit confirmed against an unreachable URL.
- **`cdk/README.md`** — full user-executed runbook: prerequisites (cross-refs `docs/infrastructure-and-scaling.md` → *Prerequisites & access*; set real `hostedZoneId`), one-time bootstrap, deploy order Cicd → Network → Data → Api → Web with exact commands, first-image + migration/seed RunTask invocation (pipeline + manual), GitHub `test` environment setup (role ARN secret + web bucket/distribution vars), smoke invocation, rollback (prev image tag / ECS circuit breaker / RDS PITR / S3 re-sync).
- **`.gitignore`** — added `client/out/` (step-15 flag; STATIC_EXPORT/GITHUB_PAGES output, verified git-ignored).
- **ALB origin hardening — DECISION: documented as a post-deploy user action, NOT implemented in-stack.** The AWS-managed `com.amazonaws.global.cloudfront.origin-facing` prefix list has a **region-specific id that AWS does not publish as a stable constant**; resolving it needs either `PrefixList.fromLookup` (forbidden by `cdk/AGENTS.md` — requires credentials/account at synth) or a brittle hardcoded `pl-*`. Neither keeps synth credential-free, so `cdk/README.md` §8 documents the post-deploy `describe-managed-prefix-lists` + `authorize`/`revoke` security-group steps, and notes the credential-free CloudFront-custom-header + ALB-listener/WAF alternative as a future stack change.
- **Verification:** `$infra-review` executed (OIDC trust conditions validated in synthesized template; least-privilege confirmed statement-by-statement; workflow injection audit — no `github.event.*`/untrusted input in any `run:`; all step outputs passed via `env:`, consumed as shell vars). `$ci` (`npm run ci`) green (build + type-check + lint:fix + tests: 10 passed, 48 DB-tests skipped locally). cdk type-check + both synths exit 0. No lockfile/build-artifact drift.

### Context

**Objective:** Author everything the user needs to execute the first `test` deployment — pipelines, verification, and the runbook. **AI authors; the user deploys.**
**Done When:**
- `cdk/lib/cicd-stack.ts`: GitHub OIDC identity provider + a deploy role trust-scoped to this repo and the `nate`/`main` branches, least-privilege for ECR push, `cdk deploy`, ECS RunTask, S3 sync, CloudFront invalidation.
- `.github/workflows/deploy-api.yml`: on push to `nate` touching `app/**`/`common/**` — type-check/test → arm64 `docker build` → ECR push → `cdk deploy ApiStack` → migration RunTask → (first-run) seed RunTask; uses `environment: test` and the OIDC role; no static AWS keys anywhere.
- `.github/workflows/deploy-web.yml`: on push to `nate` touching `client/**`/`common/**` — `STATIC_EXPORT=true` build → S3 sync → CloudFront invalidation. The legacy `deploy-client-pages.yml` remains untouched until DNS cutover (M7).
- `scripts/smoke-test.sh <base-url>`: health live/ready; directory (filter + cursor page); profile by seeded slug; community feed; follow round-trip + sign-up→sign-in→`GET /v1/users/me` with a unique throwaway email; non-zero exit on any failure.
- `cdk/README.md`: the complete user-executed runbook — prerequisites (Route 53 zone for `athletearc.ca`, `cdk bootstrap aws://<account>/us-east-1`), ordered `cdk deploy` commands, migration/seed RunTask invocations, GitHub environment/secret setup (role ARN), smoke invocation, and rollback procedures (previous image tag redeploy; RDS PITR; S3 re-sync).

**References:**
- Context §2 (user-executed boundary), §12 (deploy failure modes); `docs/delivery-plan.md` → *Test deployment runbook* + *GitHub settings*; `docs/aws-architecture-and-orchestration.md` → *CI/CD orchestration*.
- [STRICT] root `AGENTS.md`: AI never deploys — every AWS-touching command in this step lands in docs/workflows, none are executed.

### Plan
- Reuse `ci.yml` job definitions for the pre-deploy checks (workflow-level `needs`, not copy-paste).
- Smoke script uses only `curl` + `jq` (no new runtime deps); prints a summary table for the deploy record (Context §13).
- Runbook cross-references `docs/infrastructure-and-scaling.md` *Prerequisites & access* instead of duplicating it.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$infra-review` (`/infra-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 17 - Final Validation & Cleanup

### Metadata
**Status:** Complete
**Prereqs:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-13

### Completion Notes
- **TODO resolutions (all accumulated follow-ups closed):**
  1. **Feed `photoUrl` pass-through** — `app/src/api/community/CommunityFeedService.ts` `toPhotoUrl` now passes the first `photoRefs` entry through unchanged (bare Unsplash refs included, per the step-12 `mediaRefSchema` relaxation), nulling only genuinely absent photos; the community pure-mapper test updated to assert the pass-through. Verified live: 14/28 seeded feed items now carry refs (previously uniformly null); the client already composes display URLs via `unsplashPhoto` — api-mode feed photos work end-to-end.
  2. **Dead code removed** — `countActiveForAthlete` and `sumRaisedForAthlete` deleted from `app/src/repositories/CampaignRepository.ts` (dead since step 7's groupBy batching; zero call sites verified by grep before removal).
  3. **Cursor codecs consolidated** — `app/src/api/campaigns/CampaignService.ts` migrated to the shared `app/src/shared/keysetCursor.ts` (mapping `id ↔ campaignId` at the repository boundary); the module-local duplicate codec deleted. Same opaque base64url `createdAt|id` payload and malformed→422 behavior; campaign cursor-walk + malformed-cursor tests pass unchanged.
  4. **Docs aligned** — `docs/product-brief.md` Pricing now states zero platform fee / non-custodial with cross-references to `docs/business/incorporation-and-finances.md` + `docs/backend-build-sheet.md` (Phase 2); `docs/delivery-plan.md` milestones table gained a Status column (M0/M1/M2 ✅ Complete, M3 🟡 authored — awaiting user-executed deploy, M4+ not started); `docs/architecture.md` corrected (app implemented + tested through Phase 0–1 incl. follows/community/health feature folders, health live/ready + keyset-pagination/published-only notes in Request Flow, cdk authored + synth-verified, `NEXT_PUBLIC_DATA_SOURCE` dual-mode data source); `README.md` Repository Layout + Status updated honestly (API Phase 0–1 tested, cdk authored/deploy pending, client dual-mode); roster count corrected 8→7 in the context doc §7 and the step-6 spec (`client/lib/mockAthletes.ts` has 7 entries; DB seed = 7 published).
  5. **TODO comment sweep** — `grep -rn "TODO|FIXME|XXX|HACK"` over `app/src/`, `client/lib/`, `cdk/lib/`, `common/src/` → zero hits; nothing to resolve.
- **Full local loop verified (all real runs against the seeded local Postgres):** `RUN_DB_TESTS=1 npx vitest run` from `app/` → **6 files, 58/58 pass** (including the adjusted community test); `npm run build --prefix app` exit 0; compiled API booted via `node dist/index.js` (ready in ~1s, port 4000); `scripts/smoke-test.sh http://localhost:4000` → **13/13 PASS, exit 0** (health live/ready, ELITE-filtered directory + one cursor page walked, `maya-okafor` rich profile, community feed 5, campaigns feed 5, sign-up 201 → sign-in → `GET /v1/users/me` email match, follow → list-contains → unfollow); client dev server with `NEXT_PUBLIC_DATA_SOURCE=api NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` → `/athletes`, `/athletes/maya-okafor`, `/community` all **HTTP 200** with clean route compiles and zero client/API errors logged.
- **`$e2e-review` (`/e2e-review`) executed** (scope: this task's diff `main..HEAD` at the integration level): traced the five request flows across `common` ↔ `app` ↔ `client` boundaries (directory, profile, campaigns — incl. verifying the cursor-codec migration — follows, auth) plus CDK↔app alignment (ApiStack env/secrets/`DATABASE_URL` assembly match what `app/src` reads; health path `/v1/health/ready` and container port align; `JWT_ACCESS_TOKEN_TTL_SECONDS` safely defaults to 3600 in `JwtService`). **One latent contract bug found and fixed:** `common/src/zod/follow.ts` `followSchema.heroMediaUrl` was still `z.string().url()` while every sibling media-display field uses `mediaRefSchema` (step 12's sweep missed it) — a followed athlete with a bare-ref hero (which the write path explicitly permits) would have failed response validation on `GET /v1/users/me/follows`; widened to `mediaRefSchema.nullable()`, `common` rebuilt, all type-checks + 58/58 DB tests still green. All other boundaries aligned; error propagation (401/404/422 → error envelope → client `ApiError`) consistent. Doc-alignment phase covered by the sweep above; detailed per-package reviews ran within steps 6–16 (`$backend-review`/`$frontend-review`/`$infra-review`), and this step's incremental `app/` changes were re-checked against `app/AGENTS.md` (clean).
- **cdk re-verified:** package-local `npm run type-check` exit 0; `cdk synth -c env=test` and `-c env=prod` both exit 0 credential-free (5 stacks; only the known upstream NAT `keyName` + cross-stack-reference-strength advisories).
- **`$ci` (`/ci`)** — `npm run ci` **exit 0** (common build, type-check across common/app/client, lint:fix clean, full build incl. client static/SSG routes, app tests 10 passed / 48 DB-gated skipped). No lockfile/AGENTS-mirror/build-artifact drift.
- Task folder archived to `.ai/tasks/2026-07-13/completed/backend-foundation-test-deploy/` via `git mv` (internal path references intentionally left as-is — historical).

### Final Step Checklist
* [x] Confirm all prior steps are complete
* [x] Review and resolve any outstanding TODOs introduced during this task
* [x] Doc alignment sweep: tick completed milestones in `docs/delivery-plan.md`; fix the stale 3% pricing line in `docs/product-brief.md` (superseded by `docs/business/incorporation-and-finances.md` — zero platform fee, non-custodial); confirm `docs/architecture.md` request-flow and endpoint claims match the landed code
* [x] Verify the full local loop end-to-end: migrate (user-applied) → seed → `npm run test` → API up → client with `NEXT_PUBLIC_DATA_SOURCE=api` renders directory/profile/community → `scripts/smoke-test.sh http://localhost:4000` passes
* [x] Run the `$e2e-review` (`/e2e-review`) skill with all required context provided
* [x] Run the `$ci` (`/ci`) skill and confirm it passes
- [x] Fix any issues caused by `$ci` (`/ci`)
* [x] Update task metadata in the steps docs and the steps guide index
* [x] Move `.ai/tasks/2026-07-13/backend-foundation-test-deploy/` to `.ai/tasks/2026-07-13/completed/backend-foundation-test-deploy/`
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
