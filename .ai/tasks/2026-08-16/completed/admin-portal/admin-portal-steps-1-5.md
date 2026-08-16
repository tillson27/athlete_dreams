# Admin Portal - Steps 1–5

## Step 1 - Common schemas — admin Zod contracts + `isAdmin` on AuthSession

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** small
**Owner:** ai
**Completed At:** 2026-08-16 10:07 MDT
**Completion Notes:** Added shared admin Zod contracts, exported them from `fad-common`, and added `isAdmin` to `AuthSession`. `npm run build --prefix common` passed. Full `npm run ci` initially exposed Step 2's required backend session update, then passed after Step 2 was completed.

### Context

**Objective:** Establish all shared admin API contracts in `common/` so that `app/` and `client/` can import them from `fad-common`. Also add `isAdmin: boolean` to `authSessionSchema` so the sign-in response can carry the admin hint.

**Done When:**
- `common/src/zod/admin.ts` exists and exports all admin schemas listed below.
- `authSessionSchema` in `common/src/zod/auth.ts` includes `isAdmin: z.boolean()`.
- `common/src/index.ts` exports `./zod/admin`.
- `npm run build --prefix common` succeeds with no TypeScript errors.

**References:**
- Context §9 — Data model and contracts (full list of schemas and example shapes)
- `common/src/zod/auth.ts` — `authSessionSchema` to extend
- `common/src/zod/shared.ts` — `idSchema`, `isoDateTimeSchema`, `paginationResponseSchema`, `moneyCentsSchema`
- `common/src/types/enums.ts` — `CampaignStatus`, `CampaignType`, `DonationStatus`, `SportCategory`
- `common/src/types/roles.ts` — `PlatformRole`
- `common/src/index.ts` — barrel export to update
- `common/AGENTS.md` — strict() for request bodies, ISO-8601 strings, integer cents

### Plan

