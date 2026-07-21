# Backer Dashboard and Race Result Notifications

Date: 2026-07-20
Task slug: backer-dashboard-and-result-notifications
Status: Draft

## 0) Summary

- **Objective:** Give anyone who has successfully donated a home base that shows the athletes they back, and notify them with the race result when a backed athlete finishes an event they helped fund.
- **Why now:** The non-custodial money loop shipped (`.ai/tasks/2026-07-19/completed/stripe-connect-crowdfunding/`), so donations are real, but a donor's relationship with the platform ends the moment Stripe Checkout returns. `client/app/(marketing)/donate/thanks/page.tsx` is the only donor-facing surface that exists. There is no reason for a backer to come back, and no delivery mechanism for the post-event updates the repo root `AGENTS.md` names as a [STRICT] differentiator.
- **Primary outcomes:**
  - A backer dashboard at `/backers` listing backed athletes, total impact, upcoming backed events, and recent results.
  - An athlete can link a race result to one of their events; doing so marks the event complete and notifies every backer of that event exactly once.
  - An in-app notification bell and a chronological result log for backers.
  - A "Proud Backer" share graphic generated from a result.

---

## 1) Success criteria

- A signed-in user with at least one `SUCCEEDED` donation sees every athlete they have backed at `/backers`, with correct per-athlete totals in dollars, verified against the `donations` rows.
- An athlete linking a race result to one of their own events notifies every backer of that event's campaign(s) exactly once, and re-saving their profile notifies nobody.
- An athlete cannot link a result to an event they do not own.
- A backer with an unread notification sees a badge in the site header; opening the notification marks it read and lands on the athlete's profile at the result.
- Every new client surface renders correctly with `NEXT_PUBLIC_DATA_SOURCE` unset (mock mode), so the static export build still succeeds.
- A guest donation made with an email that later signs up is attached to that account and appears on the dashboard.

**Acceptance criteria (definition of done):**
- `npm run ci` from the repo root passes (excluding the pre-existing `cdk` `constructs` type errors documented in the prior task).
- New Zod contracts live in `common/src/zod/` and are consumed by both `app/` and `client/` with zero duplicated request/response interfaces.
- All new backend read paths go through repositories; no `PrismaClient` import in a controller or service.
- Backend unit tests cover: dashboard aggregation, result-to-event ownership, notification fan-out idempotency across repeated profile saves, and guest-donation claim.
- The Prisma migration is **drafted by the user**, not by AI (see §6 Constraints).

---

## 2) Scope and non-goals

**In scope:**
- Linking an existing `AthleteRaceResult` to an `AthleteEvent`, and marking that event complete.
- `BackerNotification` in-app notification model with an idempotent fan-out triggered by a result being linked to an event, and by a backer's own donation succeeding.
- Backer read APIs: dashboard aggregate, result log, notification list/read.
- Guest-donation claim on sign-up by matching `Donation.supporterEmail`.
- Client surfaces: `/backers`, `/backers/activity`, `/backers/share/[athleteRaceResultId]`, and a header notification bell.
- Mock-mode fixtures for every new client surface.

**Out of scope:**
- **A separate debrief/recap model.** An earlier draft of this plan introduced an `EventDebrief` aggregate with its own draft/publish lifecycle. The race result *is* the update. `AthleteRaceResult` already exists, already has `resultName`, `resultSummary`, `photoRefs`, `resultUrl`, and `links`, is already written by `PUT /v1/athletes/me/races`, and is already rendered publicly on the athlete profile. Adding a parallel model would duplicate all of it.
- **Post-hoc spend accounting.** No receipt uploads, OCR, verification badges, audit hashes, or "where the money went" ledger. The Stitch `arc_backer_event_transparency_report` mock shows all of these; there is no file storage and no OCR provider in this repo, and claiming verification we do not perform would violate the [STRICT] Transparency differentiator rather than serve it. Campaigns already show planned spend via `CampaignCostLine` at donate time — see §15 for the open question this leaves.
- **A standalone debrief page.** The result renders on the athlete's public profile, which is already the shareable artifact. No `/debriefs/[id]` route, no public debrief read API.
- **"Win probability +12% vs unfunded avg"** and similar inferred analytics from the same mock. We have no data to support that claim.
- **Email delivery of notifications.** `EmailService` (Resend) is Step 7 of the in-flight `.ai/tasks/2026-07-19/platform-polish-and-real-auth/` plan and does not exist yet. `BackerNotification` is designed so an email sender attaches later without a schema change.
- **Magic-link dashboard access for guests.** Guests are invited to create an account instead.
- **A backer-only bottom navigation bar.** The Stitch mocks show a 4-tab mobile nav; the repo already has `client/components/site/MobileBottomNav.tsx`. Extend it rather than introducing a second nav shell.
- Corporate-sponsor or ambassador-program dashboards.

