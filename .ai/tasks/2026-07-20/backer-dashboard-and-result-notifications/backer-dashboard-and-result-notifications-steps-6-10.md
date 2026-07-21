# Backer Dashboard and Race Result Notifications - Steps 6-10

## Step 6 - Donation-succeeded notification + `SUPPORTER` role + guest donation claim

### Metadata
**Status:** Incomplete
**Prereqs:** 5
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** Close the loop at the moment of donation — confirm the backing in-app, start assigning the `SUPPORTER` role, and attach guest donations when their owner signs up.

**Done When:**
- `StripeWebhookService.handleCheckoutSucceeded` writes one `DONATION_SUCCEEDED` `BackerNotification` **inside the existing `$transaction`**, only when `donation.supporterUserId` is non-null.
- `dedupeKey` is `` `${supporterUserId}:DONATION_SUCCEEDED:${donationId}` ``.
- The same transaction assigns `PlatformRole.SUPPORTER` via the existing `PlatformRoleRepository.assignRole` upsert, so the enum stops being dead schema.
- The existing exactly-once contract is preserved: a Stripe redelivery still hits P2002 on `DonationEvent.idempotencyKey`, rolls back the whole fold, and is treated as an already-applied no-op. `StripeWebhookService.test.ts` still passes in that respect.
- **[SECURITY] The guest-donation claim is gated on a verified email.** `claimForSupporterEmail` is exposed as a `BackerClaimService.claimVerifiedDonations(userId, email)` method that refuses to run unless the user's `emailVerifiedAt` is set. Claiming on unverified sign-up would disclose the donation history of any address an attacker signs up with — and sign-up is open by default (`SignupAllowlistService` returns `true` when `SIGNUP_EMAIL_ALLOWLIST` is unset). See context §11 and §15.
- `AuthService.signUp` calls the claim service, which is a **no-op today** because nothing sets `emailVerifiedAt` yet. This is intentional and must be stated in the step's Completion Notes: the claim activates when Step 8 of `.ai/tasks/2026-07-19/platform-polish-and-real-auth/` lands the verification flow, at which point the same call is added to the verify-email handler.
- A claim failure never blocks sign-up — it is caught and logged.
- `logger.warn({ userId, claimedDonationCount }, 'donation.claimed_on_signup')` fires only when the count exceeds zero.
- Tests cover: notification written for an authenticated donor, no notification for a guest donation, role assigned, **a claim attempt on an unverified user claims nothing**, and a claim on a verified user attaches the matching donation.

**References:**
- Context §5 (webhook considerations), §12 (idempotency), §13 (observability), §11 (guest edge cases)
- `app/src/api/webhooks/StripeWebhookService.ts:75-136` — the fold transaction this extends; read the "Append FIRST" comment before editing
- `app/src/repositories/PlatformRoleRepository.ts` and `app/src/api/athletes/AthleteService.ts:109` — the existing `assignRole` call site to mirror
- `app/src/api/auth/AuthService.ts`
- `app/AGENTS.md` — never log secrets or full request bodies

### Plan
- Extend the fold transaction in `handleCheckoutSucceeded`, after the campaign projection update:
    - Snippet:
      ```ts
      if (donation.supporterUserId) {
        await this.platformRoles.assignRole(donation.supporterUserId, PlatformRole.SUPPORTER, tx);
        await this.backerNotifications.fanOutDonationSucceeded(
          {
            recipientUserId: donation.supporterUserId,
            donationId: donation.id,
            campaignId: donation.campaignId,
            athleteId: campaign.athlete.id,
            athleteName: campaign.athlete.fullName,
            campaignTitle: campaign.campaignTitle,
            donationAmountCents: donation.donationAmountCents,
          },
          tx
        );
      }
      ```
