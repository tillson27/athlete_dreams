# M6 Client Session Cutover - Steps 1-5

## Step 1 - Backend gaps: personal-bests set-replace + GET /v1/athletes/me

### Metadata
**Status:** Incomplete
**Prereqs:** None
**Size:** medium
**Owner:** unassigned

### Context

**Objective:** Close the two audited backend gaps so the full onboarding loop is reachable over HTTP.
**Done When:**
- `common/src/zod/athlete.ts` gains `replacePersonalBestsRequestSchema` (`.strict()`, `personalBests` array max 8 of `{label ≤40, value ≤40, resultUrl?: url}`) exported via the barrel.
- `PUT /v1/athletes/me/personal-bests` (auth) set-replaces via a transactional `AthleteRepository.replacePersonalBests` (order = array order via `sortOrder`), mirroring the existing highlights writer exactly.
- `GET /v1/athletes/me` (auth) returns the caller's full rich profile DTO **including unpublished** (`publishedAt: null`); 404 `NotFoundError('Athlete profile')` when the user has no profile. Route ordering: register `/me` before `/:athleteSlug`.
- DB-gated tests: PB round-trip (order preserved), and the previously-impossible HTTP-only loop — sign-up → create profile → PATCH (storyIntro + disciplineLabel) → PUT personal-bests → publish 200 → appears in directory; plus `GET /v1/athletes/me` for draft + missing-profile 404.
- `RUN_DB_TESTS=1 npx vitest run` fully green; `npm run ci` green.

**References:**
- Context §4 (gap audit), §9 (contracts/endpoints), §11 (404 semantics); patterns: `app/src/api/athletes/AthleteRouterFactory.ts`, `AthleteRepository.replaceHighlights`, `AthleteService` rich DTO mapper.

### Plan
- Copy the highlights set-replace pattern end-to-end (schema → controller handler → service → repository transaction).
- `getMyProfile` reuses the existing rich mapper with a `findByUserId` include (extend the include only if `findByUserId` lacks the rich relations).

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 2 - Client session core: real session.ts + api.ts auth layer

### Metadata
**Status:** Incomplete
**Prereqs:** None
**Size:** medium
**Owner:** unassigned

### Context

**Objective:** Make the client capable of authenticated API use in api mode, preserving the mock path and every consumer's hook shape.
**Done When:**
- `client/lib/api.ts`: an auth layer — token provider hook-in, `Authorization: Bearer` on authed helpers, 401 → typed `ApiError` + session-clear callback; new authed helpers: `signUp`, `signIn`, `fetchMe`, `followAthlete`/`unfollowAthlete`/`fetchMyFollows`, `createMyProfile`, `patchMyProfile`, `replaceMyPersonalBests`/`Highlights`/`Races`/`Roadmap`/`Gallery`, `publishMyProfile`, `fetchMyProfile` — all typed from `fad-common`.
- `client/lib/session.ts`: in api mode `signUp`/`signIn` call the API and persist `{accessToken, user}` in a namespaced `browserStore` (`arc-auth`); `useSession` returns the same shape consumers use today (plus the token internally); mount-time `fetchMe` validation clears stale/expired sessions; `signOut` clears. **Mock mode keeps today's behavior exactly** (same exports, branch on `DATA_SOURCE`).
- Mock-mode DOM byte-safety re-verified (step-12 comparison method); `npm run ci` green.

**References:**
- Context §7-§8, §11 (401 handling), §12 (multi-tab via browserStore); files: `client/lib/{api,session,dataSource,browserStore}.ts`; `client/AGENTS.md` ([STRICT] fad-common types; server components by default).

### Plan
- Keep `session.ts`'s public surface identical (`signUp/signIn/signOut/markPublished/useSession`) so pages diff minimally; `markPublished` becomes a session-user refresh in api mode.
- No test runner in client (do not introduce one): verify via a tsx exercise script against the locally-booted API (sign-up→me→sign-out) and report results.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 3 - Auth pages: real submission + invite-only/409/401 error UX

