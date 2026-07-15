# Delivery Plan — Branching, Environments & Phased Rollout

How the backend gets built and shipped: the branching model (with `nate` as the integration base), the environment/promotion strategy (AWS **test** deployment first), per-PR quality gates, and the milestone sequence that takes the plan in `docs/backend-build-sheet.md` to a running test deployment.

**Reads with:** `docs/backend-build-sheet.md` (what to build, per phase) · `docs/aws-architecture-and-orchestration.md` (infra design + CI/CD mechanics) · `docs/infrastructure-and-scaling.md` (prerequisites & access, sizing, cost).

**Division of labor ([STRICT], from `AGENTS.md`):** AI authors code, IaC, pipelines, and migration drafts; **the user** pushes branches, merges PRs, configures GitHub settings, runs `cdk bootstrap`/`cdk deploy`, applies migrations, and executes deployments. AI never pushes to any remote and never deploys.

## Branching model

```
main ──────────────────────────────► production line (GH Pages marketing site today;
  │                                   AWS prod later). Protected.
  └── nate ────────────────────────► INTEGRATION BASE for the platform build-out.
        │                             Contains the launch frontend. All implementation
        │                             branches cut from here and PR back into here.
        ├── feat/backend-and-aws-infra-plan   (planning docs — rebased onto nate)
        ├── feat/phase-0-foundation
        ├── feat/phase-1-read-path
        ├── feat/infra-cdk
        └── feat/phase-2-donations …
```

- **`nate` is the base branch for all implementation branches.** It carries the launch-ready frontend (runner-first roster, onboarding, community feed, manage editor). Building the backend against anything else would integrate against a dead UI.
- **`main` stays releasable.** It drives today's production artifact (the GH Pages marketing site). `nate → main` happens once as a promotion PR when the integrated platform (backend + wired client) is ready for a production cutover — not before.
- **Implementation branches** are short-lived, one concern each (`feat/phase-0-foundation`, `fix/…`), cut from `nate`, merged back via PR. Rebase onto `nate` regularly — other agents/contributors land there concurrently (expected per `AGENTS.md`).
- **Merge strategy:** squash-merge PRs into `nate` (linear, revertable units); `nate → main` as a merge commit (preserves the integration point).
- **Conventional commits** (`feat|fix|docs|chore|refactor(scope): …`) — already the repo's practice; PR titles follow the same form since they become squash-commit subjects.

### GitHub settings (user-applied; AI cannot configure these)

| Setting | Value |
|---|---|
| Branch protection: `main`, `nate` | require PR + 1 approval; require status checks (`ci`); no force-push; no direct pushes |
| GitHub environments | `test`, later `production` — deployment protection rules + environment-scoped secrets |
| Dependabot | npm ecosystem, weekly, all workspaces (`/`, `common`, `app`, `client`, later `cdk`) |
| Secret scanning + push protection | on |
| Actions OIDC | IAM role trust per environment (role ARNs as environment secrets; no static AWS keys) |

## Environments & promotion

| | **local** | **test** (first AWS deployment) | **production** (later) |
|---|---|---|---|
| Purpose | dev + unit/integration tests | integrated verification on real AWS | live traffic |
| Infra | local Postgres; `npm run dev` | full CDK stack set, **lean params** (single-AZ `t4g.micro/small`, 1 NAT, min tasks) | CDK **HA params** (`multiAz`, HA NAT, autoscale) |
| Config | `cdk/config/test.ts` n/a | `cdk/config/test.ts` | `cdk/config/prod.ts` |
| Data | seed script | seed script (mirrors client roster data); **no real money — Stripe test mode only** | real |
| DNS | localhost | `test.athletearc.ca` + `api.test.athletearc.ca` (or CloudFront default domains pre-DNS) | `athletearc.ca` + `www` |
| Deploy trigger | — | merge to `nate` (paths-filtered workflows, `test` environment) | promotion `nate → main` (production environment, manual approval gate) |

Promotion is **artifact-forward**: the same image/CDK code verified in test is what prod deploys with different config — no test-only forks of infrastructure code.

## Quality gates — Definition of Done (every PR)

1. `npm run ci` green (type-check, lint, build) **plus tests** (`vitest` + `supertest`) — enforced by the `ci.yml` required check on PRs into `nate`/`main`.
2. New behavior has tests alongside (unit for services, integration for endpoints).
3. Zod-first honored: contract changes land in `common/src/zod/` and types import from `fad-common` only.
4. Migration discipline: drafts created via the sanctioned command only, **immutable once created**, expand/contract pattern for anything destructive (add-new → backfill → cut over → drop later; never a breaking column change in one step).
5. `app/.env.example` updated for any new env var; secrets never committed.
6. Docs updated when a decision or contract changes (the `docs/` set is the decision log).
7. Human review + approval before merge.

## Milestones