**Out-of-scope edge cases:**
- A donation refunded *after* a notification was sent — the notification stays. Rare, and silently retracting a message the user already read is worse than leaving it.
- An athlete materially rewriting a result after it was announced. Backers are notified once per event; they are not re-notified on edits. Re-notifying on every save is the failure mode we are explicitly designing against (§5).
- Multiple athletes sharing one event — `AthleteEvent` is owned by exactly one athlete.
- Backer-authored comments or cheers on a result. That is a community feature; `/community` already has cheers.
- Real-time push/websocket delivery. Reading unread count on mount is sufficient at current volume.

---

## 3) Background and motivation

The repo root `AGENTS.md` names three [STRICT] differentiators, the first of which is: transparency — supporters can see what they are funding and **receive post-event updates**.

Today the platform delivers the first half (campaigns carry `CampaignCostLine` rows showing planned spend, surfaced in the donate flow) and none of the second. `AthleteEvent` has no completion state and no link to any result. `AthleteRaceResult` exists and is rendered on profiles and in the community feed, but is entirely disconnected from campaigns and events — so there is no way to say "the thing you funded happened, and here is how it went." `PlatformRole.SUPPORTER` is defined and never assigned to anyone (the symbol is referenced in `common/src/types/roles.ts:12`, but nothing ever writes or reads an assignment).

Crowdfunding is the go-to-market motion, and the retention loop for crowdfunding is the backer feeling like part of the journey. This task builds that loop with the smallest possible new surface: one nullable foreign key, one notification model, and a fan-out hooked into a write path that already exists.

Four Stitch design references informed the UI, mounted as additional working directories:
- `backer_dashboard_my_athletes_impact/` — the dashboard (used)
- `arc_backer_full_activity_result_log/` — the chronological result log (used)
- `shareable_impact_report/` — the "Proud Backer" share graphic (used)
- `arc_backer_event_transparency_report/` — the receipt-audit report (**not** used; see Out of scope)

Their Tailwind config palette is byte-identical to the `@theme` block already in `client/styles/globals.css` (`--color-primary: #ab3600`, `--color-secondary: #0453cd`, `--color-outline-variant: #e3bfb3`), so they translate to existing tokens with no new design system work.

---

## 4) Current state and gaps

### Current state
- `app/prisma/schema.prisma` — `Donation` carries `supporterUserId` (nullable, for guests), `supporterEmail`, `donationStatus`, and already has an unused `@@index([supporterUserId])`. `Campaign.athleteEventId` links a campaign to an `AthleteEvent`, which is the join that makes a backer dashboard possible: `Donation → Campaign → AthleteEvent → AthleteProfile`.
- `AthleteRaceResult` has `resultName`, `displayDate`, `occurredOn`, `resultSummary`, `resultUrl`, `links Json?`, `photoRefs String[]`, `sortOrder`. Contract: `athleteRaceResultSchema` in `common/src/zod/athlete.ts:46-58`.
- `PUT /v1/athletes/me/races` → `AthleteService.replaceMyRaceResults` (`app/src/api/athletes/AthleteService.ts:166-183`) → `AthleteRepository.replaceRaceResults` (`app/src/repositories/AthleteRepository.ts:267-291`).
- `app/src/api/webhooks/StripeWebhookService.ts` — `handleCheckoutSucceeded` folds a successful donation in one `$transaction` and ends at a bare `this.logger.info({ donationId }, 'donation.succeeded')`. That line is the natural notification hook.
- `app/src/api/follows/` — the canonical template for a "my X" authed read surface: `MyFollowsRouterFactory` mounts `basePath = '/v1/users'` alongside `UserRouterFactory`. `FollowService.listFollows` also sets the precedent for a capped, uncursored list (`FOLLOW_LIST_LIMIT = 250`, `nextCursor: null`).
- `client/lib/dataSource.ts` — the `DATA_SOURCE` mock/api seam plus the `useApiResource` async-state hook.
- `client/lib/shareImage.ts` — `drawShareCard(ctx, width, height, data, image, fonts)` renders canvas share images; `ShareCard.tsx` drives it across six platform sizes.
- `client/app/(marketing)/dashboard/DashboardClient.tsx` — the athlete dashboard, the closest structural template for the backer dashboard.

### Gaps
- `AthleteRaceResult` has no link to an `AthleteEvent` or a `Campaign`, so a result cannot be attributed to something a backer funded.
- `AthleteEvent` has no `completedAt` — nothing marks an event done.
- No notification model, no delivery mechanism, no unread state anywhere in `app/` or `client/`.
- `app/src/repositories/DonationRepository.ts` has `listForCampaign` but nothing keyed on `supporterUserId` — there is no "my donations" read path.
- No backer-facing Zod contracts in `common/src/zod/`.
- No badge-count or notification UI primitive in `client/components/ui/`.
- Guest donations (`supporterUserId: null`) are permanently orphaned; nothing ever links them to an account.