- Add `fanOutDonationSucceeded` to `BackerNotificationService`, reusing `BackerNotificationRepository.createMany` with a single row so both fan-outs share one idempotent write path.
- Thread a `tx` parameter through `PlatformRoleRepository.assignRole` following the `DonationRepository` convention.
- Add `app/src/api/backers/BackerClaimService.ts` holding the verification gate, so the rule lives in one place and both call sites inherit it:
    - Snippet:
      ```ts
      // Guest donations are identified only by email, so attaching them to an
      // account discloses that address's donation history. Gate on a verified
      // email — sign-up alone proves nothing, and sign-up is open by default
      // when SIGNUP_EMAIL_ALLOWLIST is unset (context §11).
      async claimVerifiedDonations(userId: string, email: string): Promise<number> {
        const user = await this.users.findById(userId);
        if (!user?.emailVerifiedAt) return 0;
        return this.donations.claimForSupporterEmail(userId, email);
      }
      ```
- Call it from `AuthService.signUp`, accepting that it returns 0 until email verification exists:
    - Snippet:
      ```ts
      const claimedDonationCount = await this.backerClaims
        .claimVerifiedDonations(user.id, user.email)
        .catch(() => 0);
      if (claimedDonationCount > 0) {
        this.logger.warn({ userId: user.id, claimedDonationCount }, 'donation.claimed_on_signup');
      }
      ```
    - `AuthService` does not currently inject `BackerClaimService` or `Logger` — add both.
- Leave a TODO at the verification hand-off point naming the exact follow-up, since it crosses task boundaries:
    - Snippet:
      ```ts
      // TODO: call claimVerifiedDonations from the verify-email handler once
      // platform-polish-and-real-auth Step 8 lands; sign-up alone never verifies.
      ```
- Update `app/src/api/webhooks/StripeWebhookService.test.ts` with the new expectations, and add an auth test for the claim.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 7 - Backer dashboard aggregate API

### Metadata
**Status:** Incomplete
**Prereqs:** 2, 4
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** One authenticated endpoint that returns everything `/backers` renders.

**Done When:**
- `GET /v1/users/me/backer-dashboard` returns a payload validating against `backerDashboardResponseSchema`.
- The route is served by a new `BackerRouterFactory` with `basePath = '/v1/users'`, registered in `app/src/app.ts` after `UserRouterFactory`, following the `MyFollowsRouterFactory` precedent.
- A user with zero successful donations gets a 200 with zeroed summary and empty arrays, not a 404.
- `backedAthletes` is sorted by `totalBackedCents` descending, capped at a named constant, and each entry carries the athlete's most recent result (name, summary, date) or nulls.
- `upcomingBackedEvents` includes only events with `eventStartDate >= today` and `completedAt = null`, sorted ascending, each carrying its campaign's `targetAmountCents` and `raisedAmountCents` so the client can render the funding progress bar.
- `recentResults` is the most recent results across all backed athletes, ordered by `occurredOn desc` with nulls last, and `wasBacked` true when the result's `athleteEventId` is one the caller funded. If Prisma 5.20 rejects `nulls: 'last'`, exclude null-`occurredOn` results and say so in the step's Completion Notes rather than letting undated rows head the list (context §14).
- Soft-deleted athletes and campaigns are excluded everywhere.
- Unit tests cover the empty-state response, the per-athlete total/count folding, and `wasBacked` derivation.

**References:**
- Context §9 (example dashboard payload), §7, §11 (zero-donation edge case)
- Stitch reference: `backer_dashboard_my_athletes_impact/code.html` — the summary card, "Your Athletes" rail, "Competition Roadmap", and "Recent Results" sections map 1:1 onto the four response fields
- `app/src/api/follows/MyFollowsRouterFactory.ts` — mount-path precedent
- `app/src/api/follows/FollowService.ts` — service + module-scope DTO mapper shape
- `BackerRepository` from Step 4

### Plan
- Create `app/src/api/backers/` with `BackerRouterFactory.ts`, `BackerController.ts`, `BackerService.ts` (`BackerNotificationService.ts` already lives here from Step 5).
- Router:
    - Snippet:
      ```ts
      // Shares the users base path with UserRouterFactory and MyFollowsRouterFactory;
      // keeps backer ownership inside the backers feature folder.
      readonly basePath = '/v1/users';

      build(): Router {
        const router = Router();
        router.get('/me/backer-dashboard', this.auth.required, this.wrap(this.backerController.getDashboard));
        return router;
      }
      ```
