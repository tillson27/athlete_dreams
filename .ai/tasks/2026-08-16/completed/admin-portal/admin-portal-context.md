# Admin Portal

Date: 2026-08-16
Task slug: admin-portal
Status: Draft

## 0) Summary

- **Objective:** Build a fully functional admin portal that lets platform admins manage users, athletes, campaigns, donations, and the signup allowlist, with an analytics overview.
- **Why now:** FAD is onboarding its first athletes and needs operational visibility and control before scale makes manual intervention impractical.
- **Primary outcomes:**
  - Admins can access a password-protected dashboard by signing in with an ADMIN-role account.
  - Admins can view, search, and manage users and their platform roles.
  - Admins can moderate athlete profiles (publish/unpublish) and override campaign statuses.
  - Admins can manage the signup allowlist from the UI rather than editing environment variables.
  - Admins can view platform analytics (signups, donations, conversion funnel) with trend charts.

---

## 1) Success criteria

- An admin user who signs in sees an "Admin Dashboard" option in the site navigation.
- Navigating to `/admin` redirects non-admins to `/sign-in`; admins see the analytics overview.
- `GET /v1/admin/users` returns a paginated list of all users with role and profile metadata.
- Admin can assign/revoke the ADMIN, ATHLETE, SUPPORTER, and BRAND roles from the user detail page.
- Admin can publish or unpublish any athlete profile.
- Admin can override any campaign's status.
- Admin can add and delete allowlist entries from the portal; the changes take effect on the next sign-up attempt.
- The analytics page shows total users, published athletes, active campaigns, total raised, signups over time, and donations over time.

**Acceptance criteria (definition of done):**
- All 13 admin API endpoints respond correctly to admin-authed requests.
- All non-admin or unauthenticated requests to `/v1/admin/*` receive 401 or 403.
- All client admin pages load without TypeScript errors.
- `npm run ci` passes (type-check, lint, build).
- `$e2e-review` passes without critical findings.

---

## 2) Scope and non-goals

**In scope:**
- `isAdmin: boolean` field added to `authSessionSchema` (common) and surfaced in the session hint.
- Backend `AdminAuthorizationMiddleware` that verifies JWT + checks `PlatformRole.ADMIN` in DB.
- Backend admin API at `/v1/admin/*` covering users, athletes, campaigns, donations, analytics, and allowlist.
- DB-backed `SignupAllowlistEntry` model alongside the existing env-var allowlist (union approach).
- Client admin route group at `client/app/admin/` with sidebar layout and role guard.
- Analytics dashboard with metric cards and CSS-based trend bars (no charting library).
- Conditional "Admin" link in the site navigation for admin users.

**Out of scope:**
- Admin audit log (tracking which admin performed which action).
- Admin-initiated password reset on behalf of a user.
- Impersonating users from the admin portal.
- Brand / sponsorship management from the admin portal.
- Ambassador application review from the admin portal.
- Email/notification triggers from the admin portal.
- Two-factor authentication for admin accounts.

**Out-of-scope edge cases:**
- Revoking one's own ADMIN role — the portal will allow it (no self-guard), as this is an edge case for a small admin team.
- Soft-deleted user accounts — admin user list excludes soft-deleted users; deletion adds a `deletedAt` timestamp only.

---

## 3) Background and motivation

FAD's three pillars (crowdfunding, sponsorships, ambassador programs) all require operational oversight. Today there is no admin tooling: viewing users requires direct DB access, and the signup allowlist can only be changed by editing an environment variable and redeploying. The admin portal closes this gap for the initial go-to-market phase.

The `PlatformRole.ADMIN` enum value already exists in `app/prisma/schema.prisma` and `common/src/types/roles.ts` but is not enforced anywhere. This task activates it.

---

## 4) Current state and gaps

### Current state
- `PlatformRole.ADMIN` defined in `app/prisma/schema.prisma` (line 94–99) and `common/src/types/roles.ts` (line 10–17).
- `PlatformRoleAssignment` model exists with `{ userId, role }` unique constraint.
- `PlatformRoleRepository` (`app/src/repositories/PlatformRoleRepository.ts`) has only `assignRole(userId, role)` — no lookup method.
- `AuthenticationMiddleware` (`app/src/middleware/AuthenticationMiddleware.ts`) validates JWT and populates `req.authenticatedUserId` but does not check roles.
- `authSessionSchema` (`common/src/zod/auth.ts`) has `{ user, accessToken, accessTokenExpiresAt, mustVerifyEmail }` — no `isAdmin` hint.
- `Session` type in `client/lib/session.ts` has `{ name, email, published, mustVerifyEmail }` — no `isAdmin`.
- `SignupAllowlistService` reads only from `SIGNUP_EMAIL_ALLOWLIST` env var; no DB table exists for allowlist entries.
- No admin routes, controllers, services, or client pages exist.

