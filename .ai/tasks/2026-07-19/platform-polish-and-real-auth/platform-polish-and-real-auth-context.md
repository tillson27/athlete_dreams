# Platform Polish + Real Auth (Resend, Verification, Reset, Mobile & Discovery)

Date: 2026-07-19
Task slug: platform-polish-and-real-auth
Status: Draft

## 0) Summary

- **Objective:** Ship a coherent polish pass across marketing + editor UX, tighten discovery to remove noise, and replace the placeholder mock-mode auth with real email-verified accounts + forgot-password flow using Resend.
- **Why now:** Discovery and profile-editor rough edges are muddying the story-first pitch. The bigger blocker: signing in with any email/password unlocks a random account today (`client/lib/session.ts:97-115` on mock mode), which is unusable for real testers and unsafe for anything close to production.
- **Primary outcomes:**
  - `client/` is visibly tighter on mobile — full-screen hero, shrunken cards, clean filter rail, drag-to-reorder + confirmed-delete editor.
  - Real accounts: `app/` verifies emails, enforces password strength, and drives verification + reset emails through Resend using branded templates.
  - Local dev boots against the real API by default so the "any email logs in" bug is impossible.

---

## 1) Success criteria

- Public athlete profile has story "See more" that keeps the intro visible; "See results" and "See all races" appear at the **bottom** of Career Highlights + Previous Races, not between rows.
- `/athletes` no longer surfaces Discipline or Level filter groups; results are paginated at a cap (e.g. 12 per page) with mobile-friendly filter row.
- Home hero fills the full viewport (`h-svh`/`h-dvh`) on desktop and mobile.
- Manage editor: explicit **Save** control + autosave (parity across mock/api); "View public page" button anchored at the footer as well as the header.
- Highlights, Races, Roadmap items expose a three-dot menu (reorder-via-drag + confirmed delete) instead of the current numbered up/down + trash pattern.
- Photo gallery entry is a clickable button that opens a full block-carousel/lightbox on mobile and desktop.
- New ARC logo mark drops into `client/components/site/Logo.tsx`, `client/app/icon.svg`, and `client/app/opengraph-image.tsx`.
- Sign-up requires strong password + valid email; sign-in returns a specific error for unknown email vs. bad password; every new account gets a branded verification email + welcome email; users can request a password-reset email and set a new password from a signed link.
- Emails render cleanly on desktop (>=600px) and mobile (<400px) and use the ARC palette (primary warm terracotta + inverse warm).

**Acceptance criteria (definition of done):**
- With `NEXT_PUBLIC_DATA_SOURCE=api` (the new default for local dev), signing in with a non-existent email surfaces "No account found for this email" and cannot mint a session.
- Signing up with `password: "short"` is rejected client-side before the request fires; the API also rejects it (defense in depth).
- Requesting a reset for a known email produces a Resend delivery with a signed link containing a single-use token that expires after 60 minutes; using it navigates to `/reset-password/<token>` and updates the password hash on submit.
- Career Highlights, Races, and Roadmap items can be dragged to reorder on touch and mouse; deleting one shows a confirmation modal before removal.
- `/athletes` renders at most `ATHLETE_PAGE_SIZE` cards per page with numeric pagination controls that update the URL.
- `npm run ci` at repo root passes.

---

## 2) Scope and non-goals

**In scope:**
- Marketing polish (hero, discovery, athlete profile) in `client/app/(marketing)/`.
- Editor polish in `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx`.
- New logo mark under `client/components/site/Logo.tsx` + related icon assets.
- Auth hardening in `app/src/api/auth/` and new email-token models in `app/prisma/schema.prisma`.
- Resend integration + branded HTML email templates in `app/`.
- Zod schema additions in `common/src/zod/auth.ts` for verify/reset/forgot flows.
- Environment defaults so `npm run dev` targets the real API.

