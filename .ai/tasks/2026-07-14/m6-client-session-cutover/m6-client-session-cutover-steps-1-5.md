# M6 Client Session Cutover - Steps 1-5

## Step 1 - Backend gaps: personal-bests set-replace + GET /v1/athletes/me

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-14

### Completion Notes
- Added `replacePersonalBestsRequestSchema` (`.strict()`, `personalBests` max 8 of `{label ≤40, value ≤40, resultUrl?: url}`) and the clarity alias `myAthleteProfileResponseSchema` (= `athleteProfileSchema`, which already carries `publishedAt`) to `common/src/zod/athlete.ts`, exported via the existing barrel.
- Mirrored the highlights/races set-replace end-to-end: `AthleteRepository.replacePersonalBests` (transactional deleteMany + createMany, `sortOrder` = array index, patterned on `replaceRaceResults`), `AthleteService.replaceMyPersonalBests` + `getMyProfile` (reuses `requireOwnProfile` → `toProfileDto`; 404 `NotFoundError('Athlete profile')` when absent), controller handlers, and routes `PUT /v1/athletes/me/personal-bests` + `GET /v1/athletes/me` (the `/me` GET registered before `/:athleteSlug`). `findByUserId` already carried `richProfileInclude`, so no include change was needed.
- New DB-gated suite `app/src/api/athletes/athletes.ownProfile.test.ts` (7 tests): the previously-impossible pure-HTTP loop (sign-up → POST /v1/athletes → PATCH me storyIntro+disciplineLabel → PUT me/personal-bests → publish 200 → fixture slug appears in GET /v1/athletes), PB order round-trip through GET /me, GET /me draft state, GET /me 404, PB max-8 (422), and both 401 auth gates. Fixture etiquette: unique `m6s1-<epoch>` ids, name-scoped directory lookup (no global-count assertions), afterAll user + orphan-team cleanup (verified DB back to the 7-published baseline, zero `m6s1-` leakage). Allowlist forced open in `beforeAll`, restored in `afterAll`.
- `npm run ci` green (type-check + lint:fix + build across common/app/client; `✔ No ESLint warnings or errors`). `RUN_DB_TESTS=1 npx vitest run` from `app/` fully green: 8 files / 73 tests (66 prior + 7 new).

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
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 2 - Client session core: real session.ts + api.ts auth layer

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-14
**Completion Notes:**
- `client/lib/api.ts`: added the auth layer — module-level token-provider seam (`setAuthTokenProvider`) + unauthorized-listener seam (`setOnUnauthorized`) so `session.ts` wires the token in without a static import cycle; generalized `apiGet` into `apiRequest` (method/body/`authed`), injecting `Authorization: Bearer <token>` on authed helpers and, on a 401 to an authed call, invoking `onUnauthorized` before throwing a typed `ApiError`; `ApiError` now carries `details` (surfaces the publish 422 `{ missing }` for later steps). New typed helpers (all `fad-common`): `signUp`, `signIn`, `fetchMe`, `followAthlete`/`unfollowAthlete`/`fetchMyFollows`, `createMyProfile`, `patchMyProfile`, `replaceMyPersonalBests`/`Highlights`/`Races`/`Roadmap`/`Gallery`, `publishMyProfile`, `fetchMyProfile`.
- `client/lib/session.ts`: preserved the exact exported surface (`signUp`/`signIn`/`signOut`/`markPublished`/`useSession`/`Session`). Api mode calls the API and persists `{ accessToken, user, published }` in `createBrowserStore('arc-auth','arc-auth-change')`; `useSession` returns the same `{ name, email, published }` consumer shape (name/email derived from the stored user) and validates the token on mount via `fetchMe` (refreshes the user on success, self-clears on failure); `signOut` clears + notifies; `markPublished` reflects publish into the session hint. Mock mode branches on `DATA_SOURCE` and is today's behaviour verbatim. `signUp`/`signIn` params widened with an optional `password?` (mock ignores it; step 3 passes it) so current callers still compile.
- **Merge note (Step 1 parallel):** `replaceMyPersonalBests` and `fetchMyProfile` target endpoints Step 1 owns (`PUT /v1/athletes/me/personal-bests`, `GET /v1/athletes/me`), absent on this base branch. Typed against Context §9 shapes (PB body `{ personalBests: [{ label, value, resultUrl? }] }`; both return `athleteProfileSchema`) using a local `ReplacePersonalBestInput` type — flagged with `TODO(m6-step-1-merge)`; swap for the fad-common export when Step 1 lands. No `common/` edits made.
- **Verification — mock-mode DOM byte-safety (step-12 method):** built the `GITHUB_PAGES=true` (mock) export at the branch base vs with these changes; after stripping Next's per-build nondeterminism (script/preload tags, `_next` asset paths, BUILD_ID, random server-component segment-marker comments) the rendered DOM is **34/34 identical**. Normalizer calibrated by the step-12 control (identical code built twice: 34/34 raw-differ but 34/34 normalized-identical), confirming it strips only nondeterministic artifacts.
- **Verification — live exercise (tsx against a locally-booted API, seeded `fad_dev`, allowlist open):** a shimmed-`window` script drove the real `api.ts`/`session.ts` in `DATA_SOURCE=api`: `session.signUp` (unique `m6s2-<epoch>@example.com`) → persisted `arc-auth` = `{ accessToken (non-empty), user{email,displayName}, published:false }` → token-provider seam → `fetchMe` returns the signed-up user → `api.signUp` returns the full `AuthSession` (`accessToken`, `user.userId`, `accessTokenExpiresAt`) → `signOut` clears `arc-auth` → `fetchMe` throws `ApiError` `status:401` and the registered `onUnauthorized` fires → duplicate sign-up → `ApiError` `status:409 code:conflict`. **16/16 checks PASS.** Fixture users deleted from the local DB (count restored to 10); API stopped; temp scripts removed.
- **CI:** `npm run ci` green (exit 0) — common build, type-check (common/app/client), lint:fix (no warnings), full build, `app` tests 13 passed / 53 skipped (DB-gated).
- Did not touch `app/src`, `common/`, `cdk/`, `.github/`, or page components (steps 3-6 own pages).

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
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 3 - Auth pages: real submission + invite-only/409/401 error UX

