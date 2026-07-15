# M6 Client Session Cutover - Steps 6-8

## Step 6 - Dashboard + manage editor cutover to the real profile

### Metadata
**Status:** Complete
**Prereqs:** 1, 5
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-14

### Completion Notes

- New pure mapper module `client/lib/manageApi.ts` (mirrors `client/lib/onboardingApi.ts`): `profileToEdits` (DTO → `AthleteEdits`, load) + `saveEditsToApi` (four set-replace PUTs, sequential) + `toManageSaveError` (one curated sentence). Field mapping: highlights `title/detail/resultsUrl/photos ↔ title/detail/resultUrl/photoRefs`; races `name/date/result/resultsUrl/links/photos ↔ resultName/displayDate/resultSummary/resultUrl/links/photoRefs`; roadmap `name/date ↔ eventName/displayDate`; gallery display-URL ↔ media ref. The editor's per-highlight `date` has no API column (highlights set-replace carries no date), so it is dropped on save like `blob:` photos (noted; matches the wizard, which also drops highlight dates).
- `client/lib/athleteEdits.ts` unchanged — its exported contract (`loadEdits/saveEdits/deriveEdits/clearEdits/subscribeToEdits` + `AthleteEdits`) is the mock/static seam and stays byte-safe; the api-mode seam lives in `manageApi.ts` alongside it (same pattern step 5 used).
- `ManageProfile.tsx` refactored to a `DATA_SOURCE` branch over one shared `EditorLayout`. Mock path is byte-identical (auto-save to `arc-manage-<slug>`, "Reset to published"). Api path: owner-only (loads `fetchMyProfile`, gates non-owner/anonymous/404-no-profile to a "view public page" card), explicit "Save changes" button issuing the set-replace PUTs, `blob:` stripped pre-save, one-sentence save error, loading skeleton.
- `DashboardClient.tsx` refactored to a `DATA_SOURCE` branch over one shared `DashboardView`. Mock path byte-identical (onboarding store + `ProfilePreview`). Api path: identity from the session, profile from `fetchMyProfile`, Draft/Live from `publishedAt`, checklist derived from real fields (storyBody, ≥1 PB, discipline, values, highlights/races), share link uses the real slug, sign-out works, loading skeleton, and a `GET /v1/athletes/me` 404 → "no profile yet → Start your story (/register)" state.

**Verification (local, booted API + seeded Postgres):**
- Scripted API driver (Node): sign-up → `GET /me` 404 pre-create → create → PATCH story/discipline → PUT PBs → `GET /me` Draft with all checklist fields → publish → `GET /me` Live → set-replace highlights/races/roadmap/gallery → `GET /me` + public `GET /v1/athletes/{slug}` reflect every field with correct mapping. All assertions passed.
- In-browser (headless Chrome over CDP, api-mode client on :3000 = CORS-allowed origin): dashboard shows "Profile live" + real first name + completeness % + real-slug share link + checklist rows; owner sees the editor with the real name + Save button; non-owner slug is gated (no Save button); profile-less user gets the no-profile state. **Editor save round-trip**: added a highlight + roadmap item via the real forms, clicked Save, saw the saved acknowledgement, and confirmed both landed via `GET /v1/athletes/me` and on the public profile API.
- Mock-mode DOM byte-safety (step-12 method): `STATIC_EXPORT=true` export before vs after — dashboard, manage, and profile page bodies are byte-identical (only build-id/chunk-hash noise differs).
- All E2E fixtures cleaned up; DB back to baseline (users=10, athlete_profiles=7, accomplishments=27, race_results=36, personal_bests=28, athlete_events=21, follows=0).
- `npm run ci` green; `RUN_DB_TESTS=1 npx vitest run` (app/) green — 74/74.

### Context