---

## 5) Changes and considerations

**Significant changes:**
- **`AthleteRaceResult` gains a nullable `athleteEventId`.** This one foreign key is what turns an existing profile artifact into a backer update. Results with no event link behave exactly as they do today.
- **New `BackerNotification` model with a unique `dedupeKey`.** Fan-out is a bulk insert with `skipDuplicates`, making repeat writes and webhook redeliveries safe without a distributed lock.
- **Backing is derived, not stored.** "Who backs this athlete" is `SELECT DISTINCT supporterUserId FROM donations JOIN campaigns WHERE donationStatus = 'SUCCEEDED'`. No new join table, no denormalized counter to drift. This mirrors the ownership-derived authorization already used in `AthleteStripeService`.
- **Guest-donation claim on sign-up.** `AuthService.signUp` attaches any `SUCCEEDED` donation whose `supporterEmail` matches the new account's email and whose `supporterUserId` is null.

**Impact and considerations:**
- **The race-results write path is replace-all.** `AthleteRepository.replaceRaceResults` runs `deleteMany` then `createMany` inside a transaction, so **every profile save destroys and recreates every result row with fresh UUIDs**. This is the single most important constraint in this task. Consequences:
  - Notification idempotency **must not** key on `athleteRaceResultId` — it churns. It keys on `athleteEventId`, giving one notification per backer per event, forever.
- **`AthleteEvent.id` also churns today, and that is a separate live bug.** `AthleteRepository.replaceRoadmapEvents` (`app/src/repositories/AthleteRepository.ts:294-316`) is likewise delete-all-then-recreate, and `client/lib/manageApi.ts` calls `replaceMyRaces` **then** `replaceMyRoadmap` on every save (`:150-156`). Because `Campaign.athleteEvent` is `onDelete: SetNull` (`app/prisma/schema.prisma:374`) and `CampaignService.createCampaign` persists `athleteEventId` (`app/src/api/campaigns/CampaignService.ts:61-77`), **every roadmap save silently destroys every campaign→event link on that athlete's profile** — severing the `Donation → Campaign → AthleteEvent` join this entire feature reads, in already-shipped code. The client compounds it: `toEditRoadmap` discards the real id (`id: uid()`, `client/lib/manageApi.ts:70-76`), so the editor cannot round-trip it. Step 3 reconciles the roadmap write path so ids survive, and is a hard prerequisite for the fan-out. Without it the dedupe key is meaningless and the result→event link is nulled on the same save that sets it.
  - The result log **must not** order or paginate by `createdAt` or `id` — both churn. It orders by `occurredOn desc`, which is the semantically correct field anyway (when the race happened, not when the row was written).
  - `athleteEventId` must be carried through the replace payload, or the link is destroyed on the athlete's next save.
- `StripeWebhookService.handleCheckoutSucceeded` gains a notification write. It must go **inside** the existing `$transaction` so the idempotency guard (P2002 on `DonationEvent.idempotencyKey`) still yields exactly-once semantics for the whole fold.
- `PlatformRole.SUPPORTER` is finally assigned — on first successful donation by an authenticated user — so the role stops being dead schema. Authorization still gates on donation ownership, not the role.
- **Per-athlete giving totals appear on the backer dashboard, and only there.** `client/AGENTS.md` [STRICT] Story-first pushes funding metrics below the athlete's identity, and funding figures were deliberately stripped from public athlete profiles. That rule governs public surfaces; a backer's private record of what they personally gave is a different artifact and belongs on their own dashboard. It must never be surfaced as an athlete-side total, and `client/components/site/AthleteCard.tsx` (exports `AthleteRow`) (used by discovery) must not gain funding props.
- Every new client route must render in mock mode or the `STATIC_EXPORT` / GitHub Pages build breaks.
- `client/AGENTS.md` says routes are organized by audience. Backers are a new audience, so they get a `/backers` prefix inside the existing `(marketing)` group (which supplies `SiteHeader`/`SiteFooter`/`MobileBottomNav`).

---

## 6) Constraints, assumptions, dependencies