**Out of scope:**
- Any change to donation/campaign/sponsor flows.
- CDK infrastructure changes (Resend key handling in cloud is left to the existing SSM/env pattern already used by JWT).
- Rebranding beyond the logo mark (typography, palette).
- Social/OAuth sign-in.
- Multi-factor auth.
- Rate-limiting the reset endpoint (a minimal per-email cooldown is fine, but no Redis / dedicated bucket).

**Out-of-scope edge cases:**
- Users with multiple email addresses on one account — accounts are 1:1 with `User.email` today.
- Real-time email delivery status webhooks from Resend.
- Legacy `arc-onboarding-profile` accounts created in pure mock mode do not need a data migration; they will simply need to sign up again in API mode.

---

## 3) Background and motivation

FAD's differentiators are transparency, athlete story, and minimalist UX (`AGENTS.md`). Discovery today leads with filter labels that don't help supporters find a specific runner ("Road, Trail & Ultra" vs. "Track & Field" is not how supporters browse), and the profile funnels users into a "See more results" mid-list button that feels like a bug. The manage editor's numbered chevron reorder + one-tap delete is easy to mis-tap on mobile — several career highlights have been lost this way.

Auth is the biggest gap. The `client` today ships as a static export against GitHub Pages, where mock mode (`DATA_SOURCE=mock`) accepts any credentials and mints a fake session (`client/lib/session.ts:97-115`). This has to change before we let real athletes and supporters test. The backend already has an `AuthService` with password hashing, JWT issuing, and a `SIGNUP_EMAIL_ALLOWLIST` invite gate — but no email verification, no password reset, no Resend dependency, and no "check the email actually exists" cross-reference on the client because the client short-circuits in mock mode.

Resend is the transactional email provider; credentials must live only in local environment files such as `app/.env` and must not be copied into task docs. Templates must reuse the same colourways as the marketing site so they feel like an ARC email, not a generic transactional.

---

## 4) Current state and gaps

### Current state
- `client/components/site/home/HomeHero.tsx:5-7` renders a fixed-height (`h-[540px] md:h-[640px]`) hero — never full viewport.
- `client/app/(marketing)/athletes/AthleteDirectory.tsx:16-27` defines both `SPORTS` (Discipline: Road/Trail/Ultra, Track & Field) and `LEVELS` (Pro & Elite / Competitive / Everyday). Mobile filter row shows both stacks with no obvious clear affordance.
- `client/app/(marketing)/athletes/AthleteDirectory.tsx:251-256` renders the full filtered list with no pagination.
- `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx:316-336` "See more" story `<details>` is fine but hides the read state after opening; UX ask is to keep the intro paragraph visible with a click-through "See more" that expands in place.
- `client/app/(marketing)/athletes/[athleteSlug]/ProfileEditableSections.tsx:74-92` places the "See all results" expandable inline **inside** the highlights list (visually between highlight cards). Same story for races (`ProfileEditableSections.tsx:127-147`).
- `client/app/(marketing)/athletes/[athleteSlug]/ProfileEditableSections.tsx:169-193` `EditedGallery` renders 2-column thumbnails with only `cursor-pointer` styling — no lightbox / carousel.
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx:517-661` uses `ReorderControls` (chevron up/down) + `RemoveButton` (one-tap trash).
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx:258-284` api-mode Save is a header-only button; footer only shows a status line. No autosave in api mode. Mock mode has autosave (`ManageProfile.tsx:103-106`).
- `client/lib/dataSource.ts:25-26` — `DATA_SOURCE` defaults to `'mock'` unless `NEXT_PUBLIC_DATA_SOURCE === 'api'`. `client/.env.example` (if present) does not set this by default.
- `client/lib/session.ts:97-115` mock-mode `signIn()` mints a session for any email string; no password check; no directory lookup.
- `client/app/(marketing)/sign-in/SignInForm.tsx:32-38` short-circuits to `/dashboard` after 600 ms in non-api mode, regardless of credentials.
- `app/src/api/auth/AuthService.ts:23-57` already hashes passwords with argon2 and looks up existing users — signup rejects duplicates, sign-in verifies password, but there is no email verification, no reset, no email transport, and no `emailVerifiedAt` gate.
- `app/prisma/schema.prisma` (`User.emailVerifiedAt` field exists at line 30 but there is no verification token model and no password-reset token model).
- `app/.env.example` has no Resend key, no APP_URL, no FROM_EMAIL.
- `client/components/site/Logo.tsx:3-19` is a simple square-with-A monogram.