- Service composes the repository calls:
    - Snippet:
      ```ts
      const [backedAthletes, upcomingBackedEvents, recentResults, backedEventIds, unreadNotificationCount] =
        await Promise.all([
          this.backers.listBackedAthletes(supporterUserId),
          this.backers.listUpcomingBackedEvents(supporterUserId, UPCOMING_EVENT_LIMIT),
          this.backers.listResultsForBacker(supporterUserId, {}, RECENT_RESULT_LIMIT),
          this.backers.listBackedEventIds(supporterUserId),
          this.notifications.countUnread(supporterUserId),
        ]);
      ```
- Derive `wasBacked` by set membership against `backedEventIds`, and derive `impactSummary` from the loaded collections rather than issuing separate count queries, so the headline numbers can never disagree with the lists beside them.
- Declare limits as named module constants (`BACKED_ATHLETE_LIMIT`, `UPCOMING_EVENT_LIMIT`, `RECENT_RESULT_LIMIT`) — silent truncation must be a deliberate, named choice.
- Register the router factory in `app/src/app.ts`.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 8 - Backer result log + notifications list/read API

### Metadata
**Status:** Incomplete
**Prereqs:** 5, 7
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** The full result history and the unread-notification surface behind the header bell.

**Done When:**
- `GET /v1/users/me/backer-activity` accepts `backerActivityQuerySchema` (`athleteId?`, `limit`) and returns `backerActivityResponseSchema` with `nextCursor: null`.
- Results are ordered by `occurredOn desc` — **never** `createdAt` or `id`, which churn on every athlete profile save.
- `GET /v1/users/me/notifications` returns `backerNotificationListResponseSchema` including `unreadCount`, newest first.
- `POST /v1/users/me/notifications/:notificationId/read` returns 204 and is idempotent — marking an already-read notification changes nothing and still returns 204.
- `POST /v1/users/me/notifications/read-all` returns 204 and sets `readAt` only where it is null.
- A notification belonging to another user returns 404, never 403.
- Notifications referencing a soft-deleted athlete are filtered out of the list rather than returned with a dead link.
- All four routes are added to `BackerRouterFactory` behind `this.auth.required`.
- Tests cover: `athleteId` filter, ordering by `occurredOn`, cross-user 404, and read idempotency.

**References:**
- Context §5 (ordering constraint), §7, §11, §12
- Stitch reference: `arc_backer_full_activity_result_log/code.html` — the chronological timeline with per-athlete filter chips is exactly the `athleteId` filter
- `app/src/api/follows/FollowService.ts` — the capped-list, `nextCursor: null` precedent this follows
- `app/src/shared/requestParsers.ts` — `parseRequestQuery`, `parseRequestParams`

### Plan
- Add the four routes to `BackerRouterFactory`.
    - Snippet:
      ```ts
      router.get('/me/backer-activity', this.auth.required, this.wrap(this.backerController.listActivity));
      router.get('/me/notifications', this.auth.required, this.wrap(this.backerController.listNotifications));
      router.post('/me/notifications/read-all', this.auth.required, this.wrap(this.backerController.markAllRead));
      router.post('/me/notifications/:notificationId/read', this.auth.required, this.wrap(this.backerController.markRead));
      ```
    - Register `read-all` **before** `:notificationId/read` so the literal path is not captured by the parameter route.
- Activity list reuses `BackerRepository.listResultsForBacker` with the `athleteId` filter applied, returning `{ items, nextCursor: null }`.
- `markRead` scopes the update by both `recipientUserId` and `backerNotificationId`:
    - Snippet:
      ```ts
      // Scoped by recipient so another user's id is indistinguishable from a
      // nonexistent one — a 404, never a 403.
      const matched = await this.notifications.markRead(supporterUserId, backerNotificationId);
      if (matched === 0) throw new NotFoundError('Notification');
      ```
    - `markRead` must match the row regardless of current `readAt` (so a repeat call still finds it and returns 204) while only writing `readAt` when it is null.
