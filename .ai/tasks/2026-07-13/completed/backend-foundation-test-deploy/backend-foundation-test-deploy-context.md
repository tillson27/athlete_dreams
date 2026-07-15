# Backend Foundation, Nate Contract Alignment & AWS Test-Deployment Readiness

Date: 2026-07-13
Task slug: backend-foundation-test-deploy
Status: Approved

## 0) Summary

- **Objective:** Implement milestones **M0–M3** of `docs/delivery-plan.md` — engineering enablement, the Phase 0 backend foundation, the Phase 1 read path aligned to the `nate` frontend contracts, and the CDK/CI infrastructure — leaving the repo one user-executed runbook away from a live AWS **test** deployment.
- **Why now:** The `nate` branch ships a launch-ready frontend on deliberate localStorage mock seams that each name their backend replacement; the backend is a scaffold with no migrations, no tests, and no infrastructure. This task closes that gap.
- **Primary outcomes:** CI quality gates on PRs; a runnable, tested, seedable API serving nate's directory/profile/feed/follows/onboarding surfaces; an authored `cdk/` app + deploy workflows; a smoke-tested path to `test.athletearc.ca`.

---

## 1) Success criteria

- `npm run ci` (type-check, lint, build) **plus** `npm run test` pass locally against a local Postgres, and the same checks run as a required PR workflow.
- `prisma migrate dev` (user-applied) + `prisma db seed` produce a database from which the API serves the full nate launch roster byte-compatibly with `client/lib/{mockAthletes,athleteProfiles}.ts`.
- The client, with its data-source flag set to `api`, renders directory, athlete profile, and community feed from `GET /v1/*` locally.
- `cdk synth` succeeds for the `test` configuration; deploy workflows and the runbook are complete so the user can execute bootstrap → deploy → migrate → seed → smoke.

**Acceptance criteria (definition of done):**
- All steps in the steps docs are Complete, including final validation via `$e2e-review` (`/e2e-review`).
- Every endpoint listed in `docs/backend-build-sheet.md` Phases 0–1 (including *Nate alignment additions*) exists, is Zod-validated via `fad-common`, and has tests.
- Directory and feed return **published athletes only**; unpublished profiles are reachable only by their owner.
- The smoke-test script covers: health live/ready, directory (filtered + paginated), profile by slug, community feed, follow round-trip, sign-up → sign-in → `GET /v1/users/me`.

---

## 2) Scope and non-goals

**In scope:**
- M0: `ci.yml` PR checks, PR template, Dependabot (`.github/`).
- M1 / Phase 0: `buildApp` split, Prisma connect + graceful shutdown, health live/ready, vitest+supertest harness, **`init` migration draft including the nate profile-model evolution**, seed script, `ATHLETE` platform-role assignment.
- M2 / Phase 1: rich profile read path, keyset pagination + batched directory stats, athlete write path (PATCH me, publish, manage-editor set-replace endpoints), follows, campaign read path + transparency rule, derived community feed.
- Client API layer behind a data-source flag (mock fallback preserved).
- M3 authoring: `cdk/` stacks (Network/Data/Api/Web, test+prod configs), `app/Dockerfile`, deploy workflows (OIDC), static-export knob, smoke script, deploy runbook.

**Out of scope:**
- Phases 2–4 (Stripe money loop, campaign lifecycle, refresh tokens/SES email, teams) — M4–M6; Stripe/SES access is deferred per `docs/infrastructure-and-scaling.md` → *Prerequisites & access*.
- Executing any deployment, migration apply, or GitHub settings change — **user-executed** per [STRICT] rules.
- Production environment bring-up, DNS cutover, `nate → main` promotion (M7).
- Photo uploads (S3 presigned), feed cheers persistence, all-or-nothing pledges — see `docs/backend-build-sheet.md` → *Deferred*.

**Out-of-scope edge cases:**
- Multi-currency beyond CAD/USD display: launch is Canada-first; ledger carries `currency` but no FX handling.
- SSR/ISR for SEO of API-driven data: accepted gap until Stage 2 (`docs/infrastructure-and-scaling.md`).
- Concurrent-editor conflict resolution on manage-editor set-replace writes: last-write-wins is acceptable for a single-owner profile.
- RDS Proxy / read replicas / caching: Stage 1–2 concerns, not needed at test-env scale.

---

## 3) Background and motivation