**Constraints:**
- **AI must not draft or apply Prisma migrations in this task.** Repo root `AGENTS.md` [STRICT] forbids applying migrations and hand-writing migration files, but it *does* permit `npm run migrate:create --prefix app -- --name <name>` (create-only). The blocker here is environmental, not policy: that command needs a live Postgres to diff against and this machine has none (`app/.env` carries only PostHog vars, no `DATABASE_URL`). So the restriction below is this plan's own constraint, not a repo rule. The schema edit is in scope; **drafting and applying the migration is an owner follow-up**, as it was for the Stripe Connect task.
- Schema has already drifted ahead of `app/prisma/migrations/` — the entire Stripe Connect delta is unmigrated. Whatever migration the owner drafts will sweep that up too. Flag it, do not try to fix it.
- API contract changes are Zod-first: edit `common/src/zod/`, `npm run build --prefix common`, then `app/`, then `client/`.
- **Do not refactor `replaceRaceResults` away from replace-all.** It is a shipped endpoint the manage editor depends on; changing its semantics is a separate task with its own blast radius. Design around it.
- No new runtime dependencies in `client/` — it ships four (`fad-common`, `next`, `react`, `react-dom`), no state library, no test runner.
- App tests need `DATABASE_URL` exported as a placeholder or three test files stall ~75s at import; DB-backed suites are `RUN_DB_TESTS`-gated and skip cleanly.

**Assumptions:**
- A "backed athlete" means at least one `SUCCEEDED` donation to any campaign of that athlete. `PENDING`, `FAILED`, and `REFUNDED` donations do not create a backing relationship.
- A backer of an *event* is a backer of any campaign whose `athleteEventId` matches that event.
- Notification volume is low enough that a `createMany` fan-out inside a request is acceptable. Revisit above ~10k backers per event.
- Result lists are capped rather than cursor-paginated, following the `FollowService` precedent. This sidesteps keyset pagination over churning ids entirely.

**Dependencies (ordered):**
- `common/` contracts must build before `app/` handlers compile.
- Repositories must exist before services that call them.
- The result-to-event link must exist before fan-out can be triggered.
- Backer read APIs must exist before client surfaces can consume them in api mode.
- Owner follow-up: draft + apply the Prisma migration before any of this runs against a real database.

---

## 7) Requirements

**Functional requirements:**
- An authenticated user can list every athlete they have backed, with total backed cents and donation count per athlete.
- The dashboard returns, in one request: an impact summary (backed athlete count, total backed cents, backed event count, unread notification count), the backed athlete list with each athlete's most recent result, upcoming backed events with campaign funding progress, and recent results from backed athletes.
- An athlete can set `athleteEventId` on a race result via the existing `PUT /v1/athletes/me/races` payload, and only for events they own.
- Linking a result to an event sets `AthleteEvent.completedAt` and notifies every backer of that event exactly once, ever.
- Re-saving the athlete profile produces zero additional notifications.
- A backer can list their notifications (newest first), see an unread count, mark one read, and mark all read.
- A backer can browse a chronological log of results from athletes they back, filterable by athlete.
- On sign-up, any unclaimed `SUCCEEDED` donation matching the new account's email is attached to that account.
- A signed-out donor returning from Stripe Checkout is shown a dismissible prompt that explains what a profile gets them — following the athlete toward their next event, receiving the result when they finish, and keeping every backed athlete in one place — and states that the donation just made will attach automatically if they sign up with the same email. Dismissing it leaves the same offer inline; it never blocks the thank-you.
- A backer can open a share view of a result and download a canvas-rendered "Proud Backer" graphic in square and story ratios.

**Non-functional requirements:**
- Fan-out is idempotent across arbitrarily many profile saves.
- The webhook fold stays a single transaction; adding notifications must not introduce a second round-trip that can partially fail.
- The dashboard aggregate is one endpoint, not four.
- Unread-count reads are index-backed (`@@index([recipientUserId, readAt])`).
- Every new page reads in under 10 seconds and works at 375px width, per `client/AGENTS.md` [STRICT] Minimalism.
- No secrets, tokens, or full request bodies in logs.

---

## 8) Proposed approach

- **Backend layout** follows the established `app/src/api/<feature>/` triplet convention: one new `app/src/api/backers/` folder holding the router factory, controller, service, and the notification service. Router factories are registered by hand in the `routerFactories` array in `app/src/app.ts`; tsyringe needs no registration file (there is no `DependencyInjector.ts` in this repo).
- **Route mounting** reuses the `MyFollowsRouterFactory` precedent: a `BackerRouterFactory` with `basePath = '/v1/users'` serving `/me/backer-dashboard`, `/me/backer-activity`, and `/me/notifications*`. Order it after `UserRouterFactory`; there is no path collision because `UserRouterFactory` only claims `/me` exactly.
- **No new athlete-facing endpoint.** The result-to-event link rides the existing `PUT /v1/athletes/me/races` payload, so athletes get this in the manage editor they already use.
- **Fan-out** lives in a `BackerNotificationService` with `fanOutEventResult(...)` and `fanOutDonationSucceeded(...)`, both taking a `Prisma.TransactionClient`, mirroring how `DonationRepository` threads `tx` today.
- **Backing derivation** lives in a new `BackerRepository` that owns the `Donation`-keyed aggregate queries, keeping `DonationRepository` focused on the payment lifecycle.
- **Client layout** adds `client/app/(marketing)/backers/` (dashboard + activity + share) and `client/components/site/NotificationBell.tsx`. Data flows through new loaders in `client/lib/apiLoaders.ts` and hooks in `client/lib/dataSource.ts`, with fixtures in `client/lib/mockBackers.ts`.
- **Share graphic** extends `client/lib/shareImage.ts` rather than introducing a second canvas renderer.