- **Create `common/src/zod/admin.ts`** — new file with all admin schemas.
    - Snippet:
      ```ts
      import { z } from 'zod';
      import { idSchema, isoDateTimeSchema, moneyCentsSchema, paginationResponseSchema } from './shared';
      import { CampaignStatus, CampaignType, DonationStatus, SportCategory } from '../types/enums';
      import { PlatformRole } from '../types/roles';

      // ── User list ──────────────────────────────────────────────────────────────

      export const adminUserSummarySchema = z.object({
        userId: idSchema,
        email: z.string().email(),
        displayName: z.string(),
        avatarUrl: z.string().url().nullable(),
        emailVerifiedAt: isoDateTimeSchema.nullable(),
        createdAt: isoDateTimeSchema,
        roles: z.array(z.nativeEnum(PlatformRole)),
        hasAthleteProfile: z.boolean(),
      });
      export type AdminUserSummary = z.infer<typeof adminUserSummarySchema>;

      export const adminUserListQuerySchema = z.object({
        search: z.string().optional(),
        role: z.nativeEnum(PlatformRole).optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        cursor: z.string().optional(),
      });
      export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

      export const adminUserListResponseSchema = paginationResponseSchema(adminUserSummarySchema);
      export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;

      // ── User detail ────────────────────────────────────────────────────────────

      export const adminUserDetailSchema = adminUserSummarySchema.extend({
        updatedAt: isoDateTimeSchema,
        athleteSlug: z.string().nullable(),
        publishedAt: isoDateTimeSchema.nullable(),
      });
      export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;

      export const adminUpdateUserRolesRequestSchema = z.object({
        roles: z.array(z.nativeEnum(PlatformRole)),
      }).strict();
      export type AdminUpdateUserRolesRequest = z.infer<typeof adminUpdateUserRolesRequestSchema>;

      // ── Athletes ───────────────────────────────────────────────────────────────

      export const adminAthleteItemSchema = z.object({
        athleteId: idSchema,
        userId: idSchema,
        athleteSlug: z.string(),
        fullName: z.string(),
        primarySport: z.nativeEnum(SportCategory),
        publishedAt: isoDateTimeSchema.nullable(),
        createdAt: isoDateTimeSchema,
        stripeChargesEnabledAt: isoDateTimeSchema.nullable(),
      });
      export type AdminAthleteItem = z.infer<typeof adminAthleteItemSchema>;

      export const adminAthleteListQuerySchema = z.object({
        published: z.enum(['true', 'false']).optional(),
        sport: z.nativeEnum(SportCategory).optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        cursor: z.string().optional(),
      });
      export type AdminAthleteListQuery = z.infer<typeof adminAthleteListQuerySchema>;

      export const adminAthleteListResponseSchema = paginationResponseSchema(adminAthleteItemSchema);
      export type AdminAthleteListResponse = z.infer<typeof adminAthleteListResponseSchema>;

      export const adminAthletePublishRequestSchema = z.object({
        publish: z.boolean(),
      }).strict();
      export type AdminAthletePublishRequest = z.infer<typeof adminAthletePublishRequestSchema>;

      // ── Campaigns ──────────────────────────────────────────────────────────────

      export const adminCampaignItemSchema = z.object({
        campaignId: idSchema,
        campaignSlug: z.string(),
        campaignTitle: z.string(),
        campaignType: z.nativeEnum(CampaignType),
        campaignStatus: z.nativeEnum(CampaignStatus),
        targetAmountCents: moneyCentsSchema,
        raisedAmountCents: moneyCentsSchema,
        athleteId: idSchema,
        athleteSlug: z.string(),
        athleteFullName: z.string(),
        createdAt: isoDateTimeSchema,
      });
      export type AdminCampaignItem = z.infer<typeof adminCampaignItemSchema>;

      export const adminCampaignListQuerySchema = z.object({
        status: z.nativeEnum(CampaignStatus).optional(),
        athleteId: idSchema.optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        cursor: z.string().optional(),
      });
      export type AdminCampaignListQuery = z.infer<typeof adminCampaignListQuerySchema>;

      export const adminCampaignListResponseSchema = paginationResponseSchema(adminCampaignItemSchema);
      export type AdminCampaignListResponse = z.infer<typeof adminCampaignListResponseSchema>;

      export const adminUpdateCampaignStatusRequestSchema = z.object({
        campaignStatus: z.nativeEnum(CampaignStatus),
      }).strict();
      export type AdminUpdateCampaignStatusRequest = z.infer<typeof adminUpdateCampaignStatusRequestSchema>;

      // ── Donations ──────────────────────────────────────────────────────────────

      export const adminDonationItemSchema = z.object({
        donationId: idSchema,
        campaignId: idSchema,
        campaignTitle: z.string(),
        athleteFullName: z.string(),
        supporterDisplayName: z.string(),
        supporterEmail: z.string().nullable(),
        donationAmountCents: moneyCentsSchema,
        donationStatus: z.nativeEnum(DonationStatus),
        isAnonymous: z.boolean(),
        createdAt: isoDateTimeSchema,
      });
      export type AdminDonationItem = z.infer<typeof adminDonationItemSchema>;

      export const adminDonationListQuerySchema = z.object({
        status: z.nativeEnum(DonationStatus).optional(),
        athleteId: idSchema.optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        cursor: z.string().optional(),
      });
      export type AdminDonationListQuery = z.infer<typeof adminDonationListQuerySchema>;

      export const adminDonationListResponseSchema = paginationResponseSchema(adminDonationItemSchema);
      export type AdminDonationListResponse = z.infer<typeof adminDonationListResponseSchema>;

      // ── Analytics ──────────────────────────────────────────────────────────────

      export const adminDailyStatSchema = z.object({
        date: z.string(),
        count: z.number().int().nonnegative(),
      });

      export const adminDonationDailyStatSchema = adminDailyStatSchema.extend({
        amountCents: z.number().int().nonnegative(),
      });

      export const adminAnalyticsResponseSchema = z.object({
        totalUsers: z.number().int().nonnegative(),
        totalAthletes: z.number().int().nonnegative(),
        publishedAthletes: z.number().int().nonnegative(),
        activeCampaigns: z.number().int().nonnegative(),
        totalRaisedCents: z.number().int().nonnegative(),
        totalSucceededDonations: z.number().int().nonnegative(),
        signupsLast30Days: z.number().int().nonnegative(),
        athletesLast30Days: z.number().int().nonnegative(),
        userSignupsByDay: z.array(adminDailyStatSchema),
        donationsByDay: z.array(adminDonationDailyStatSchema),
      });
      export type AdminAnalyticsResponse = z.infer<typeof adminAnalyticsResponseSchema>;

      // ── Allowlist ──────────────────────────────────────────────────────────────

      export const adminAllowlistEntrySchema = z.object({
        id: z.string(),
        entry: z.string(),
        source: z.enum(['db', 'env']),
        createdAt: isoDateTimeSchema.nullable(),
      });
      export type AdminAllowlistEntry = z.infer<typeof adminAllowlistEntrySchema>;

      export const adminAllowlistResponseSchema = z.object({
        entries: z.array(adminAllowlistEntrySchema),
        isEnforced: z.boolean(),
      });
      export type AdminAllowlistResponse = z.infer<typeof adminAllowlistResponseSchema>;

      export const adminAddAllowlistEntryRequestSchema = z.object({
        entry: z.string().min(1).max(254),
      }).strict();
      export type AdminAddAllowlistEntryRequest = z.infer<typeof adminAddAllowlistEntryRequestSchema>;
      ```

