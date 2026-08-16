# Admin Portal - Steps 6–10

## Step 6 - Client — session update + admin guard + layout

### Metadata
**Status:** Complete
**Prereqs:** 1
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-16 10:25 MDT
**Completion Notes:** Added `isAdmin` to client session persistence with backward compatibility for old stored records, added all admin API helpers in `client/lib/api.ts`, created guarded `client/app/admin/layout.tsx`, and surfaced an Admin link for admin sessions in the site header auth menu. `$frontend-review` found and fixed persisted-session normalization. Full `npm run ci` passed.

### Context

**Objective:** Update the client session layer to carry `isAdmin`, add all admin API helper functions to `client/lib/api.ts`, create the admin route group layout with role guard + sidebar navigation, and add a conditional "Admin" link to the site header.

**Done When:**
- `Session` type in `client/lib/session.ts` includes `isAdmin: boolean`.
- `AuthRecord` type includes `isAdmin: boolean`; `signIn` and `signUp` write it to `authStore`.
- `authRecordToSession` maps `isAdmin` from `AuthRecord` to `Session`.
- All admin API helpers exist in `client/lib/api.ts` (one function per admin endpoint).
- `client/app/admin/layout.tsx` exists, guards on `session.isAdmin`, and renders a sidebar nav.
- The site header/nav conditionally renders an "Admin" link for admin users.

**References:**
- Context §5 — isAdmin written to arc-auth at sign-in; sign-out and back in needed after role grant
- Context §8 — Client admin layout as standalone route group; marketing chrome not shown
- Context §11 — Admin guard renders loading skeleton until `ready === true`
- `client/lib/session.ts` — `Session`, `AuthRecord`, `authRecordToSession`, `signIn`, `signUp`
- `client/lib/api.ts` — `apiRequest` function and existing helper pattern
- `client/app/(marketing)/layout.tsx` — existing marketing layout for reference
- `client/app/(marketing)/dashboard/DashboardClient.tsx` — `useSession()` gate pattern
- `common/src/zod/admin.ts` — all admin response schemas for validation
- `client/AGENTS.md` — Server Components by default; `'use client'` only for interactivity

### Plan

- **Update `client/lib/session.ts`**:
    1. Add `isAdmin: boolean` to the `Session` type.
    2. Add `isAdmin: boolean` to the `AuthRecord` type (the shape written to `arc-auth` browserStore).
    3. Update `authRecordToSession` to include `isAdmin: record.isAdmin`.
    4. Update `signIn` to write `isAdmin: session.isAdmin` when storing the `AuthRecord`.
    5. Update `signUp` to write `isAdmin: false` (new accounts are never admin at creation).
    - Snippet:
      ```ts
      type AuthRecord = {
        accessToken: string;
        user: User;
        published: boolean;
        isAdmin: boolean;   // ← add
      };

      function authRecordToSession(record: AuthRecord | null): Session | null {
        if (!record) return null;
        return {
          name: record.user.displayName,
          email: record.user.email,
          published: record.published,
          mustVerifyEmail: !record.user.emailVerifiedAt,
          isAdmin: record.isAdmin,   // ← add
        };
      }
      ```

- **Add admin API helpers to `client/lib/api.ts`** — one function per endpoint, all with `authed: true`:
    ```ts
    // Users
    export function fetchAdminUsers(params?: AdminUserListQuery): Promise<AdminUserListResponse>
    export function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail>
    export function updateAdminUserRoles(userId: string, body: AdminUpdateUserRolesRequest): Promise<AdminUserDetail>
    export function deleteAdminUser(userId: string): Promise<AuthActionResponse>

    // Athletes
    export function fetchAdminAthletes(params?: AdminAthleteListQuery): Promise<AdminAthleteListResponse>
    export function adminPublishAthlete(athleteId: string, body: AdminAthletePublishRequest): Promise<AuthActionResponse>

    // Campaigns
    export function fetchAdminCampaigns(params?: AdminCampaignListQuery): Promise<AdminCampaignListResponse>
    export function adminUpdateCampaignStatus(campaignId: string, body: AdminUpdateCampaignStatusRequest): Promise<AuthActionResponse>

    // Donations
    export function fetchAdminDonations(params?: AdminDonationListQuery): Promise<AdminDonationListResponse>

    // Analytics
    export function fetchAdminAnalytics(): Promise<AdminAnalyticsResponse>

    // Allowlist
    export function fetchAdminAllowlist(): Promise<AdminAllowlistResponse>
    export function addAdminAllowlistEntry(body: AdminAddAllowlistEntryRequest): Promise<AdminAllowlistEntry>
    export function deleteAdminAllowlistEntry(entryId: string): Promise<AuthActionResponse>
    ```
    Validate each with its corresponding schema from `common/src/zod/admin.ts` (imported via `fad-common`).