---

## 9) Data model and contracts

### Data model changes

`app/prisma/schema.prisma`:

```prisma
model AthleteEvent {
  // …existing fields…
  completedAt DateTime?
}

model AthleteRaceResult {
  // …existing fields…
  // Nullable link that attributes a result to a funded event. Set by the athlete
  // through the existing race-results write path; drives backer fan-out.
  athleteEventId String? @db.Uuid

  athleteEvent AthleteEvent? @relation(fields: [athleteEventId], references: [id], onDelete: SetNull)

  @@index([athleteEventId])
}

enum BackerNotificationType {
  EVENT_RESULT_POSTED
  DONATION_SUCCEEDED
}

model BackerNotification {
  id                String                 @id @default(uuid()) @db.Uuid
  recipientUserId   String                 @db.Uuid
  notificationType  BackerNotificationType
  athleteId         String                 @db.Uuid
  athleteEventId    String?                @db.Uuid
  campaignId        String?                @db.Uuid
  notificationTitle String
  notificationBody  String
  // Idempotency guard. Keyed on athleteEventId, NOT athleteRaceResultId: the
  // races write path is delete-all-then-recreate, so result ids churn on every
  // profile save. Event ids are stable only because the roadmap write path was
  // reconciled to update in place rather than recreate (context §5).
  dedupeKey         String                 @unique
  readAt            DateTime?
  createdAt         DateTime               @default(now())

  recipient User @relation(fields: [recipientUserId], references: [id], onDelete: Cascade)

  @@index([recipientUserId, readAt])
  @@index([recipientUserId, createdAt])
  @@map("backer_notifications")
}
```

`User` gains `backerNotifications BackerNotification[]`. `AthleteEvent` gains `raceResults AthleteRaceResult[]`.

### OpenAPI changes