Each milestone = one or more PRs into `nate`, with entry/exit criteria. AI builds; the user reviews/merges and runs anything that touches GitHub settings or AWS.

| # | Milestone | Status | Contents | Exit criteria |
|---|---|---|---|---|
| **M0** | Engineering enablement | ✅ Complete | `ci.yml` (PR checks: type-check, lint, test, build), PR template, Dependabot config; user applies branch protection + environments | CI required check live on PRs into `nate` |
| **M1** | Phase 0 — foundation | ✅ Complete | `init` migration draft, vitest/supertest harness, seed script, `buildApp` split, DB-aware health, platform-role fix (per build sheet Phase 0) | `npm run ci` + tests green against local Postgres; seed produces the client roster |
| **M2** | Phase 1 — read path + nate contract alignment | ✅ Complete | Directory/profile/feed endpoints **extended to nate's frontend contracts** (rich profile surface, follows, community feed — see build sheet Phase 1) | Client pages can render from `GET /v1/…` locally with mock stores swapped behind a flag |
| **M3** | Infra authoring + **first AWS test deployment** | ✅ Complete (2026-07-14 — deployed in temporary-URL mode, smoke 13/13) | `cdk/` app (Network/Data/Api/Web, test config), `deploy-api.yml`/`deploy-web.yml` targeting the `test` environment, plain static-export knob in `next.config.ts` (no basePath — the `GITHUB_PAGES` path is Pages-specific); user runs bootstrap + first deploy + migration task + seed | **Smoke suite passes against `test`**: health/ready, directory/profile/feed reads, sign-up→sign-in round-trip |
| **M4** | Phase 2 — donations (Stripe **test mode**) | ◻ Not started | Standard OAuth onboarding, direct-charge donations, event ledger, Connect webhooks (build sheet Phase 2) | Test-mode donation completes end-to-end on `test`; ledger + projections correct; webhook idempotency verified |
| **M5** | Phase 3 — campaign lifecycle | ◻ Not started | Status transitions, transparency updates | Lifecycle verified on `test` |
| **M6** | Phase 4 — accounts, teams + client session cutover | ◐ Client cutover complete (2026-07-14); Phase 4 backend hardening pending | **Done:** client swapped `lib/session.ts`/follows/onboarding/dashboard/manage-editor mocks for real API auth in api mode (access-token-only sessions), plus the two backend gaps it needed (`PUT /v1/athletes/me/personal-bests`, `GET /v1/athletes/me`). **Pending:** refresh tokens/rotation, email verification (SES), rate limiting, teams | Client on `test` runs sign-up → onboard → publish → dashboard against the real API |
| **M7** | Production readiness (deferred until wanted) | ◻ Not started | `prod` config bring-up, `nate → main` promotion PR, DNS cutover, live Stripe credentials | Go-live checklist green |

Milestones are sequential gates, but work within them parallelizes (e.g., M3 infra authoring can proceed while M2 is in review).

## Test deployment runbook (M3, user-executed)

1. **Once:** `cdk bootstrap aws://<account>/us-east-1` (see prerequisites in `docs/infrastructure-and-scaling.md`).
2. `cdk deploy` Network → Data → Api → Web with the `test` config.
3. Run the migration task (`prisma migrate deploy` as ECS RunTask), then the seed task.
4. Point the deployed client at the test API (`NEXT_PUBLIC_API_BASE_URL`).
5. Run the smoke suite (scripted checks: `/v1/health/ready`, directory/profile/feed GETs, auth round-trip). A failed smoke = no traffic shift.
6. Subsequent deploys go through `deploy-api.yml`/`deploy-web.yml` on merge to `nate` (OIDC, `test` environment).

**Rollback:** API — redeploy the previous image tag (ECS keeps prior task definitions; deployment circuit breaker auto-rolls-back failed health checks). DB — expand/contract means schema rollbacks are rarely needed; disaster path is RDS PITR. Client — S3 re-sync of the previous build + CloudFront invalidation.

## Enterprise practice checklist (where each is enforced)

| Practice | Enforcement point |
|---|---|
| IaC for all infrastructure | `cdk/` (no console-created resources) |
| No static cloud credentials | GitHub OIDC roles per environment |
| Secrets management | Secrets Manager / SSM; never in repo or images |
| Required CI on protected branches | `ci.yml` + branch protection (M0) |
| Test pyramid | vitest unit + supertest integration + post-deploy smoke suite |
| Migration safety | immutable drafts, expand/contract, pre-traffic RunTask |
| Zero-downtime deploys + auto-rollback | ALB health-gated rolling updates, ECS circuit breaker |
| Observability from day one | CloudWatch logs/alarms in **test**, not just prod |
| Dependency hygiene | Dependabot + `npm audit` in CI (non-blocking initially) |
| Decision log | the `docs/` set (this file + companions) updated per decision |
| Least-privilege | scoped SGs, task roles, per-env IAM |
