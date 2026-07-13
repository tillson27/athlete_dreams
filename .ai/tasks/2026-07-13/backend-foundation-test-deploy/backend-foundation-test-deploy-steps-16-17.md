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
**Status:** Incomplete
**Prereqs:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
**Owner:** unassigned

### Final Step Checklist
* [ ] Confirm all prior steps are complete
* [ ] Review and resolve any outstanding TODOs introduced during this task
* [ ] Doc alignment sweep: tick completed milestones in `docs/delivery-plan.md`; fix the stale 3% pricing line in `docs/product-brief.md` (superseded by `docs/business/incorporation-and-finances.md` — zero platform fee, non-custodial); confirm `docs/architecture.md` request-flow and endpoint claims match the landed code
* [ ] Verify the full local loop end-to-end: migrate (user-applied) → seed → `npm run test` → API up → client with `NEXT_PUBLIC_DATA_SOURCE=api` renders directory/profile/community → `scripts/smoke-test.sh http://localhost:4000` passes
* [ ] Run the `$e2e-review` (`/e2e-review`) skill with all required context provided
* [ ] Run the `$ci` (`/ci`) skill and confirm it passes
- [ ] Fix any issues caused by `$ci` (`/ci`)
* [ ] Update task metadata in the steps docs and the steps guide index
* [ ] Move `.ai/tasks/2026-07-13/backend-foundation-test-deploy/` to `.ai/tasks/2026-07-13/completed/backend-foundation-test-deploy/`
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
