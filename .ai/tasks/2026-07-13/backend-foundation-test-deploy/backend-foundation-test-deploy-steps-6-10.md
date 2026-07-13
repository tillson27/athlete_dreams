# Backend Foundation, Nate Contract Alignment & AWS Test-Deployment Readiness - Steps 6-10

## Step 6 - Init migration draft + seed script

### Metadata
**Status:** Complete
**Prereqs:** 4
**Size:** medium
**Owner:** claude-opus-4.8 (with user-applied migration/seed)
**Completed At:** 2026-07-13
**Completion Notes:**
- First execution of the `$db-migrate-and-seed` (`/db-migrate-and-seed`) skill. Enabled `postgresqlExtensions` + `extensions = [citext]` before drafting; `20260713174510_init` drafted via the sanctioned create-only command and reviewed end-to-end (extension emitted first, `ROAD_CYCLING`/`AthleteLevel` enums, all 20 tables, nate profile fields/uniques/indexes, cascade FKs). **User** applied via `prisma migrate dev` and seeded via `prisma db seed`.
- `app/prisma/seed.ts` imports `client/lib/{mockAthletes,athleteProfiles}.ts` directly (single source of truth); idempotent (upserts by email/slug/`userId_role`; keyless children delete+recreate per athlete). Result: 7 athletes (7 users, personal teams, `ATHLETE` roles), 6 campaigns + cost lines, 36 race results, 28 personal bests, media/roadmap/presentation JSON, `publishedAt` set.
- Verified: `RUN_DB_TESTS=1` test suite 3/3 (ready-200 against the real DB); compiled API (`node dist/index.js`) serves `/v1/health/ready` 200, directory with all 7 slugs + correct aggregated stats, profile by slug.
- **KNOWN ISSUE (pre-existing, logged for step 12):** `npm run dev --prefix app` (tsx) cannot boot the DI container — esbuild never emits decorator metadata, so tsyringe throws `TypeInfo not known`. The production path (`tsc` build → `node dist/index.js`) is unaffected (Docker/ECS use it). Fix the dev runner (swc-based runner or `tsc --watch` + `node --watch`) when a live local API is needed, at the latest in step 12.

### Context

**Objective:** Produce the single `init` migration (evolved schema) and a seed that reproduces the nate launch roster — the first execution of the `$db-migrate-and-seed` (`/db-migrate-and-seed`) skill.
**Done When:**
- `app/prisma/migrations/<ts>_init/` exists, created **only** via `npm run migrate:create --prefix app -- --name init`, and its SQL contains the nate-alignment models/fields from Step 4.
- The datasource enables the `citext` extension via the `postgresqlExtensions` preview feature **before drafting**, so the migration emits `CREATE EXTENSION IF NOT EXISTS "citext"` and applies on vanilla Postgres/RDS (see skill → Gotchas; `User.email` is `@db.Citext`).
- `app/prisma/seed.ts` upserts (idempotent re-run) the 8-athlete roster from `client/lib/mockAthletes.ts` + `client/lib/athleteProfiles.ts` — users (placeholder emails + argon2 hashes), personal teams, profiles (published), PBs, race results, highlights, roadmap events, campaigns + cost lines, presentation JSON.
- `app/package.json` gains `"prisma": { "seed": "tsx prisma/seed.ts" }`.
- **USER ACTIONS flagged in the PR:** run a local Postgres, then `prisma migrate dev` and `prisma db seed` (AI must not apply).

**References:**
- **Procedure:** the `$db-migrate-and-seed` (`/db-migrate-and-seed`) skill — roles boundary, prerequisites, draft→apply→seed→verify workflow, gotchas. This step adds only the step-specific content below.
- Context §6 (local Postgres assumption), §11 (seed idempotency); `docs/backend-build-sheet.md` → Phase 0 *Prisma / migrations* + *Seed*.
- [STRICT] Prisma CLI rules (root `AGENTS.md`): create-only drafting; migration files immutable once created.

### Plan
- Execute per the `$db-migrate-and-seed` (`/db-migrate-and-seed`) skill (including the `citext`/`postgresqlExtensions` schema prep before drafting); do not hand-edit the generated SQL.
- Seed imports the client data modules directly (pure-data TS, no React) so the roster has one source of truth:
    - Snippet:
      ```ts
      import { mockAthletes } from '../../client/lib/mockAthletes';
      import { athleteProfiles } from '../../client/lib/athleteProfiles';
      ```
- Upsert order: user → personal team → profile → children (PBs, results, highlights, events, campaigns/cost lines); derive `handle` from `athleteProfiles[slug].handle` (strip `@`).

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 7 - Athlete read path: rich profile, directory keyset + filters