### Metadata
**Status:** Complete
**Prereqs:** 2
**Size:** small
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-14
**Completion Notes:**
- New shared helper `client/lib/authErrors.ts` (`toAuthErrorView(kind, error)`) maps a thrown `ApiError` to one curated, plain sentence keyed on the auth kind — never a raw payload/code (Context §11, `client/AGENTS.md` minimalism). Deviated from the Plan's "pages render `error.message`" on purpose: surfacing the API's raw message would leak backend prose for 422/500/network, so the helper returns fixed sentences and a single `linkToSignIn` flag (sign-up 409 only). Mapping by `ApiError.status`: 403 → invite-only; sign-up 409 → duplicate + `/sign-in` link; sign-in 401 → invalid-credentials; everything else (network/unknown/non-`ApiError`) → generic try-again.
- `SignUpForm.tsx` / `SignInForm.tsx`: submit is now async and passes `password` (read from the form) into the session core. Mock mode is a pre-`try` early return preserving today's fire-and-forget `signIn/signUp` + `setTimeout(600)` push verbatim (byte-safe); api mode `await`s, then routes on success — sign-up → `/community`, sign-in → `/dashboard`. On error: re-enable submit + render the mapped sentence in a `role="alert"` `<p>` reusing the established `bg-error/10 … text-error` style (from `PublishPanel.tsx`); the sign-up 409 renders "sign in instead" as the `/sign-in` link. The existing "Build your profile" CTA path to `/register` is untouched. Success keeps the button disabled through the navigation (no double-submit).
- Only page-level env branch is the one genuinely page-owned decision (mock vs api success route); the mock-vs-api auth *behavior* stays inside the session core.
- **Live verification (tsx driver against a locally-booted API, seeded `fad_dev`):** drove the real `session.ts` → `api.ts` → `authErrors.ts` in `DATA_SOURCE=api`. Allowlist-open boot: sign-up success (session persisted → `/community`), sign-up 409 duplicate → `"An account already exists for this email —"` + `linkToSignIn=true` (form renders "…email — sign in instead."), sign-in 401 wrong password → `"Invalid email or password."`. Allowlist-gated boot (`SIGNUP_EMAIL_ALLOWLIST=@invited.example`): sign-up 403 AND sign-in 403 → `"Access is currently invite-only — contact hello@athletearc.ca"`. Generic fallback (network `ApiError` + plain `Error` + non-error value, both kinds) → `"Something went wrong — please try again."`. All checks PASS. Fixture user + orphan team deleted (DB restored 11→10 users, zero `m6s3-` leakage); API stopped; temp drivers removed.
- **Mock-mode DOM byte-safety (step-12 method):** built the `GITHUB_PAGES=true` mock export at the branch base vs with these changes; the server-rendered visible DOM for `/sign-up` (14247 chars) and `/sign-in` (13652 chars) is **byte-identical** after stripping the hydration flight payload + `_next` asset tags. The only build-output delta is Next's expected chunk-graph nondeterminism (content-hashed filenames + one extra shared JS chunk `42-*.js` in the preload tags/hydration manifest from the new imports) — inert asset loading, not rendered markup.
- **CI:** `npm run ci` green (exit 0) — type-check (common/app/client), lint:fix (`✔ No ESLint warnings or errors`), full build, app tests 13 passed / 60 skipped (DB-gated). Did not touch `follows.ts`/FollowButton/community/register/dashboard/manage (steps 4-6), nor `app/src`, `common/`, `cdk/`, `.github/`.

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
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 4 - Follows cutover: signed-in via API, anonymous prompts sign-in