### Gaps
- No DB lookup for role-based access control.
- No admin middleware to gate `/v1/admin/*` routes.
- No `isAdmin` hint in the auth session flow.
- No admin API layer.
- No DB-backed allowlist storage.
- No admin client routes or layout.

---

## 5) Changes and considerations

**Significant changes:**
- `authSessionSchema` gains `isAdmin: boolean` — a **breaking** change for any consumer that does strict schema validation. Both `app/` and `client/` consume this schema; both must be updated in the same task.
- `SignupAllowlistService` behaviour changes: DB entries are unioned with env-var entries. Existing env-var allowlist still works; no migration of existing entries is needed.
- New Prisma model `SignupAllowlistEntry` requires a migration. The AI creates a draft migration; the user must apply it (`npx prisma migrate dev` or equivalent).

**Impact and considerations:**
- The `client/app/admin/` route group uses a separate layout (sidebar) from `client/app/(marketing)/layout.tsx`, so the marketing header/footer are not shown on admin pages.
- Session hint `isAdmin` is written to `arc-auth` browserStore on sign-in. A user who is later granted ADMIN must sign out and back in to see the admin nav link. This is acceptable for the initial implementation.
- All admin routes require both JWT auth and ADMIN role DB check — two round-trips for auth on each admin request. Given expected low admin traffic, this is acceptable.

---

## 6) Constraints, assumptions, dependencies

**Constraints:**
- AI must not run Prisma migrations (`migrate dev`, `migrate deploy`). A draft migration file is created; the user applies it.
- No new charting library — trend charts use CSS proportional bars (Tailwind utility classes).
- Server Components by default in Next.js; mark `'use client'` only where interactivity requires it.
- All API types must come from `fad-common`; no duplicate type definitions in `app/` or `client/`.

**Assumptions:**
- At least one user in the DB will be manually assigned `PlatformRole.ADMIN` (e.g., via a seed or direct DB insert) before the portal is useful. No "bootstrap first admin" flow is in scope.
- The Prisma migration for `signup_allowlist_entries` will be applied by the user before the allowlist API is tested in a running environment.
- Analytics queries on 30-day windows with small datasets (<10,000 rows) do not require query optimisation.

**Dependencies (ordered):**
1. `common/` schemas must be built before `app/` or `client/` can consume them.
2. `AdminAuthorizationMiddleware` must exist before any admin route can be registered.
3. `AdminRouterFactory` must be registered in `app/src/app.ts` before the admin API is reachable.
4. `client/lib/session.ts` and `client/lib/api.ts` must be updated before any admin client page can compile.
5. The `client/app/admin/layout.tsx` admin guard and layout must exist before any admin sub-page can be created.

---

## 7) Requirements

**Functional requirements:**
- `GET /v1/admin/users` — paginated list of users with roles and athlete profile presence. Supports `search` (email/name prefix), `role` filter, `limit`, `cursor`.
- `GET /v1/admin/users/:userId` — full user detail including roles, athlete slug, and published status.
- `PATCH /v1/admin/users/:userId/roles` — replace the user's platform role assignments (accepts full desired role set).
- `DELETE /v1/admin/users/:userId` — soft-delete the user (sets `deletedAt`).
- `GET /v1/admin/athletes` — paginated athlete profiles (all, including unpublished). Supports `published` boolean filter, `sport` filter.
- `POST /v1/admin/athletes/:athleteId/publish` — publish or unpublish an athlete profile (body: `{ publish: boolean }`).
- `GET /v1/admin/campaigns` — paginated campaigns across all athletes. Supports `status` and `athleteId` filters.
- `PATCH /v1/admin/campaigns/:campaignId/status` — override campaign status (body: `{ campaignStatus: CampaignStatus }`).
- `GET /v1/admin/donations` — paginated donation log with campaign and athlete context. Supports `status` and `athleteId` filters.
- `GET /v1/admin/analytics` — aggregate platform stats + 30-day daily trend arrays.
- `GET /v1/admin/allowlist` — full list of allowlist entries (DB + env-var) with `isEnforced` flag.
- `POST /v1/admin/allowlist` — add a DB-backed allowlist entry (email or `@domain`).
- `DELETE /v1/admin/allowlist/:entryId` — remove a DB-backed allowlist entry. Env-var entries cannot be deleted via API.

**Non-functional requirements:**
- All admin endpoints return 401 if JWT is missing/invalid, 403 if the user lacks ADMIN role.
- Admin user list query must handle up to 10,000 users without timeout (keyset pagination, no full-table scan).
- Admin portal pages must render in under 2 seconds on localhost.
- No secrets (tokens, password hashes) logged or returned in API responses.

---

## 8) Proposed approach

