# Platform Polish + Real Auth - Steps 6-10

## Step 6 - Backend contracts: Prisma migration + Zod schemas + env additions

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** codex
**Completed At:** 2026-07-19
**Completion Notes:**
- Added strong password and verify/reset request schemas, added email verification and password reset token Prisma models, updated backend env examples, and drafted `app/prisma/migrations/20260719215334_add_email_tokens/` via Prisma create-only workflow. The new migration still needs to be applied manually by a developer/operator before use.

### Context

**Objective:** Land the schemas, migration, and env keys that Steps 7-9 depend on.
**Done When:**
- `common/src/zod/auth.ts` exports `strongPasswordSchema`, `forgotPasswordRequestSchema`, `resetPasswordRequestSchema`, `verifyEmailRequestSchema`, `resendVerificationRequestSchema` and types; `signUpRequestSchema` uses `strongPasswordSchema`.
- `common` builds cleanly (`npm run build --prefix common`).
- `app/prisma/schema.prisma` adds `EmailVerificationToken` + `PasswordResetToken` models with `tokenHash` (indexed), `expiresAt`, `usedAt`, `createdAt`.
- A new migration file exists under `app/prisma/migrations/<timestamp>_add_email_tokens/` (created via `npm run migrate:create --prefix app -- --name add_email_tokens`; the user will apply it — do not apply).
- `app/.env.example` gains `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_URL`, `PASSWORD_RESET_TOKEN_TTL_MINUTES=60`, `EMAIL_VERIFICATION_TOKEN_TTL_HOURS=48`.

**References:**
- Context §6, §9, §10
- Repo root `AGENTS.md` (Prisma CLI usage rules — AI must not `migrate deploy`/`apply`; only `migrate:create`).
- `common/src/zod/auth.ts`
- `app/prisma/schema.prisma`
- `app/.env.example`

### Plan
- Extend `common/src/zod/auth.ts`:
    - Snippet:
      ```ts
      export const strongPasswordSchema = z
        .string()
        .min(10, 'At least 10 characters')
        .max(200)
        .refine((v) => /[A-Za-z]/.test(v), 'Must include a letter')
        .refine((v) => /\d/.test(v), 'Must include a number');

      export const forgotPasswordRequestSchema = z.object({ email: z.string().email() }).strict();
      export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

      export const resetPasswordRequestSchema = z
        .object({ token: z.string().min(20), password: strongPasswordSchema })
        .strict();
      export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

      export const verifyEmailRequestSchema = z.object({ token: z.string().min(20) }).strict();
      export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;

      export const resendVerificationRequestSchema = z
        .object({ email: z.string().email() })
        .strict();
      export type ResendVerificationRequest = z.infer<typeof resendVerificationRequestSchema>;
      ```
- Update `signUpRequestSchema` to use `strongPasswordSchema` for `password`.
- Rebuild `common` and export new schemas via `common/src/index.ts` (barrel).
- Add Prisma models:
    - Snippet:
      ```prisma
      model EmailVerificationToken {
        id         String    @id @default(uuid()) @db.Uuid
        userId     String    @db.Uuid
        tokenHash  String    @unique
        expiresAt  DateTime
        usedAt     DateTime?
        createdAt  DateTime  @default(now())

        user User @relation(fields: [userId], references: [id], onDelete: Cascade)

        @@index([userId])
        @@map("email_verification_tokens")
      }

      model PasswordResetToken {
        id         String    @id @default(uuid()) @db.Uuid
        userId     String    @db.Uuid
        tokenHash  String    @unique
        expiresAt  DateTime
        usedAt     DateTime?
        createdAt  DateTime  @default(now())

        user User @relation(fields: [userId], references: [id], onDelete: Cascade)

        @@index([userId])
        @@map("password_reset_tokens")
      }
      ```
- Add inverse relations on `User`.
- Draft the migration via `npm run migrate:create --prefix app -- --name add_email_tokens`. Do not apply it — leave the file for the user.
- Update `app/.env.example` with the new keys.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 7 - Backend Resend integration: EmailService + branded HTML templates