`docs/product-brief.md` defines the product (story-first, transparent athlete funding; Canada-first); `nate` narrows launch to a runners-only Pillar-1 surface and removes corporate routes. The five planning docs are the decision log: `docs/backend-build-sheet.md` (what to build), `docs/delivery-plan.md` (branching `nate`-based, environments, milestones), `docs/aws-architecture-and-orchestration.md` (infra design + justifications), `docs/infrastructure-and-scaling.md` (prereqs, sizing, cost), `docs/architecture.md` (current layout). Product rules to preserve ([STRICT], root `AGENTS.md`): transparency (cost breakdowns), athlete stories before metrics, minimalist UX.

Note: `docs/product-brief.md` §Pricing (3% platform fee) is **stale** — superseded by `docs/business/incorporation-and-finances.md` (zero platform fee, non-custodial). Money is out of scope here; the brief gets a doc-alignment touch-up in the final step.

---

## 4) Current state and gaps

### Current state
- API scaffold: `app/src/index.ts` (monolithic boot), feature folders `app/src/api/{auth,users,teams,athletes,campaigns}/`, repositories, infra services (`PrismaService`, `JwtService`, `PasswordHashService`, `Logger`), shared plumbing (`BaseRouterFactory`, `ResponseHandler`, `errors.ts`, `requestParsers.ts`), middleware (auth, request-id, errorHandler). Auth sign-up/sign-in fully works (argon2 + HS256 JWT, personal-team auto-create).
- Schema: `app/prisma/schema.prisma` — complete pre-nate domain model; **no `app/prisma/migrations/` directory exists**.
- Contracts: `common/src/zod/{athlete,auth,campaign,donation,event,shared,sponsor,team,user}.ts` — pre-nate shapes.
- Client (`nate`): launch surface on mock seams — `client/lib/{session,follows,athleteEdits,athleteProfiles,communityFeed,browserStore,mockAthletes}.ts`; `NEXT_PUBLIC_API_BASE_URL` defined but unused; zero `fetch()` calls.
- CI/CD: only `.github/workflows/deploy-client-pages.yml` (GH Pages static export with `/athlete_dreams` basePath). No PR checks, no tests anywhere, no `cdk/` directory, no Dockerfile.

### Gaps
- No migrations, seed, or test harness; health check is DB-blind; no graceful shutdown; `PlatformRoleAssignment` never written.
- Backend contracts lack nate's model: `runnerLevel`, `handle`, story fields, personal bests, race results with `resultUrl` verification, roadmap display dates, `publishedAt`, follows, feed, `ROAD_CYCLING`.
- `AthleteController.listDirectory` ignores `cursor` and returns a bare array; `buildDirectoryItem` is N+1; profile DTO hardcodes empty arrays (`app/src/api/athletes/AthleteService.ts`).
- Campaign transparency rule (Σ cost lines == target) unenforced; `CampaignRepository.listActiveForAthlete` is dead code.
- No infrastructure code, no deploy workflows, no smoke tests, no production-grade static export path for `athletearc.ca`.

---

## 5) Changes and considerations

**Significant changes:**
- Single `init` migration carries the **evolved** schema (pre-nate model + nate alignment) — nothing is deployed, so there is no two-migration churn.
- `athleteProfileSchema` grows toward the client's `RichAthleteProfile`; normalization split per `docs/backend-build-sheet.md` → *Frontend contract alignment* (editor-editable content normalized; curated presentation as `presentation Json`).
- Directory/feed become **published-only**; publish is an explicit endpoint with a minimum-content guard.
- The client gains its first real API layer, flagged so mock mode keeps working (GH Pages deploy unaffected).

**Impact and considerations:**
- `common` builds must precede `app`/`client` type-checks after contract changes (workspace file: dependency).
- The GH Pages workflow keeps working throughout; the S3/CloudFront path is additive until DNS cutover.
- Other agents may land commits on `nate` concurrently — rebase implementation branches; never halt on unrelated changes (root `AGENTS.md`).

---

## 6) Constraints, assumptions, dependencies

**Constraints ([STRICT] unless noted):**
- AI never deploys, never pushes to remotes, never applies migrations; drafts only via `npm run migrate:create --prefix app -- --name <name>`; migration files immutable once created.
- All API types from `fad-common`; all Prisma access through repositories; typed domain errors; no secrets in logs.
- Comment rules (self-explanatory code), explicit naming, dependency-reuse check before adding packages.
- Repo-root relative paths in docs; no documentation duplication — cross-reference `docs/` instead.

**Assumptions:**
- A local Postgres is available at `DATABASE_URL` (e.g. `postgresql://fad:fad@localhost:5432/fad_dev`) for migration drafting, seed, and integration tests; the user provides/starts it.
- The user performs GitHub settings (branch protection, environments, Dependabot enable) and all AWS actions when steps flag them.
- `nate` remains the integration base; steps rebase onto it as needed.

