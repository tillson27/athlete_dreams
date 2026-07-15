# Backend Foundation, Nate Contract Alignment & AWS Test-Deployment Readiness - Steps 1-5

## Step 1 - CI enablement: PR checks, PR template, Dependabot

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** small
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-13
**Completion Notes:**
- Added `.github/workflows/ci.yml` (triggers: `pull_request` into `nate`/`main` + `workflow_dispatch`; Node 22 + npm cache over all four workspace lockfiles; steps `npm ci` → build `common` → `type-check` → `lint` → `build`; least-privilege `contents: read`, `cancel-in-progress` concurrency). No `test` job — Step 3 adds it.
- Added `.github/pull_request_template.md` (summary, linked task/step, checklist) and `.github/dependabot.yml` (weekly npm updates for `/`, `/common`, `/app`, `/client`, plus `github-actions` at `/`).
- `$infra-review` + `$ci` (`npm run ci`) both green; CI builds `common` before `type-check`, resolving the known `fad-common` dist dependency (Context §5).
- **USER ACTION (GitHub settings — human only):** enable branch protection on `nate` and `main` requiring the `ci` check; enable Dependabot alerts/security updates and secret scanning.

### Context

**Objective:** Stand up the M0 quality gates so every subsequent PR into `nate`/`main` is checked.
**Done When:**
- `.github/workflows/ci.yml` runs on `pull_request` into `nate` and `main`: install → build `common` → type-check → lint → build (a `test` job is added in Step 3).
- `.github/pull_request_template.md` and `.github/dependabot.yml` (npm, weekly, directories `/`, `/common`, `/app`, `/client`) exist.
- Workflow is green on a draft PR.

**References:**
- Context §2 (M0 scope), §10 (.github impact); `docs/delivery-plan.md` → *GitHub settings* + *Quality gates*.
- Existing workflow conventions: `.github/workflows/deploy-client-pages.yml` (Node 22, npm cache paths).

### Plan
- Author `ci.yml` mirroring the Node/cache setup of the Pages workflow; steps: `npm ci` → `npm run build --prefix common` → `npm run type-check` → `npm run lint` → `npm run build`.
- Add a concise PR template: summary, linked step/task doc, checklist (CI green, tests added, docs touched).
- Add `dependabot.yml` for all npm workspaces.
- Flag for the user (in the PR description): enable branch protection on `nate`/`main` with `ci` as a required check, plus Dependabot + secret scanning (settings are user-only actions).

