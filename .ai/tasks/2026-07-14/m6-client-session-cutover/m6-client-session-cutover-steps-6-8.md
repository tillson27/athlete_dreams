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
**Status:** Incomplete
**Prereqs:** 1, 2, 3, 4, 5, 6
**Size:** medium
**Owner:** unassigned

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
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$infra-review` (`/infra-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 8 - Final Validation & Cleanup

### Metadata
**Status:** Incomplete
**Prereqs:** 1, 2, 3, 4, 5, 6, 7
**Owner:** unassigned

### Final Step Checklist
* [ ] Confirm all prior steps are complete
* [ ] Review and resolve any outstanding TODOs introduced during this task
* [ ] Doc alignment: `docs/delivery-plan.md` M6 row → client cutover complete (Phase 4 backend hardening remains); `docs/architecture.md` frontend section reflects real sessions/follows/onboarding in api mode
* [ ] Run the `$e2e-review` (`/e2e-review`) skill with all required context provided (scope: this task's diff at integration level)
* [ ] Run the `$ci` (`/ci`) skill and confirm it passes (plus `RUN_DB_TESTS=1` full suite)
- [ ] Fix any issues caused by `$ci` (`/ci`)
* [ ] Build the fresh api-mode static export for the user's redeploy and hand off the redeploy steps (image rebuild+push, migrate n/a, web sync+invalidation) — **deploys are user-executed**
* [ ] Update task metadata in the steps docs and the steps guide index
* [ ] Move `.ai/tasks/2026-07-14/m6-client-session-cutover/` to `.ai/tasks/2026-07-14/completed/m6-client-session-cutover/`
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