- **Create `client/app/admin/layout.tsx`** — `'use client'` component (needs `useSession` and `useRouter`). Full-page layout: fixed left sidebar + scrollable main content.
    - Guard logic: if `ready && !session?.isAdmin` → `router.replace('/sign-in')`. While `!ready` → render a loading skeleton.
    - Sidebar nav links: Overview (`/admin`), Users (`/admin/users`), Athletes (`/admin/athletes`), Campaigns (`/admin/campaigns`), Donations (`/admin/donations`), Allowlist (`/admin/allowlist`).
    - Sidebar should include the user's name/email at the bottom and a sign-out button.
    - Sidebar design: dark background (`bg-gray-900 text-white`), width `w-64`, full-height fixed. Active link uses a highlighted state.

- **Update site header nav** — find the component that renders the site navigation (likely `client/components/site/SiteHeader.tsx` or similar). Use `useSession()` to conditionally render an "Admin" link pointing to `/admin`. This component must be or become a client component (`'use client'`).

### Step checklist
- [x] `Session` and `AuthRecord` types updated with `isAdmin`
- [x] `signIn`, `signUp`, `authRecordToSession` updated
- [x] All admin API helpers added to `client/lib/api.ts`
- [x] `client/app/admin/layout.tsx` created with role guard + sidebar
- [x] Site header shows conditional "Admin" link for admin users
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 7 - Client — analytics dashboard page

### Metadata
**Status:** Complete
**Prereqs:** 6
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-16 10:27 MDT
**Completion Notes:** Created `client/app/admin/page.tsx` with KPI cards, signup and donation trend bars, 30-day summary stats, conversion funnel, loading state, and error state. `$frontend-review` found and fixed percentage clamping, line wrapping, and new letter-spacing utility use. Full `npm run ci` passed.

### Context

**Objective:** Build the admin analytics overview page at `client/app/admin/page.tsx`. Display KPI metric cards, CSS-based 30-day trend bars for signups and donations, and a simple conversion funnel.

**Done When:**
- `client/app/admin/page.tsx` renders without TypeScript errors.
- The page fetches `GET /v1/admin/analytics` on load and displays all stats.
- Metric cards show: Total Users, Published Athletes, Active Campaigns, Total Raised.
- Trend section shows 30-day signup bar chart and donation bar chart (CSS proportional bars, no library).
- Conversion funnel section shows the three steps: Total Users → Has Athlete Profile → Published.
- Loading and error states are handled.

**References:**
- Context §7 — Analytics data shape (`AdminAnalyticsResponse`)
- Context §8 — No charting library; CSS proportional bars
- `client/lib/api.ts` — `fetchAdminAnalytics()` (Step 6 output)
- `common/src/zod/admin.ts` — `AdminAnalyticsResponse` type
- `client/lib/format.ts` — `formatCents` for Total Raised display
- `client/AGENTS.md` — `'use client'` only when interactivity demands it; money from `formatCents`

### Plan

- **Create `client/app/admin/page.tsx`** as a `'use client'` component (needs data fetching with React state).
    - Fetch `fetchAdminAnalytics()` in a `useEffect` on mount.
    - Loading state: show skeleton cards. Error state: show an error message.
    - Metric cards (4-up grid): Total Users, Published Athletes, Active Campaigns, Total Raised.
      ```tsx
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Users" value={data.totalUsers} />
        <MetricCard label="Published Athletes" value={data.publishedAthletes} />
        <MetricCard label="Active Campaigns" value={data.activeCampaigns} />
        <MetricCard label="Total Raised" value={formatCents(data.totalRaisedCents)} />
      </div>
      ```
    - CSS trend bars — for each day in `userSignupsByDay`, render a bar whose height is proportional to the max count in the series:
      ```tsx
      const maxCount = Math.max(...data.userSignupsByDay.map(d => d.count), 1);
      // Render: <div style={{ height: `${(day.count / maxCount) * 100}%` }} className="bg-blue-500 w-full" />
      ```
      Wrap bars in a fixed-height container (`h-24`) with `items-end flex gap-0.5`.
    - Conversion funnel: three boxes with counts and percentages showing the drop-off:
      - Total Users → Has Athlete Profile (`totalAthletes / totalUsers`) → Published (`publishedAthletes / totalAthletes`).
    - Recent stats: show `signupsLast30Days` and `athletesLast30Days` as inline stat lines below the metric cards.