### Metadata
**Status:** Complete
**Prereqs:** 6
**Size:** medium
**Owner:** codex
**Completed At:** 2026-07-19
**Completion Notes:**
- Added a tsyringe-managed Resend `EmailService`, inline-styled branded templates for verification, welcome, and password reset emails, shared email palette tokens, and provider-shaped fetch payload tests. No centralized dependency-injector file exists in this app; registration is through the existing `@singleton()` pattern.

### Context

**Objective:** Add a Resend-backed `EmailService` and branded, mobile-safe HTML templates for verification, welcome, and password reset emails.
**Done When:**
- `app/src/services/infrastructure/EmailService.ts` exposes a tsyringe-injectable class with `sendVerification`, `sendWelcome`, `sendPasswordReset` methods.
- `EmailService` calls `https://api.resend.com/emails` via `fetch` using `RESEND_API_KEY` from env; never logs the key.
- Templates live under `app/src/services/email/templates/` as pure functions returning `{ subject, html, text }`.
- Templates render at ≤600px content width, degrade to 100% width < 480px, and use inline styles pulled from a shared `emailTokens` constant matching the site palette (primary warm terracotta `#c65d3e`, inverse warm `#160d09`, surface neutral `#fdfaf6`).
- `EmailService` is registered in `app/src/config/DependencyInjector.ts`.
- Unit test verifies the `fetch` payload shape and Authorization header.

**References:**
- Context §5, §8, §14
- Repo `AGENTS.md` and `app/AGENTS.md` (never log secrets; import types from `fad-common`; use ResponseHandler and typed domain errors).
- `app/src/services/infrastructure/`
- `app/.env.example`

### Provider contract evidence

- Provider/API: Resend Email API.
- Source URL: https://resend.com/docs/api-reference/emails/send-email
- Retrieved with: web official-doc open.
- Retrieved at: 2026-07-19.
- Request contract: `POST https://api.resend.com/emails` with `Authorization: Bearer <api key>`, `Content-Type: application/json`, and JSON body containing required `from`, `to`, `subject`; this implementation also sends `html` and `text`.
- Response contract: success body includes `id` as a string.
- Evidence source: official cURL/body parameter example and official success response example.
- Live smoke: Not run; the endpoint sends email and would consume the local secret.
- Fixture/test coverage: `app/src/services/infrastructure/EmailService.test.ts` uses the provider-shaped `{ id: string }` response and asserts the Resend URL, bearer header, and JSON payload.
- Remaining risk: Sender-domain verification remains operational and outside this code contract.

### Plan
- Introduce a shared `emailTokens` module and template helpers.
    - Snippet:
      ```ts
      // app/src/services/email/tokens.ts
      export const emailTokens = {
        primary: '#c65d3e',
        primaryContainer: '#f2b28f',
        surface: '#fdfaf6',
        inverseSurface: '#160d09',
        onInverse: '#ffffff',
        onSurface: '#160d09',
        onSurfaceVariant: '#6b5c53',
        radius: '12px',
        maxWidth: '600px',
      } as const;
      ```
- Build a `renderEmailShell(title, bodyHtml)` helper that emits the outer HTML doc with inline styles + `<meta name="viewport">` + the media query for < 480px stack behaviour.
- Create per-template functions:
    - `verificationEmail({ displayName, verifyUrl }): EmailPayload`
    - `welcomeEmail({ displayName, profileUrl })`
    - `passwordResetEmail({ displayName, resetUrl, expiresInMinutes })`
- Implement `EmailService`:
    - Snippet:
      ```ts
      @injectable()
      export class EmailService {
        constructor(private readonly logger: Logger) {}
        private async send(payload: EmailPayload) {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL,
              ...payload,
            }),
          });
          if (!res.ok) {
            this.logger.warn({ status: res.status }, 'resend.send_failed');
            throw new Error(`Resend failed: ${res.status}`);
          }
        }
        // sendVerification / sendWelcome / sendPasswordReset call `this.send(...)`
      }
      ```