### Metadata
**Status:** Incomplete
**Prereqs:** 2
**Size:** small
**Owner:** unassigned

### Context

**Objective:** The `/sign-up` and `/sign-in` pages perform real authentication in api mode with readable error states.
**Done When:**
- Api mode: sign-up submits via the session core; **403 → invite-only message** ("Access is currently invite-only — contact hello@athletearc.ca"); **409 → "account exists, sign in"** with a link; sign-in **401 → generic invalid-credentials**; **403 → invite-only**. Loading/disabled states during submission.
- Api-mode routing: successful sign-up lands on `/community` if the user has no athlete profile intent — keep the existing "Build your profile" CTA path to `/register` intact; successful sign-in lands on `/dashboard`.
- Mock mode: byte-identical behavior to today.

**References:**
- Context §11 (error matrix); files: `client/app/(marketing)/sign-in/*`, `sign-up/*`; minimalism mandate (`client/AGENTS.md`): errors are one plain sentence, no raw payloads.

### Plan
- Error mapping lives beside the session core (shared helper), not in page components; pages render `error.message`.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 4 - Follows cutover: signed-in via API, anonymous prompts sign-in

### Metadata
**Status:** Incomplete
**Prereqs:** 2
**Size:** small
**Owner:** unassigned

### Context

**Objective:** "Follow" persists server-side for signed-in api-mode users; anonymous users are invited to sign in.
**Done When:**
- Api mode signed-in: `useFollows`/`FollowButton` back onto the API — initial load from `fetchMyFollows`, toggles call follow/unfollow and adopt the returned full list (the endpoints return it for exactly this). The community "Following" tab filters by the server list.
- Api mode anonymous: follow interactions surface a sign-in prompt (link to `/sign-in`), never a silent local write.
- Mock mode: localStorage behavior unchanged; `useFollows` keeps its exported shape.

**References:**
- Context §7, §11; files: `client/lib/follows.ts`, the FollowButton component, `client/app/(marketing)/community/*`; endpoints per step-9 completion notes (list-returning toggles).

### Plan
- Same seam style as `dataSource.ts`: one hook, two implementations selected by `DATA_SOURCE` + session presence.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 5 - Onboarding wizard persistence: create, per-step PATCH/set-replace, publish

### Metadata
**Status:** Incomplete
**Prereqs:** 1, 2
**Size:** large
**Owner:** unassigned

### Context

**Objective:** The 4-step `/register` wizard persists to the real API in api mode, ending in a real publish.
**Done When:**
- First save (step 1 completion): `createMyProfile` with client-side slug from `slugify(fullName)`; **409 → retry `<slug>-2..-5`** then readable error; re-entering the wizard loads existing state via `fetchMyProfile` (draft resume).
- Per-step persistence: step 1 → PATCH (fullName, hometown/countryCode, disciplineLabel, bio→storyIntro/storyBody mapping per the wizard's fields, heroMediaUrl ref); step 2 → `replaceMyPersonalBests` + `replaceMyHighlights` + `replaceMyRaces` (result URLs carried); step 3 → PATCH (values, tagline→storyIntro if that's the wizard's mapping — follow the existing field semantics, don't invent); step 4 review reads the draft from the API.
- Publish: `publishMyProfile`; **422 renders `details.missing` as a completion checklist**; success keeps today's celebration UX and the profile appears in the directory.
- Mock mode: wizard byte-identical (localStorage context path preserved); `OnboardingContext` keeps its shape, backed by API loaders in api mode.
- Token-expiry mid-wizard (401): session cleared, prompt to sign in, in-memory step state preserved where already held (Context §11).

**References:**
- Context §7, §9, §11-§12; files: `client/app/register/*` (all four steps + context), `client/lib/slugify.ts`; write surface: PATCH fields listed in Context §4/audit; set-replace endpoints incl. step 1's new personal-bests.

### Plan
- Persistence functions live in a dedicated `client/lib/onboardingApi.ts` (pure, typed) consumed by `OnboardingContext`; the four page components change minimally.
- Save-on-step-advance (not per-keystroke); surface per-step save errors inline.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
