# ARC MVP Platform Alignment - Steps 1-5

## Step 1 - Import `origin/nate` UI Surface

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** AI agent

### Context

**Objective:** Bring the redesigned MVP UI from `origin/nate` into the current branch while preserving visuals and excluding non-UI branch artifacts unless intentionally needed.

**Done When:**
- `client/` matches the `origin/nate` UI surface for routes, components, styles, and user-facing copy.
- Non-UI artifacts from `origin/nate`, such as `.claude/launch.json`, `app/package-lock.json`, and unrelated docs, are not pulled into this step unless a reason is recorded.
- Removed routes from `origin/nate`, including `client/app/presentation/`, are removed from the current branch if the UI import requires it.
- The client builds or any build/type failures are documented with exact causes.

**References:**
- Context sections 4, 5, 10
- `origin/nate`
- `client/`
- `client/AGENTS.md`

### Plan

- Create a manifest from `git diff --name-status origin/main..origin/nate -- client`.
- Restore UI-specific `client/` files from `origin/nate`, including route moves into `client/app/(marketing)/`, `client/app/register/`, shared components, styles, and UI helper modules.
- Review `client/package-lock.json` before keeping it; retain only if the lockfile change is required by actual dependency changes.
- Preserve ARC/Athlete ARC user-facing copy and visual structure exactly.
- Run a focused client build/type check and record any failures before making refactors in Step 2.

### Step checklist
- [x] UI-specific files from `origin/nate` imported
- [x] Non-UI branch artifacts excluded or explicitly justified
- [x] Route additions, route moves, and route deletions match the redesigned UI
- [x] `client/package-lock.json` decision recorded
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

### Completion notes

- Imported the `origin/nate` client UI surface for routes, route groups, shared components, styles, and UI helper modules.
- Excluded non-client branch artifacts: `.claude/launch.json`, `app/package-lock.json`, `docs/business/incorporation-and-finances.md`, and `docs/reference/trademark-brief.md`.
- Kept the current `client/package-lock.json` because `client/package.json` did not change and the `origin/nate` lockfile diff was resolver metadata rather than a required dependency update.
- Verified the client with `npm run build --prefix client` and `npm run type-check --prefix client`; the initial type check only failed against stale local `.next/types` entries for removed routes and passed after `next build` regenerated them.
- Ran the `$frontend-review` (`/frontend-review`) skill in uncommitted client scope with Step 1 import focus; no Step 1 blocker was found.
- Ran the `$ci` (`/ci`) skill with `npm run ci`; it passed.

---

## Step 2 - Refactor Imported Client Structure Without Visual Changes

### Metadata
**Status:** Complete
**Prereqs:** 1
**Size:** medium
**Owner:** AI agent

### Context

**Objective:** Clean up vibe-coded frontend structure while preserving the rendered MVP UI and interaction promises from Step 1.

**Done When:**
- Large imported client files are split only where the split improves maintainability and does not change UI output.
- LocalStorage-backed prototype modules are clearly isolated behind compatibility adapters pending backend integration.
- Comments that restate JSX sections or implementation mechanics are removed unless they satisfy the repo's allowed comment categories.
- Money formatting still goes through `client/lib/format.ts`.
- Server Components remain the default; `'use client'` is limited to files with state, event handlers, effects, browser APIs, or custom client hooks.