### Metadata
**Status:** Complete
**Prereqs:** 2
**Size:** small
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-14
**Completion Notes:**
- `client/lib/follows.ts`: kept the exported hook surface additive-compatible (`follows`/`ready`/`isFollowing`/`toggle` unchanged; added `requiresSignIn`/`error` to the new `FollowsState` type), one `useFollows` branching internally on `DATA_SOURCE` (mirrors `session.ts`). **Mock** path is byte-identical prototype behaviour (`arc-follows` localStorage; `toggleFollow` export preserved). **Api** path: signed-in → initial `fetchMyFollows` mapped to `athleteSlug[]`, and `toggle` optimistically updates then calls `followAthlete`/`unfollowAthlete` and adopts the returned full list (single round-trip sync) — a `requestSeq` ref discards stale concurrent responses, and a failed toggle reverts the optimistic list + sets a one-sentence `error`. A 401 is handled by the api layer's unauthorized listener (session self-clears), which re-runs the effect signed-out. Signed-in state is read via `useSession()` (no token leak).
- `client/components/site/FollowButton.tsx` (the single follow-interaction seam for directory cards, profile hero/quick-actions, community feed + racing-soon): when `requiresSignIn` (api mode, anonymous) it renders a `<Link href="/sign-in">` styled identically to the "Follow" chip with a "Sign in to follow" hint — never a silent local write; on toggle `error` it renders the button plus a one-sentence `role="status"` message. Both new branches are inert in mock and api-signed-in, so the default button DOM is unchanged.
- Community "Following" tab needed no edit: it already filters by `useFollows().follows` (now the server list in api mode) and passes `signedIn` to `EmptyFollowing`, which already shows the signed-out "Sign in" state when anonymous.
- Did not touch sign-in/up pages, `register/*`, `dashboard/*`, `app/src`, `common/`, `cdk/`, `.github/` (other steps own those).
- **Verification — mock-mode DOM byte-safety (step-12 method):** built the `GITHUB_PAGES` (mock) export at the branch base vs with these changes; visible rendered DOM is **34/34 identical** after stripping Next's inline flight-data scripts + hashed asset tags (the only whole-file deltas — on the 7 profile pages + community — are RSC flight-payload hashes from the new `next/link` import, carrying no user-visible markup: a script-stripped diff on the athlete + community pages is 0 lines).
- **Verification — live exercise (tsx driving the real `session.ts`/`api.ts` in `DATA_SOURCE=api` against a locally-booted API, seeded `fad_dev`, allowlist open):** sign-up (unique `m6s4-<epoch>@example.com`) → empty follow list → `followAthlete('emma-chen')` returns a list containing it AND an independent `fetchMyFollows` confirms server-side persistence → `unfollowAthlete` drops it (returned + re-listed) → `signOut` clears `arc-auth` → an authed follow while signed-out throws `ApiError status:401` and fires the unauthorized listener → mock `toggleFollow` still round-trips `arc-follows`. **12/12 checks PASS.** Anonymous-prompt confirmed from the built api-mode page: the FollowButton compiles the `if(requiresSignIn) return <Link href="/sign-in" title="Sign in to follow">` branch into the community + profile bundles, and the server HTML renders the SSR-safe default button (no premature prompt). Fixture user deleted (cascade removed follow/session rows; DB back to the 10-user baseline, zero `m6s4-`/`@example.com` leakage); API stopped; temp scripts removed.
- **CI:** `npm run ci` green (exit 0) — common build, type-check (common/app/client), lint:fix (no warnings), full build across all three modes, `app` tests 13 passed / 60 skipped (DB-gated). `git status` shows only the two intended client files; no lockfile drift.

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
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 5 - Onboarding wizard persistence: create, per-step PATCH/set-replace, publish