**Objective:** The dashboard and `/athletes/[slug]/manage` editor read and write the real profile in api mode.
**Done When:**
- Dashboard (api mode): identity from the session, profile state from `fetchMyProfile` — Draft/Live from `publishedAt`, completion checklist derived from real fields (storyIntro, PBs, discipline, values), share link uses the real slug, "no profile yet" state routes to `/register` on `GET /v1/athletes/me` 404. Sign-out works from the header/dashboard.
- Manage editor (api mode): loads current highlights/races/roadmap/gallery from `fetchMyProfile` (replacing the `deriveEdits`-from-static-data seed); Save issues the corresponding set-replace PUTs; `blob:` URLs still stripped before save; owner-only (non-owners/anonymous see today's public profile behavior).
- Mock mode: dashboard + editor byte-identical to today.

**References:**
- Context §7, §11 (404 → no-profile state); files: `client/app/dashboard/*`, `client/app/(marketing)/athletes/[athleteSlug]/manage/*`, `client/lib/athleteEdits.ts`; write surface: the five set-replace endpoints.

### Plan
- `athleteEdits.ts` keeps its exported contract (`loadEdits/saveEdits/deriveEdits/subscribeToEdits`) with an api-mode implementation behind the seam; map API DTOs ↔ the editor's `AthleteEdits` shape in pure functions.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 7 - Config + local api-mode E2E verification

### Metadata
**Status:** Complete
**Prereqs:** 1, 2, 3, 4, 5, 6
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-14

### Completion Notes

**Part A — Config (cdk).** Added `jwtAccessTokenTtlSeconds: number` to `cdk/config/types.ts` (TSDoc CONTRACT: access-token-only sessions until Phase 4 refresh tokens; `test` runs 24h/86400 as an accepted invite-gated trade-off — tokens live in `localStorage`, XSS-exposed, testers re-sign-in on expiry; `prod` keeps 3600). `test.ts` = `86400`, `prod.ts` = `3600`. `cdk/lib/api-stack.ts` injects `JWT_ACCESS_TOKEN_TTL_SECONDS: String(config.jwtAccessTokenTtlSeconds)` into `containerEnvironment` (next to `SIGNUP_EMAIL_ALLOWLIST`), so it flows into the service + migration + seed task defs. The app already consumes it verbatim (`app/src/services/infrastructure/JwtService.ts:13`, default 3600) — no app change needed. `cdk/README.md` §1b gained a "Session TTL for testers" note (24h test tokens + the accepted localStorage trade-off). Both synths pass **credential-free** (all AWS env unset): `npx cdk synth Arc-test-Api -c env=test` (TTL `"86400"` in all 3 task defs) and `Arc-prod-Api -c env=prod` (TTL `"3600"`) both exit 0. `npm run type-check --prefix cdk` clean.

**Part B — Full local api-mode E2E (headless Chrome over CDP, `--user-data-dir` fresh profiles).** Compiled API (`node app/dist/index.js`) on :4000 against seeded local `fad_dev`; api-mode client (`NEXT_PUBLIC_DATA_SOURCE=api`, `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`) `next dev` on :3000 (= the API's `CORS_ALLOWED_ORIGINS`). Api mode confirmed real: `/athletes` fires `GET /v1/athletes?limit=100` and renders live seeded athletes. **Main loop 37/37 checks PASS, all in-browser (real DOM clicks/typing), each persistence assertion re-verified server-side via a direct API fetch or psql:**
- **1. Sign-up** `e2e-<epoch>@seed.athletearc.ca` via the real form → routes to `/community`; `POST /v1/auth/sign-up` fired; session persisted to `arc-auth` localStorage (`{accessToken,user,published}`); `GET /v1/users/me` returns the new user server-side.
- **2. Sign-in on a genuinely fresh browser profile #2** (separate `--user-data-dir`, storage confirmed empty) → routes to `/dashboard`; session re-persisted (restore across a clean context); a dashboard reload re-validates via `GET /v1/users/me`.
- **3. Follow + unfollow a seeded athlete (emma-chen) from the profile UI** → after Follow, `GET /v1/users/me/follows` includes the slug; after clicking the "Following" toggle, the server list no longer includes it.
- **4. All four wizard steps with realistic data → publish.** Step 1 (name/discipline/location/bio) create+PATCH → `GET /v1/athletes/me` returns the draft (slug `e2e-runner-<epoch>`, disciplineLabel); step 2 add a personal best (Marathon 2:58:41) → PB persisted; step 3 pick values + tagline → storyIntro + values persisted; step 4 agree + Publish → confetti "Profile published", `publishedAt` set server-side. New athlete appears in the **live directory** both via `GET /v1/athletes?limit=100` **and** in the `/athletes` UI DOM.
- **5. Manage editor (owner) → add a roadmap item** ("Chicago Marathon 2026", "October 11, 2026") via the real add form → **Save changes** fired `PUT /v1/athletes/me/roadmap`; the item is visible on the **public profile API** `GET /v1/athletes/<slug>` (`roadmap[].eventName`).
- **6. Dashboard reflects Live state**: "Profile live" pill, "Welcome back, E2E.", the completion checklist, 80% completeness; then **Sign out** (now rendered on the profile-backed dashboard) clears `arc-auth` and the dashboard falls back to the signed-out gate.

**Error-UX (separate in-browser run; API restarted with `SIGNUP_EMAIL_ALLOWLIST=@seed.athletearc.ca` to exercise the gate) — 6/6 PASS:** sign-up `@example.com` → 403 "Access is currently invite-only — contact hello@athletearc.ca" (stays on /sign-up); sign-in wrong password → 401 "Invalid email or password."; sign-up existing email → 409 "An account already exists for this email — sign in instead." + working `/sign-in` link. (The publish-guard 422 checklist was exercised in step 5 and its path ran cleanly here since the guarded publish succeeded.) After the error run the API was left with the restrictive allowlist only for that run; the main loop ran allowlist-open.

**In-browser vs scripted, honest:** every one of the 6 success-criteria scenarios + all 3 auth error sentences were driven **in a real browser** (CDP: real form typing via the React native-value-setter + input/change events, real button clicks, real navigation). "Scripted" was used **only** for the independent server-side confirmation of each write (direct `/v1/*` fetches + psql counts) — never as a substitute for the UI action.

**Bugs found + fixed in-step (small, client read-surfaces).** The cutover surfaces real photoless athletes in the api-mode directory; `AthleteCard.tsx` and the profile hero in `AthleteProfile.tsx` passed an **empty-string `src`** to `next/image` (console warning "empty string was passed to the src attribute"). Guarded both with `athlete.heroMediaUrl ? <Image/> : null` (matches the existing ternary style; mock athletes always have a hero so mock renders identically). **Documented boundary (not a regression):** a brand-new api athlete's dedicated public profile *page* (`/athletes/<new-slug>`) returns Next's 404 because `generateStaticParams`/`findMockAthlete` are mock-roster-only (Context §2 SSR/static-params gap) — so scenario 5's "visible on the public profile" was verified via the public profile **API** (the profile page's own data source) and the live directory; seeded slugs (in the roster) render their pages fully in api mode (verified emma-chen).

**Build modes + byte-safety.** All three client modes build clean (exit 0): `GITHUB_PAGES=true`, `STATIC_EXPORT=true`, default `next build`. Mock-mode DOM byte-safety (step-12 method): built the `GITHUB_PAGES` mock export before (changes stashed) vs after; normalized `<body>` (stripping Next flight-data + hashed asset graph) is **byte-IDENTICAL** on `/athletes`, `/athletes/emma-chen`, `/athletes/cassandra-de-winter`, `/community` (32–90 KB normalized each, so the normalizer retains real markup).

**Cleanup.** All E2E fixtures removed (3 users: main athlete + allowtest + erruser, with cascade); the 2 personal teams each sign-up creates (`AuthService.createWithOwner`) don't cascade on user delete, so teams were restored to the exact pre-run set via an id-snapshot diff. **DB verified back to baseline:** users=10, athlete_profiles=7 (published=7), teams=48, team_memberships=10, follows=0, personal_bests=28, athlete_accomplishments=27, athlete_race_results=36, athlete_events=21, athlete_media=28, auth_sessions=0. Temp CDP driver/scripts removed; `client/.env.local` (api-mode, gitignored) removed. (**Flag, out of step scope:** the app DB test suite's `afterAll` cleans users but leaves the personal teams its sign-up fixtures create — 2 orphan teams accrue per full run; I restored them here.)