- Use `ResponseHandler` for the list endpoints and `res.sendStatus(204)` for the two write endpoints.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 9 - Client data layer: API helpers, mock fixtures, loaders, hooks

### Metadata
**Status:** Incomplete
**Prereqs:** 7, 8
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** Give the new client surfaces a data seam that works identically in mock and api mode, so the static-export build never breaks.

**Done When:**
- `client/lib/api.ts` gains `fetchBackerDashboard()`, `fetchBackerActivity(query)`, `fetchBackerNotifications()`, `markNotificationRead(id)`, and `markAllNotificationsRead()`, all `authed: true`.
- Every helper validates against its `fad-common` schema through the existing `apiRequest` wrapper — no bespoke fetch.
- `client/lib/mockBackers.ts` provides fixtures for a backer dashboard, a result log, and notifications, built from the existing `client/lib/mockAthletes.ts` / `athleteProfiles.ts` roster so names and slugs stay consistent with the athlete pages a backer can navigate to.
- `client/lib/dataSource.ts` gains `useBackerDashboard()`, `useBackerActivity(athleteFilter)`, and `useBackerNotifications()`, each returning the existing `{ data, loading, error }` shape and each fully synchronous in mock mode.
- `client/lib/apiLoaders.ts` gains the composition functions; `client/lib/adapters.ts` gains DTO → view-model mappers; view-model types go in `client/lib/dataSourceTypes.ts`.
- All money formatting goes through `formatCents` from `client/lib/format.ts` — **[STRICT]**, no ad-hoc division.
- No new dependency is added to `client/package.json`.
- `npm run type-check --prefix client` and `npm run lint --prefix client` pass.

**References:**
- Context §8 (client layout), §10 (`client/` impact), §6 (no new client deps)
- `client/lib/api.ts` — `apiRequest`, `ApiError`, the `authed` flag, and the `Parser<T>` structural-typing trick that keeps `zod` out of client deps
- `client/lib/dataSource.ts` — `DATA_SOURCE`, `useApiResource`
- `client/lib/apiLoaders.ts`, `client/lib/adapters.ts`
- `client/AGENTS.md` — **[STRICT]** import API types from `fad-common`; **[STRICT]** money via `formatCents`

### Plan
- Extend `client/lib/api.ts` following the existing one-liner style:
    - Snippet:
      ```ts
      export function fetchBackerDashboard(): Promise<BackerDashboardResponse> {
        return apiRequest('/v1/users/me/backer-dashboard', backerDashboardResponseSchema, {
          authed: true,
        });
      }
      ```
- Build `client/lib/mockBackers.ts` deriving athlete identity from the existing roster, so the mock dashboard shows real seeded runners rather than the Stitch placeholder names.
    - Snippet:
      ```ts
      // Mock-mode fixtures. Derived from the existing roster so slugs, names, and
      // hero images match the athlete pages a backer can navigate to from here.
      export const mockBackerDashboard: BackerDashboardView = { … };
      ```
- Add the hooks, mirroring the existing mock/api branch precisely:
    - Snippet:
      ```ts
      export function useBackerDashboard(): AsyncState<BackerDashboardView> {
        const apiMode = DATA_SOURCE === 'api';
        const state = useApiResource(apiMode, loadApiBackerDashboard, mockBackerDashboard);
        return apiMode ? state : { data: mockBackerDashboard, loading: false, error: null };
      }
      ```
- Add a `toBackerErrorMessage(error)` helper next to the existing `toManageSaveError`, returning one plain sentence and special-casing 401 as "Your session expired — sign in again."
- Do not add a test runner; `client/` has none. Verification is type-check, lint, and the browser QA in Steps 9-11.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 10 - Client: backer dashboard page (`/backers`)