There is no `common/openapi.yaml` in this repo — contracts are Zod-only.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/v1/users/me/backer-dashboard` | required | Aggregate dashboard payload |
| GET | `/v1/users/me/backer-activity` | required | Result log, `?athleteId=` filter |
| GET | `/v1/users/me/notifications` | required | Notification list + unread count |
| POST | `/v1/users/me/notifications/:notificationId/read` | required | Mark one read |
| POST | `/v1/users/me/notifications/read-all` | required | Mark all read |
| PUT | `/v1/athletes/me/races` | required | **Existing.** Payload gains optional `athleteEventId` per race |

### Example shapes

`GET /v1/users/me/backer-dashboard`:

```json
{
  "impactSummary": {
    "backedAthleteCount": 3,
    "totalBackedCents": 125000,
    "backedEventCount": 4,
    "unreadNotificationCount": 2
  },
  "backedAthletes": [
    {
      "athleteId": "…",
      "athleteSlug": "cassandra-de-winter",
      "athleteName": "Cassandra de Winter",
      "primarySport": "RUNNING",
      "disciplineLabel": "Ultra Runner",
      "heroMediaUrl": "…",
      "totalBackedCents": 50000,
      "donationCount": 2,
      "firstBackedAt": "2026-05-02T18:11:00.000Z",
      "latestResultName": "Lost Soul Ultra",
      "latestResultSummary": "1st place, 100km — a course record.",
      "latestResultOccurredOn": "2026-07-18"
    }
  ],
  "upcomingBackedEvents": [
    {
      "athleteEventId": "…",
      "eventName": "Lost Soul Ultra",
      "eventStartDate": "2026-10-15",
      "athleteSlug": "cassandra-de-winter",
      "athleteName": "Cassandra de Winter",
      "campaignId": "…",
      "campaignSlug": "lost-soul-ultra-2026",
      "targetAmountCents": 200000,
      "raisedAmountCents": 150000
    }
  ],
  "recentResults": [
    {
      "athleteRaceResultId": "…",
      "athleteEventId": "…",
      "athleteSlug": "marcus-chen",
      "athleteName": "Marcus Chen",
      "primarySport": "RUNNING",
      "resultName": "Vancouver 10k",
      "displayDate": "May 2026",
      "occurredOn": "2026-05-14",
      "resultSummary": "1st place — 29:42, a 14-second personal best.",
      "resultUrl": "https://results.example.com/van10k",
      "heroPhotoRef": "…",
      "wasBacked": true
    }
  ]
}
```

`GET /v1/users/me/backer-activity` returns `{ "items": [ …backedResultSchema… ], "nextCursor": null }` — capped, uncursored, ordered by `occurredOn` descending. See §6 assumptions.

---

## 10) Package-level impact

### common/
- `common/src/zod/athlete.ts` — add optional `athleteEventId` to `athleteRaceResultSchema` and to `setRaceResultInputSchema`.
- New `common/src/zod/backer.ts` — `backedAthleteSchema`, `impactSummarySchema`, `upcomingBackedEventSchema`, `backedResultSchema`, `backerDashboardResponseSchema`, `backerActivityQuerySchema`, `backerActivityResponseSchema`.
- New `common/src/zod/notification.ts` — `backerNotificationSchema`, `backerNotificationListResponseSchema`.
- `common/src/types/enums.ts` — add `BackerNotificationType`.
- `common/src/index.ts` — barrel exports for the two new modules.

### app/
- `app/prisma/schema.prisma` — changes from §9.
- New repositories: `app/src/repositories/BackerRepository.ts`, `BackerNotificationRepository.ts`. `DonationRepository` gains `claimForSupporterEmail`. `AthleteRepository.replaceRaceResults` carries `athleteEventId` through.
- New feature folder `app/src/api/backers/` — router factory, controller, service, notification service.
- `app/src/api/athletes/AthleteService.ts` — ownership validation of `athleteEventId`, event completion, and fan-out on `replaceMyRaceResults`.
- `app/src/api/webhooks/StripeWebhookService.ts` — notification write inside the existing fold transaction; assign `PlatformRole.SUPPORTER`.
- `app/src/api/auth/AuthService.ts` — guest donation claim on sign-up.
- `app/src/app.ts` — register `BackerRouterFactory`.

### client/
- New routes: `client/app/(marketing)/backers/page.tsx` + `BackerDashboardClient.tsx`, `client/app/(marketing)/backers/activity/`, `client/app/(marketing)/backers/share/[athleteRaceResultId]/`.
- New components: `client/components/site/NotificationBell.tsx`, `client/components/ui/EmptyState.tsx`, `client/components/ui/StatTile.tsx`.
- `client/lib/api.ts` — authed backer helpers.
- `client/lib/mockBackers.ts` — fixtures.
- `client/lib/apiLoaders.ts`, `client/lib/adapters.ts`, `client/lib/dataSource.ts` — loaders, view-model adapters, hooks.
- `client/lib/shareImage.ts` — backer share-card variant.
- `client/components/site/SiteHeader.tsx`, `MobileBottomNav.tsx` — backer entry points.
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx` — event picker on each race result row.
- `client/app/(marketing)/donate/thanks/page.tsx` + new `SignUpPrompt.tsx` — journey-framed sign-up modal for guests, dashboard link for signed-in backers.
- `client/app/(marketing)/sign-up/SignUpForm.tsx` — contextual line when arriving with `?from=donation`.

### docs/
- `docs/product-brief.md` — note the backer loop as a shipped pillar once complete.

---

## 11) Edge cases and error handling

- **User has zero successful donations:** dashboard returns empty collections with zeroed summary; the client renders the dashed-border empty state pointing at `/athletes`, not an error.
- **[SECURITY] Guest-donation claim on an unverified email:** claiming donations by matching `Donation.supporterEmail` to a new account's email discloses that email's donation history — which athletes they backed, how much, and when — to whoever signs up with the address first. Today nothing prevents that: `User.emailVerifiedAt` exists but is never set (the verification flow is Step 8 of the in-flight `platform-polish-and-real-auth` plan), and `SignupAllowlistService` is **open when `SIGNUP_EMAIL_ALLOWLIST` is unset** (`app/src/services/infrastructure/SignupAllowlistService.ts:5-7`). The claim must therefore be gated on a verified email, not on sign-up. See §15 — this affects task sequencing.
- **Guest donation, never claimed:** invisible to any dashboard. `/donate/thanks` invites account creation.
- **Guest signs up with a different email than they donated with:** donation stays unclaimed. Accepted; no fuzzy matching. The prompt copy therefore has to say "the same email" explicitly, not imply it.
- **Guest dismisses the sign-up prompt:** the same offer stays on the page as an inline card. The modal does not reappear during that visit.
- **Athlete slug missing from the Checkout return URL:** the prompt falls back to "this athlete" wording rather than rendering an empty name, matching how the existing thank-you headline already degrades.
- **Signed-in donor returns from Checkout:** no modal at all — they get a dashboard link. The prompt stays hidden until `useSession()` reports `ready` so it never flashes at them.
- **Athlete links a result to an event they do not own:** `ForbiddenError` (403), and the whole race-results save is rejected — partial application would silently drop the link.
- **Athlete links a result to a nonexistent event:** `ValidationError` (422) via the same ownership check path.
- **Athlete re-saves their profile with the same links:** rows are recreated with new ids, `completedAt` stays at its original value, and `skipDuplicates` means zero new notifications.
- **Athlete removes the event link from a result:** `completedAt` is left set and notifications already sent stay. Un-completing an event that demonstrably happened is not a state worth modelling.
- **Event has no campaign, or only `PENDING` donations:** result links fine, fan-out finds zero recipients, nothing is sent.
- **Two results linked to the same event:** one notification total, because `dedupeKey` is per-event. Correct — the backer cares about the event, not the row count.
- **Notification referencing a soft-deleted athlete:** filtered out of the list query rather than rendered with a broken link.
- **Marking an already-read notification read:** idempotent no-op, still 204.
- **Cross-user notification id:** 404, never 403 — do not confirm another user's row exists.
- **Client in mock mode:** every backer surface renders from `client/lib/mockBackers.ts`; no fetch is attempted.
- **Signed-out visitor hits `/backers`:** the `SignedOutGate` card pattern from `DashboardClient.tsx`, with sign-in and browse-athletes CTAs.