**Reviews + CI.** `$frontend-review` (uncommitted, general) on the 2 client changes — compliant with `client/AGENTS.md` (fad-common untouched, server components preserved, minimalist, byte-safe). `$infra-review` (uncommitted) on the cdk changes — config-driven value, credential-free synth, app integration matches the env-var name, TTL-as-plaintext is correct (not a secret). `npm run ci` green (type-check + `✔ No ESLint warnings or errors` + build across all three modes). `RUN_DB_TESTS=1 npx vitest run` from `app/` fully green — **74/74** (8 files).

### Context

**Objective:** Test-env session TTL config, and a demonstrated full local loop proving the cutover end-to-end.
**Done When:**
- `cdk/config/types.ts` gains `jwtAccessTokenTtlSeconds` (TSDoc contract), `test.ts` = 86400, `prod.ts` = 3600; `api-stack.ts` injects `JWT_ACCESS_TOKEN_TTL_SECONDS`; both synths green credential-free; `cdk/README.md` §1b notes the 24h test-token decision (and its accepted localStorage trade-off).
- **Full local E2E demonstrated and reported step-by-step** (local seeded API via compiled output or the fixed dev runner + api-mode client dev server): fresh sign-up (allowlisted address) → sign-in on a clean browser profile → follow/unfollow from the UI (verify via `GET /v1/users/me/follows`) → complete all four wizard steps → publish → new athlete visible in the live directory → edit via manage editor → changes visible on the public profile. Report what was verified in-browser vs via scripted fetches, honestly.
- All three client build modes still build; mock-mode DOM byte-safety re-verified; `RUN_DB_TESTS=1` suite + `npm run ci` green.