- **Inline `MetricCard`** — a small functional component within the same file (single use here):
    ```tsx
    function MetricCard({ label, value }: { label: string; value: string | number }) { ... }
    ```

### Step checklist
- [x] `client/app/admin/page.tsx` created
- [x] Metric cards render with correct data
- [x] 30-day signup trend bars render
- [x] 30-day donation trend bars render
- [x] Conversion funnel renders
- [x] Loading and error states handled
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 8 - Client — admin users pages (list + detail)

### Metadata
**Status:** Complete
**Prereqs:** 6
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-16 10:30 MDT
**Completion Notes:** Created `client/app/admin/users/page.tsx`, `client/app/admin/users/[userId]/page.tsx`, and shared role badge UI. User list supports debounced search, role filter, cursor pagination, and keyboard-accessible row navigation. Detail supports role toggles, save, and soft-delete confirmation. `$frontend-review` found and fixed shared component placement and table-row keyboard access. Full `npm run ci` passed.

### Context

**Objective:** Build the user management pages: a searchable/filterable paginated table at `/admin/users` and a user detail page at `/admin/users/[userId]` with role management.

**Done When:**
- `client/app/admin/users/page.tsx` renders a user table with email, name, roles, verified status, joined date, and pagination controls.
- Search input filters users by email/name.
- Role filter dropdown filters by platform role.
- Clicking a row navigates to `/admin/users/[userId]`.
- `client/app/admin/users/[userId]/page.tsx` shows full user detail and allows toggling roles via checkboxes.
- Role save triggers `PATCH /v1/admin/users/:userId/roles`.
- Soft-delete button triggers `DELETE /v1/admin/users/:userId` with a confirmation prompt.

**References:**
- Context §7 — Functional requirements for user list and user detail
- `client/lib/api.ts` — `fetchAdminUsers`, `fetchAdminUserDetail`, `updateAdminUserRoles`, `deleteAdminUser`
- `common/src/zod/admin.ts` — `AdminUserSummary`, `AdminUserDetail`, `PlatformRole` values
- `common/src/types/roles.ts` — `PlatformRole` enum for role options
- `client/AGENTS.md` — `'use client'` for interactive components; minimalism

### Plan

- **Create `client/app/admin/users/page.tsx`** as `'use client'`:
    - State: `search` (string), `roleFilter` (`PlatformRole | ''`), `cursor` (string | null), `users` (items), `nextCursor`.
    - Table columns: Email, Display Name, Roles (badge list), Verified, Joined, Actions (→ detail link).
    - Search: debounced input (300ms) that resets cursor and refetches.
    - Role filter: `<select>` with options for each `PlatformRole` value + "All".
    - Pagination: "Next" button shown when `nextCursor` is present.
    - Each row is a `<tr>` with a link to `/admin/users/{userId}` on click.
    - Role badges: small inline badges coloured by role (ADMIN = red, ATHLETE = blue, SUPPORTER = green, BRAND = orange).

- **Create `client/app/admin/users/[userId]/page.tsx`** as `'use client'`:
    - Fetch `fetchAdminUserDetail(userId)` on mount.
    - Display: avatar, email, displayName, emailVerifiedAt, createdAt, athleteSlug (if present), publishedAt (if athlete).
    - Role section: a checkbox for each `PlatformRole` value. Current roles pre-checked. "Save Roles" button calls `updateAdminUserRoles`.
    - Delete section: "Delete User" button opens an inline confirmation (`window.confirm` is sufficient). On confirm, calls `deleteAdminUser` and redirects to `/admin/users`.
    - Success/error toast feedback using a simple inline state (`savedMessage: string | null`).

### Step checklist
- [x] `client/app/admin/users/page.tsx` created with search, filter, table, pagination
- [x] `client/app/admin/users/[userId]/page.tsx` created with user detail, role management, delete
- [x] Role badges colour-coded
- [x] All API calls use helpers from `client/lib/api.ts`
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 9 - Client — admin athletes + campaigns + donations + allowlist pages

### Metadata
**Status:** Complete
**Prereqs:** 6
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-16 10:37 MDT
**Completion Notes:** Created the admin athlete moderation, campaign moderation, donation log, and signup allowlist pages. Added shared admin display helpers for status badges, table headers, loading/error states, and empty rows. `$frontend-review` found and fixed unstable fetch effects and missing empty states. Full `npm run ci` passed.

### Context

