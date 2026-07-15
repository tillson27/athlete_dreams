# M6 Client Session Cutover — Real Sign-up, Follows, Onboarding & Publish

Date: 2026-07-14
Task slug: m6-client-session-cutover
Status: Approved

## 0) Summary

- **Objective:** Cut the client's remaining localStorage mocks over to the real API in `api` data-source mode — sessions, follows, the 4-step onboarding wizard, publish, dashboard, and the manage editor — plus the two small backend gaps that block it, so allowlisted testers on the deployed test environment can sign up, follow, and create/publish real athlete profiles.
- **Why now:** M3 is deployed and smoke-verified (13/13 at `https://d2p71rep7t1ch4.cloudfront.net`); the read surfaces are live in api mode, but auth/onboarding still run the localStorage prototype, so testers cannot create real accounts or persist anything.
- **Primary outcomes:** delivery-plan **M6** milestone (client half) complete; mock mode and the GH Pages export stay byte-safe.

---

## 1) Success criteria

- On a local api-mode client against the local seeded API: a new user signs up (allowlisted), signs in on a fresh browser profile, follows/unfollows athletes (persisted server-side), completes all four onboarding steps, publishes, appears in the directory, and edits their profile via the manage editor — all persisting via `/v1/*`.
- 403 invite-only, 409 duplicate email/slug, 401 bad credentials, and the publish guard's 422 (missing story/PB/discipline) all surface as readable UI errors.
- `RUN_DB_TESTS=1` suite fully green including the new backend tests; `npm run ci` green; all three client build modes still work (`STATIC_EXPORT`, `GITHUB_PAGES`, default).
- Mock mode is behaviorally unchanged (DOM-identical rendering per the step-12 comparison method).

**Acceptance criteria (definition of done):**
- All steps Complete incl. final validation via `$e2e-review` (`/e2e-review`); the local end-to-end loop above demonstrated against a locally-booted API; a fresh api-mode export builds ready for the user's redeploy (deploy itself is user-executed).

---

## 2) Scope and non-goals

**In scope:**
- Backend gaps: `PUT /v1/athletes/me/personal-bests` (set-replace, mirrors highlights/races) and `GET /v1/athletes/me` (own rich profile incl. unpublished + publish state) — Zod-first, tests.
- Client: real `session.ts` (API-backed, token+user in localStorage, `/v1/users/me` validation), `api.ts` auth-header injection + 401 handling + authed helpers; auth pages with real submission + error UX; follows cutover (signed-in → API, anonymous → sign-in prompt); onboarding wizard persistence (create-on-first-save with client slugify + 409 retry, PATCH per step, set-replace PBs/highlights/races, real publish); dashboard + manage editor on `GET /v1/athletes/me` + set-replace saves.
- Config: test-env `JWT_ACCESS_TOKEN_TTL_SECONDS=86400` via cdk container env; runbook/env-example notes.

**Out of scope:**
- Phase 4 backend auth hardening (refresh tokens/rotation, SES verification, password reset, rate limiting, teams) — access-token-only sessions are the accepted interim.
- Photo uploads (editor keeps stripping `blob:` URLs; refs only), cheers persistence, campaigns/donations UI (M4).
- Deployment execution (user-run per [STRICT]); smoke-suite changes (publish flow would pollute the shared roster — verification is local E2E + manual).

**Out-of-scope edge cases:**
- Multi-tab session sync beyond the existing `browserStore` event pattern; token refresh UX at expiry (24h TTL + re-sign-in is acceptable for testers); migrating a pre-existing localStorage mock draft into a real profile (drafts start server-side at first wizard save; old local drafts are ignored in api mode).

---

## 3) Background and motivation

`docs/delivery-plan.md` → M6; `docs/backend-build-sheet.md` → *Frontend contract alignment* (the seam table — `session.ts` and the editor are the last unwired seams). The deployed test env is invite-gated by `SIGNUP_EMAIL_ALLOWLIST` (`cdk/README.md` §1b) — this task makes that gate meaningful in the UI. Product rules preserved: minimalist UX (surface errors plainly), story-first, mock mode untouched for GH Pages.

---

## 4) Current state and gaps