**Dependencies (ordered):**
- Schema evolution (step 4) → `init` migration draft + seed (step 6) → user applies migration → integration tests/read path (steps 7+).
- Contract evolution (step 5) + `common` build → app services/controllers and client API layer.
- NetworkStack (step 13) → Data/Api stacks (step 14) → WebStack (step 15) → deploy workflows + runbook (step 16).

---

## 7) Requirements

**Functional requirements:**
- Serve every read surface nate renders: filtered/paginated directory (`sport`, `runnerLevel`, `search`, `countryCode`, published-only), rich profile by slug (PBs, highlights, races with `resultUrl`, roadmap, story, presentation JSON, gallery), derived community feed (kind/sport filters, follows-aware when authenticated), campaign feed + per-athlete campaigns.
- Persist every write nate's UI performs: onboarding profile updates (`PATCH /v1/athletes/me`), publish, manage-editor set-replace (highlights/races/roadmap/gallery), follows, campaign create with transparency validation.
- Auth: existing sign-up/sign-in; `GET /v1/users/me` restores session; profile creation assigns `ATHLETE` platform role.
- Seed reproduces the 7-athlete launch roster exactly (`client/lib/mockAthletes.ts` has 7 entries).

**Non-functional requirements:**
- Keyset pagination (no OFFSET) on `(createdAt desc, id desc)`; directory stats batched via `groupBy` (no N+1).
- p95 < 300 ms for directory/profile/feed at test-env scale; graceful shutdown drains in-flight requests.
- Health: `live` (process) vs `ready` (DB `SELECT 1`); ALB targets `ready`.
- Security: helmet, CORS allowlist, JWT verification unchanged; secrets only via env/Secrets Manager; least-privilege SGs and task roles in CDK.
- CI wall-time ≤ ~5 min; deploys are health-gated rolling updates with circuit-breaker rollback.

---

## 8) Proposed approach

- Follow the phase specs verbatim from `docs/backend-build-sheet.md` (Phase 0, Phase 1 incl. *Nate alignment additions*, Infra & Deploy track) and the milestone gates from `docs/delivery-plan.md` (M0–M3).
- Patterns: Controller → Service → Repository (`app/AGENTS.md`); Zod-first contract flow (`common/AGENTS.md`); set-replace write semantics to match the manage editor's save-all model; derived (not stored) feed.
- Infra: CDK v2 stacks parameterized lean/HA per `docs/aws-architecture-and-orchestration.md`; migrations as a pre-traffic ECS RunTask; GitHub OIDC for CI.
- Three parallelizable tracks — enablement (steps 1–3), domain (4–12), infra (13–16) — converging on final validation (17).

---

## 9) Data model and contracts

This repo is **Zod-first** (`common/src/zod/` is the contract source of truth; there is no `common/openapi.yaml`).

### Data model changes
- Exactly the Δschema of `docs/backend-build-sheet.md` → *Phase 1 → Nate alignment additions*: `AthleteProfile` += `handle @unique`, `runnerLevel`, `disciplineLabel`, `storyIntro`, `storyBody String[]`, `coreValues Json`, `presentation Json`, `publishedAt DateTime?`; `AthleteAccomplishment` highlight shape; new `AthleteRaceResult`, `PersonalBest`, `Follow`; `AthleteEvent` += `displayDate`; `SportCategory` += `ROAD_CYCLING`; enum `AthleteLevel`.
- `handle` format: lowercase letters, digits, and dots, 3–30 chars (client examples: `@maya.runs.far`); stored without the `@`.

### Contract changes
- Per the same section: rich `athleteProfileSchema`, `athleteDirectoryQuerySchema` += `runnerLevel`, paginated directory wrapper, `followSchema`, `communityFeedItemSchema`, `campaignSummarySchema` + feed wrapper, `updateAthleteProfileRequestSchema`, publish response.

### Example shapes

```json
// GET /v1/community/feed → data.items[]
{
  "feedItemId": "string (derived: <athleteSlug>-<kind>-<sourceId>)",
  "athleteSlug": "string",
  "athleteName": "string",
  "primarySport": "RUNNING | TRACK_AND_FIELD | ROAD_CYCLING",
  "kind": "result | roadmap",
  "category": "race | training | milestone",
  "headline": "string",
  "detail": "string",
  "photoUrl": "string | null",
  "occurredAtLabel": "string",
  "isVerified": "boolean (derived: source carries resultUrl)"
}
```

---

## 10) Package-level impact

### common/
- New/changed schemas + enums per §9; `npm run build --prefix common` after every change; consumers re-type-checked.