- Register in DI. Cover with a `vitest` unit test using a `fetch` stub.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 8 - Backend auth flow: verify, forgot-password, reset-password endpoints

### Metadata
**Status:** Complete
**Prereqs:** 6, 7
**Size:** medium
**Owner:** codex
**Completed At:** 2026-07-19
**Completion Notes:**
- Added token repositories, SHA-256 token hashing, verification/reset/resend endpoints, `mustVerifyEmail` session state, and best-effort Resend sends that never roll back signup or reset requests.
- Added focused unit coverage plus `RUN_DB_TESTS=1` integration coverage for unknown forgot-password requests, verification, and expired reset tokens.
- Ran `$backend-review` (`/backend-review`) in uncommitted auth/API scope and full `$ci` (`/ci`); CI passed with only pre-existing tooling warnings.

### Context

**Objective:** Wire the sign-up → verification, forgot-password, and reset-password endpoints end-to-end in the API.
**Done When:**
- `AuthService.signUp` creates the user, issues a verification token, and calls `EmailService.sendVerification` + `EmailService.sendWelcome`; never rolls back if the send throws.
- New `AuthService.forgotPassword({ email })` always resolves (no enumeration); issues + emails a reset token when the user exists.
- New `AuthService.resetPassword({ token, password })` verifies the token hash, checks `expiresAt` and `usedAt`, updates `passwordHash`, marks the token used.
- New `AuthService.verifyEmail({ token })` marks the token used and sets `user.emailVerifiedAt`.
- New `AuthService.resendVerification({ email })` idempotently issues a fresh token when a user exists.
- Routes added to `AuthRouterFactory`: `POST /v1/auth/forgot-password`, `POST /v1/auth/reset-password`, `POST /v1/auth/verify-email`, `POST /v1/auth/resend-verification`.
- Errors on sign-in are surfaced via `UnauthorizedError` messages: "No account found for this email" vs "Invalid email or password". No 500s on happy path.
- Unit + integration tests cover: sign-up sends emails, forgot returns 200 for unknown emails, reset with expired token fails, verify sets timestamp.

**References:**
- Context §5, §8, §11, §12
- `app/src/api/auth/AuthService.ts:1-83`
- `app/src/api/auth/AuthRouterFactory.ts`
- `app/src/repositories/` (add repositories for new token models)

### Plan
- Add repositories: `EmailVerificationTokenRepository`, `PasswordResetTokenRepository`. Each exposes `create(userId, tokenHash, expiresAt)`, `findByHash(hash)`, `markUsed(id)`, `invalidateAllForUser(userId)`.
- Add `TokenHasher` service (SHA-256 wrapper over `node:crypto.createHash`).
- Extend `AuthService`:
    - Snippet:
      ```ts
      async signUp(input: SignUpRequest): Promise<AuthSession> {
        // …existing user + team creation…
        const { plaintext, hash, expiresAt } = this.issueTokenPair(EMAIL_VERIFICATION_TTL_HOURS * 3600);
        await this.emailVerificationRepo.create(user.id, hash, expiresAt);
        await this.emailService.sendWelcome({ displayName: user.displayName, profileUrl: this.appUrl });
        await this.emailService.sendVerification({
          displayName: user.displayName,
          verifyUrl: `${this.appUrl}/verify-email?token=${plaintext}`,
        }).catch((e) => this.logger.warn({ err: e }, 'auth.verification_email.send_failed'));
        return this.issueSession(user);
      }

      async forgotPassword({ email }: ForgotPasswordRequest): Promise<void> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) return; // never leak
        await this.passwordResetRepo.invalidateAllForUser(user.id);
        const { plaintext, hash, expiresAt } = this.issueTokenPair(PASSWORD_RESET_TTL_MINUTES * 60);
        await this.passwordResetRepo.create(user.id, hash, expiresAt);
        await this.emailService.sendPasswordReset({
          displayName: user.displayName,
          resetUrl: `${this.appUrl}/reset-password?token=${encodeURIComponent(plaintext)}`,
          expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
        });
      }
      ```