**References:**
- Context §1 (success criteria), §10 (cdk impact); `cdk/README.md` §1b; the E2E fixture user must use a unique-suffixed allowlisted address (`@seed.athletearc.ca` domain entry admits `e2e-<epoch>@seed.athletearc.ca`) and clean up its rows afterward.

### Plan
- Config first (small), then the E2E run; file bugs found during E2E back into the responsible surfaces and fix within this step if small, else flag.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$infra-review` (`/infra-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 8 - Final Validation & Cleanup

### Metadata
**Status:** Complete
**Prereqs:** 1, 2, 3, 4, 5, 6, 7
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-14

### Completion Notes

**Close-out inventory (verified against code, then acted on):**

1. **Test-suite hygiene (step-7 flag) — FIXED + verified.** Root cause pinned to `app/src/api/auth/auth.allowlist.test.ts`: its `afterAll` deleted only `"Allowlist Fixture's Team"`, but the suite completes **three** successful sign-ups (`beforeAll` → Allowlist Fixture; the "listed" test → Listed Fixture; the "domain" test → Domain Fixture), each of which `AuthService.signUp` auto-creates a personal team via `TeamRepository.createWithOwner`. Deleting the fixture users cascades their `TeamMembership` rows (schema: `TeamMembership.user onDelete: Cascade`) but leaves the standalone `Team` rows orphaned (`Team` has no user FK) → exactly **2 orphan teams/run** (`Listed Fixture's Team`, `Domain Fixture's Team`). All other sign-up suites (`athletes.ownProfile`, `follows`, `community`, `campaign`, and the `beforeAll` team in `auth.allowlist`) already captured/cleaned their teams; `athletes.write`/`athletes.read` create users directly via `prisma.user.create` (no team, no orphan). Fix: extended the `auth.allowlist` `afterAll` team-delete to `name: { in: ["Allowlist Fixture's Team", "Listed Fixture's Team", "Domain Fixture's Team"] }` with the existing `memberships: { none: {} }` orphan guard (matches the `in`-list pattern in `athletes.ownProfile.test.ts`). **Verified:** baseline `teams` count is now **unchanged run-over-run** across two consecutive full `RUN_DB_TESTS=1` runs (28 → 28, delta 0); pre-fix a run grew `teams` +2. `users`/`team_memberships`/`athlete_profiles` were already stable at 10/10/7. (The dev DB also carried ~40 pre-existing orphans from prior agents' runs — 24 of them the systematic `Listed`/`Domain` accrual, now swept to 0 by the fixed `afterAll`; the remaining ~18 are one-off leftovers from earlier steps' manual E2E sessions, out of the suite's cleanup scope and not something the automated tests re-create. A manual purge of those historical rows was intentionally not performed — see "Note to user".)

2. **TODO sweep — CLEAN.** `grep -rn "TODO\|FIXME" app/src client/lib client/app cdk/lib common/src` → **zero hits** (broadened to HACK/XXX and to `client/components`/`cdk/config` — still zero). The two deviations flagged in earlier steps were both resolved by later steps before this gate: (a) step-2's `TODO(m6-step-1-merge)` local `ReplacePersonalBestInput` type in `client/lib/api.ts` is gone — `replaceMyPersonalBests` now imports and uses `ReplacePersonalBestsRequest` from `fad-common`; (b) step-5's slug-conflict 500-branch workaround is gone — `AthleteService.createProfileForUser` now maps the `athleteSlug` unique violation (P2002) to `ConflictError` (409) with a `{ field: 'athleteSlug' }` discriminator (test-covered in `athletes.ownProfile.test.ts`), and `client/lib/onboardingApi.ts` keys its bounded slug retry on that 409+discriminator (no dead 500 path).

3. **Doc alignment — DONE.** `docs/delivery-plan.md` M6 row → status `◐ Client cutover complete (2026-07-14); Phase 4 backend hardening pending`, Contents split into **Done** (client session/follows/onboarding/dashboard/manage-editor cutover + the two backend gaps) vs **Pending** (refresh tokens, SES verification, rate limiting, teams) — kept honest, not claimed as full M6. `docs/architecture.md` frontend section → rewritten to state sessions/follows/onboarding/dashboard/editor are real against `/v1/*` in api mode (access-token-only interim), plus a new **"Known static-export boundary"** paragraph documenting that a newly-created api athlete's dedicated `/athletes/[slug]` page 404s in the static export (mock-roster `generateStaticParams`) while the directory/dashboard/profile-API are unaffected — cross-referenced to `docs/infrastructure-and-scaling.md` → *Stage 2 — Growth* (SSR/ISR resolution) rather than duplicating the plan.

4. **Redeploy-readiness (build only, deploys user-executed) — VERIFIED.** (a) api-mode static export `STATIC_EXPORT=true NEXT_PUBLIC_DATA_SOURCE=api NEXT_PUBLIC_API_BASE_URL=https://d2p71rep7t1ch4.cloudfront.net npm run build --prefix client` → exit 0, `client/out/` produced (130 files; deployed CloudFront URL confirmed baked into `_next/static/chunks/*.js`; the 7 mock-roster slug pages + their `/manage` pages pre-rendered as SSG). (b) API Docker image `docker buildx build --platform linux/arm64 -f app/Dockerfile -t arc-api:m6check --load .` → built + loaded clean (arm64, ~218 MB); throwaway tag removed afterward. Nothing pushed/synced/deployed.

**Step-8 gate:**
- All 7 prior steps show **Complete** in the steps-guide index.
- **`$e2e-review`** (integration scope, diff `23b01ed..HEAD` — the M6 cutover, 36 files across common/app/client/cdk): traced the full data path client → API → client for the whole loop (sign-up → session → follow/unfollow → onboarding create/PATCH/set-replace → publish → dashboard → manage editor). **Contract alignment perfect** across all 12 authed helpers + the 2 new endpoints (each client `apiRequest` method+path+response-schema matches the app router; all types from `fad-common`; PB body correctly wrapped as `{ personalBests }`; follow slug `encodeURIComponent`'d). **CDK↔app aligned:** `JWT_ACCESS_TOKEN_TTL_SECONDS` injected by `api-stack.ts` == `JwtService` consumption (test 86400 / prod 3600; correctly plaintext env, not a secret). Error propagation controlled via typed `ApiError` carrying `details` (403/409/401/publish-422 all readable). Mock byte-safety seam intact: every changed client file branches on `DATA_SOURCE === 'api'` (default `mock`), pure libs stay framework-free (no `'use client'`), interactive components keep `'use client'`. Compliance spot-checks clean: no duplicated Request/Response types in app/client, no secret/token logging in the app diff, no ad-hoc money math in changed client files, comments all within allowed categories. **No fundamentally-incorrect logic and no root-AGENTS.md violations found → Phase 3 was a no-op** (the only fix this step made is inventory item 1, which is outside the reviewed flow logic). Prior steps already ran `$backend-review`/`$frontend-review`/`$infra-review` on their committed slices.
- **`npm run ci`** → green (exit 0): type-check (common/app/client) clean, `✔ No ESLint warnings or errors`, expired-rules check clean, sync scripts clean (no mirror drift), build across all three modes/packages. **`RUN_DB_TESTS=1 npx vitest run`** (app/) → **74/74 green** (8 files).

**Note to user (before redeploying):** ~18 orphan `teams` rows remain in the local `fad_dev` DB from earlier steps' manual E2E runs (not seed data, not re-created by the now-fixed test suite). They are inert and harmless, but if you want a pristine local baseline you can delete orphaned teams manually: `DELETE FROM teams t WHERE NOT EXISTS (SELECT 1 FROM team_memberships m WHERE m."teamId"=t.id);` (all seed/live teams have memberships, so this only removes fixture dross). This does not affect the deployed test env.

### Final Step Checklist
* [x] Confirm all prior steps are complete
* [x] Review and resolve any outstanding TODOs introduced during this task
* [x] Doc alignment: `docs/delivery-plan.md` M6 row → client cutover complete (Phase 4 backend hardening remains); `docs/architecture.md` frontend section reflects real sessions/follows/onboarding in api mode
* [x] Run the `$e2e-review` (`/e2e-review`) skill with all required context provided (scope: this task's diff at integration level)
* [x] Run the `$ci` (`/ci`) skill and confirm it passes (plus `RUN_DB_TESTS=1` full suite)
- [x] Fix any issues caused by `$ci` (`/ci`) (none — CI passed clean)
* [x] Build the fresh api-mode static export for the user's redeploy and hand off the redeploy steps (image rebuild+push, migrate n/a, web sync+invalidation) — **deploys are user-executed**
* [x] Update task metadata in the steps docs and the steps guide index
* [x] Move `.ai/tasks/2026-07-14/m6-client-session-cutover/` to `.ai/tasks/2026-07-14/completed/m6-client-session-cutover/`
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