### app/
- `app.ts`/`index.ts` split; health endpoints; harness (`vitest.config.ts`, `src/test/buildTestApp.ts`); schema + `init` migration + `prisma/seed.ts`; repositories (`FollowRepository`, `PlatformRoleRepository`, extended `AthleteRepository`/`CampaignRepository`); services/controllers/routers for athletes (read+write+publish), follows, feed, campaigns; `Dockerfile`.

### client/
- `client/lib/api.ts` (typed fetch on `NEXT_PUBLIC_API_BASE_URL`), `NEXT_PUBLIC_DATA_SOURCE=mock|api` flag consumed by directory/profile/community pages; `next.config.ts` plain static-export knob (no basePath); `client/.env.example` updated.

### cdk/
- New package: `bin/`, `lib/{network,data,api,web}-stack.ts`, migration/seed RunTask defs, `config/{test,prod}.ts`, `README.md` runbook, `AGENTS.md`; OIDC role for Actions.

### docs/
- Tick off delivery-plan milestones as they land; fix stale pricing line in `docs/product-brief.md`; keep `docs/architecture.md` request-flow section true as endpoints land.

*(.github/: `ci.yml`, `deploy-api.yml`, `deploy-web.yml`, `pull_request_template.md`, `dependabot.yml`.)*

---

## 11) Edge cases and error handling

- **Unpublished profile fetched publicly:** 404 (`NotFoundError`) unless the requester is the owner (authenticated user id matches).
- **Publish without minimum content** (no story, no PBs, or no discipline): 422 `ValidationError` listing missing requirements.
- **Duplicate follow / unfollow of non-followed athlete:** idempotent success (no-op), not an error.
- **Follow a non-existent or unpublished athlete:** 404.
- **Cursor garbage in directory/feed:** 422 from Zod cursor validation; empty `items` + `nextCursor: null` on out-of-range.
- **Campaign create where Σ cost lines ≠ target:** 422 with per-line details.
- **Seed re-run:** upserts by unique keys (slug/handle/email) — idempotent, no duplicates.
- **`/v1/health/ready` with DB down:** 503 with `{error}` body; `live` stays 200 (deploy gates on `ready`).

---

## 12) Failure modes and concurrency

**Concurrency/race conditions:**
- Migrations never run on container boot — only as a discrete pre-traffic RunTask, so N starting tasks cannot race schema changes.
- Set-replace editor writes wrap delete+create in a `prisma.$transaction`; last-write-wins is accepted (single-owner resource).
- Keyset pagination is stable under concurrent inserts (no OFFSET drift).
- Concurrent agents on `nate`: proceed per root `AGENTS.md`; rebase before PR.

**Idempotency and retries:**
- Follow/unfollow: `@@unique(followerUserId, athleteId)` + upsert/deleteMany semantics.
- Publish: setting `publishedAt` twice is a no-op (first-write preserved).
- Seed: upsert-only. Smoke script: read-only except one throwaway auth account (unique suffixed email per run).

**Failure modes:**
- DB unavailable → `ready` 503 → ALB stops routing; ECS circuit breaker rolls a bad deploy back to the prior task definition.
- Graceful shutdown: SIGTERM → stop accepting → drain → `prisma.$disconnect()` (bounded timeout).
- Deploy workflow failure after ECR push but before service update leaves the running version untouched (image push is inert).

---

## 13) Operational readiness

**Observability:**
- pino structured logs with request-id; CloudWatch log groups with 14–30 day retention (`docs/infrastructure-and-scaling.md` cost levers).
- CloudWatch alarms in **test** from day one: ALB 5xx rate, target health, ECS CPU/memory, RDS free storage/CPU.
- Smoke script output doubles as the post-deploy verification record.

---

## 14) Research and references

- All design research is consolidated in the planning docs: `docs/backend-build-sheet.md`, `docs/delivery-plan.md`, `docs/aws-architecture-and-orchestration.md`, `docs/infrastructure-and-scaling.md`, `docs/architecture.md`.
- Frontend contract source: `client/lib/{mockAthletes,athleteProfiles,athleteEdits,follows,communityFeed,session}.ts` (each mock names its backend replacement).
- Business/legal grounding: `docs/business/incorporation-and-finances.md` (non-custodial, zero-fee — out of scope here but constrains later phases), `docs/reference/trademark-brief.md`.
- **Provider contract gate:** no third-party API request/response contracts are consumed in this task's scope (AWS is driven via CDK constructs, not parsed API responses; Stripe/SES are deferred to M4+). `$provider-contract-verification` (`/provider-contract-verification`) is therefore not applicable to this plan and **must be run during M4 planning** for Stripe.