- **Update `common/src/zod/auth.ts`** — add `isAdmin: z.boolean()` to `authSessionSchema`.
    - Snippet:
      ```ts
      export const authSessionSchema = z.object({
        user: userSchema,
        accessToken: z.string(),
        accessTokenExpiresAt: z.string().datetime(),
        mustVerifyEmail: z.boolean(),
        isAdmin: z.boolean(),   // ← add this line
      });
      ```

- **Update `common/src/index.ts`** — add `export * from './zod/admin'`.

- **Build common** — run `npm run build --prefix common` and confirm no errors.

### Step checklist
- [x] `common/src/zod/admin.ts` created and all schemas compile
- [x] `authSessionSchema` updated with `isAdmin: z.boolean()`
- [x] `common/src/index.ts` exports `./zod/admin`
- [x] `npm run build --prefix common` passes
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 2 - Backend — admin middleware + role infrastructure + `isAdmin` in sign-in

### Metadata
**Status:** Complete
**Prereqs:** 1
**Size:** small
**Owner:** ai
**Completed At:** 2026-08-16 10:07 MDT
**Completion Notes:** Added `PlatformRoleRepository.hasRole()`, created `AdminAuthorizationMiddleware`, and returned `isAdmin` from sign-up/sign-in sessions. `$backend-review` found and fixed constructor/test wiring and dedicated middleware requirements. Full `npm run ci` passed after rerunning outside the sandbox because `script:skills:sync` needs to update generated `.codex/skills/` files.

### Context

**Objective:** Wire up the ADMIN role check on the backend: extend `PlatformRoleRepository` with a targeted DB lookup, create `AdminAuthorizationMiddleware`, and update `AuthService.signIn`/`signUp` to include `isAdmin` in the returned `AuthSession`.

**Done When:**
- `PlatformRoleRepository.hasRole(userId, role)` method exists and returns `Promise<boolean>`.
- `AdminAuthorizationMiddleware` (at `app/src/middleware/AdminAuthorizationMiddleware.ts`) is injectable via tsyringe and has a `required` arrow method that throws `ForbiddenError` for non-admins.
- `AuthService.signIn()` and `signUp()` both include `isAdmin: boolean` in their returned `AuthSession` DTOs.
- `npm run build --prefix app` (or `npm run type-check`) passes.

**References:**
- Context §4 — Current state (PlatformRoleRepository, AuthenticationMiddleware)
- Context §8 — Proposed approach (admin middleware composition)
- `app/src/repositories/PlatformRoleRepository.ts` — extend with `hasRole`
- `app/src/middleware/AuthenticationMiddleware.ts` — pattern to follow for injectable middleware
- `app/src/api/auth/AuthService.ts` — `signIn()` and `signUp()` return values
- `app/src/shared/errors.ts` — `ForbiddenError`, `UnauthorizedError`
- `common/src/types/roles.ts` — `PlatformRole.Admin = 'ADMIN'`

### Plan

- **Extend `PlatformRoleRepository`** — add `hasRole(userId, role): Promise<boolean>`.
    - Snippet:
      ```ts
      async hasRole(userId: string, role: PlatformRole): Promise<boolean> {
        const assignment = await this.prisma.platformRoleAssignment.findUnique({
          where: { userId_role: { userId, role } },
        });
        return assignment !== null;
      }
      ```