### Metadata
**Status:** Incomplete
**Prereqs:** 9
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** The backer's home base — who they back, what their money did, what is coming next.

**Done When:**
- `client/app/(marketing)/backers/page.tsx` (server) renders `BackerDashboardClient.tsx` (`'use client'`), inside the existing `(marketing)` group so it inherits `SiteHeader` / `SiteFooter` / `MobileBottomNav`.
- The page follows `DashboardClient.tsx`'s shape: a signed-out early return rendering `SignedOutGate` (`:41`, `:519`), then a discriminated union for the rest — its kinds are `loading | none | error | ready` (`:132-135`). Mirror that split rather than folding signed-out into the union.
- Sections, mapping the Stitch reference: an impact summary card (backed athlete count, total funded), a "Your Athletes" rail of backed-athlete cards, a "Competition Roadmap" list of upcoming backed events with funding progress, and a "Recent Results" list.
- A new `BackedAthleteCard.tsx` renders each backed athlete with: hero photo, name, sport/discipline, **the amount that backer has given that athlete** (`totalBackedCents` via `formatCents`), a supporting line reading "across N donations · backing since {month year}" from `donationCount` and `firstBackedAt`, and the athlete's latest result. The whole card links to the athlete's public profile.
- The amount is presented as the backer's own contribution ("You've given $500"), never as the athlete's total raised — the response carries only this backer's figures and the copy must not imply otherwise.
- Cards are ordered by `totalBackedCents` descending, matching the API's ordering, so the rail is stable and the biggest relationships lead.
- An athlete backed with zero successful donations cannot appear (the API excludes them), so the card has no zero-amount state to design.
- Each recent result links to the athlete's public profile at the results section; results with `wasBacked` true carry a quiet "you backed this" marker.
- The signed-out state reuses the `SignedOutGate` card pattern (centred `max-w-md`, `card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8`, circular icon badge, stacked CTAs).
- The zero-donations state uses the dashed-border empty card, with CTAs to `/athletes` and `/community` — never an error.
- New shared primitives `client/components/ui/StatTile.tsx` and `client/components/ui/EmptyState.tsx` are extracted. **Name collision:** a local `EmptyState` already exists inside `ManageProfile.tsx` (defined ~`:844`, used `:611` and `:659`) — either rename the local one or import the shared one under an alias; do not leave two `EmptyState` symbols in the codebase, and these three verified duplicates of the `rounded-card border border-dashed border-outline-variant bg-surface-container-lowest` card are migrated to it: `client/app/(marketing)/community/communityParts.tsx:29` (the full version with heading + CTAs), `client/app/(marketing)/community/CommunityClient.tsx:148` (the one-line version), and `client/app/(marketing)/athletes/AthleteDirectory.tsx:238`. `EmptyState` must support both shapes — heading + body + optional actions, and a bare-message variant — or the migration will not be clean.
- Leave the `rounded-input`-based dashed borders in `ManageProfile.tsx` and `ProfileEditableSections.tsx` alone; those are upload targets and inline editors, not empty states, and folding them in would overload the component.
- All icons come from `client/components/ui/Icon.tsx`; any Material Symbol used by the Stitch mock is added to that registry rather than loading an icon font.
- All colors are existing `@theme` tokens; no hex literals, no `bg-white`, no `bg-green-100`.
- Uppercase labels use `.eyebrow`, not `.label-bold`. Money renders via `formatCents`.
- Verified in the browser at desktop **and** 375px width, in mock mode, with a screenshot shared.