---

## 12) Failure modes and concurrency

**Concurrency/race conditions:**
- Two simultaneous profile saves both linking the same event: both attempt the fan-out `createMany`. `skipDuplicates: true` plus the `dedupeKey` unique constraint means the loser inserts nothing. `completedAt` is a guarded `updateMany` on `{ completedAt: null }`, so it is written once.
- A donation succeeding while a result is being linked: the new backer may or may not be in the fan-out set depending on transaction ordering. Acceptable — they see the result in their log and dashboard regardless; only the notification is potentially missed.
- Simultaneous `read-all` and single-read: both are idempotent `updateMany` calls setting `readAt` where `readAt IS NULL`.

**Idempotency and retries:**
- Stripe redelivers webhooks. The notification write goes inside the existing fold `$transaction`, so the P2002 rollback on `DonationEvent.idempotencyKey` already covers it. The `dedupeKey` is a second, independent guard.
- The race-results save is idempotent for notification purposes by construction — this is the property the whole `dedupeKey`-on-event design exists to guarantee, given the replace-all write path.
- No retry/backoff logic is introduced — there are no new outbound network calls in this task.

**Transaction shape (verified against the code):**
- `AthleteRepository.replaceRaceResults` opens its own `this.prisma.$transaction` today (`app/src/repositories/AthleteRepository.ts:267-291`). Prisma has **no nested interactive transactions**, so folding fan-out into the same transaction requires refactoring that method to reuse a supplied `Prisma.TransactionClient`. Skipping that refactor does not fail loudly at compile time — it deadlocks or errors at runtime, which is why it is called out explicitly in Steps 3 and 4.
- The fold spans a full result replace plus two queries per linked event, against Prisma's default 5s interactive-transaction timeout. The timeout is raised deliberately to 15s and the per-event work is capped at two queries (one recipient lookup, one `createMany`). Per-recipient loops are forbidden.
- `AthleteService` gains a `PrismaService` injection to open the transaction, matching `StripeWebhookService` (`app/src/api/webhooks/StripeWebhookService.ts:22-31`). This is orchestration only; queries stay in repositories, so `app/AGENTS.md` still holds.

**Failure modes:**
- Fan-out fails during a race-results save: the whole save rolls back, no links are persisted, and the athlete sees a 500. Retrying is safe. This deliberately couples an athlete's profile save to notification success — chosen for consistency, but it means a notification bug can block profile edits. If that trade proves wrong in practice, the alternative is a best-effort fan-out outside the transaction, which risks silently never notifying if the athlete does not save again.
- Fan-out fails inside the webhook fold: the transaction rolls back, the webhook returns 500, Stripe retries, and the idempotency guard makes the retry safe. This is the existing contract and must not be weakened — do not swallow notification errors in the webhook.
- The backer dashboard aggregate is the heaviest new read. If it degrades, the fix is an index or a split endpoint, not caching — there is no cache layer in this repo.
- Client API failure: `useApiResource` surfaces one plain error sentence via the existing gate-component pattern; never a code or payload.

---

## 13) Operational readiness

**Observability:**
- `logger.info({ athleteEventId, recipientCount }, 'event.result_posted')` on a successful fan-out — the single most useful signal for whether the loop is working.
- `logger.info({ donationId, recipientUserId }, 'backer.notification.donation_succeeded')` in the webhook fold.
- `logger.warn({ userId, claimedDonationCount }, 'donation.claimed_on_signup')` when a guest donation is attached.
- Existing `errorHandler` already logs domain errors at `warn` and unknown errors at `error`; no new error plumbing needed.