- **Create `app/src/middleware/AdminAuthorizationMiddleware.ts`** — injectable middleware.
    - Snippet:
      ```ts
      import type { NextFunction, Request, Response } from 'express';
      import { injectable } from 'tsyringe';
      import { PlatformRole } from 'fad-common';
      import { PlatformRoleRepository } from '../repositories/PlatformRoleRepository';
      import { ForbiddenError, UnauthorizedError } from '../shared/errors';

      @injectable()
      export class AdminAuthorizationMiddleware {
        constructor(private readonly platformRoleRepository: PlatformRoleRepository) {}

        required = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
          try {
            if (!req.authenticatedUserId) throw new UnauthorizedError();
            const isAdmin = await this.platformRoleRepository.hasRole(
              req.authenticatedUserId,
              PlatformRole.Admin,
            );
            if (!isAdmin) throw new ForbiddenError('Admin access required');
            next();
          } catch (err) {
            next(err);
          }
        };
      }
      ```

- **Update `AuthService.signIn()`** — after verifying credentials, call `hasRole` and include result in the returned `AuthSession`.
    - Find where the method constructs and returns the DTO. Add:
      ```ts
      const isAdmin = await this.platformRoleRepository.hasRole(user.id, PlatformRole.Admin);
      return {
        user: toUserDto(user),
        accessToken,
        accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
        mustVerifyEmail: !user.emailVerifiedAt,
        isAdmin,
      };
      ```
    - Inject `PlatformRoleRepository` into `AuthService` constructor (it will be resolved automatically by tsyringe since it is `@injectable()`).

- **Update `AuthService.signUp()`** — same pattern. A newly registered user will never be ADMIN at sign-up, so `isAdmin` will always be `false` here, but the field must be present for schema correctness.

### Step checklist
- [x] `PlatformRoleRepository.hasRole()` implemented
- [x] `AdminAuthorizationMiddleware` created and injectable
- [x] `AuthService.signIn()` includes `isAdmin` in return value
- [x] `AuthService.signUp()` includes `isAdmin` in return value
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 3 - Backend admin API — users + analytics routes

### Metadata
**Status:** Complete
**Prereqs:** 2
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-16 10:10 MDT
**Completion Notes:** Added `AdminRouterFactory`, `AdminController`, `AdminService`, and `AdminRepository` for user management and analytics. Registered `/v1/admin` behind JWT auth plus admin role middleware. `$backend-review` kept Prisma access in `AdminRepository` to comply with `app/AGENTS.md`. Full `npm run ci` passed.

### Context

**Objective:** Create the admin API feature folder with `AdminService`, `AdminController`, and `AdminRouterFactory`. Implement user management routes and the analytics endpoint. Register the router in `app/src/app.ts`.

**Done When:**
- `app/src/api/admin/AdminService.ts` exists with `listUsers`, `getUserDetail`, `updateUserRoles`, `deleteUser`, and `getAnalytics` methods.
- `app/src/api/admin/AdminController.ts` exists with corresponding handler methods.
- `app/src/api/admin/AdminRouterFactory.ts` is registered at `/v1/admin` and applies `authMiddleware.required` + `adminAuthMiddleware.required` to all routes.
- `app/src/app.ts` resolves and mounts `AdminRouterFactory`.
- `GET /v1/admin/users`, `GET /v1/admin/users/:userId`, `PATCH /v1/admin/users/:userId/roles`, `DELETE /v1/admin/users/:userId`, `GET /v1/admin/analytics` respond correctly.

**References:**
- Context §7 — Functional requirements (all admin routes and their behaviour)
- Context §8 — Proposed approach (single AdminService + AdminController, keyset pagination, raw SQL analytics)
- Context §9 — Example shapes for `AdminUserListResponse` and `AdminAnalyticsResponse`
- `app/src/api/auth/AuthRouterFactory.ts` — router factory pattern
- `app/src/api/auth/AuthController.ts` — controller pattern
- `app/src/middleware/AdminAuthorizationMiddleware.ts` — Step 2 output
- `app/src/repositories/UserRepository.ts` — existing user queries
- `app/src/shared/keysetCursor.ts` — `encodeKeysetCursor` / `decodeKeysetCursor`
- `app/src/shared/requestParsers.ts` — `parseRequestQuery`, `parseRequestParams`, `parseRequestBody`
- `app/src/app.ts` — where to register the new router factory
- `common/src/zod/admin.ts` — Step 1 output (schema imports)

### Plan