- Sign-in error refinement (keep behaviour safe):
    - Snippet:
      ```ts
      const user = await this.userRepository.findByEmail(input.email);
      if (!user) throw new UnauthorizedError('No account found for this email');
      const ok = await this.passwordHashService.verify(user.passwordHash, input.password);
      if (!ok) throw new UnauthorizedError('Invalid email or password');
      ```
- Wire routes + validators. Delegates parse via `parseRequestBody(schema)`.
- Add integration tests hitting the new endpoints with a stubbed `EmailService`.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 9 - Frontend auth cutover: API-mode default + password rules + verify/forgot/reset pages

### Metadata
**Status:** Complete
**Prereqs:** 6, 8
**Size:** medium
**Owner:** codex
**Completed At:** 2026-07-19
**Completion Notes:**
- Defaulted the client data source to API mode with a local API base URL fallback while preserving explicit mock static previews.
- Added forgot-password, query-token reset-password, and verify-email pages wired to `fad-common` auth contracts and `client/lib/api.ts` helpers.
- Added a common-backed password strength meter for sign-up/reset and removed the fake sign-in short-circuit; mock sign-in now requires a prior mock account.
- Propagated `mustVerifyEmail` into client session state, dashboard messaging, and the publish guard.
- Ran frontend/e2e/doc alignment review, focused auth checks, mock static export, and full repo CI.

### Context

**Objective:** Make API mode the local-dev default, enforce password rules + email format on the client, remove the "any credentials sign in" bug, and add verify/forgot/reset UI.
**Done When:**
- `client/.env.example` sets `NEXT_PUBLIC_DATA_SOURCE=api` and `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`.
- `SignInForm.tsx` no longer short-circuits in non-api mode; both modes call `signIn({ email, password })` and surface friendly errors.
- `SignUpForm.tsx` validates password strength client-side (using `strongPasswordSchema.safeParse`) before submitting; renders a strength meter that ticks off "10+ characters" / "Letter" / "Number".
- Sign-in error mapping renders "No account found" vs "Invalid password" vs "Please verify your email first (resend)".
- New pages: `client/app/(marketing)/forgot-password/page.tsx`, `client/app/(marketing)/reset-password/page.tsx`, `client/app/(marketing)/verify-email/page.tsx`.
- New `client/lib/api.ts` helpers: `forgotPassword`, `resetPassword`, `verifyEmail`, `resendVerification`.
- Sign-in surfaces a "Forgot password?" link.

**References:**
- Context §1, §5, §7
- `client/lib/session.ts:97-115`
- `client/app/(marketing)/sign-in/SignInForm.tsx`
- `client/app/(marketing)/sign-up/SignUpForm.tsx`
- `client/lib/api.ts:236-241`
- `client/.env.example` (create if missing)

### Plan
- Add missing env keys in `client/.env.example`:
    - Snippet:
      ```env
      NEXT_PUBLIC_DATA_SOURCE=api
      NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
      ```
- Delete the fake-login short-circuit in `SignInForm.tsx`; call `signIn` unconditionally.
- Update `session.ts` `signIn` mock branch to require a matching entry (either delete the mock branch entirely for sign-in, or gate it behind a `NEXT_PUBLIC_MOCK_ACCOUNTS` env — simpler to require API mode and let mock users be a build-time thing only). For this task: keep mock mode for pure-static preview, but flip the default and force real auth locally.
- Add `client/lib/api.ts` helpers:
    - Snippet:
      ```ts
      export function forgotPassword(body: ForgotPasswordRequest) {
        return apiRequest('/v1/auth/forgot-password', z.object({ ok: z.literal(true) }), {
          method: 'POST', body,
        });
      }
      export function resetPassword(body: ResetPasswordRequest) { /* ... */ }
      export function verifyEmail(body: VerifyEmailRequest) { /* ... */ }
      export function resendVerification(body: ResendVerificationRequest) { /* ... */ }
      ```