**References:**
- Context sections 4, 5, 8, 10
- `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx`
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx`
- `client/app/register/_components/OnboardingContext.tsx`
- `client/lib/session.ts`
- `client/lib/athleteEdits.ts`
- `client/lib/follows.ts`
- `client/lib/communityFeed.ts`

### Plan

- Identify imported files with high complexity or repeated helpers.
- Move reusable presentation pieces into route-local files or `client/components/` according to existing conventions.
- Convert prototype state modules into clearly named compatibility layers, such as `client/lib/prototype/`, if they must remain temporarily.
- Remove disallowed comments and commented-out code.
- Check for text overflow or layout shifts introduced by refactors by comparing key routes to Step 1 behavior.

### Step checklist
- [x] Imported client files refactored without visual changes
- [x] Prototype-only persistence isolated and named as temporary compatibility code
- [x] Disallowed comments removed
- [x] No duplicated request/response interfaces introduced
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

### Completion notes

- Kept the imported visual surface intact while reducing client structure risk.
- Moved browser-backed prototype session, follows, cheers, onboarding, and profile edit persistence into `client/lib/prototype/`.
- Extracted repeated manage-page editing controls into `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfileParts.tsx`.
- Removed low-value JSX section-marker comments from the imported UI files touched by this step.
- Confirmed money display remains routed through `client/lib/format.ts` and no API request/response types were duplicated.
- Ran the `$frontend-review` (`/frontend-review`) skill in uncommitted client scope with Step 2 structure/persistence focus; no remaining Step 2 blockers were found.
- Ran `npm run type-check --prefix client`; it passed.
- Ran the `$ci` (`/ci`) skill with `npm run ci`; it passed.

---

## Step 3 - Define Shared MVP Contracts in `common/`

### Metadata
**Status:** Complete
**Prereqs:** 1, 2
**Size:** medium
**Owner:** AI agent

### Context

**Objective:** Add Zod-first contracts that describe the redesigned MVP data needs before backend or client API integration work begins.

**Done When:**
- `common/src/zod/` exports DTO and request schemas for public profiles, profile drafts, dashboard data, follows, community feed, profile child data, and campaign summaries.
- New schema types are exported through `common/src/index.ts`.
- Existing schemas are extended or composed instead of duplicated.
- `npm run build --prefix common` passes.

**References:**
- Context sections 7, 8, 9, 10
- `common/AGENTS.md`
- `common/src/zod/athlete.ts`
- `common/src/zod/campaign.ts`
- `common/src/zod/event.ts`
- `common/src/zod/donation.ts`
- `common/src/types/enums.ts`

### Plan

- Add or extend enums for profile status, athlete level, result kind, verification status, media role, feed kind/category, and reaction kind.
- Define profile schemas around view contracts, not raw Prisma entities.
- Define draft and publish request schemas with strict object validation.
- Define feed and directory query schemas with explicit limit and cursor bounds.
- Keep transport dates as ISO strings and money as integer cents.

### Step checklist
- [x] Shared MVP schemas added or extended
- [x] Public exports updated
- [x] `npm run build --prefix common` run
- [x] No API types duplicated in `app/` or `client/`
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

### Completion notes

- Added shared enums for profile status, athlete level, result kind, verification status, media kind/role, story chapter display metadata, community feed kinds/categories/targets, and reaction kind.
- Added MVP profile contracts in `common/src/zod/athlete.ts`: public profile, draft profile, publish response, completion checklist, child data DTOs, child upsert requests, reorder request, support summary, and paginated directory response.
- Added `campaignSummarySchema` in `common/src/zod/campaign.ts` by composing from the existing campaign schema and reusing campaign cost lines.
- Added community contracts in `common/src/zod/community.ts` for follow responses, feed query/response/items, reactions, and racing-soon items.
- Added `athleteDashboardSchema` in `common/src/zod/dashboard.ts` and exported new schemas through `common/src/index.ts`.
- Added shared `httpUrlSchema` so new media/source URL contracts accept durable HTTP(S) URLs and reject browser-only `blob:` URLs.
- Did not modify `app/` or `client/` API shapes in this step, so no request/response types were duplicated downstream.
- Ran `npm run build --prefix common`; it passed.
- Ran the `$ci` (`/ci`) skill with `npm run ci`; it passed.

---

## Step 4 - Create Prisma Data Model Alignment

### Metadata
**Status:** Complete
**Prereqs:** 3
**Size:** medium
**Owner:** AI agent

### Context

**Objective:** Update the Prisma schema to support the MVP profile, community, and campaign-readiness contracts from Step 3.

**Done When:**
- `app/prisma/schema.prisma` models the required profile, result, story chapter, training, media, follow, and reaction concepts.
- Indexes and unique constraints support slug lookup, ownership, directory filters, feed queries, and idempotent follow/reaction operations.
- A draft migration is created only through `npm run migrate:create --prefix app -- --name <migration_name>`.
- No existing migration files are edited and no migration files are manually created.

**References:**
- Context sections 8, 9, 11, 12
- `app/AGENTS.md`
- `app/prisma/schema.prisma`
- `common/src/zod/`

### Plan

- Map the Step 3 schemas to normalized Prisma models.
- Prefer existing models where they fit cleanly, such as `AthleteProfile`, `AthleteEvent`, `AthleteMedia`, `Campaign`, and `CampaignCostLine`.
- Add new models for concepts not cleanly covered today, such as story chapters, personal bests, richer results, follows, and reactions.
- Add versioning or concurrency fields needed by profile editing endpoints.
- Use the allowed migration-create command after schema edits.

### Step checklist
- [x] Prisma schema updated
- [x] Required indexes and unique constraints added
- [x] Draft migration created with the repo-approved command only
- [x] No immutable migration files edited
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

### Completion notes

- Updated `app/prisma/schema.prisma` for draft/published profile state, optimistic profile versioning, richer profile fields, support readiness fields, and published-profile directory indexes.
- Added normalized Prisma models for core values, story chapters, personal bests, results, source links, roadmap event source links, training snapshots, power profiles, profile milestones, follows, and community reactions.
- Extended `AthleteMedia`, `AthleteEvent`, `Campaign`, and `CampaignCostLine` to support deterministic ordering, media roles, source-link readiness, campaign summary reads, and idempotent community features.
- Added unique constraints for one profile per user, stable athlete slugs, one follow per `(userId, athleteId)`, and one community reaction per `(userId, targetType, targetId)`.
- Created draft migration `app/prisma/migrations/20260713171400_align_mvp_profile_models/migration.sql` with `npm run migrate:create --prefix app -- --name align_mvp_profile_models`; a temporary local Postgres Docker container was used because no local `DATABASE_URL` was configured.
- Updated current athlete repository/service behavior so legacy public profile and directory routes only expose published, complete profiles while draft rows can be nullable for Step 5.
- Ran the `$backend-review` (`/backend-review`) skill with uncommitted Step 4 backend/schema focus and applied its local cleanup.
- Ran `npm run type-check --prefix app`; it passed.
- Ran the `$ci` (`/ci`) skill with `DATABASE_URL=postgresql://fad:fad@localhost:5432/fad_dev?schema=public npm run ci`; it passed.