- **Create `app/src/api/admin/AdminService.ts`** — inject `PrismaService` directly for complex joined queries. Methods: `listUsers`, `getUserDetail`, `updateUserRoles`, `deleteUser`, `getAnalytics`.
    - `listUsers(query)` — Prisma `findMany` on `users` with `include: { platformRoleAssignments: true, athleteProfile: { select: { id: true } } }`. Apply keyset pagination via `keysetCursor` on `(createdAt, id)`. Apply `where` filters for `search` (email/displayName contains, case-insensitive) and `role` (roles any).
    - `getUserDetail(userId)` — Prisma `findFirst` with full role + athlete profile include; throw `NotFoundError` if null.
    - `updateUserRoles(userId, roles)` — `$transaction`: delete all existing `PlatformRoleAssignment` for userId, then `createMany` the new set.
    - `deleteUser(userId)` — soft-delete: `prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } })`.
    - `getAnalytics()` — run parallel Prisma count queries + two `$queryRaw` calls for daily trends.
      ```ts
      // Daily signup trend (last 30 days):
      const rows = await this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('day', created_at) AS date, COUNT(*) AS count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
          AND deleted_at IS NULL
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      // Map: date.toISOString().slice(0, 10), Number(count)
      ```
      Same pattern for donations daily trend (`succeeded` only, sum `donation_amount_cents`).

- **Create `app/src/api/admin/AdminController.ts`** — thin handlers: parse, gate (userId guard), delegate to service, `ResponseHandler.success`.
    - `listUsers` — `parseRequestQuery(adminUserListQuerySchema, req)` → service → 200
    - `getUserDetail` — `parseRequestParams(z.object({ userId: idSchema }).strict(), req)` → service → 200
    - `updateUserRoles` — params + `parseRequestBody(adminUpdateUserRolesRequestSchema, req)` → service → 200
    - `deleteUser` — params → service → 200 `{ ok: true }`
    - `getAnalytics` — service → 200

- **Create `app/src/api/admin/AdminRouterFactory.ts`** — apply double middleware guard on all routes.
    - Snippet:
      ```ts
      build(): Router {
        const router = Router();
        const auth = this.authMiddleware.required;
        const adminAuth = this.adminAuthMiddleware.required;

        router.get('/users', auth, adminAuth, this.wrap(this.adminController.listUsers));
        router.get('/users/:userId', auth, adminAuth, this.wrap(this.adminController.getUserDetail));
        router.patch('/users/:userId/roles', auth, adminAuth, this.wrap(this.adminController.updateUserRoles));
        router.delete('/users/:userId', auth, adminAuth, this.wrap(this.adminController.deleteUser));
        router.get('/analytics', auth, adminAuth, this.wrap(this.adminController.getAnalytics));
        return router;
      }
      ```

- **Register in `app/src/app.ts`** — add `AdminRouterFactory` import and resolution alongside existing factories.

### Step checklist
- [x] `AdminService` created with `listUsers`, `getUserDetail`, `updateUserRoles`, `deleteUser`, `getAnalytics`
- [x] `AdminController` created with all corresponding handlers
- [x] `AdminRouterFactory` created with double-guard middleware on all routes
- [x] `AdminRouterFactory` registered in `app/src/app.ts`
- [x] All routes return correct status codes and response shapes
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 4 - Backend admin API — athletes + campaigns + donations routes

### Metadata
**Status:** Complete
**Prereqs:** 3
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-16 10:13 MDT
**Completion Notes:** Added admin athlete moderation, campaign status override, and donation log endpoints. Mutating admin actions log structured events and capture PostHog events. `$backend-review` passed with only formatting cleanups. Full `npm run ci` passed.

### Context

**Objective:** Extend `AdminService`, `AdminController`, and `AdminRouterFactory` with athlete moderation, campaign status override, and donation log endpoints.

**Done When:**
- `AdminService` has `listAthletes`, `publishAthlete`, `listCampaigns`, `updateCampaignStatus`, `listDonations` methods.
- `AdminController` has corresponding handlers.
- `AdminRouterFactory` registers the 5 new routes.
- `GET /v1/admin/athletes`, `POST /v1/admin/athletes/:athleteId/publish`, `GET /v1/admin/campaigns`, `PATCH /v1/admin/campaigns/:campaignId/status`, `GET /v1/admin/donations` respond correctly.