### Gaps
- No pagination primitive in `client/` beyond simple mapping — need `useMemo`-driven page slice.
- No `EmailService` abstraction in `app/src/services/infrastructure/`.
- No branded email HTML — `docs/reference/` has no template system.
- Zod contracts for `verify-email`, `forgot-password`, `reset-password` do not exist in `common/src/zod/auth.ts`.
- No drag-and-drop library in `client/package.json` (need to add `@dnd-kit/core` + `@dnd-kit/sortable` — the pointer/touch story is best-in-class and tree-shakeable).
- No confirmation-modal primitive in `client/components/ui/`.

---

## 5) Changes and considerations

**Significant changes:**
- Default local dev to API mode: `client/.env.example` sets `NEXT_PUBLIC_DATA_SOURCE=api`, root `dev` script continues to run `app` + `client` concurrently so devs get real auth by default. Mock mode still ships the GitHub Pages export.
- Add two new Prisma models (`EmailVerificationToken`, `PasswordResetToken`) with token hashes + expiry; migrate via `npm run migrate:create --prefix app -- --name add_email_tokens`.
- Introduce `EmailService` in `app/src/services/infrastructure/EmailService.ts` that calls Resend via `fetch` (no SDK dependency — one endpoint, easy to stub in tests).
- New Zod schemas: `resendVerificationRequest`, `verifyEmailRequest`, `forgotPasswordRequest`, `resetPasswordRequest`, plus a shared `strongPasswordSchema` reused by sign-up + reset.
- Client adds `@dnd-kit/core` + `@dnd-kit/sortable` for drag-reorder; introduces a shared `ConfirmDialog` primitive in `client/components/ui/`.

**Impact and considerations:**
- Static export (GH Pages) still needs to build cleanly with mock mode. The API cutover only changes the default value — mock code paths remain intact for `next build` on the marketing preview.
- Existing signed-up users in dev DBs will still work; their `emailVerifiedAt` remains null. Sign-in policy: allow sign-in even if unverified, but show a persistent banner + block publish until verified. This keeps invite testing moving.
- Resend keys must not be logged (see backend `AGENTS.md`: "Never log secrets"). The key must never appear in an error response body either.
- Discovery filter removal must not break existing deep-links (`?sport=RUNNING&level=EVERYDAY`) — silently ignore unknown params.

---

## 6) Constraints, assumptions, dependencies

**Constraints:**
- **AI rules:** No `prisma migrate deploy`, no manual migration file edits; use `npm run migrate:create` only (see repo root `AGENTS.md`).
- **[STRICT] Import from `fad-common`** — all new auth request/response shapes go in `common/src/zod/` first.
- Marketing site must remain server-rendered where possible; keep `'use client'` scoped to interactive islands.
- Money formatting rule is not touched by this task but continue to use `formatCents` where any dollar values render.
- Do not run deployment commands (root `AGENTS.md`).