**Objective:** Build the remaining four admin pages: athlete moderation, campaign moderation, donation log, and allowlist management.

**Done When:**
- `client/app/admin/athletes/page.tsx` — table of all athletes (published + unpublished) with publish/unpublish toggle.
- `client/app/admin/campaigns/page.tsx` — table of all campaigns with status filter and status override dropdown.
- `client/app/admin/donations/page.tsx` — donation log table with status filter.
- `client/app/admin/allowlist/page.tsx` — shows all allowlist entries (DB + env) with add form and delete for DB entries.

**References:**
- Context §7 — Functional requirements for all four pages
- Context §11 — Edge cases: env-var entries not deletable; ConflictError on duplicate allowlist entry
- `client/lib/api.ts` — `fetchAdminAthletes`, `adminPublishAthlete`, `fetchAdminCampaigns`, `adminUpdateCampaignStatus`, `fetchAdminDonations`, `fetchAdminAllowlist`, `addAdminAllowlistEntry`, `deleteAdminAllowlistEntry`
- `common/src/zod/admin.ts` — all relevant item types
- `client/lib/format.ts` — `formatCents`

### Plan

- **Create `client/app/admin/athletes/page.tsx`** as `'use client'`:
    - Table columns: Slug, Full Name, Sport, Published (badge), Stripe Connected (badge), Created, Actions.
    - Each row: "Publish" or "Unpublish" button (disabled while loading). Calls `adminPublishAthlete`.
    - Filter: "Published Only" / "Unpublished Only" / "All" radio toggle.
    - Profile slug links to the public athlete profile (`/athletes/{athleteSlug}`) in a new tab.

- **Create `client/app/admin/campaigns/page.tsx`** as `'use client'`:
    - Table columns: Title, Type, Status (coloured badge), Target, Raised, Athlete, Created.
    - Status filter `<select>` (all statuses + "All").
    - Each row: inline status override `<select>` with all `CampaignStatus` options. On change, calls `adminUpdateCampaignStatus`. Show loading indicator per row.
    - Progress bar: `raisedAmountCents / targetAmountCents` as a Tailwind width.

- **Create `client/app/admin/donations/page.tsx`** as `'use client'`:
    - Table columns: Supporter, Email (if not anonymous), Amount, Status (badge), Campaign, Athlete, Date.
    - Status filter dropdown.
    - Pagination with "Next" cursor button.
    - Read-only; no actions. Format amounts with `formatCents`.

- **Create `client/app/admin/allowlist/page.tsx`** as `'use client'`:
    - Header shows `isEnforced: true/false` status badge ("Enforced" vs "Open — anyone can sign up").
    - Entry table: Entry (email or @domain), Source badge (DB = green, ENV = gray), Created, Delete button.
    - Delete: only shown for `source === 'db'` entries. Calls `deleteAdminAllowlistEntry`. On 404 or success, refetches.
    - Add entry form: text input + "Add" button. Calls `addAdminAllowlistEntry`. On `ConflictError`, shows "Entry already exists" inline message. On success, refetches.

### Step checklist
- [x] `client/app/admin/athletes/page.tsx` created with publish toggle
- [x] `client/app/admin/campaigns/page.tsx` created with status override
- [x] `client/app/admin/donations/page.tsx` created (read-only log)
- [x] `client/app/admin/allowlist/page.tsx` created with add + delete
- [x] All pages handle loading and error states
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 10 - Final Validation & Cleanup

### Metadata
**Status:** Complete
**Prereqs:** 3, 4, 5, 7, 8, 9
**Owner:** ai
**Completed At:** 2026-08-16 10:40 MDT
**Completion Notes:** Confirmed Steps 1-9 are complete, checked for introduced TODOs, ran `$e2e-review` across the admin portal flow, ran backend/frontend/doc-alignment passes for the uncommitted scope, fixed allowlist delete refetch behavior found during review, and confirmed full `npm run ci` passes.

### Final Step Checklist
* [x] Confirm all prior steps (1–9) are marked Complete in steps docs and the steps guide index
* [x] Review and resolve any outstanding TODOs introduced during this task
* [x] Run the `$e2e-review` (`/e2e-review`) skill with all required context provided
* [x] Run the `$ci` (`/ci`) skill and confirm it passes
- [x] Fix any issues caused by `$ci` (`/ci`)
* [x] Update task metadata in the steps docs and the steps guide index
* [x] Move `.ai/tasks/2026-08-16/admin-portal/` to `.ai/tasks/2026-08-16/completed/admin-portal/`
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