**References:**
- Context §7 — Functional requirements for athlete, campaign, donation routes
- Context §11 — Edge cases: admin force-publish bypasses completeness checks
- `app/src/api/admin/AdminService.ts` — Step 3 output (extend this file)
- `app/src/api/admin/AdminController.ts` — Step 3 output (extend this file)
- `app/src/api/admin/AdminRouterFactory.ts` — Step 3 output (extend this file)
- `app/src/repositories/AthleteRepository.ts` — existing athlete query patterns and Prisma include shapes
- `app/src/repositories/CampaignRepository.ts` — existing campaign patterns
- `app/src/repositories/DonationRepository.ts` — existing donation patterns
- `common/src/zod/admin.ts` — `adminAthleteListQuerySchema`, `adminCampaignListQuerySchema`, `adminDonationListQuerySchema`, `adminAthletePublishRequestSchema`, `adminUpdateCampaignStatusRequestSchema`

### Plan

- **Extend `AdminService`** with athlete, campaign, donation methods:
    - `listAthletes(query)` — `prisma.athleteProfile.findMany` with `include: { user: { select: { email: true } } }`. Filter: `published = 'true'` → `where: { publishedAt: { not: null } }`, `published = 'false'` → `where: { publishedAt: null }`. Keyset cursor on `(createdAt, id)`.
    - `publishAthlete(athleteId, publish)` — `prisma.athleteProfile.update({ where: { id: athleteId }, data: { publishedAt: publish ? new Date() : null } })`. Throw `NotFoundError` if athlete does not exist.
    - `listCampaigns(query)` — `prisma.campaign.findMany` with `include: { athlete: { select: { athleteSlug: true, fullName: true } } }`. Keyset cursor.
    - `updateCampaignStatus(campaignId, campaignStatus)` — `prisma.campaign.update`. Throw `NotFoundError` if not found.
    - `listDonations(query)` — `prisma.donation.findMany` with `include: { campaign: { select: { campaignTitle: true, athlete: { select: { fullName: true } } } } }`. Filter by status and/or athleteId. Keyset cursor on `(createdAt, id)`.

- **Extend `AdminController`** — add handlers for each new service method, following the same parse → delegate → `ResponseHandler.success` pattern from Step 3.

- **Extend `AdminRouterFactory`** — add 5 new routes with the `auth, adminAuth` guard pair.
    ```ts
    router.get('/athletes', auth, adminAuth, this.wrap(this.adminController.listAthletes));
    router.post('/athletes/:athleteId/publish', auth, adminAuth, this.wrap(this.adminController.publishAthlete));
    router.get('/campaigns', auth, adminAuth, this.wrap(this.adminController.listCampaigns));
    router.patch('/campaigns/:campaignId/status', auth, adminAuth, this.wrap(this.adminController.updateCampaignStatus));
    router.get('/donations', auth, adminAuth, this.wrap(this.adminController.listDonations));
    ```

- **PostHog events** — in `AdminController`, capture:
    - `admin_athlete_published` on `publishAthlete` (include `athleteId`, `publish` as properties)
    - `admin_campaign_status_changed` on `updateCampaignStatus` (include `campaignId`, `campaignStatus`)

### Step checklist
- [x] `AdminService` extended with athlete, campaign, donation methods
- [x] `AdminController` extended with corresponding handlers
- [x] `AdminRouterFactory` extended with 5 new routes
- [x] PostHog events captured for mutating actions
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 5 - DB migration + allowlist API

### Metadata
**Status:** Complete
**Prereqs:** 3, 4
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-16 10:22 MDT
**Completion Notes:** Added `SignupAllowlistEntry` to Prisma, created draft migration `app/prisma/migrations/20260816162025_add_signup_allowlist/` via `npm run migrate:create --prefix app -- --name add-signup-allowlist`, and implemented DB+env allowlist support with admin API routes. User must run `npx prisma migrate dev` (or deploy equivalent) to apply the `add_signup_allowlist` migration before the DB-backed allowlist API is functional. No backfill script is needed because there are no active subscribers; local test data can be reset separately if requested. `$backend-review` and full `npm run ci` passed.

### Context

**Objective:** Add DB-backed signup allowlist support. Add `SignupAllowlistEntry` to the Prisma schema, create a draft migration, build a repository, update `SignupAllowlistService` to union DB + env entries, and add the three allowlist routes to the admin API.

**Done When:**
- `SignupAllowlistEntry` model is present in `app/prisma/schema.prisma`.
- Draft migration directory exists (created via `npm run migrate:create`). **User must apply the migration** — a note is left in Completion Notes.
- `app/src/repositories/SignupAllowlistRepository.ts` exists with `findAll`, `create`, `deleteById` methods.
- `SignupAllowlistService.isAllowed()` checks DB entries in addition to env-var entries.
- `AdminService` has `getAllowlistEntries`, `addAllowlistEntry`, `deleteAllowlistEntry` methods.
- `AdminRouterFactory` registers `GET /v1/admin/allowlist`, `POST /v1/admin/allowlist`, `DELETE /v1/admin/allowlist/:entryId`.