- **Common-first:** Add `isAdmin` to `authSessionSchema` and create `admin.ts` Zod schema file in `common/` before touching `app/` or `client/`.
- **Backend middleware composition:** `AdminRouterFactory` applies `authMiddleware.required` then `adminAuthMiddleware.required` to every route. The admin middleware reads `req.authenticatedUserId` (set by auth middleware) and does a targeted `PlatformRoleAssignment` lookup.
- **Single AdminService + AdminController:** One service class for all admin operations, one controller. This keeps the feature cohesive and avoids premature splitting. File length is acceptable given the scope.
- **Keyset pagination:** Reuse `encodeKeysetCursor` / `decodeKeysetCursor` from `app/src/shared/keysetCursor.ts` for all admin list endpoints.
- **Analytics via raw SQL:** `AdminService.getAnalytics()` uses `prisma.$queryRaw` for daily bucketing (`DATE_TRUNC('day', created_at)`) where Prisma's ORM groupBy can't express date truncation.
- **Hybrid allowlist:** `SignupAllowlistService.isAllowed()` checks DB entries first, then falls back to env-var entries. The API returns both with a `source: 'db' | 'env'` discriminator.
- **Client admin layout as a standalone route group:** `client/app/admin/layout.tsx` renders a full-page sidebar layout (no marketing chrome). Admin guard inside the layout: if session is not ready or `!session.isAdmin`, redirect to `/sign-in`.
- **isAdmin in nav:** The site header's nav reads `session.isAdmin` from `useSession()` to conditionally show the "Admin" link. This requires the nav component to be a client component (it likely already is).

---

## 9) Data model and contracts

### Data model changes

New Prisma model added to `app/prisma/schema.prisma`:

```prisma
model SignupAllowlistEntry {
  id        String   @id @default(uuid()) @db.Uuid
  entry     String   @unique
  createdAt DateTime @default(now())

  @@map("signup_allowlist_entries")
}
```

### OpenAPI changes

New endpoint group at base path `/v1/admin`:

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/v1/admin/users` | query: `AdminUserListQuery` | `AdminUserListResponse` |
| GET | `/v1/admin/users/:userId` | params: `{ userId }` | `AdminUserDetail` |
| PATCH | `/v1/admin/users/:userId/roles` | body: `AdminUpdateUserRolesRequest` | `AdminUserDetail` |
| DELETE | `/v1/admin/users/:userId` | params: `{ userId }` | `AuthActionResponse` |
| GET | `/v1/admin/athletes` | query: `AdminAthleteListQuery` | `AdminAthleteListResponse` |
| POST | `/v1/admin/athletes/:athleteId/publish` | params + body: `AdminAthletePublishRequest` | `AuthActionResponse` |
| GET | `/v1/admin/campaigns` | query: `AdminCampaignListQuery` | `AdminCampaignListResponse` |
| PATCH | `/v1/admin/campaigns/:campaignId/status` | body: `AdminUpdateCampaignStatusRequest` | `AuthActionResponse` |
| GET | `/v1/admin/donations` | query: `AdminDonationListQuery` | `AdminDonationListResponse` |
| GET | `/v1/admin/analytics` | — | `AdminAnalyticsResponse` |
| GET | `/v1/admin/allowlist` | — | `AdminAllowlistResponse` |
| POST | `/v1/admin/allowlist` | body: `AdminAddAllowlistEntryRequest` | `AdminAllowlistEntry` |
| DELETE | `/v1/admin/allowlist/:entryId` | params: `{ entryId }` | `AuthActionResponse` |

`authSessionSchema` gains `isAdmin: boolean` (added alongside existing fields).

### Example shapes

```json
// AdminUserListResponse
{
  "items": [
    {
      "userId": "uuid",
      "email": "user@example.com",
      "displayName": "Jane Doe",
      "avatarUrl": null,
      "emailVerifiedAt": "2026-01-01T00:00:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "roles": ["ATHLETE"],
      "hasAthleteProfile": true
    }
  ],
  "nextCursor": "base64cursor"
}

// AdminAnalyticsResponse
{
  "totalUsers": 142,
  "totalAthletes": 38,
  "publishedAthletes": 22,
  "activeCampaigns": 11,
  "totalRaisedCents": 487500,
  "totalSucceededDonations": 103,
  "signupsLast30Days": 17,
  "athletesLast30Days": 6,
  "userSignupsByDay": [{ "date": "2026-07-17", "count": 3 }],
  "donationsByDay": [{ "date": "2026-07-17", "count": 2, "amountCents": 5000 }]
}