**Assumptions:**
- Resend account is already provisioned and the provided API key is valid.
- `noreply@arc.network` (or similar) is a verified sender in Resend — actual FROM address to be confirmed at implementation time; fallback is `onboarding@resend.dev` (Resend's built-in test sender).
- Marketing app is deployed as a static export; API is deployed independently via CDK — the auth cutover only affects local dev + api-mode builds.

**Dependencies (ordered):**
1. New Zod schemas + Prisma models must land before the AuthService / email endpoints are wired.
2. `EmailService` must exist before `AuthService` can call it.
3. Backend auth endpoints must exist before client `/forgot-password` + `/reset-password/[token]` pages can integrate.
4. Manage editor drag-and-drop depends on `@dnd-kit/*` being added to `client/package.json`.
5. Mobile audit runs last so it can absorb every visual change from prior steps.

---

## 7) Requirements

**Functional requirements:**
- Athlete profile "See more" reveals the story body while keeping the intro paragraph visible; toggle re-collapses.
- Career Highlights + Previous Races show `HIGHLIGHTS_VISIBLE` / `RACES_VISIBLE` rows first, then a **"See all results"** / **"See all races"** trigger at the **bottom** that expands the rest in place.
- `/athletes` no longer renders Discipline or Level filter groups (desktop rail + mobile pills). Deep-linked `?sport=...` / `?level=...` params are ignored gracefully.
- `/athletes` shows at most 12 athletes per page and renders `Prev / 1 2 3 / Next` controls (page state in URL as `?page=2`).
- Mobile filter row on `/athletes` is a single horizontally-scrollable Region filter row (all we keep), or is removed entirely if no filter groups remain — plan will collapse to just Region + Search.
- Home hero uses full viewport height with `h-svh` (fall back to `h-screen`) and safe-area padding.
- Manage editor: Save button visible in header + footer; autosave fires with a 1s debounce in both mock + api modes.
- Manage editor footer includes a large "View public page" CTA linking to `athleteProfileHref(slug)`.
- Highlights/Races/Roadmap: three-dot menu opens a small popover with "Move" (drag-handle affordance) and "Delete" (confirm modal). Drag-to-reorder works via `@dnd-kit`.
- Photo gallery in the public profile: tapping any tile opens a full-screen carousel with swipe (touch) + arrow-key (desktop) navigation.
- Sign-up requires: valid email (RFC 5322 subset via Zod), password ≥ 10 chars, contains at least one letter and one digit; UI shows a live strength meter.
- Sign-in returns distinct errors for: unknown email, wrong password, unverified email (soft warning).
- Forgot-password flow: `/forgot-password` posts to `POST /v1/auth/forgot-password` (always returns 200 to avoid enumeration); user receives an email; `/reset-password/<token>` submits a new password to `POST /v1/auth/reset-password`.
- Every new account triggers a verification email + welcome email via Resend, using branded HTML templates.

**Non-functional requirements:**
- Emails must render inline-styled (no `<style>` blocks) to survive Gmail/Outlook stripping, and cap at 600 px content width with responsive stack < 480 px.
- Password hash + token hash operations must remain server-side. Token *plaintext* is emailed once, only the SHA-256 hash is stored.
- Reset tokens expire after 60 minutes and are single-use (a `usedAt` field marks consumption).
- Drag interactions must feel responsive on iOS Safari — use pointer events, not mouse events.
- Discovery pagination should be O(1) client-side (already loaded array; no server round-trip yet).

---

## 8) Proposed approach

- **Discovery cleanup** stays in `AthleteDirectory.tsx`; delete the `SPORTS` + `LEVELS` constants, prune the mobile pill rows, and slice results with `page`/`pageSize`.
- **Athlete profile:** flip the "See more" story `<details>` to a controlled `useState` toggle so the intro paragraph doesn't disappear. Move the `moreLabel` trigger inside `EditedHighlights` / `EditedRaces` from the current inline position to a final bottom slot.
- **Photo gallery:** wrap `EditedGallery` in a new `client/components/ui/PhotoCarousel.tsx` that uses `useReducer` for the active index + arrow-key handlers + native swipe (touch move deltas — no library).
- **Backend contracts:** add two Prisma models with `@@index([tokenHash])` for O(log n) lookups, and Zod schemas in `common/src/zod/auth.ts`.
- **EmailService:** thin `fetch` wrapper over `POST https://api.resend.com/emails`. Injected via tsyringe; unit tests stub the fetch.
- **Email templates:** plain-string tagged template functions (no Handlebars — overkill). Inline styles reference the same design tokens as the site (warm terracotta primary `#c65d3e`, inverse warm `#160d09`, etc.).
- **AuthService:** on sign-up, create user + issue verification token + call `EmailService.sendVerification`. On sign-in, keep behaviour but return a discriminated "unknown-email" vs. "invalid-password" via the standard `UnauthorizedError` variant — client renders friendlier copy.
- **Client auth cutover:** flip the `client/.env.example` default; delete the "fake login" short-circuit in `SignInForm.tsx` (so API mode is the only path); the mock path still exists for GH Pages builds because `DATA_SOURCE` still reads env at build time.
- **Manage editor:** replace `ReorderControls` + `RemoveButton` with a single `<SortableItem>` wrapping a menu button. Menu items: "Move" (visually indicates drag handle now active — actually items are always draggable; menu offers keyboard-accessible move-up/move-down as fallback) + "Delete" (opens `<ConfirmDialog />`).
- **New logo:** design a warm terracotta ARC mark — arc-swoosh over an "A" formed from an angled stride, using the primary + primary-container palette. Emit SVG at 36×36 (site) and 32×32 (favicon).

---

## 9) Data model and contracts

### OpenAPI changes
- `POST /v1/auth/forgot-password` (body: `{ email }`, always 200).
- `POST /v1/auth/reset-password` (body: `{ token, password }`).
- `POST /v1/auth/verify-email` (body: `{ token }`).
- `POST /v1/auth/resend-verification` (body: `{ email }`, always 200).

### Data model changes
- New `EmailVerificationToken` model: `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt?`, `createdAt`. Index `(tokenHash)`.
- New `PasswordResetToken` model: same shape.
- No changes to `User.emailVerifiedAt` (already exists).

### Example shapes

```json
{
  "signUpRequest": {
    "email": "athlete@example.com",
    "password": "arc-run-2026",
    "displayName": "Jamie Runner"
  },
  "forgotPasswordRequest": { "email": "athlete@example.com" },
  "resetPasswordRequest": {
    "token": "7f8b…",
    "password": "newpassword-2026"
  }
}
```

---

## 10) Package-level impact

### common/
- `src/zod/auth.ts` gains `strongPasswordSchema`, `forgotPasswordRequestSchema`, `resetPasswordRequestSchema`, `verifyEmailRequestSchema`, `resendVerificationRequestSchema`. Rebuild the package.

### app/
- New `services/infrastructure/EmailService.ts` + Resend-backed implementation.
- New `services/infrastructure/TokenHasher.ts` (SHA-256 via `node:crypto`).
- New Prisma models + generated repositories.
- `api/auth/AuthService.ts` extended with `sendVerificationEmail`, `verifyEmail`, `forgotPassword`, `resetPassword`.
- New Resend-backed HTML templates under `services/email/templates/`.
- `.env.example` gains `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_URL`, `PASSWORD_RESET_TOKEN_TTL_MINUTES`, `EMAIL_VERIFICATION_TOKEN_TTL_HOURS`.
- Password strength enforced in `AuthService` as defence-in-depth (Zod schema is primary).

### client/
- `.env.example` sets `NEXT_PUBLIC_DATA_SOURCE=api` and `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`.
- New pages: `app/(marketing)/forgot-password/page.tsx`, `app/(marketing)/reset-password/[token]/page.tsx`, `app/(marketing)/verify-email/page.tsx`.
- `app/(marketing)/sign-up/SignUpForm.tsx` + `sign-in/SignInForm.tsx` add validation + strength meter + "Forgot password?" link.
- `AthleteDirectory.tsx`: remove filters, add pagination.
- `AthleteProfile.tsx` + `ProfileEditableSections.tsx`: story toggle + move "See more" triggers.
- `ManageProfile.tsx`: three-dot menu, drag-reorder via `@dnd-kit`, confirm-delete modal, footer Save + View-public buttons.
- `components/ui/ConfirmDialog.tsx` + `components/ui/PhotoCarousel.tsx` + `components/ui/SortableList.tsx` new primitives.
- Home hero: full-viewport class swap in `HomeHero.tsx`.
- Logo mark: swap `Logo.tsx`, `app/icon.svg`, `app/opengraph-image.tsx`.
- Mobile pass — audit + shrink cards & typography for every changed surface.

### docs/
- No documentation updates required for this task beyond keeping `docs/backend-build-sheet.md` accurate if it lists auth endpoints.

---

## 11) Edge cases and error handling

- **Deep-linked filter params (`?sport=…`):** ignore silently, keep the current page URL.
- **Reset token expired/used:** `/reset-password/<token>` shows "This reset link has expired. Request a new one."
- **Verification token expired:** show link to `POST /v1/auth/resend-verification`.
- **Sign-in when email is unverified:** issue the session anyway, but return a `mustVerifyEmail: true` flag on the session so the client can gate publish + banner.
- **Sign-up with an already-registered email:** unchanged `ConflictError` from `AuthService`; UI copy: "That email already has an account — sign in instead."
- **Resend outage:** the sign-up endpoint must not fail if Resend returns 5xx — log the failure and let the user resend. Never rollback the user creation.
- **Drag-reorder with a single item:** no-op.
- **Delete confirmation dismissed:** revert to open list; no state change.
- **Photo carousel with 0 photos:** show empty state (existing `EmptySection` copy).
- **Pagination with 0 results:** render existing empty state, no pagination controls.

---

## 12) Failure modes and concurrency

**Concurrency/race conditions:**
- Two reset-token requests for the same email: latest token supersedes earlier ones (mark prior tokens as `usedAt = now()` at issuance to keep only the newest one live).
- Simultaneous saves in the manage editor from two tabs: last write wins (existing behaviour). No pessimistic locking.

**Idempotency and retries:**
- `POST /v1/auth/forgot-password` always returns 200 (idempotent, no user-enumeration).
- Verify + reset endpoints are idempotent on the token: reusing a consumed token returns "Token already used or expired."
- Resend send failures are retried once with 500ms backoff; further failures return 200 to the user (email delivery is best-effort from the API's perspective) but are logged with `warn`.

**Failure modes:**
- Resend outage: sign-up proceeds; verification email flagged for background retry (log + metric only for this task).
- DB down: existing global error middleware returns 500. No change.
- Bad token: 400 with a friendly "Invalid or expired token" message; no leaking of whether the token existed.

---

## 13) Operational readiness

**Observability:**
- Structured log for `auth.verification_email.sent`, `auth.password_reset.requested`, `auth.password_reset.completed`, `auth.verification.completed` — include user id + token id, never plaintext token.
- Emit a warn log with the Resend request id whenever Resend returns 4xx/5xx.

---

## 14) Research and references

- [Resend docs — Send an email (2026)](https://resend.com/docs/api-reference/emails/send-email) — verified via web docs, `POST https://api.resend.com/emails` with `Authorization: Bearer <key>` and JSON `{ from, to, subject, html, text }`; response `{ id }`. No SDK required; using `fetch` avoids adding `resend` to `app/package.json`.
- [Email on Acid — Bulletproof Email HTML 2026](https://www.emailonacid.com/blog/article/email-development/) — inline styles, tables for layout, keep width ≤ 600 px, mobile break at 480 px.
- [`@dnd-kit` docs](https://docs.dndkit.com/) — pointer-first sortable list, minimal footprint, works with keyboard for a11y.
- [MDN `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — for `ConfirmDialog` we use the native dialog to inherit focus trap + `esc`-to-close.
- Repo docs: `docs/backend-build-sheet.md`, `client/AGENTS.md`, `app/AGENTS.md`, `common/AGENTS.md`.

---

## 15) Open questions

- Verified FROM address in Resend (needs to be a verified sender before we can email real athletes) — default to `onboarding@resend.dev` for local dev, but production sender must be confirmed with the owner before this task's changes ship.
```