### Metadata
**Status:** Incomplete
**Prereqs:** 3, 5, 6
**Size:** medium
**Owner:** unassigned

### Context

**Objective:** Serve nate's directory and profile surfaces from the database.
**Done When:**
- `GET /v1/athletes` returns `{ items, nextCursor }` with keyset pagination on `(createdAt desc, id desc)`, filters (`sport`, `runnerLevel`, `search`, `countryCode`), **published-only**, and batched campaign stats (single `groupBy`, no N+1).
- `GET /v1/athletes/:athleteSlug` returns the full rich profile DTO (PBs, race results, highlights, roadmap/events, gallery/media, story fields, presentation JSON) — 404 for unpublished unless the authenticated user owns it (`auth.optional` on the route).
- Integration tests cover filters, pagination stability, published gating, and the seeded roster round-trip.

**References:**
- Context §7 (functional reqs), §11 (unpublished 404), §12 (keyset stability); `docs/backend-build-sheet.md` → Phase 1 (repositories + endpoints).
- Files: `app/src/repositories/AthleteRepository.ts`, `app/src/api/athletes/*`, patterns in `app/src/shared/requestParsers.ts`.

### Plan
- Repository: extend `findBySlug` with full includes; rewrite `listDirectory` for keyset cursor (opaque base64 of `createdAt|id`) + filters + `publishedAt: { not: null }`; add `getCampaignStatsForAthletes(athleteIds)` via `campaign.groupBy`.
- Service: map Prisma → `fad-common` DTOs (presentation JSON passthrough; verified badge derivable client-side from `resultUrl`).
- Controller/Router: parse query via updated `athleteDirectoryQuerySchema`; return the paginated wrapper; mount `auth.optional` on the profile route for the owner exception.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 8 - Athlete write path: PATCH me, publish, editor set-replace

### Metadata
**Status:** Incomplete
**Prereqs:** 7
**Size:** medium
**Owner:** unassigned

### Context