---

## Step 5 - Implement Profile Draft, Publish, and Public Profile APIs

### Metadata
**Status:** Complete
**Prereqs:** 3, 4
**Size:** medium
**Owner:** AI agent

### Context

**Objective:** Implement the first backend API slice needed by the redesigned product loop: draft profile creation/update, publish, public profile read, and owner-safe access.

**Done When:**
- Authenticated users can create or update their athlete profile draft.
- Authenticated users can publish a profile when minimum fields are present.
- Public users can fetch a published athlete profile by slug.
- Owner-only routes reject unauthorized users with typed errors.
- Controllers parse only `fad-common` schemas and delegate business logic to services.
- Services use repositories for all Prisma access.

**References:**
- Context sections 7, 8, 9, 10, 11, 12
- `app/src/api/athletes/`
- `app/src/repositories/AthleteRepository.ts`
- `app/src/shared/requestParsers.ts`
- `app/src/shared/errors.ts`
- `common/src/zod/athlete.ts`

### Plan

- Extend `app/src/api/athletes/` or add a focused profile feature folder if the current folder becomes too broad.
- Implement mappers from Prisma records and child records into public and draft DTOs.
- Add publish validation that returns structured missing-field information.
- Add stale update protection for draft updates.
- Keep public reads limited to published profiles unless the requester owns the draft.

### Step checklist
- [x] Draft profile API implemented
- [x] Publish API implemented
- [x] Public profile-by-slug API implemented
- [x] Ownership, not-found, conflict, and validation errors handled
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

### Completion notes

- Added owner-only profile draft routes under `GET /v1/athletes/me/draft` and `PUT /v1/athletes/me/draft`, backed by `upsertAthleteProfileDraftRequestSchema`.
- Added `POST /v1/athletes/me/publish`, with structured completion/missing-field responses and idempotent already-published handling.
- Updated public `GET /v1/athletes/:athleteSlug` to return the richer `PublicAthleteProfile` DTO for published profiles, with optional bearer-token follower state.
- Added deterministic Prisma includes and DTO mappers for public/draft profile sections so child records already read in stable order before Step 6 adds dedicated child mutation APIs.
- Added optimistic concurrency for existing draft updates via `expectedProfileVersion`; stale or missing version tokens return typed conflict errors with the current version when available.
- Preserved repository-only Prisma access and split section replacement persistence out of `AthleteRepository` during `$backend-review` (`/backend-review`).
- Ran `npm run type-check --prefix app`, `npm run lint --prefix app`, and the `$ci` (`/ci`) skill with `npm run ci`; all passed. The app lint command still emits the existing ESLint config module-type warning.