**References:**
- Context §8, §10, §11 (signed-out and empty states)
- Stitch reference: `backer_dashboard_my_athletes_impact/code.html`. Its Tailwind palette is byte-identical to `client/styles/globals.css`, so translate class-by-class to tokens. Ignore its bespoke bottom nav — reuse `MobileBottomNav`.
- `client/app/(marketing)/dashboard/DashboardClient.tsx` — state machine, gates, 12-column grid, pulse skeletons
- `client/app/(marketing)/community/communityParts.tsx` — `EmptyFollowing` is the canonical empty state
- `client/components/ui/` — the full inventory is `Button.tsx` (`Button`/`LinkButton`), `Badge.tsx`, `ProgressBar.tsx`, `Icon.tsx`, `formStyles.ts`. There is **no** `ui/Section`; `Section`/`Eyebrow`/`SectionHeading` live in `client/components/site/Section.tsx`
- `client/components/site/AthleteCard.tsx` — exports `AthleteRow` (there is no `AthleteCard` symbol); consumed only by `AthleteDirectory.tsx`. Read it for styling conventions, but do **not** extend it with funding props (see Plan).
- `client/lib/format.ts` — `formatCents` is **[STRICT]** the only money formatter
- `client/AGENTS.md` — **[STRICT]** Minimalism, Story-first, Transparency. Note the Story-first rule targets *public* athlete surfaces, where funding metrics were deliberately stripped; a backer's private record of their own giving is a different thing and is expected on this page. Keep it below the athlete's identity, not above it.

### Plan
- Scaffold the route and client component.
    - Snippet:
      ```tsx
      type BackerDashboardState =
        | { kind: 'loading' }
        | { kind: 'signed-out' }
        | { kind: 'error'; message: string }
        | { kind: 'empty' }
        | { kind: 'ready'; dashboard: BackerDashboardView };
      ```
- Impact summary: two `StatTile`s split by a vertical rule on desktop, stacked on mobile. Per Story-first, the athlete rail comes before the metrics in mobile ordering.
- Athlete rail: horizontally scrolling `BackedAthleteCard`s using the existing `.no-scrollbar` helper, `min-w-[320px]`, hero image with `group-hover:scale-110`, and a latest-result block with `border-l-4 border-primary`.
- **Build `BackedAthleteCard` as a new component in the backers route folder — do not add a money variant to `AthleteRow` in `client/components/site/AthleteCard.tsx`.** That card is used by discovery, and giving it a funding prop is how funding metrics leak back into surfaces the user deliberately stripped them from.
- Card composition, in this order — the ordering is the whole point:
    - Snippet:
      ```tsx
      // Story-first ordering: photo, name, and discipline lead. The amount is the
      // backer's own record of the relationship, not a public funding metric on the
      // athlete — it belongs on this private dashboard and nowhere else. Kept
      // visually quiet (label + figure, no badge, no progress bar) so it reads as a
      // receipt rather than a scoreboard.
      <HeroPhoto … />
      <h3>{athleteName}</h3>
      <p className="eyebrow">{disciplineLabel ?? primarySport}</p>
      <div>
        <p className="eyebrow text-on-surface-variant">You&rsquo;ve given</p>
        <p className="font-display text-2xl font-extrabold">{formatCents(totalBackedCents)}</p>
        <p className="text-sm text-on-surface-variant">
          across {donationCount} donation{donationCount === 1 ? '' : 's'} · backing since {backingSinceLabel}
        </p>
      </div>
      <LatestResultBlock … />
      ```
- Format `firstBackedAt` to a month-and-year label with the existing date helper rather than a raw timestamp; a precise date reads like an invoice.
- Singular/plural on "donation" must be handled — "across 1 donations" is the kind of detail that undermines a page about trust.
- Roadmap list: reuse `client/components/ui/ProgressBar.tsx` for funding progress rather than the mock's hand-rolled gradient div, and show the raised/target pair beneath it (**[STRICT]** Transparency).
- Add a `/backers` entry to `SiteHeader` and `MobileBottomNav` for signed-in users. `MobileBottomNav` currently has four tabs (`/`, `/athletes`, `/community`, `/dashboard`) and uses **local inline icon components, not `ui/Icon`** — follow its existing local-icon convention there rather than importing the registry, and consider whether a fifth tab crowds 375px.
- QA with the Browser pane in mock mode: desktop, then `resize_window` to 375px; check `read_console_messages`; capture a screenshot.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---