### Metadata
**Status:** Complete
**Prereqs:** 1, 2
**Size:** large
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-14

### Completion Notes
- New pure/typed `client/lib/onboardingApi.ts` holds every wizard→API mapping + persistence call; `OnboardingContext` consumes it and the four page components change minimally (each "Next" link becomes a shared `client/app/register/_components/StepAdvance.tsx` control — a plain `<Link>` in mock, a save-on-advance button in api). Extracted the shared wizard view-model types into a framework-free `client/app/register/_components/onboardingProfile.ts` so the pure lib never imports the `'use client'` context (re-exported from `OnboardingContext` so existing imports keep compiling). `OnboardingContext` branches at the provider seam (`MockOnboardingProvider` = today's localStorage flow verbatim; `ApiOnboardingProvider` = create-on-first-save, PATCH/set-replace per step, real publish), keeping `profile`/`update`/`reset` identical and adding an inert-in-mock persistence surface (`mode`/`hydrating`/`signedOut`/`saving`/`saveError`/`saveAndAdvance`/`publish`/`publishChecklist`/`draftSlug`).

- **Field mapping (wizard field → API field)** — faithful to the seed semantics (`app/prisma/seed.ts`) and the publish guard (`storyIntro` + ≥1 PB + `disciplineLabel`), documented in the lib header:

  | Wizard field | API field | Endpoint / step | Notes |
  | --- | --- | --- | --- |
  | `name` | `athleteSlug` (slugified) + `fullName` | CREATE (slug+fullName+primarySport), step-1 PATCH (fullName) | `slugifyName(name)`; padded to ≥2 chars for `slugSchema` |
  | `discipline` | `disciplineLabel` (free text) **and** `primarySport='RUNNING'` | CREATE (primarySport), step-1 PATCH (disciplineLabel) | wizard is runners-only, so sport is always RUNNING; the chosen running discipline is the free-text label |
  | `location` | `hometown` | CREATE + step-1 PATCH | `countryCode` not captured by the wizard, left null |
  | `bio` ("Your story") | `storyBody` (paragraph array) | step-1 PATCH | split on blank lines into paragraphs, matching seed's multi-paragraph `storyBody` |
  | `mission` ("Your tagline") | `storyIntro` (short hook the profile leads with) | step-3 PATCH | seed's `storyIntro` is the tagline-style hook; the guard requires it |
  | `values` | `values` | CREATE + step-3 PATCH | short word chips |
  | `personalBests[{distance,time,resultUrl}]` | `personalBests[{label,value,resultUrl}]` | step-2 PUT personal-bests | order preserved (sortOrder); result URL carried |
  | `careerHighlights[{title,detail,resultUrl}]` | `highlights[{title,detail,resultUrl}]` | step-2 PUT highlights | optional |
  | `previousRaces[{name,result,resultUrl}]` | `races[{resultName,displayDate,resultSummary,resultUrl}]` | step-2 PUT races | wizard has no race date → `displayDate: 'Date TBD'` placeholder (the manage editor adds the real date; renders cleanly, satisfies the min-1 contract) |

  Review (step 4) reads the draft from the API: in api mode `ApiOnboardingProvider` hydrates `profile` from `fetchMyProfile` on entry, so `ReviewSummary`/`ProfilePreview` (which read the context) show server data with no per-page change; a fresh reload re-hydrates from the server. Publish renders the guard 422 `details.missing` as a human checklist (`storyIntro`→"Add your tagline in Step 3", `personalBests`→"Add at least one personal best in Step 2", `disciplineLabel`→"Choose your discipline in Step 1"); success keeps today's confetti/next-actions UX and calls `markPublished()`. Token-expiry mid-wizard: the api layer's 401 listener clears the session (session.ts), which flips `signedOut`; `OnboardingSessionNotice` (rendered from the register layout, inert in mock / when signed in) prompts re-sign-in while in-memory answers stay held by the context.

- **Slug-conflict deviation (backend returns 500, not 409):** the plan (Context §4/§11) assumed a duplicate `athleteSlug` on `POST /v1/athletes` returns 409, but the API only maps a duplicate **user** profile to 409 (`ConflictError`); a duplicate **slug** hits the Prisma `athleteSlug` unique constraint → `P2002` → **500** (`internal_error`), and its envelope carries no slug signal. Per the "do not touch `app/src`" boundary I did **not** change the backend; instead `createProfileWithSlugRetry` keys the slug retry on **500** (bounded `<slug>-2..-5`, each attempt idempotent since the slug changes) and treats a **409** as "user already has a profile → resume via `fetchMyProfile`" (the more-correct semantics). Exhausting the candidates surfaces a synthetic conflict → "That profile URL is taken — try a slightly different name in Step 1." **Recommendation for a follow-up backend touch:** map the `athleteSlug` unique violation to `ConflictError` (409) in `AthleteService.createProfileForUser`/repository so the contract matches §4/§11 and the client can drop the 500 branch.

- **Live verification (report honest):** scripted esbuild-bundled driver exercising the REAL `onboardingApi.ts`/`api.ts` in `DATA_SOURCE=api` against a locally-booted, seeded API (`fad_dev`, allowlist open) — full loop **30/30 PASS**: sign-up → fresh wizard (404→null) → step-1 create with a pre-reserved colliding slug forcing the retry onto `-2` → step-1 PATCH (disciplineLabel/hometown, bio→2 storyBody paragraphs, primarySport RUNNING, storyIntro deferred) → step-2 set-replace (2 PBs w/ order+resultUrl, 1 highlight, 1 race with name→resultName + result→resultSummary) → **publish 422** before storyIntro with the tagline checklist → step-3 (storyIntro from mission, values) → review `fetchMyProfile` round-trips every field incl. bio paragraphs → **publish 200** (publishedAt set) → fixture slug **appears in GET /v1/athletes** → re-entry `loadDraftProfile` returns the profile. All `m6s5-` fixtures (users + profiles + relations, both the tester and the collider) deleted after each run; DB verified back to baseline (10 users / 7 athletes / 7 published / 0 leak). Temp driver/cleanup/shim files removed.
- **Mock-mode DOM byte-safety (step-12 method):** built the `GITHUB_PAGES=true` mock export at the branch base vs with these changes; after stripping Next's per-build nondeterminism (RSC flight-data scripts, `_next` content-hashed asset paths, preload tags, segment-marker comments) the rendered visible DOM is **7/7 IDENTICAL** across `/register`, `/register/personal-basics`, `/register/athletics`, `/register/values-social`, `/register/review`, `/sign-up`, `/sign-in` (the raw ~635-byte deltas on the register pages are purely the asset-graph shift from the new module imports; sign-up/sign-in are identical byte counts). Normalizer confirmed non-empty (review page 14.7 KB normalized, retaining the form markup).
- **CI:** `npm run ci` green (exit 0) — type-check (common/app/client), lint:fix (`✔ No ESLint warnings or errors`), full build across all three modes, `app` tests 13 passed / 60 skipped (DB-gated). `RUN_DB_TESTS=1 npx vitest run` from `app/` fully green: 8 files / 73 tests. Did not touch `dashboard/*`, the manage editor, `athleteEdits.ts`, `app/src`, `common/`, `cdk/`, or `.github/`.

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
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