### Step checklist
- [x] Step-specific tasks complete
- [x] `$infra-review` (`/infra-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 2 - App bootstrap refactor: buildApp split, lifecycle, health

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-13
**Completion Notes:**
- Split `app/src/index.ts` into `app/src/app.ts` (exports `buildApp(): express.Express`; preserves helmet → CORS → json → request-id → routers → errorHandler order) and a boot-only `app/src/index.ts` (`reflect-metadata`/dotenv first, `prisma.$connect()` before `listen`, SIGTERM/SIGINT graceful shutdown via `server.close()` → `prisma.$disconnect()` with a bounded 10s force-exit timer that exits non-zero on forced timeout or shutdown error).
- Replaced inline `/v1/health` with a DI health feature (`app/src/api/health/HealthRouterFactory.ts` + `HealthController.ts`): `/v1/health/live` returns 200 unconditionally; `/v1/health/ready` runs `SELECT 1` and returns 503 on DB failure.
- Kept the [STRICT] repository boundary: the `SELECT 1` probe lives in a new `app/src/repositories/HealthRepository.ts` (`ping()`); the controller injects the repository, never `PrismaService`/`PrismaClient` directly.
- Added `ServiceUnavailableError` (503, `service_unavailable`) to `app/src/shared/errors.ts`; readiness 503s flow through the existing `errorHandler` to emit the standard `{error: {code, message}}` envelope. `npm run ci` passes (type-check, lint:fix, build across common/app/client).

### Context

**Objective:** Make the Express app importable without side effects and observable/deployable: `buildApp()` export, DB lifecycle, split health endpoints.
**Done When:**
- `app/src/app.ts` exports `buildApp(): express.Express`; `app/src/index.ts` only boots (`start()`), connects Prisma, and registers SIGTERM/SIGINT graceful shutdown (`server.close()` → `prisma.$disconnect()`).
- `GET /v1/health/live` returns 200 unconditionally; `GET /v1/health/ready` runs `SELECT 1` via `PrismaService` and returns 503 with the standard error envelope when the DB is unreachable.
- `npm run ci` passes.

**References:**
- Context §4 (current `app/src/index.ts`), §11–12 (ready semantics, shutdown); `docs/backend-build-sheet.md` → Phase 0 *App entry refactor*.
- Patterns: `app/src/middleware/errorHandler.ts`, `app/src/shared/ResponseHandler.ts`.

### Plan
- Move `buildApp` (helmet/CORS/json/request-id, router mounting, errorHandler) into `app/src/app.ts`; keep mounting order intact.
- Replace the inline `/v1/health` with a small health router:
    - Snippet:
      ```ts
      router.get('/ready', async (_req, res) => {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ data: { status: 'ready' } });
      });
      ```
- Implement `start()` with `prisma.$connect()` before `listen`, plus a bounded-drain shutdown handler.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 3 - Test harness: vitest + supertest, wired into CI

### Metadata
**Status:** Complete
**Prereqs:** 1, 2
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-13
**Completion Notes:**
- Added devDeps `vitest`, `supertest`, `@types/supertest` to `app/` (no test deps existed — dependency-reuse confirmed). Authored `app/vitest.config.ts` (node env, `pool: 'forks'`, `fileParallelism: false`, `maxWorkers: 1` for sequential integration tests; Vitest 4 top-level pool options) and `app/src/test/setup.ts` (loads `reflect-metadata` before tsyringe resolves — required or `container.resolve` throws the reflect-polyfill error) wired via `setupFiles`.
- `app/src/test/buildTestApp.ts` returns Step 2's `buildApp()`. `app/src/test/health.test.ts` covers: `/v1/health/live` 200 (no DB); `/v1/health/ready` 503 by overriding `HealthRepository` in the tsyringe container with a stub whose `ping()` throws (exercises the real controller → `ServiceUnavailableError` → errorHandler `service_unavailable` envelope, no DB); `/v1/health/ready` 200 real `SELECT 1`.
- **Ready-200 locally:** no Postgres was reachable at first (`pg_isready` no response, port 5432 closed, no docker pg), so it is gated behind `describe.skipIf(RUN_DB_TESTS !== '1')` — a *visible* skip, never a fake pass. Then verified for real against a throwaway `postgres:16` container with `RUN_DB_TESTS=1` + `DATABASE_URL=…/fad_test`: all 3 tests pass. Documented `RUN_DB_TESTS` in `app/.env.example`.
- Scripts: `app/package.json` += `test`/`test:watch`; root `package.json` += `"test": "npm run test --prefix app"` and `ci` now ends with `&& npm run test`. `ci.yml` gained a `test` job with a health-checked `postgres:16` service, `DATABASE_URL=…/fad_test`, `RUN_DB_TESTS=1` (so the ready-200 test RUNS in CI), steps npm ci → build common → build-client → test. `$backend-review` + `$ci` green.

### Context

**Objective:** Give the repo its first automated tests and make them a required gate.
**Done When:**
- `vitest run` executes from `app/` with passing health tests (live always; ready against a running local Postgres).
- `app/package.json` has `test`/`test:watch`; root `package.json` gains `"test": "npm run test --prefix app"` and `ci` includes it.
- `ci.yml` gains a `test` job with a `postgres:16` service container and `DATABASE_URL` env.

**References:**
- Context §1 (success criteria), §6 (local Postgres assumption); `docs/backend-build-sheet.md` → Phase 0 *Test harness*.
- Dependency-reuse rule (root `AGENTS.md`): vitest + supertest chosen in planning; no test deps exist yet in `app/package.json`.

### Plan
- Add devDeps `vitest`, `supertest`, `@types/supertest`; author `app/vitest.config.ts` (node environment, sequential integration pool).
- Add `app/src/test/buildTestApp.ts` returning `buildApp()`; write `health.test.ts` (live 200; ready 200 with DB, 503 with a broken `DATABASE_URL` case).
- Wire root scripts and extend `ci.yml` (service container: `postgres:16`, health-checked; `DATABASE_URL=postgresql://fad:fad@localhost:5432/fad_test`).

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 4 - Prisma schema evolution (nate alignment)

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-13
**Completion Notes:**
- Evolved `app/prisma/schema.prisma` with the exact Δschema: `AthleteProfile` (+handle/runnerLevel/disciplineLabel/story/coreValues/presentation/publishedAt), `AthleteAccomplishment` (+detail/resultUrl/photoRefs), new `AthleteRaceResult`/`PersonalBest`/`Follow`, `AthleteEvent` (+displayDate), `SportCategory` += `ROAD_CYCLING`, enum `AthleteLevel`. Regenerated the Prisma client via `npm run build-client --prefix app`.
- Followed existing conventions: uuid PKs `@db.Uuid`, snake_case `@@map`, section banners (added a "Social graph" banner for `Follow`), cascade relations, and no `deletedAt` on child/join rows (matches existing leaf models).
- **Cross-step dependency resolved to keep CI green:** the new Prisma `ROAD_CYCLING` widens `SportCategory` beyond the `fad-common` union, breaking `app/src/api/athletes/AthleteService.ts` DTO mapping. Added only the single enum member `ROAD_CYCLING` to `common/src/types/enums.ts` (Step 5 lists this exact addition — identical additions converge on merge; no other Step 5 contract surface touched).
- Added `@@index([runnerLevel])` on `AthleteProfile` (mirrors existing `@@index([primarySport])`) for the Step 7 directory `runnerLevel` filter. `npm run ci` passes (exit 0: type-check + lint + build across common/app/client).