- Add a shared `PasswordStrengthMeter` presentational component and use it in `SignUpForm.tsx` + the reset form.
- Build the three new pages, each server-rendered where possible, with a client `Form` island.
- Wire "Forgot password?" as a link under the password field in `SignInForm.tsx`.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$e2e-review` (`/e2e-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 10 - Manage editor UX: save + view-public + three-dot menu + drag reorder + confirm delete

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** codex
**Completed At:** 2026-07-19
**Completion Notes:**
- Added `@dnd-kit/core` and `@dnd-kit/sortable` plus a shared `SortableList` primitive for mouse, touch, and keyboard reorder.
- Added a native-dialog `ConfirmDialog` primitive and routed highlight, race, and roadmap deletes through confirmation.
- Replaced inline up/down/trash controls with drag handles plus three-dot row menus containing move-up, move-down, and delete actions.
- Added the manage editor footer action band with a second API-mode Save button, status text, and a new-tab public profile link; mock mode keeps autosave copy.
- Ran frontend review, focused client type-check/lint, mock static export, and full repo CI.

### Context

**Objective:** Add a clear Save button + View-public CTA in the footer, replace the numbered up/down + trash controls with a three-dot menu (drag-to-reorder + confirm-delete) across highlights, races, and roadmap.
**Done When:**
- `ManageProfile.tsx` renders a Save button in both header and footer regions (in api mode) and keeps mock-mode autosave copy consistent.
- Footer includes a prominent "View public page →" link that opens the athlete's profile in a new tab.
- Highlights, Races, and Roadmap items expose a three-dot menu (`Icon name="more"` — add if missing) with "Delete" opening a confirm dialog; each item is a `@dnd-kit` sortable row with a drag handle.
- Deleting requires confirmation via a new `client/components/ui/ConfirmDialog.tsx` primitive; dismissing does nothing.
- Reorder works by touch and mouse; keyboard-accessible move-up/move-down items appear in the menu as a fallback.
- `client/package.json` adds `@dnd-kit/core` + `@dnd-kit/sortable`.

**References:**
- Context §1, §5, §7, §14
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx:517-661`
- `client/components/ui/` (new primitives)

### Plan
- Add `@dnd-kit/core` and `@dnd-kit/sortable` to `client/package.json`; run `npm install --prefix client` to refresh the lockfile.
- Add `client/components/ui/ConfirmDialog.tsx` using the native `<dialog>` element (`showModal()` + `close`) for a11y + focus trap.
- Add `client/components/ui/SortableList.tsx` — a generic wrapper around `DndContext` + `SortableContext` that yields `<SortableItem>` with a drag handle prop.
- Refactor Highlights/Races/Roadmap `<ul>` blocks in `ManageProfile.tsx` to render `SortableList`, replacing the `ReorderControls` + `RemoveButton` render.
    - Snippet:
      ```tsx
      <SortableList items={highlights} onReorder={setHighlights} keyOf={(h) => h.id}>
        {(item, index) => (
          <div className="rounded-input border …">
            {/* existing row content */}
            <ItemMenu
              onDelete={() => askConfirm({
                title: 'Delete this highlight?',
                body: `"${item.title}" will be removed from your public profile.`,
                confirmLabel: 'Delete',
                onConfirm: () => setHighlights((prev) => prev.filter((h) => h.id !== item.id)),
              })}
              onMoveUp={index > 0 ? () => setHighlights((prev) => moveItem(prev, index, -1)) : undefined}
              onMoveDown={index < highlights.length - 1 ? () => setHighlights((prev) => moveItem(prev, index, 1)) : undefined}
            />
          </div>
        )}
      </SortableList>
      ```
- Update the `EditorLayout` footer:
    - Snippet:
      ```tsx
      <footer className="mt-10 space-y-4 border-t border-outline-variant pt-8 text-center">
        {headerActions /* Save button reused here */}
        <a href={publicHref} target="_blank" rel="noreferrer" className="…">
          View your public page →
        </a>
        {statusLine}
      </footer>
      ```
- Ensure api-mode Save button remains present in header **and** footer (share the render via a `save` render-prop or a `saveButton` node).

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