### Current state
- Deployed test env live (temporary-URL mode), api-mode read surfaces live (directory/profile/community via `client/lib/{api,adapters,apiLoaders,dataSource}.ts`).
- Backend: sign-up/sign-in (allowlist-gated 403), `GET /v1/users/me`, follow endpoints (list-returning toggles), `POST /v1/athletes`, `PATCH /v1/athletes/me` (rich: handle/story/discipline/coreValues/…, `mediaRefSchema` heroMediaUrl), `PUT /v1/athletes/me/{highlights,races,roadmap,gallery}`, `POST /v1/athletes/me/publish` (guard: storyIntro + ≥1 PB + disciplineLabel), publish idempotent. 66→ current suite green.
- Client mocks: `client/lib/session.ts` (localStorage, `arc-session`), `client/lib/follows.ts` (`arc-follows`), onboarding `OnboardingContext` + `arc-onboarding-profile` store, `client/lib/athleteEdits.ts` (`arc-manage-<slug>`), dashboard reads all three. `client/lib/slugify.ts` exists.

### Gaps (audited 2026-07-14)
- **No personal-bests write path** — publish guard requires ≥1 PB, so HTTP-only athletes can never publish (`common/src/zod/athlete.ts` has no PB request schema; `AthleteRouterFactory` has no PB route).
- **No own-profile discovery** — no `GET /v1/athletes/me`; after fresh sign-in the client cannot learn its slug/draft state (dashboard/editor need it; `userSchema` has no athleteSlug).
- All client auth/onboarding/editor writes are localStorage-only.

---

## 5) Changes and considerations

**Significant changes:** the api-mode client becomes stateful against the real backend; auth pages stop being prototypes; onboarding writes create real DB rows on the shared test env (allowlisted users only).

**Impact and considerations:** everything is gated on `DATA_SOURCE === 'api'` — mock mode must remain the default and byte-safe (GH Pages). Server components stay server; interactivity added only where the pages are already client components (register/dashboard/editor/auth pages are). `common` build precedes app/client type-checks (root `ci` handles it).

---

## 6) Constraints, assumptions, dependencies

**Constraints ([STRICT]):** fad-common types only; Zod-first contract changes; repositories own Prisma; typed domain errors; comment rules; no deploys/pushes by AI; migrations n/a (no schema change — `PersonalBest` model already exists).

**Assumptions:** local Postgres seeded and running (`fad-pg`); the deployed env is redeployed by the user after this task (image + web export rebuilds); 24h tokens acceptable for the invite-gated test env (XSS-exposure accepted and documented).

**Dependencies (ordered):** backend gaps (step 1) before onboarding/dashboard/editor steps; session core (step 2) before all client UI steps; onboarding (step 5) before dashboard/editor (step 6).

---

## 7) Requirements

**Functional:** per §1 success criteria; additionally — sign-out clears the session and returns to signed-out UI; the community "Following" tab uses the server follow list when signed in (api mode); the wizard prevents publish until the guard passes and shows exactly what's missing (from the 422 `details.missing`); slug conflicts on create auto-retry with a numeric suffix (bounded attempts) before surfacing an error.

**Non-functional:** no regression to the three build modes; mock byte-safety; readable error states (no raw JSON); token stored under a single namespaced key (`arc-auth`) via the existing `browserStore` pattern; api-mode-only code paths tree-shaken or inert in mock builds where practical.

---

## 8) Proposed approach

- Extend the proven step-12 architecture: `api.ts` gains an auth layer (token provider + 401 propagation), `session.ts`/`follows.ts` keep their exported hook shapes so consuming components change minimally; wizard/editor/dashboard swap their persistence functions behind the same `DATA_SOURCE` seam used by the read loaders.
- Backend additions copy the existing set-replace + owner-route patterns exactly (`AthleteRouterFactory`, `AthleteRepository.replace*`, contracts in `common/src/zod/athlete.ts`).
- Verification: DB-gated vitest for backend; client via live local E2E (agent-run API + client dev server + scripted `api.ts` exercises) per step-12 precedent (client has no test runner; do not introduce one).

---

## 9) Data model and contracts

Zod-first; **no Prisma schema change** (models exist).