### Context

**Objective:** Evolve `app/prisma/schema.prisma` to the launch data model — the exact Δschema locked in planning — **without** creating a migration (Step 6 does that).
**Done When:**
- Schema contains: `AthleteProfile` += `handle String? @unique`, `runnerLevel AthleteLevel @default(EVERYDAY)`, `disciplineLabel String?`, `storyIntro String?`, `storyBody String[]`, `coreValues Json?`, `presentation Json?`, `publishedAt DateTime?`; `AthleteAccomplishment` += `detail String?`, `resultUrl String?`, `photoRefs String[]`; new models `AthleteRaceResult`, `PersonalBest`, `Follow` (with `@@unique([followerUserId, athleteId])` and indexes); `AthleteEvent` += `displayDate String?`; `SportCategory` += `ROAD_CYCLING`; new enum `AthleteLevel { ELITE COMPETITIVE EVERYDAY }`.
- `npm run build-client --prefix app` (prisma generate) succeeds and `npm run ci` stays green (changes are additive).

**References:**
- Context §9 (data model changes, handle format); `docs/backend-build-sheet.md` → *Phase 1 → Nate alignment additions* (authoritative field list).
- Shape source: `client/lib/athleteProfiles.ts` (`RichAthleteProfile`), `client/lib/athleteEdits.ts` (editor entities), `client/lib/mockAthletes.ts` (`runnerLevel`).
- Conventions: existing schema style — uuid PKs, `@db.Uuid`, `snake_case` `@@map`, soft-delete `deletedAt` where rows are user-managed.

