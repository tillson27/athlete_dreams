# ARC MVP Platform Alignment - Steps 6-10

## Step 6 - Implement Profile Child Data APIs

### Metadata
**Status:** Complete
**Prereqs:** 3, 4, 5
**Size:** medium
**Owner:** AI agent

### Context

**Objective:** Implement backend support for the editable child data shown on the redesigned athlete profile: personal bests, highlights/results, previous races, roadmap/events, story chapters, media metadata, and training snapshots.

**Done When:**
- Authenticated athletes can add, update, reorder, and delete supported profile child records they own.
- Public profile reads include child records in deterministic sort order.
- Result source links and verification statuses are represented in API responses.
- Media metadata rejects `blob:` URLs and unsafe URL shapes.
- The management API can replace localStorage-backed profile edits from `origin/nate`.

**References:**
- Context sections 7, 8, 9, 10, 11, 12
- `client/lib/athleteProfiles.ts`
- `client/lib/athleteEdits.ts`
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx`
- `app/src/api/athletes/`
- `app/src/repositories/`

### Plan

- Add backend routes or nested handlers for profile child collections.
- Use explicit sort-order fields and full-list reorder operations where that reduces client complexity.
- Validate source URLs, media roles, labels, and maximum collection sizes in `fad-common`.
- Implement repository methods that batch child reads for public profile DTOs.
- Add conflict checks for stale profile edits.

### Step checklist
- [x] Personal best APIs implemented
- [x] Result/highlight/race APIs implemented
- [x] Roadmap/event APIs implemented
- [x] Story chapter, training snapshot, and media metadata APIs implemented
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

### Completion notes

- Added `expectedProfileVersion` to dedicated child mutation contracts in `common/src/zod/athlete.ts`, plus a delete-child request contract for owner-only deletes.
- Added authenticated child collection routes under `app/src/api/athletes/AthleteRouterFactory.ts` for personal bests, results, roadmap events, story chapters, training snapshot, and media assets.
- Added controller/service methods that parse only `fad-common` schemas, enforce authenticated ownership through the current user, reject route/body child ID mismatches, and return refreshed `AthleteProfileDraft` DTOs after mutations.
- Added `app/src/repositories/AthleteProfileChildRepository.ts` with transactional child writes, full-list reorder checks, stale profile-version checks, and rollback on failed ownership or order validation.
- Preserved deterministic public/draft profile child ordering through the existing profile read mapper and included source links, verification status fields, and HTTP(S)-only media/source URL validation via shared schemas.
- Ran the `$backend-review` (`/backend-review`) skill in uncommitted backend scope with Step 6 child API focus; no strict blockers remained.
- Ran `npm run ci`; it passed. Existing tool warnings remain for the app ESLint config module type and deprecated `next lint`.

---

## Step 7 - Implement Follows, Community Feed, and Dashboard APIs

### Metadata
**Status:** Complete
**Prereqs:** 3, 4, 5, 6
**Size:** medium
**Owner:** AI agent

### Context

**Objective:** Move the follow graph, community feed, cheers, and athlete dashboard from browser-only prototype state to backend-backed APIs.

**Done When:**
- Authenticated users can follow and unfollow athletes idempotently.
- Community feed returns paginated, deterministic items for everyone and following filters.
- Cheers/reactions are idempotent and scoped to stable feed targets.
- Dashboard endpoint returns profile status, completion checklist, public URL, and management links/data from backend state.
- Directory/profile follower counts can be computed or returned without N+1 query patterns.

**References:**
- Context sections 7, 8, 9, 10, 11, 12
- `client/lib/follows.ts`
- `client/lib/communityFeed.ts`
- `client/app/(marketing)/community/CommunityClient.tsx`
- `client/app/(marketing)/dashboard/DashboardClient.tsx`
- `app/prisma/schema.prisma`

### Plan

- Add follow repository/service/controller methods with unique constraints backing idempotency.
- Build community feed from persisted results, upcoming events, and profile milestones rather than storing fabricated posts.
- Add reaction operations keyed by target type and target ID.
- Add dashboard DTO mapper that derives completeness from the same profile fields used by public pages.
- Add cursor/limit query handling and indexed sort fields for feed reads.

### Step checklist
- [x] Follow/unfollow APIs implemented
- [x] Community feed API implemented
- [x] Cheer/reaction APIs implemented or explicitly deferred with client fallback removed
- [x] Dashboard API implemented
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

### Completion notes

- Added authenticated follow/unfollow routes under `POST /v1/athletes/:athleteSlug/follow` and `DELETE /v1/athletes/:athleteSlug/follow`, backed by the unique `(userId, athleteId)` follow constraint and idempotent repository operations.
- Added `GET /v1/athletes/me/dashboard`, returning the shared `AthleteDashboard` DTO with profile status, completion state, public/manage URLs, quick actions, and draft data derived from backend state.
- Added the `app/src/api/community/` feature with `GET /v1/community/feed`, `POST /v1/community/reactions`, and `DELETE /v1/community/reactions`.
- Built the community feed from persisted verified results, upcoming roadmap events, training snapshots, and profile milestones, with deterministic cursor pagination, following-scope filtering, batched reaction counts, and viewer reaction state.
- Added `app/src/repositories/CommunityRepository.ts` and `app/src/repositories/communityFeedRecords.ts` for repository-only Prisma access, stable feed target validation, and bounded fan-out across feed sources.
- Updated athlete directory reads to include follower counts without N+1 queries and continued using batched campaign support metrics.
- Ran the `$backend-review` (`/backend-review`) skill in uncommitted Step 7 backend/API scope; it tightened verified-result feed filtering, cursor validation, target validation, and repository file size.
- Ran `npm run type-check --prefix app`, `npm run lint --prefix app`, and the `$ci` (`/ci`) skill with `npm run ci`; all passed. Existing warnings remain for the app ESLint config module type, deprecated `next lint`, and the `task-planning` skill soft-limit notice.

---

## Step 8 - Align Campaign and Support Readiness APIs

### Metadata
**Status:** Complete
**Prereqs:** 3, 4, 5
**Size:** medium
**Owner:** AI agent

### Context

**Objective:** Make the campaign and support data model match the redesigned support/backing preview while keeping live payments out of scope.

**Done When:**
- Public profile DTOs expose whether support is enabled and any active campaign summaries.
- Campaign summaries include itemized cost lines, target amount, raised amount, supporter count, and status.
- Support/backing UI remains honest that payments are not live.
- Existing campaign APIs are refactored where needed to avoid duplicated campaign DTO logic.
- No payment provider code, payment credentials, webhook routes, or donation checkout flows are added.

**References:**
- Context sections 2, 5, 7, 8, 9, 10
- `client/app/(marketing)/support/page.tsx`
- `client/lib/mockAthletes.ts`
- `common/src/zod/campaign.ts`
- `app/src/api/campaigns/`
- `app/src/repositories/CampaignRepository.ts`

### Plan

- Extend campaign summary schemas in `common/`.
- Update campaign repository queries to return active campaign summaries for profile and directory surfaces efficiently.
- Ensure campaign cost lines remain first-class and visible in DTOs.
- Preserve disabled payment/backing behavior in client integration until a separate payment task exists.
- Add clear service boundaries so future payment integration can attach later without rewriting campaign reads.

### Step checklist
- [x] Campaign summary contracts implemented
- [x] Active campaign summary backend queries implemented
- [x] Public profile support fields wired
- [x] No live payment implementation added
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

### Completion notes

- Verified the existing `campaignSummarySchema` in `common/src/zod/campaign.ts` already covered Step 8 fields: status, target and raised cents, supporter count, itemized cost lines, close date, and story excerpt.
- Added centralized campaign DTO mapping in `app/src/api/campaigns/campaignMappers.ts` so full campaign reads and campaign summaries share cost-line conversion and deterministic cost-line ordering.
- Updated `app/src/repositories/CampaignRepository.ts` with support-readiness queries for active/funded campaigns, batched directory metrics, recent successful backers, public campaign visibility, and ordered cost-line creation.
- Wired public athlete profile support payloads through backend campaign summaries and recent backers in `app/src/api/athletes/AthleteService.ts` and `app/src/api/athletes/athleteProfileMappers.ts`.
- Kept live payments out of scope: no payment provider code, payment credentials, webhook routes, donation checkout routes, or donation creation flows were added.
- Ran the `$backend-review` (`/backend-review`) skill in uncommitted backend/API Step 8 scope; it tightened public support readiness and public campaign visibility.
- Ran `npm run type-check --prefix app`, `npm run lint --prefix app`, and the `$ci` (`/ci`) skill with `npm run ci`; all passed. Existing warnings remain for the app ESLint config module type, deprecated `next lint`, and the `task-planning` skill soft-limit notice.

---

## Step 9 - Connect Client UI to Typed Backend APIs

### Metadata
**Status:** Complete
**Prereqs:** 3, 5, 6, 7, 8
**Size:** medium
**Owner:** AI agent

### Context

**Objective:** Replace the imported UI's fixture and localStorage data sources with typed backend API calls while preserving the redesigned UX.

**Done When:**
- Public athlete pages, directory, dashboard, community feed, follows, and profile management use `fad-common` DTOs through typed client API helpers.
- Server Components fetch public data where appropriate.
- Client Components remain for interactive controls such as forms, modals, canvas share cards, follows, cheers, and local form state.
- Fixture data is retained only as explicit seed/dev fallback data if needed.
- Loading, empty, and error states match the minimalist UX.

**References:**
- Context sections 5, 7, 8, 10, 11
- `client/app/(marketing)/athletes/`
- `client/app/(marketing)/community/`
- `client/app/(marketing)/dashboard/`
- `client/app/register/`
- `client/lib/mockAthletes.ts`
- `client/lib/athleteProfiles.ts`
- `client/lib/session.ts`
- `client/lib/athleteEdits.ts`
- `client/lib/follows.ts`

### Plan

- Add `client/lib/api/` helpers that wrap API calls and import response/request types from `fad-common`.
- Add DTO-to-view mappers only where the UI's presentation shape is intentionally different from the transport shape.
- Move public route data fetching into route-level Server Components.
- Update management forms to submit to backend APIs and rehydrate from backend state.
- Remove runtime dependence on `mockAthletes` and `athleteProfiles` for production paths.

### Step checklist
- [x] Typed client API helper layer implemented
- [x] Public profile and directory pages use backend DTOs
- [x] Dashboard, community, follows, and management flows use backend DTOs
- [x] Fixture modules removed from production paths or clearly isolated as seed/dev data
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$e2e-review` (`/e2e-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

### Completion notes

- Added the typed client API boundary under `client/lib/api/`, including shared response-envelope handling, `fad-common` request/response schemas, athlete API helpers, community API helpers, and DTO-to-view mappers.
- Rewired the public athlete directory, public athlete profile, and sitemap to fetch backend DTOs from `/v1/athletes` instead of runtime mock roster modules.
- Rewired dashboard, community feed, cheer/reaction, follow/unfollow, and profile management flows to use typed backend API helpers. Auth token acquisition and durable auth persistence remain Step 10 scope.
- Updated profile management to write results, roadmap events, and gallery metadata through backend child APIs. Local uploaded gallery files are preview-only until a media hosting/upload flow exists.
- Deleted the browser-only community feed, follow, cheer, and athlete edit stores; moved mock athlete/profile data into `client/lib/dev-fixtures/` as development seed/reference data only.
- Updated `docs/architecture.md` so the architecture notes match the backend-backed athlete, community, dashboard, follow, cheer, and management flows.
- Ran the `$frontend-review` (`/frontend-review`) skill, the `$e2e-review` (`/e2e-review`) skill, the `$doc-alignment` (`/doc-alignment`) skill, and the `$ci` (`/ci`) skill. `npm run ci` passed with the expected existing warnings for the app ESLint config module type, deprecated `next lint`, and the `task-planning` skill soft-limit notice.

---

## Step 10 - Replace Mock Auth and Browser Persistence With Durable Flows

### Metadata
**Status:** Complete
**Prereqs:** 3, 5, 7, 9
**Size:** medium
**Owner:** AI agent

### Context

**Objective:** Replace the redesigned branch's mock session and browser-source-of-truth persistence with real auth-backed flows and safe draft resilience.

**Done When:**
- Sign-up and sign-in pages call the backend auth API.
- Authenticated client routes use real session/token state according to the repo's current auth pattern or a documented improvement.
- Profile draft state is persisted server-side.
- LocalStorage is used only for non-authoritative draft resilience or UI preferences, never as the durable source of truth.
- Logout and expired-token behavior are handled consistently.

**References:**
- Context sections 4, 7, 8, 10, 11, 12
- `client/lib/session.ts`
- `client/app/(marketing)/sign-in/`
- `client/app/(marketing)/sign-up/`
- `client/app/register/`
- `app/src/api/auth/`
- `common/src/zod/auth.ts`

### Plan

- Replace `client/lib/session.ts` mock methods with real auth client methods or a new auth API module.
- Decide whether access tokens remain client-held for this MVP or move to an HTTP-only cookie pattern in a documented follow-up; implement the scoped choice consistently.
- Update sign-up to seed or create the athlete draft server-side.
- Update dashboard/register guards to use real auth readiness and backend profile state.
- Remove mock published flags from localStorage.

### Step checklist
- [x] Sign-in and sign-up forms call backend auth
- [x] Authenticated route guards use durable auth state
- [x] Profile draft source of truth moved server-side
- [x] Mock session/localStorage source-of-truth removed
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$backend-review` (`/backend-review`) run
- [x] `$e2e-review` (`/e2e-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

### Completion notes

- Added typed auth helpers under `client/lib/api/auth.ts` and replaced the prototype session store with `client/lib/session.ts`, which persists the real backend `AuthSession`, exposes the existing session hook shape, seeds the athlete draft on sign-up, supports logout, and clears expired tokens.
- Updated sign-in and sign-up forms to call `/v1/auth/sign-in` and `/v1/auth/sign-up` through `fad-common` request/response types, with deterministic API error states.
- Reworked the register onboarding provider to load `/v1/athletes/me/draft`, map the backend `AthleteProfileDraft` into the existing onboarding UI shape, debounce draft saves through `PUT /v1/athletes/me/draft`, and use localStorage only as a user/version-scoped unsaved draft backup.
- Updated publish to flush pending draft edits and call `POST /v1/athletes/me/publish`; removed the mock published flag and mock profile lookup from the review flow.
- Updated authenticated route guards and owner controls to use durable session state and backend-owned user IDs instead of name-derived mock ownership.
- Deleted the remaining prototype auth/onboarding browser stores and kept browser storage limited to the real auth session plus non-authoritative draft resilience.
- Ran the `$frontend-review` (`/frontend-review`) skill with Step 10 client auth/draft focus; it identified and fixed a session-expiry timer gap and implementation-flavored gate copy.
- Ran the `$backend-review` (`/backend-review`) skill with auth/profile API focus; no backend changes were required, and `npm run type-check --prefix app` plus `npm run lint --prefix app` passed.
- Ran the `$e2e-review` (`/e2e-review`) skill across the auth, draft, publish, dashboard, follow, and community token flow; contract and data flow alignment checked out.
- Ran the `$doc-alignment` (`/doc-alignment`) skill as required by `$e2e-review` and updated `docs/architecture.md` to remove the stale follow-up-auth statement.
- Ran the `$ci` (`/ci`) skill with `npm run ci`; it passed. Existing warnings remain for the app ESLint config module type, deprecated `next lint`, and the `task-planning` skill soft-limit notice.
