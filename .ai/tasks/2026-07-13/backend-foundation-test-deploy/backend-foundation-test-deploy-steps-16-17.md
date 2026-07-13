# Backend Foundation, Nate Contract Alignment & AWS Test-Deployment Readiness - Steps 16-17

## Step 16 - Deploy workflows (OIDC), smoke suite, deploy runbook

### Metadata
**Status:** Incomplete
**Prereqs:** 3, 14, 15
**Size:** medium
**Owner:** unassigned

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
- [ ] Step-specific tasks complete
- [ ] `$infra-review` (`/infra-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
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