### Plan
- Add fields/models/enums following the existing section banners and naming conventions (explicit names: `resultSummary`, `displayDate`, `photoRefs`).
- `AthleteRaceResult`: `id`, `athleteId`, `resultName`, `displayDate String`, `occurredOn DateTime? @db.Date`, `resultSummary String`, `resultUrl String?`, `links Json?`, `photoRefs String[]`, `sortOrder Int @default(0)`, timestamps; relation + index on `athleteId`.
- `PersonalBest`: `id`, `athleteId`, `label`, `value`, `resultUrl String?`, `sortOrder Int @default(0)`; `@@unique([athleteId, label])`.
- `Follow`: `id`, `followerUserId`, `athleteId`, `createdAt`; relations to `User`/`AthleteProfile` (cascade), `@@unique([followerUserId, athleteId])`, index on `athleteId`.
- Run prisma generate via the sanctioned build script; fix any compile fallout (expected: none — additive).

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 5 - Zod contract evolution in common/

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-13
**Completion Notes:**
- Added `AthleteLevel` enum + `SportCategory.ROAD_CYCLING`; grew `athleteProfileSchema` (handle, runnerLevel, disciplineLabel, story fields, coreValues, presentation, publishedAt, personalBests, raceResults, roadmap, gallery) with the new rich fields **optional in the inferred output type** so the existing `app/` `toProfileDto`/`buildDirectoryItem` mappers keep compiling (Step 7/8 populate them). Added `updateAthleteProfileRequestSchema` (`.strict()`, all-optional), paginated directory/follow/feed/campaign wrappers, set-replace request schemas (highlights 20 / races 30 / roadmap 10 / gallery 12), publish response, new `follow.ts` + `feed.ts` (feed item matches Context §9 exactly), and `campaignSummarySchema` + `activeCampaignFeedResponseSchema`.
- `handle` modeled as `z.string().regex(/^[a-z0-9.]{3,30}$/)`, stored without the leading `@`.
- Cross-step bridge: added only `ROAD_CYCLING` + `AthleteLevel` to `app/prisma/schema.prisma` (byte-convergent with Step 4) and ran the sanctioned `prisma generate` so the workspace type-check stays green in isolation; the rest of the Δschema remains Step 4's scope.
- `npm run ci` green (type-check + lint clean + `common`/`app`/`client` build); all 18 new symbols verified exported from `fad-common`.

### Context

**Objective:** Land the full contract surface for Phases 0–1 in `common/src/zod/` so app and client consume identical types.
**Done When:**
- `common/src/types/enums.ts` gains `ROAD_CYCLING` in `SportCategory` and a new `AthleteLevel`; barrel exports updated.
- `athlete.ts`: `athleteProfileSchema` grown toward `RichAthleteProfile` (handle, runnerLevel, disciplineLabel, storyIntro/storyBody, coreValues, presentation, publishedAt, personalBests, raceResults, roadmap, gallery); `updateAthleteProfileRequestSchema` (`.strict()`, all-optional); `athleteDirectoryQuerySchema` += `runnerLevel`; `athleteDirectoryResponseSchema = paginationResponseSchema(athleteDirectoryItemSchema)`; set-replace request schemas for highlights/races/roadmap/gallery; publish response schema.
- New `follow.ts` (follow item + list response) and `feed.ts` (`communityFeedItemSchema` per Context §9 example + query schema); `campaign.ts` += `campaignSummarySchema` + `activeCampaignFeedResponseSchema`.
- `npm run build --prefix common` passes and `npm run type-check` is green across the workspace.

**References:**
- Context §9 (contract changes + feed example shape); `docs/backend-build-sheet.md` → Phase 1 Δcontract + *Nate alignment additions*.
- Conventions: `common/AGENTS.md` (strict request bodies, ISO dates, integer cents); existing patterns in `common/src/zod/shared.ts` (`slugSchema`, `paginationResponseSchema`).

### Plan
- Model `handle` as `z.string().regex(/^[a-z0-9.]{3,30}$/)` (Context §9); keep response schemas non-strict, requests `.strict()`.
- Mirror the editor's save-all model with array-payload set-replace schemas (max lengths: highlights 20, races 30, roadmap 10, gallery 12).
- Export everything through `common/src/index.ts`; build and re-type-check `app/` + `client/`.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