---

## 14) Research and references

**Provider contract evidence (third-party API gate):**
- The only third-party API in scope is **Stripe**, and this task **parses no new Stripe response fields**. It extends the existing fold in `handleCheckoutSucceeded` with writes derived entirely from our own persisted rows (`donation.supporterUserId`, `donation.donationAmountCents`, `campaign.athlete.fullName`, `campaign.campaignTitle`). No new endpoint, no new webhook event type, no new payload shape is read.
- The Stripe contract this builds on was verified during `.ai/tasks/2026-07-19/completed/stripe-connect-crowdfunding/`, which pinned `STRIPE_API_VERSION = '2026-06-24.dahlia'` in `app/src/services/infrastructure/StripeService.ts:10` and covers the handled event types. That evidence carries forward unchanged.
- **Consequence:** no new provider-contract verification is required for this task. If a step is later added that reads a Stripe field not already parsed, that step must run `$provider-contract-verification` (`/provider-contract-verification`) before implementation.

**Prisma feature dependencies (pinned at `prisma`/`@prisma/client` ^5.20.0, per `app/package.json`):**
- `createMany({ skipDuplicates: true })` — the fan-out idempotency mechanism. Supported on PostgreSQL in Prisma 5.
- `findMany({ distinct: [...] })` and `groupBy` with `_sum`/`_count`/`_min` — the backing aggregates.
- `$transaction(fn, { timeout })` — interactive transaction with a raised timeout; the default is 5s.
- `orderBy: { occurredOn: { sort: 'desc', nulls: 'last' } }` — **verify this compiles against 5.20 before relying on it.** If null ordering is unavailable, fall back to filtering out null `occurredOn` rows in the backer result log, and note the exclusion rather than letting undated results sort to the top.


- Stitch UI references (additional working directories, `code.html` + `screen.png` in each): `backer_dashboard_my_athletes_impact/`, `arc_backer_full_activity_result_log/`, `shareable_impact_report/`. Their Tailwind palette matches the `@theme` block in `client/styles/globals.css` exactly. `arc_backer_event_transparency_report/` is deliberately unused (§2).
- Prior task, completed: `.ai/tasks/2026-07-19/completed/stripe-connect-crowdfunding/` — the donation lifecycle, webhook fold, and non-custodial invariant this builds on.
- Prior task, in flight: `.ai/tasks/2026-07-19/platform-polish-and-real-auth/` — Steps 6-8 add `EmailService` (Resend) and new token models. Email delivery of backer notifications is deferred until that lands. Step 6 also drafts a migration; coordinate migration naming with the owner.
- Repo root `AGENTS.md` — [STRICT] differentiators, Zod-first contract workflow, Prisma CLI restrictions, explicit-naming and comment rules.
- `app/AGENTS.md` — repository-only Prisma access, typed domain errors, thin controllers.
- `client/AGENTS.md` — [STRICT] Minimalism, Story-first, Transparency; `formatCents` as the single money helper.

---

## 15) Open questions

- **Does the guest-donation claim ship dormant, or does this task wait on email verification?** The claim is gated on `emailVerifiedAt` for the security reason in §11, and nothing sets that field until Step 8 of `.ai/tasks/2026-07-19/platform-polish-and-real-auth/` lands. So as planned, guest donations are never claimed and the `/donate/thanks` sign-up prompt promises something that does not yet happen. Three options, and the choice is the owner's: (a) ship dormant and land the auth task next, accepting that the prompt's "we'll connect this donation" line is premature — in which case that sentence must be cut from the modal until verification exists; (b) sequence the auth task first; (c) claim on unverified sign-up anyway, accepted only if `SIGNUP_EMAIL_ALLOWLIST` is enforced in every deployed environment, which is not currently true by default. **Recommendation: (b).** It is the only option where the copy and the behaviour agree.
- **Migration sequencing with the in-flight auth task.** Both this plan and `platform-polish-and-real-auth` Step 6 add Prisma models, and neither can draft a migration on this machine. The owner needs to decide whether to draft one combined migration or two, and in what order — a decision that depends on which task they intend to ship first.
- **Whether "how the money was actually spent" ever gets built.** This plan closes the loop on *outcome* (the result) but not on *spend*. Backers see planned spend via `CampaignCostLine` at donate time and never find out what was actually spent. That may be fine — the athlete-story framing is the product's centre of gravity, and receipt collection is a real burden on non-technical athletes. But it is a deliberate gap, and worth an explicit product decision rather than drifting into it.