// AdminAllowlistResponse
{
  "entries": [
    { "id": "uuid", "entry": "@strava.com", "source": "db", "createdAt": "2026-08-01T00:00:00.000Z" },
    { "id": "env-0", "entry": "founder@fad.run", "source": "env", "createdAt": null }
  ],
  "isEnforced": true
}
```

---

## 10) Package-level impact

### common/
- `common/src/zod/auth.ts` — add `isAdmin: boolean` to `authSessionSchema`.
- `common/src/zod/admin.ts` — new file with all admin schemas.
- `common/src/index.ts` — add `export * from './zod/admin'`.
- Rebuild required: `npm run build --prefix common`.

### app/
- `app/src/repositories/PlatformRoleRepository.ts` — add `hasRole(userId, role): Promise<boolean>`.
- `app/src/middleware/AdminAuthorizationMiddleware.ts` — new file.
- `app/src/api/auth/AuthService.ts` — include `isAdmin` in `signIn()` and `signUp()` return values.
- `app/src/api/admin/AdminService.ts` — new file (all admin business logic).
- `app/src/api/admin/AdminController.ts` — new file.
- `app/src/api/admin/AdminRouterFactory.ts` — new file.
- `app/src/app.ts` — register `AdminRouterFactory`.
- `app/prisma/schema.prisma` — add `SignupAllowlistEntry` model.
- Draft migration file created via `npm run migrate:create`.
- `app/src/repositories/SignupAllowlistRepository.ts` — new file.
- `app/src/services/infrastructure/SignupAllowlistService.ts` — update `isAllowed()` to union DB entries.

### client/
- `client/lib/session.ts` — add `isAdmin` to `Session`, `AuthRecord`, `authRecordToSession`, `signIn`, `signUp`.
- `client/lib/api.ts` — add all admin API helper functions.
- `client/app/admin/layout.tsx` — new admin layout with role guard and sidebar nav.
- `client/app/admin/page.tsx` — analytics overview.
- `client/app/admin/users/page.tsx` — user list.
- `client/app/admin/users/[userId]/page.tsx` — user detail.
- `client/app/admin/athletes/page.tsx` — athlete moderation.
- `client/app/admin/campaigns/page.tsx` — campaign moderation.
- `client/app/admin/donations/page.tsx` — donation log.
- `client/app/admin/allowlist/page.tsx` — allowlist management.
- Site header/nav — add conditional "Admin" link (update existing nav component).

---

## 11) Edge cases and error handling

- **Non-admin user hits `/v1/admin/*`:** `AdminAuthorizationMiddleware` throws `ForbiddenError` → 403.
- **Unauthenticated request to `/v1/admin/*`:** `AuthenticationMiddleware.required` throws `UnauthorizedError` → 401.
- **Delete own admin role:** Allowed; next admin request returns 403. User must sign in again as a regular user.
- **User not found on `GET /v1/admin/users/:userId`:** `AdminService` throws `NotFoundError` → 404.
- **Athlete publish when profile is incomplete:** The admin force-publish bypasses the standard publish completeness checks. This is intentional — admins have override authority.
- **Allowlist entry already exists on `POST /v1/admin/allowlist`:** `SignupAllowlistRepository.create` unique constraint violation → `ConflictError` → 409.
- **Deleting env-var-sourced allowlist entry:** The API returns 404 (no DB record for that "id"). Env entries are not deletable.
- **Analytics with zero data:** All counts default to 0; trend arrays are empty arrays.
- **Client admin page before session resolves:** AdminGuard renders a loading skeleton until `ready === true`; redirects on `ready && !session?.isAdmin`.

---

## 12) Failure modes and concurrency

**Concurrency/race conditions:**
- `PATCH /v1/admin/users/:userId/roles` replaces the full role set in a single `$transaction` (delete all existing + create new). No partial-update race condition.
- `POST /v1/admin/allowlist` uses Prisma's `create` with unique constraint; duplicate concurrent inserts surface as `ConflictError`.

**Idempotency and retries:**
- `POST /v1/admin/athletes/:athleteId/publish` with `{ publish: true }` on an already-published athlete is idempotent (sets `publishedAt = now()` if null, no-op if already set — or always sets to now; either is acceptable).
- `PATCH /v1/admin/campaigns/:campaignId/status` is idempotent (setting to the current status is a no-op write).

**Failure modes:**
- DB unavailable during admin role check: `AdminAuthorizationMiddleware` propagates the Prisma error, which surfaces as 503 via the global error handler. No silent allow.
- Analytics `$queryRaw` fails: Service throws, global handler returns 500. Analytics page shows an error state.

---

## 13) Operational readiness

**Observability:**
- PostHog events to capture in `AdminController`: `admin_user_role_updated`, `admin_athlete_published`, `admin_campaign_status_changed`, `admin_allowlist_entry_added`, `admin_allowlist_entry_deleted`. Use `req.authenticatedUserId` as the `distinctId`.
- Logger (pino) `info` calls on each mutating admin action with the `adminUserId` and `targetId`.

---

## 15) Open questions

- **Bootstrap first admin:** How will the initial ADMIN role assignment happen? (Direct DB insert or seed script.) Out of scope for this task but must be done before the portal is usable.