### Contract changes (`common/src/zod/athlete.ts`)
- `replacePersonalBestsRequestSchema`: `.strict()` array payload (max 8) of `{ label ≤40, value ≤40, resultUrl?: url }` — mirrors the other set-replace schemas.
- `myAthleteProfileResponseSchema`: reuse `athleteProfileSchema` (it already carries `publishedAt`); no new shape needed — export an alias only if it aids clarity.

### Endpoints
- `PUT /v1/athletes/me/personal-bests` (auth) — set-replace, order = array order (`sortOrder`).
- `GET /v1/athletes/me` (auth) — own rich profile DTO incl. unpublished; 404 `NotFoundError('Athlete profile')` when the user has none (the client treats that as "no profile yet").

### Example shapes

```json
// PUT /v1/athletes/me/personal-bests — request body
{ "personalBests": [ { "label": "Marathon", "value": "2:58:41", "resultUrl": "https://..." } ] }
```

---

## 10) Package-level impact

### common/
- The two contract additions above; build + re-type-check consumers.

### app/
- `AthleteRepository.replacePersonalBests` (transactional, mirrors `replaceHighlights`); controller/router additions for the two endpoints; DB-gated tests (round-trip incl. order, guard interaction: create → PBs → publish succeeds over HTTP end-to-end).

### client/
- `lib/session.ts` (rewrite, API-backed in api mode; mock path preserved for mock mode), `lib/api.ts` (auth header, 401, authed helpers: follows, me, create/patch/publish/set-replace), `lib/follows.ts` (+`FollowButton`/community Following tab), `app/(marketing)/sign-in|sign-up` pages, `app/register/*` + `OnboardingContext` persistence, `app/dashboard/*`, `lib/athleteEdits.ts` + manage editor, `.env.example` notes.

### cdk/
- `config/types.ts` + `test.ts`: `jwtAccessTokenTtlSeconds` (test 86400, prod 3600) → `JWT_ACCESS_TOKEN_TTL_SECONDS` container env in `api-stack.ts`.

### docs/
- `cdk/README.md`: session note in §1b (24h test tokens); delivery-plan M6 status updated at final step.

---

## 11) Edge cases and error handling

- **Sign-up 403 (invite-only):** friendly "invite only" message naming the gate; **409:** "account exists — sign in"; **sign-in 401:** generic invalid-credentials (no enumeration); **sign-in 403:** invite-only message.
- **Slug conflict on create (409):** retry `<slug>-2..-5`, then surface an error.
- **Publish 422:** render `details.missing` as a checklist of what to complete.
- **Token expired mid-flow (401):** clear session, prompt re-sign-in, preserve unsaved wizard step state in memory where already held.
- **`GET /v1/athletes/me` 404:** dashboard/editor show "no profile yet → start onboarding"; wizard starts at create.
- **Anonymous follow click (api mode):** sign-in prompt, not a silent localStorage write.
- **Mock mode:** every one of the above paths keeps today's behavior exactly.

---

## 12) Failure modes and concurrency

- **Create retry** is bounded and idempotent per attempt (each 409 changes the slug); a half-created profile (create ok, first PATCH fails) is safe — wizard re-entry loads `GET /v1/athletes/me` and resumes.
- **Set-replace writes** are transactional server-side; last-write-wins accepted (single owner).
- **Publish** is first-write-wins server-side (idempotent re-clicks).
- **Dual writers** (two tabs) resolve via last-write-wins + the `browserStore` change events already syncing session state across tabs.

---

## 13) Operational readiness

- Client errors logged to console with a stable prefix in api mode; backend already logs domain errors via pino. No new alarms (test env).

---

## 14) Research and references

- Seam sources: `client/lib/{session,follows,athleteEdits,api,dataSource,apiLoaders,adapters,slugify}.ts`, `client/app/register/*`, `client/app/dashboard/*`; backend patterns: `app/src/api/athletes/*`, `app/src/repositories/AthleteRepository.ts`; audit results in §4.
- **Provider contract gate:** no third-party API contracts are consumed by this task (first-party API only) — `$provider-contract-verification` (`/provider-contract-verification`) not applicable; Stripe remains gated on M4 planning.