**Objective:** Persist everything nate's onboarding and manage editor capture.
**Done When:**
- `PATCH /v1/athletes/me` updates profile fields per `updateAthleteProfileRequestSchema`.
- `POST /v1/athletes/me/publish` sets `publishedAt` once (idempotent) behind a minimum-content guard (422 lists what's missing: story intro, ≥1 personal best, discipline).
- `PUT /v1/athletes/me/{highlights,races,roadmap,gallery}` replace the full set transactionally (matches the editor's save-all model, `client/lib/athleteEdits.ts`).
- Profile creation now assigns the `ATHLETE` `PlatformRoleAssignment` via a new `PlatformRoleRepository`.
- Tests: guard failures, idempotent publish, set-replace round-trips, ownership (401/403 paths).

**References:**
- Context §11 (publish guard, idempotency), §12 (transactional set-replace); `docs/backend-build-sheet.md` → Phase 0 *Fixes* + Phase 1 *Nate alignment additions*.
- Files: `app/src/api/athletes/*`, `app/src/repositories/AthleteRepository.ts`, `app/src/shared/errors.ts`.

### Plan
- Add repository writers: `update(athleteId, patch)`, `setPublished(athleteId)`, and `replace{RaceResults,Highlights,RoadmapEvents,Gallery}` as `deleteMany` + `createMany` inside `prisma.$transaction`.
- Add `PlatformRoleRepository.assignRole(userId, role)` (upsert) and call it in `AthleteService.createProfileForUser`.
- Controllers gate on `req.authenticatedUserId`; all request parsing via `fad-common` schemas.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 9 - Follows: model wiring, endpoints, tests

### Metadata
**Status:** Incomplete
**Prereqs:** 7
**Size:** small
**Owner:** unassigned

### Context

**Objective:** Replace `client/lib/follows.ts`'s localStorage graph with a real one.
**Done When:**
- `POST /v1/athletes/:athleteSlug/follow` and `DELETE /v1/athletes/:athleteSlug/follow` (auth required) are idempotent; following an unknown/unpublished athlete → 404.
- `GET /v1/users/me/follows` returns the caller's followed athletes (slug + display fields per `followSchema`).
- Tests: round-trip, double-follow no-op, unfollow-when-not-following no-op, 404 case.

**References:**
- Context §11–12 (idempotency); `docs/backend-build-sheet.md` → Phase 1 *Nate alignment additions*; `client/lib/follows.ts` (semantic source).

### Plan
- `app/src/repositories/FollowRepository.ts`: `follow(userId, athleteId)` upsert on the unique pair, `unfollow` deleteMany, `listForUser(userId)` with athlete include.
- New `app/src/api/follows/` Router/Controller/Service (or mount under athletes router — follow the smaller-diff option consistent with `app/AGENTS.md` feature-folder rule: dedicated feature folder).

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 10 - Campaign read path + transparency rule

### Metadata
**Status:** Complete
**Prereqs:** 3, 5, 6
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-13
**Completion Notes:**
- `CampaignRepository`: added `listActiveFeed({ limit, cursor })` — keyset on `(createdAt desc, id desc)` over `campaignStatus: ACTIVE, deletedAt: null` with `include: { costLines, athlete }`, fetching `limit + 1` to derive `hasMore`; refactored the previously-dead `listActiveForAthlete` to return ACTIVE-only with the `athlete` include (feeds the per-profile list). Exported `CampaignWithAthlete` and `ActiveFeedCursor` types.
- `CampaignService`: `listActiveFeed` (opaque base64url `createdAt|id` cursor codec, co-located as module functions alongside the existing `toCampaignDto` mapper — matches the file's convention rather than a separate `contracts.ts`), `listForAthleteSlug` (resolves via `AthleteRepository.findBySlug`, 404 on absent OR unpublished `publishedAt === null`), and **[STRICT] transparency enforcement** in `createForAthlete`: `assertCostLinesMatchTarget` throws 422 `ValidationError` with `{ targetAmountCents, costLinesTotalCents, costLines[] }` details when Σ`costLines.amountCents !== targetAmountCents` (a create with no cost lines against a non-zero target fails, total 0 ≠ target).
- Contract: added `activeCampaignFeedQuerySchema` (`status: 'active'` default, `limit` default 20 max 100, `cursor`) to `common/src/zod/campaign.ts`; feed response reuses the existing (step 5) `activeCampaignFeedResponseSchema`; per-athlete list returns `CampaignSummary[]`. Rebuilt `common`.
- **ROUTING DECISION (parallel-safety):** did NOT touch `app/src/api/athletes/**`, `AthleteRouterFactory`, or `AthleteController` (step 7 owns those concurrently). Feed route `GET /v1/campaigns` (public) added to the existing `CampaignRouterFactory` before `GET /:campaignSlug`. For `GET /v1/athletes/:athleteSlug/campaigns` created a new `AthleteCampaignsRouterFactory` inside `app/src/api/campaigns/` (`basePath = '/v1/athletes'`, exposes only `/:athleteSlug/campaigns`) and registered it via ONE appended line in `app/src/app.ts` after `AthleteRouterFactory` (Express mounts two routers on one base path). Keeps campaign ownership in the campaigns feature folder and avoids cross-feature edits.
- Tests (`app/src/test/campaign.test.ts`, DB-gated behind `RUN_DB_TESTS=1`, unique `step10-<epoch>-<rand>` fixtures deleted in `afterAll` via user/team cascade): feed keyset pagination walks own fixtures across 2-per-page requests to a null cursor (asserts fixture subset + no duplicates), malformed-cursor 422, seeded per-athlete list (`felix-tremblay`, ≥2 ACTIVE, all `campaignStatus === ACTIVE`), unknown-athlete 404, transparency accept (Σ==target → 201) + reject (Σ≠target → 422 with details) + no-cost-lines reject. Verified `RUN_DB_TESTS=1 npx vitest run` = 9/9 pass; fixtures leave zero residue and the seeded baseline (6 ACTIVE campaigns, 7 athletes) is intact.

### Context

**Objective:** Complete the campaign read surface and enforce the transparency invariant.
**Done When:**
- `GET /v1/campaigns?status=active&limit=&cursor=` returns a keyset-paginated `campaignSummarySchema` feed.
- `GET /v1/athletes/:athleteSlug/campaigns` serves the profile's campaign list (wires the currently-dead `listActiveForAthlete`).
- `POST /v1/campaigns` rejects Σ`costLines.amountCents` ≠ `targetAmountCents` with 422 and per-line details ([STRICT] product transparency differentiator).
- Tests: feed pagination, per-athlete list, transparency accept/reject.

**References:**
- Context §7, §11; `docs/backend-build-sheet.md` → Phase 1 (campaign endpoints + transparency rule); root `AGENTS.md` → *Differentiators*.
- Files: `app/src/repositories/CampaignRepository.ts`, `app/src/api/campaigns/*`.

### Plan
- Repository: add `listActiveFeed({limit, cursor})` (keyset, `campaignStatus: ACTIVE`); reuse `listActiveForAthlete`.
- Service: validate the cost-line sum in `createForAthlete` before repository write; map summaries via `fad-common`.
- Router: add the two GET routes (public).

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