**References:**
- Context §5 — Changes and considerations (hybrid allowlist approach, migration note)
- Context §9 — `SignupAllowlistEntry` Prisma model definition and `AdminAllowlistResponse` example shape
- Context §11 — Edge cases: deleting env-var entry returns 404; ConflictError on duplicate
- `app/src/services/infrastructure/SignupAllowlistService.ts` — existing logic to extend
- `app/src/api/admin/AdminService.ts` — extend (Step 4 output)
- `app/src/api/admin/AdminController.ts` — extend
- `app/src/api/admin/AdminRouterFactory.ts` — extend
- `app/AGENTS.md` — migration rules: use `npm run migrate:create --prefix app -- --name <name>` only

### Plan

- **Add `SignupAllowlistEntry` model to `app/prisma/schema.prisma`**:
    ```prisma
    model SignupAllowlistEntry {
      id        String   @id @default(uuid()) @db.Uuid
      entry     String   @unique
      createdAt DateTime @default(now())

      @@map("signup_allowlist_entries")
    }
    ```

- **Create draft migration**:
    ```bash
    npm run migrate:create --prefix app -- --name add-signup-allowlist
    ```
    Do not edit the generated SQL — Prisma generates it. Leave a note for the user to apply it.

- **Create `app/src/repositories/SignupAllowlistRepository.ts`**:
    ```ts
    @injectable()
    export class SignupAllowlistRepository {
      constructor(private readonly prisma: PrismaService) {}

      findAll() {
        return this.prisma.signupAllowlistEntry.findMany({ orderBy: { createdAt: 'desc' } });
      }

      create(entry: string) {
        return this.prisma.signupAllowlistEntry.create({ data: { entry } });
      }

      deleteById(id: string): Promise<void> {
        return this.prisma.signupAllowlistEntry.delete({ where: { id } }).then(() => undefined);
      }
    }
    ```

- **Update `SignupAllowlistService`** — inject `SignupAllowlistRepository` and extend `isAllowed()` to also check DB entries:
    ```ts
    async isAllowed(email: string): Promise<boolean> {
      // Env-var check first (fast path, no DB round-trip if not enforced)
      if (this.parseEntries().length === 0) {
        const dbEntries = await this.repository.findAll();
        if (dbEntries.length === 0) return true;
      }
      // ... union check
    }
    ```
    Note: `isAllowed` becomes async. Update `AuthService` callers to `await` it.

- **Add allowlist methods to `AdminService`**:
    - `getAllowlistEntries()` — fetch DB entries, generate synthetic env-var entries with `id: 'env-{index}'` and `source: 'env'`. Combine and return `AdminAllowlistResponse`.
    - `addAllowlistEntry(entry)` — `SignupAllowlistRepository.create(entry)`; catch unique constraint violation → throw `ConflictError`.
    - `deleteAllowlistEntry(entryId)` — `SignupAllowlistRepository.deleteById(entryId)`; catch not-found → throw `NotFoundError`.

- **Extend `AdminController`** — `getAllowlist`, `addAllowlistEntry`, `deleteAllowlistEntry` handlers.

- **Extend `AdminRouterFactory`**:
    ```ts
    router.get('/allowlist', auth, adminAuth, this.wrap(this.adminController.getAllowlist));
    router.post('/allowlist', auth, adminAuth, this.wrap(this.adminController.addAllowlistEntry));
    router.delete('/allowlist/:entryId', auth, adminAuth, this.wrap(this.adminController.deleteAllowlistEntry));
    ```

### Step checklist
- [x] `SignupAllowlistEntry` model added to `app/prisma/schema.prisma`
- [x] Draft migration created via `npm run migrate:create`
- [x] `SignupAllowlistRepository` created
- [x] `SignupAllowlistService.isAllowed()` updated to union DB + env entries (and callers `await` it)
- [x] `AdminService` allowlist methods added
- [x] `AdminController` allowlist handlers added
- [x] `AdminRouterFactory` allowlist routes added
- [x] Completion Notes record: "User must run `npx prisma migrate dev` (or deploy equivalent) to apply the `add-signup-allowlist` migration before the allowlist API is functional."
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
