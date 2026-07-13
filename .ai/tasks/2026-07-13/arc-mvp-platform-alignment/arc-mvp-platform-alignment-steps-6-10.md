# ARC MVP Platform Alignment - Steps 6-10

## Step 6 - Implement Profile Child Data APIs

### Metadata
**Status:** Incomplete
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
- [ ] Personal best APIs implemented
- [ ] Result/highlight/race APIs implemented
- [ ] Roadmap/event APIs implemented
- [ ] Story chapter, training snapshot, and media metadata APIs implemented
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 7 - Implement Follows, Community Feed, and Dashboard APIs

### Metadata
**Status:** Incomplete
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
- [ ] Follow/unfollow APIs implemented
- [ ] Community feed API implemented
- [ ] Cheer/reaction APIs implemented or explicitly deferred with client fallback removed
- [ ] Dashboard API implemented
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 8 - Align Campaign and Support Readiness APIs

### Metadata
**Status:** Incomplete
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
- [ ] Campaign summary contracts implemented
- [ ] Active campaign summary backend queries implemented
- [ ] Public profile support fields wired
- [ ] No live payment implementation added
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 9 - Connect Client UI to Typed Backend APIs

### Metadata
**Status:** Incomplete
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
- [ ] Typed client API helper layer implemented
- [ ] Public profile and directory pages use backend DTOs
- [ ] Dashboard, community, follows, and management flows use backend DTOs
- [ ] Fixture modules removed from production paths or clearly isolated as seed/dev data
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$e2e-review` (`/e2e-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 10 - Replace Mock Auth and Browser Persistence With Durable Flows

### Metadata
**Status:** Incomplete
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
- [ ] Sign-in and sign-up forms call backend auth
- [ ] Authenticated route guards use durable auth state
- [ ] Profile draft source of truth moved server-side
- [ ] Mock session/localStorage source-of-truth removed
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$e2e-review` (`/e2e-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
