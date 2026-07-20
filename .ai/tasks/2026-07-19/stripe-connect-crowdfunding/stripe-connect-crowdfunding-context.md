# Stripe Connect Crowdfunding — Non-Custodial Direct Donations (Phase 2 Money Loop)

Date: 2026-07-19
Task slug: stripe-connect-crowdfunding
Status: Draft

## 0) Summary

- **Objective:** Let supporters donate to an athlete from their profile through a "Donate" button that opens a Stripe-hosted Checkout page, with funds flowing **directly** into the athlete's own Stripe (Connect **Standard**) account — the platform never holds or touches the money and takes zero fee.
- **Why now:** The launch frontend ships "Back this athlete" CTAs that all dead-end at a `/support` "coming soon" teaser. The backend foundation (Phase 0/1) is complete — real JWT auth, `AthleteProfile`/`Campaign`/`Donation` models, campaign read + create — but there is **no payment code anywhere**. Crowdfunding is the go-to-market anchor (`docs/product-brief.md`); without a working money loop the primary pillar is inert.
- **Primary outcomes:**
  - An athlete can connect (or create) their own Stripe account via Stripe-hosted onboarding and see their payout-readiness status.
  - A supporter (signed-in or guest) can donate a chosen amount and complete payment on Stripe's hosted page; the donation is recorded and the campaign total updates.
  - The platform is provably **non-custodial**: direct charges on the athlete's connected account, `application_fee_amount` omitted, no funds ever routed through a platform balance.

---

## 1) Success criteria

- An authenticated athlete can start Stripe onboarding from their dashboard, complete Stripe's hosted flow, return to ARC, and see a "charges enabled" status once Stripe verifies them.
- On an athlete profile with `supportEnabled` and an `ACTIVE` campaign whose athlete has charges enabled, a "Donate" button lets a supporter choose an amount and is redirected to a **Stripe-hosted Checkout page** to pay.
- A completed test-mode payment: (a) creates a `Donation` that transitions `PENDING → SUCCEEDED` via webhook, (b) appends a `DonationEvent` to the append-only ledger, (c) atomically increments the campaign `raisedAmountCents` + `supporterCount`, and (d) flips the campaign to `FUNDED` when the target is reached.
- The Checkout Session is created **on the connected account** (`Stripe-Account` header) with **no** `application_fee_amount` — verified in test mode that the net lands in the athlete's balance and no funds touch the platform balance.
- Duplicate webhook deliveries (same Stripe event id) are processed exactly once (idempotent).
- The webhook route verifies the Stripe signature against the **Connect** signing secret using the **raw** request body.

**Acceptance criteria (definition of done):**
- `npm run ci` at repo root passes (type-check, lint, build, tests).
- Backend unit/integration tests cover: onboarding link creation + status gating, donation creation guards (campaign `ACTIVE`, before `closesAt`, athlete charges-enabled, minimum amount), webhook idempotency (duplicate event id no-ops), ledger→projection fold (`SUCCEEDED` increments + `FUNDED` flip), overfunding accepted past target, raw-body mount ordering.
- A new Prisma migration is **drafted** (not applied) via `npm run migrate:create --prefix app -- --name add_stripe_connect_donations` and includes `AthleteProfile.stripeAccountId`/`stripeChargesEnabledAt`, `Donation.stripePaymentIntentId`, `DonationEvent`, `WebhookEvent`, and enum `DonationEventType`.
- `app/.env.example` documents every new Stripe env var; no live secret is committed.
- All new request/response shapes are defined in `common/src/zod/` and imported from `fad-common` — never redefined in `app/` or `client/`.

---

## 2) Scope and non-goals

**In scope:**
- Stripe Connect **Standard** connected-account onboarding for athletes via **Account Links** (Stripe-hosted), including "connect an existing account or create a new one."
- Direct-charge **Stripe Checkout** donation flow (hosted page), zero platform fee, default currency **CAD**.
- Append-only `DonationEvent` ledger + `Donation` projection + campaign projection updates, driven by a signature-verified Stripe **Connect webhook**.
- Client surfaces: an athlete "Connect Stripe / payout status" card in the dashboard/manage area, and a donor donation entry (amount presets + custom) replacing the `/support` dead-ends on profiles, gated by `supportEnabled` + campaign `ACTIVE` + athlete charges-enabled.
- Everything runs against **Stripe test mode**; live keys are user-supplied and deferred.

**Out of scope:**
- All-or-nothing (Kickstarter) pledges / saved-card off-session capture / scheduled deadline resolver — explicitly deferred in `docs/backend-build-sheet.md` ("Deferred").
- Any non-custodial → custodial variant (destination charges, separate transfers, platform-balance routing, application fees). These re-trigger MSB/money-transmitter analysis and are prohibited by `docs/business/incorporation-and-finances.md`.
- Corporate sponsorships / ambassador pillars (Phase 5).
- Athlete payout management UI (payouts are owned by the athlete inside their own Stripe Dashboard — that is the point of Standard).
- Refund/dispute *initiation* UI (refunds and disputes are handled by the athlete in their Stripe Dashboard; ARC only *records* the resulting webhook events).
- CDK/infra wiring for the webhook route and secrets (tracked separately in the Infra track of `docs/backend-build-sheet.md`); this task keeps to app/common/client + `.env.example`.

**Out-of-scope edge cases:**
- Multi-currency per campaign — campaigns have no `currency` column today; default to CAD platform-wide and defer per-campaign currency.
- A donor's Checkout Session expiring then the donor retrying — Stripe issues a fresh session per donation attempt; stale sessions simply never complete and their `PENDING` donations are ignored.
- Connected-account de-authorization / `account.application.deauthorized` handling beyond marking charges disabled — full offboarding is deferred.

---

## 3) Background and motivation

FAD/ARC is a story-first athlete network whose go-to-market anchor is crowdfunding (`docs/product-brief.md`). Its stated differentiator is that **money moves directly to the athlete** — "unlike Makeachamp, which holds funds." `docs/business/incorporation-and-finances.md` turns that into a hard architectural constraint: the platform must be **non-custodial** so it stays a *technology platform*, not a FINTRAC-registered money-services business — no MSB registration, no AML program on ARC, KYC offloaded to Stripe, chargeback/PCI/fund-flow liability sitting with Stripe and the athlete.

`docs/backend-build-sheet.md` locks the implementation of that model:

> Payment provider — **Stripe Connect — Standard accounts, direct charges, fee 0** — funds never touch the platform. Athlete is merchant of record; owns Stripe fees, refunds, disputes, payouts. Platform takes **0** and holds nothing. Persistence via an **event-sourced ledger** (`DonationEvent`, append-only); campaign totals are projections folded from it.

This task implements Phase 2 of that build sheet, with two refinements validated against the current Stripe API (July 2026 — see §14):
- **Onboarding uses Account Links + controller properties, not OAuth.** Stripe now states "OAuth isn't recommended for new Connect platforms." Account Links is the current Stripe-hosted onboarding path for Standard accounts.
- **The donor payment surface is Stripe Checkout (hosted), not embedded PaymentIntent/Elements.** This matches the product requirement — "take them to a Stripe page, put in their donation amount" — and is fully compatible with Standard + direct charges + zero fee.

Product rules preserved: transparency (cost lines already enforced Σ = target at campaign create), athlete story before metrics, minimalist UX (a single Donate button; Stripe hosts the payment surface so ARC builds almost no payment UI). Legal disclosures at the point of donation (not-a-charity / not-tax-deductible / athlete income is taxable / ARC does not control spending) are required by `docs/business/incorporation-and-finances.md` §5 and are included in the donor flow.

---

## 4) Current state and gaps

### Current state
- **Backend foundation complete** (`.ai/tasks/2026-07-13/completed/backend-foundation-test-deploy`): runnable Express 5 app (`app/src/app.ts` `buildApp()`), Prisma with a single applied migration `app/prisma/migrations/20260713174510_init/`, seed script, vitest + supertest harness.
- **Real auth exists:** argon2 hashing, HS256 JWT (`app/src/services/infrastructure/JwtService.ts`, singleton with a constructor env-guard), bearer `AuthenticationMiddleware` exposing `req.authenticatedUserId` with `.required`/`.optional`.
- **DI is decorator-driven** (tsyringe, `@injectable()`/`@singleton()`, no central registry). Routes are `BaseRouterFactory` subclasses resolved and mounted in `app/src/app.ts`. Adding a feature = new injectable RouterFactory + one `container.resolve(...)` line in `buildApp()`.
- **Feature pattern to mirror:** `app/src/api/campaigns/{CampaignRouterFactory,CampaignController,CampaignService}.ts` + `app/src/repositories/CampaignRepository.ts` (repository-per-aggregate; only repos touch `PrismaService`). Shared helpers: `app/src/shared/{errors.ts,ResponseHandler.ts,requestParsers.ts,keysetCursor.ts,BaseRouterFactory.ts}`.
- **Schema (`app/prisma/schema.prisma`):** `AthleteProfile` (identity/story, no Stripe fields), `Campaign` (`campaignStatus DRAFT|ACTIVE|FUNDED|COMPLETED|ARCHIVED`, `targetAmountCents`, `raisedAmountCents @default(0)`, `supporterCount @default(0)`, `closesAt`, `costLines`), `Donation` (already has `paymentProviderRef String? @unique`, `donationStatus PENDING|SUCCEEDED|REFUNDED|FAILED`, guest fields `supporterDisplayName`/`supporterEmail?`, `isAnonymous`). Money is integer cents everywhere.
- **Contracts (`common/src/zod/`):** `donation.ts` has `donationSchema` + `createDonationRequestSchema` (`.strict()`: `campaignId`, `supporterDisplayName`, `supporterEmail?`, `donationAmountCents` positive int, `donationMessage?`, `isAnonymous?`) — **no** payment-session/response shape. `campaign.ts` has the full campaign contract. Enums in `common/src/types/enums.ts` (`DonationStatus`, `CampaignStatus`). Barrel: `common/src/index.ts`. No OpenAPI file — Zod is the single source of truth.
- **Client:** typed fetch layer `client/lib/api.ts` (`apiRequest` unwraps `{data}`/`{error}`, `safeParse` against `fad-common`, bearer auth via `session.ts` provider seam; already has `fetchAthleteCampaigns(slug)`). Mock/api seam in `client/lib/dataSource.ts` + `client/lib/adapters.ts` (note: the API profile adapter hard-codes `campaigns: []`). Profile UI `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx` gates all funding UI on `supportEnabled`; three "Back this athlete" CTAs (≈ lines 166, 565, 602) all `<Link href="/support">`; the `#back` section (≈ 548–573) is the natural donate home. `/support` is a static teaser (`client/app/(marketing)/support/page.tsx`). Athlete = `athleteSlug` client-side; UUID `athleteId`/`campaignId` server-side.

### Gaps
- No `stripe` dependency; no `StripeService`; no Stripe env vars (`app/.env.example`).
- No `DonationRepository`/`DonationService`/`DonationController`/donation route (schema + contract only).
- No `DonationEvent` / `WebhookEvent` models, no `DonationEventType` enum, no `AthleteProfile.stripeAccountId`/`stripeChargesEnabledAt`.
- No webhook route and no raw-body parsing — `app/src/app.ts` applies a single global `express.json({ limit: '15mb' })` that would consume the stream a Stripe signature needs.
- No client helpers for onboarding/donation, no athlete "Connect Stripe" UI, no donor donation widget, no Checkout success/cancel return pages; campaigns are not wired into the API profile view model.

---

## 5) Changes and considerations

**Significant changes:**
- New infra singleton `StripeService` (mirrors `JwtService`'s singleton + constructor env-guard) wrapping `stripe-node` v22, `apiVersion` pinned to `2026-06-24.dahlia`, `maxNetworkRetries` set.
- New Prisma migration (drafted): `AthleteProfile.stripeAccountId String? @unique` + `stripeChargesEnabledAt DateTime?`; append-only `DonationEvent`; `WebhookEvent` idempotency/audit table; enum `DonationEventType`.
- New donation feature slice (`app/src/api/donations/`) + webhook slice (`app/src/api/webhooks/`), plus repositories (`DonationRepository`, `DonationEventRepository`, `WebhookEventRepository`) and extensions to `AthleteRepository`/`CampaignRepository`.
- `app/src/app.ts` refactor: mount the webhook route with `express.raw({ type: 'application/json' })` **before** the global `express.json(...)` so signature verification sees the raw body.
- Client: `api.ts` helpers, an athlete Stripe-connect card in the dashboard/manage area, a donor donation widget wired into `AthleteProfile.tsx`, and Checkout success/cancel return pages.

**Impact and considerations:**
- **Non-custodial invariant is load-bearing** — every charge is a direct charge on the connected account with `application_fee_amount` omitted. A reviewer must be able to confirm no destination-charge/transfer/platform-fee code exists. This is a legal posture, not just a config choice (see §14 discussion in `docs/business/incorporation-and-finances.md`); lawyer sign-off of the live flow is gating before real money (item #5 there) but does not block test-mode build.
- **api-mode only.** A live donation/onboarding flow requires `NEXT_PUBLIC_DATA_SOURCE=api` against the running API. Gate on `DATA_SOURCE === 'api'` from `client/lib/dataSource.ts` — the seam is exactly `'mock' | 'api'` (anything non-`api` is `mock`); there is **no** `'static'` value (the mock build is simply Next's static export). The mock build keeps the existing `/support` teaser; donate CTAs only activate in api mode.
- **Webhooks are the source of truth for fulfillment**, not the browser return to `success_url` (the donor may never land there). Campaign totals must never be incremented from the client or from the create-donation response.
- **Legal disclosure copy** at the point of donation is required and must be reviewed before live (not-a-charity / not-tax-deductible / athlete income is taxable / ARC does not control spending).
- **Secrets discipline:** Stripe keys via env only, never logged (the pino logger already redacts auth/cookie/password paths; ensure Stripe keys/signatures are not added to log payloads).

---

## 6) Constraints, assumptions, dependencies

**Constraints:**
- **[STRICT] Non-custodial only:** direct charges, `application_fee_amount` omitted, no platform-balance routing. No destination charges / transfers / application fees anywhere.
- **[STRICT] AI limits:** draft migrations only via `npm run migrate:create --prefix app -- --name <name>`; the **user** applies them. Migration files are immutable once created. AI never deploys.
- **[STRICT] Zod-first + import from `fad-common`:** contracts land in `common/src/zod/` first, rebuild `common`, then consume; never redefine request/response types in `app/`/`client/`.
- **Money in integer cents; dates ISO-8601 in transport, `Date` at the boundary.** Default currency **CAD**.
- **Dependency reuse:** use the official `stripe` (stripe-node) SDK; do not hand-roll HTTP to the Stripe API. No other new payment deps. Redirect-based Checkout needs **no** client-side Stripe.js/publishable key.
- Commit only when asked, via the `$commit` (`/commit`) skill.

**Assumptions:**
- Athlete identity for onboarding derives from `req.authenticatedUserId` → `AthleteProfile` (existing JWT auth is sufficient; email verification is not required to gate onboarding).
- Donations are `auth.optional` — anyone (guest or signed-in) can donate; guest identity via `supporterDisplayName` (+ optional `supporterEmail`, which Stripe Checkout also collects).
- The user provides a Stripe **test-mode** secret key and will create the Connect webhook endpoint (or run the Stripe CLI to forward events) to obtain `STRIPE_CONNECT_WEBHOOK_SECRET`.
- `nate` is the integration base; this work is cut from `nate`.

**Dependencies (ordered):**
1. Contracts (`common/src/zod/`) + Prisma migration draft + env additions land first — everything else consumes them.
2. `StripeService` and repositories are prerequisites for the onboarding, donation, and webhook APIs.
3. Backend donation + onboarding endpoints exist before their client surfaces.
4. The webhook processor exists before an end-to-end donation can be observed to complete.

---

## 7) Requirements

**Functional requirements:**
- An athlete can start onboarding (`POST /v1/athletes/me/stripe/onboarding-link`): the API creates a **Standard** connected account (via controller properties) if none exists, persists `stripeAccountId`, creates an **Account Link** (`type: 'account_onboarding'`), and returns `{ onboardingUrl }`. Re-invocation reuses the stored account and mints a fresh link.
- An athlete can read payout-readiness (`GET /v1/athletes/me/stripe/status`) → `{ stripeConnected, chargesEnabled, onboardingUrl? }` derived from the stored account + `account.updated` webhook.
- A supporter can create a donation (`POST /v1/donations`, `auth.optional`): validates campaign is `ACTIVE`, now `< closesAt` (if set), the campaign's athlete has charges enabled, and `donationAmountCents ≥` the configured minimum; creates a `Donation(PENDING)`; creates a **Checkout Session on the connected account** (direct charge, `mode: 'payment'`, `submit_type: 'donate'`, **no** `application_fee_amount`); returns `{ donation, checkoutUrl }`.
- The donor is redirected to `checkoutUrl` (Stripe-hosted), pays, and is returned to an ARC success or cancel page.
- A signature-verified **Connect** webhook (`POST /v1/webhooks/stripe`) processes, idempotently (gated on Stripe event id via `WebhookEvent`): `checkout.session.completed` / `checkout.session.async_payment_succeeded` (only when `payment_status !== 'unpaid'`) → `DONATION_SUCCEEDED` (locate the donation via `session.metadata.donationId`, and persist `session.payment_intent` to `Donation.stripePaymentIntentId`); `checkout.session.async_payment_failed` / `payment_intent.payment_failed` → `DONATION_FAILED`; `charge.refunded` → `DONATION_REFUNDED`; `charge.dispute.created` → `DISPUTE_OPENED` (both located via the charge/dispute `payment_intent` → `Donation.stripePaymentIntentId`, since these events carry no session id or session metadata); `account.updated` → set/clear `stripeChargesEnabledAt`. Each money event appends a `DonationEvent` and, in one `prisma.$transaction`, folds the projection (`Donation.donationStatus`, `Campaign.raisedAmountCents`/`supporterCount`, `FUNDED` at target).
- The donor picks an amount on the ARC profile (preset chips + custom field) plus optional message/anonymity, then pays on Stripe. *(Decision — see §8. The alternative "type the amount on Stripe's page" via `custom_unit_amount` is a one-line variant and is documented for flip.)*

**Non-functional requirements:**
- **Idempotency:** webhook processing is exactly-once per Stripe event id; outbound Stripe calls that create resources pass an `Idempotency-Key`.
- **Security:** webhook signature verified against the Connect secret using the raw body; Stripe secrets never logged; the client never receives the secret key (redirect Checkout needs no publishable key).
- **Correctness under concurrency:** projection updates are transactional; overfunding past target is allowed (mark `FUNDED`, keep accepting until `closesAt`).
- **Reliability:** the webhook endpoint returns 2xx only after durably recording the event; transient DB failure returns non-2xx so Stripe retries.
- **UX:** minimalist — one Donate button, Stripe hosts the payment surface; clear pending/enabled/disabled states on the athlete connect card.

---

## 8) Proposed approach

- **Architecture:** follow the existing feature-slice + repository-per-aggregate pattern. New `app/src/api/donations/` (Router/Controller/Service) and `app/src/api/webhooks/` (Router/Controller), an infra `StripeService`, and repositories for donation/ledger/webhook plus extensions to athlete/campaign repos. Wire each new RouterFactory into `buildApp()`.
- **Standard onboarding via Account Links + controller properties.** Create the account Standard-equivalent (`controller: { stripe_dashboard: { type: 'full' }, fees: { payer: 'account' }, losses: { payments: 'stripe' } }` — a bare create is also Standard). No OAuth. Onboarding completion is confirmed by retrieving the account and/or the `account.updated` webhook (`charges_enabled === true && capabilities.card_payments === 'active'`); Account Link URLs are single-use and carry no return state.
- **Direct-charge Checkout.** `stripe.checkout.sessions.create(params, { stripeAccount: connectedAccountId, idempotencyKey })` with `mode: 'payment'`, `submit_type: 'donate'`, `line_items[0].price_data` = `{ currency: 'cad', product_data: { name: 'Donation to <athlete>' }, unit_amount: <amountCents> }`, `success_url`/`cancel_url`, campaign/donation ids in `metadata`, and **`application_fee_amount` omitted**. Passing `stripeAccount` sets the `Stripe-Account` header → the charge is created on the athlete's account (they are merchant of record and pay Stripe's fee).
- **Amount entry decision:** collect the amount on the ARC donate widget (presets + custom) and pass a fixed `unit_amount` to Checkout — higher conversion and the Stripe page arrives pre-filled. Variant (documented, flippable): omit `unit_amount` and set `price_data.custom_unit_amount: { enabled: true, minimum, maximum, preset }` to let the donor type the amount on Stripe's page.
- **Event-sourced ledger.** `DonationEvent` is the append-only source of truth; `Donation` and `Campaign` totals are projections folded from it inside a transaction — keeps the deferred all-or-nothing pledge model additive.
- **Raw-body webhook mount.** In `buildApp()`, register `POST /v1/webhooks/stripe` with `express.raw({ type: 'application/json' })` before `app.use(express.json(...))`; verify with `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_CONNECT_WEBHOOK_SECRET)`; events from connected accounts carry a top-level `account`.
- **Client.** Add `api.ts` helpers; render an athlete "Connect Stripe / payout status" card in the dashboard/manage area (states: not connected → onboard; onboarding incomplete → resume; charges enabled → ready); replace the `supportEnabled`-gated `/support` CTAs on `AthleteProfile.tsx` with a donation widget that calls `createDonation` then `window.location = checkoutUrl`; add `/donate/thanks` (success) and cancel-return handling; wire campaigns into the API profile adapter so the donate target resolves in api mode. All donate/onboarding UI is api-mode only.

---

## 9) Data model and contracts

### Data model changes (`app/prisma/schema.prisma`, drafted migration `add_stripe_connect_donations`)
- `AthleteProfile` += `stripeAccountId String? @unique`, `stripeChargesEnabledAt DateTime?`.
- New enum `DonationEventType { DONATION_SUCCEEDED DONATION_FAILED DONATION_REFUNDED DISPUTE_OPENED }`.
- New model `DonationEvent` (append-only): `id`, `donationId String? @db.Uuid`, `campaignId @db.Uuid`, `athleteId @db.Uuid`, `donationEventType DonationEventType`, `amountCents Int`, `currency String`, `stripeAccountId String`, `stripeObjectId String`, `idempotencyKey String @unique` (= Stripe event id), `occurredAt DateTime`, `rawPayload Json`, `createdAt DateTime @default(now())`. Indexed by `campaignId`, `donationId`.
- New model `WebhookEvent`: `id`, `eventId String @unique`, `provider String`, `eventType String`, `payload Json`, `receivedAt DateTime @default(now())`, `processedAt DateTime?`.
- `Donation` stays the per-contribution projection; `paymentProviderRef` already exists and is `@unique` — it stores the **Checkout Session id** (set at donation-create time). Add `Donation.stripePaymentIntentId String? @unique`, persisted during the `checkout.session.completed`/`async_payment_succeeded` fold from `session.payment_intent`. **Why:** refund/dispute webhooks (`charge.refunded`, `charge.dispute.created`) reference the **PaymentIntent/charge**, not the Checkout Session — without a stored PaymentIntent id there is no way to map a refund/dispute back to its `Donation`. The session id is not present on charge-level events.

### Contract changes (`common/src/zod/`, then `npm run build --prefix common`)
- `types/enums.ts`: add `DonationEventType`.
- `donation.ts`: add `createDonationResponseSchema = { donation: donationSchema, checkoutUrl: z.string().url() }` → `CreateDonationResponse`.
- `athlete.ts`: add `athleteStripeStatusSchema = { stripeConnected: boolean, chargesEnabled: boolean, onboardingUrl: z.string().url().optional() }` and `athleteStripeOnboardingResponseSchema = { onboardingUrl: z.string().url() }`.
- Barrel `common/src/index.ts` already `export *`s these modules.

### Example shapes

```json
{
  "createDonationRequest": {
    "campaignId": "b1a2…-uuid",
    "supporterDisplayName": "Sam Supporter",
    "supporterEmail": "sam@example.com",
    "donationAmountCents": 5000,
    "donationMessage": "Go get it!",
    "isAnonymous": false
  },
  "createDonationResponse": {
    "donation": { "donationId": "…", "donationStatus": "PENDING", "donationAmountCents": 5000 },
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_…"
  },
  "athleteStripeStatus": {
    "stripeConnected": true,
    "chargesEnabled": false,
    "onboardingUrl": "https://connect.stripe.com/setup/e/acct_…/…"
  }
}
```

---

## 10) Package-level impact

### common/
- `src/types/enums.ts` (+ `DonationEventType`), `src/zod/donation.ts` (+ response schema), `src/zod/athlete.ts` (+ Stripe status/onboarding schemas). Rebuild the package.

### app/
- New dep `stripe` in `app/package.json`.
- New: `src/services/infrastructure/StripeService.ts`; `src/api/donations/{DonationRouterFactory,DonationController,DonationService}.ts`; `src/api/webhooks/{StripeWebhookRouterFactory,StripeWebhookController}.ts`; `src/repositories/{DonationRepository,DonationEventRepository,WebhookEventRepository}.ts`; athlete-Stripe onboarding endpoints (extend `AthleteRouterFactory`/`AthleteController`/`AthleteService` or add a focused `AthleteStripeRouterFactory`).
- Extend `AthleteRepository` (`setStripeAccount`, `setChargesEnabled`, `findByStripeAccountId`) and `CampaignRepository` (`applyDonationEvent` — atomic projection + `FUNDED` flip).
- `src/app.ts`: raw-body webhook mount before `express.json`; resolve + mount the new RouterFactories.
- `prisma/schema.prisma` + drafted migration.
- `.env.example`: `STRIPE_SECRET_KEY`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `STRIPE_ACCOUNT_ONBOARDING_RETURN_URL`, `STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL`, `STRIPE_CHECKOUT_SUCCESS_URL`, `STRIPE_CHECKOUT_CANCEL_URL`, `DONATION_MINIMUM_CENTS` (default), `DEFAULT_CURRENCY` (default `cad`).

### client/
- `lib/api.ts`: `startStripeOnboarding()`, `fetchStripeStatus()`, `createDonation(body)`.
- Athlete "Connect Stripe / payout status" card in the dashboard/manage area (`app/(marketing)/athletes/[athleteSlug]/manage/` and/or `/dashboard`).
- `app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx`: replace the three `supportEnabled`-gated `/support` CTAs with a donation widget (presets + custom + message/anonymity + disclosure copy); gate on campaign `ACTIVE` + charges-enabled.
- New return pages: `app/(marketing)/donate/thanks/page.tsx` (success) + cancel handling back to the profile.
- `lib/apiLoaders.ts` (`loadApiProfile`): call the existing-but-unused `fetchAthleteCampaigns(slug)` and pass campaigns into the adapter — today `loadApiProfile` fetches profile data only and `fetchAthleteCampaigns` has zero callers.
- `lib/adapters.ts` (`profileToMockAthlete`): map the fetched campaigns into the API profile view model (replace hard-coded `campaigns: []`). Fixing the adapter without the loader change surfaces no campaigns.
- `.env.example`: no new required var (redirect Checkout needs no publishable key); document that donations require `NEXT_PUBLIC_DATA_SOURCE=api`.

### docs/
- Keep `docs/backend-build-sheet.md` Phase 2 accurate — note the OAuth→Account Links and Elements→Checkout refinements as adopted.

---

## 11) Edge cases and error handling

- **Athlete not charges-enabled at donate time:** `POST /v1/donations` returns a `ValidationError`/`ForbiddenError`; the profile shows "not accepting donations yet" and hides the amount widget.
- **Campaign not `ACTIVE` or past `closesAt`:** reject donation creation with a clear domain error.
- **Amount below minimum / above a sane max:** reject with `ValidationError` (Stripe also enforces its own minimum charge).
- **Donor abandons Checkout / hits cancel:** `Donation` stays `PENDING`, no projection change; cancel page returns to the profile with a soft message.
- **`checkout.session.completed` with `payment_status === 'unpaid'` (async method still processing):** do **not** fulfill; wait for `checkout.session.async_payment_succeeded`.
- **Duplicate webhook delivery (same event id):** `WebhookEvent.recordIfNew` returns false → no-op.
- **Webhook for an unknown donation/campaign (e.g. metadata mismatch):** record the `WebhookEvent`, log a warn, return 2xx (don't wedge Stripe retries on unrecoverable data).
- **`account.updated` toggling charges off:** clear `stripeChargesEnabledAt`; donate widget disables.
- **Overfunding past target:** accepted; mark `FUNDED` at/above target, keep accepting until `closesAt`.
- **Refund/dispute after `FUNDED`:** record `DONATION_REFUNDED`/`DISPUTE_OPENED` and append to the ledger; a failed/refunded amount does not silently un-fund a met goal (projection reflects reality but status transitions follow the build sheet's rules).
- **Refund/dispute → donation mapping:** `charge.refunded`/`charge.dispute.created` carry no Checkout Session id or session metadata — resolve the `Donation` by the charge/dispute `payment_intent` against `Donation.stripePaymentIntentId` (persisted during the success fold). If no donation matches (e.g. the PI id was never recorded), record the `WebhookEvent`, log a warn, and return 2xx.

---

## 12) Failure modes and concurrency

**Concurrency/race conditions:**
- Two concurrent successful donations to the same campaign: projection increments run inside `prisma.$transaction` with an atomic update (`increment`) on `raisedAmountCents`/`supporterCount`; the `FUNDED` flip is evaluated inside the same transaction.
- Webhook arriving before the create-donation response is persisted: the donation is created (`PENDING`) synchronously in `POST /v1/donations` **before** returning `checkoutUrl`, so the webhook always finds the row; if not found, record the event and reconcile by `paymentProviderRef`.

**Idempotency and retries:**
- Webhook exactly-once via `WebhookEvent.eventId @unique` + `DonationEvent.idempotencyKey @unique` (= Stripe event id).
- Outbound account/checkout creation passes an `Idempotency-Key`.
- Stripe auto-retries non-2xx webhook responses; handlers are safe to re-run.

**Failure modes:**
- Stripe API unreachable during donate: surface a `ServiceUnavailableError`; no `Donation` left dangling beyond `PENDING`.
- DB failure mid-webhook: return non-2xx → Stripe retries; the idempotency gate prevents double application on retry.
- Signature verification failure: 400, no processing, logged (without the raw secret/signature).

---

## 13) Operational readiness

**Observability:**
- Structured logs (no secrets): `stripe.onboarding.link_created` (athleteId, accountId), `stripe.account.charges_enabled` (accountId), `donation.created` (donationId, campaignId, amountCents), `donation.succeeded`/`.failed`/`.refunded` (donationId), `webhook.received` (eventId, type), `webhook.duplicate` (eventId), `webhook.signature_invalid`.
- The pino logger already redacts `authorization`/`cookie`/`*.password*`; ensure Stripe keys and `Stripe-Signature` are never placed in log payloads.

---

## 14) Research and references

- `docs/backend-build-sheet.md` — Phase 2 "The money loop" (the basis for this task) + Locked-decisions table (Standard, direct charges, fee 0, event-sourced ledger) + "Deferred" (all-or-nothing pledges).
- `docs/business/incorporation-and-finances.md` — §3 non-custodial model, §4 zero application fee, §5 disclosures + monitoring duty + CRA digital-platform reporting.
- `docs/product-brief.md` — crowdfunding as GTM anchor; "money moves directly to the athlete."

**Provider contract evidence block — Stripe (verified July 2026 against docs.stripe.com):**
- **API version:** `2026-06-24.dahlia` (current; pin explicitly). **SDK:** `stripe-node` v22 (`new Stripe(key, { apiVersion: '2026-06-24.dahlia', maxNetworkRetries: 2 })`).
- **Account type — Standard** = the merchant of record is the connected account, which owns fees, refunds, disputes, and negative-balance liability; Stripe performs KYC; the account can be a pre-existing Stripe account. Created via controller properties `losses.payments: 'stripe'`, `fees.payer: 'account'`, `stripe_dashboard.type: 'full'` (a bare `POST /v1/accounts` yields Standard). Source: `docs.stripe.com/connect/accounts`, `/connect/charges`, `/connect/migrate-to-controller-properties`.
- **Onboarding — Account Links** (`stripe.accountLinks.create({ account, refresh_url, return_url, type: 'account_onboarding' })`); URL is single-use, carries **no** return state → retrieve account or handle `account.updated`. **OAuth is not recommended for new platforms.** Source: `/connect/express-accounts`, `/connect/oauth-standard-accounts`, `/connect/migrate-to-controller-properties`.
- **Direct-charge Checkout** — `stripe.checkout.sessions.create(params, { stripeAccount })` sets the `Stripe-Account` header; `mode: 'payment'`, `submit_type: 'donate'`; donor-entered amount via `line_items[].price_data.custom_unit_amount { enabled, minimum, maximum, preset }` (mutually exclusive with `unit_amount`); **zero platform fee = omit `application_fee_amount`**; the connected account pays Stripe's processing fee. Source: `/connect/direct-charges`, `/api/checkout/sessions/create`, `/payments/checkout/pay-what-you-want`, `/api/prices/object`.
- **Webhooks** — register a **Connect** endpoint; events from connected accounts carry a top-level `account`. Trust `checkout.session.completed` (+ `checkout.session.async_payment_succeeded`) for fulfillment and check `payment_status !== 'unpaid'`; failures via `checkout.session.async_payment_failed`/`payment_intent.payment_failed`; `charge.refunded`; `charge.dispute.created`; capability changes via `account.updated` (`charges_enabled`, `capabilities.card_payments === 'active'`, `details_submitted`). Verify with `stripe.webhooks.constructEvent(rawBody, sig, whsec_…)` using the **raw** body and the **Connect** endpoint's own signing secret; header `Stripe-Signature`. Source: `/connect/webhooks`, `/checkout/fulfillment`, `/api/accounts/object`, `/webhooks/signature`.
- **Idempotency** — `Idempotency-Key` request option (UUID), retained ~24h. Source: `/api/idempotent_requests`.
- **Reconciliations adopted vs. build sheet:** OAuth → **Account Links** (OAuth deprecated for new platforms); embedded PaymentIntent/Elements → **Stripe Checkout** hosted page (matches the product requirement; redirect Checkout needs no client-side publishable key).
- **Flags to confirm in test mode:** exact `apiVersion` string baked into the installed `stripe-node` build (pin ours explicitly regardless); `custom_unit_amount` placement under `price_data` (only used if the amount-entry variant is chosen).

**Validation re-verification (2026-07-19, live docs.stripe.com via WebFetch/WebSearch):**
- `2026-06-24.dahlia` confirmed a real Stripe API version (Dahlia release line); `stripe-node` current release is **22.3.0** (v22 confirmed). Note: the SDK's own default pin has moved to `2026-07-08.preview`; pinning our client explicitly to the GA `2026-06-24.dahlia` is correct and intended.
- Direct-charge Checkout confirmed: `Stripe-Account` header (`stripeAccount` option) creates the charge on the connected account; **omitting `application_fee_amount` ⇒ zero platform fee**, connected account pays Stripe's processing fee; `success_url` supports the `{CHECKOUT_SESSION_ID}` template (official example). Source: `/connect/direct-charges`.
- Standard controller mapping confirmed exactly: `losses.payments: stripe`, `fees.payer: account`, `requirement_collection: stripe`, `stripe_dashboard.type: full`; a bare `accounts.create()` defaults to the same. Source: `/connect/migrate-to-controller-properties`.
- Response fields the implementation parses — confirmed names/casing: Checkout Session `amount_total` (integer, nullable), `payment_status` (values `paid` / `unpaid` / `no_payment_required`), `metadata` (object), `payment_intent` (string, nullable/expandable); `submit_type` accepts `donate` (payment mode only); Account `charges_enabled` (boolean), `details_submitted` (boolean), `capabilities.card_payments` (`active` / `inactive` / `pending`). Sources: `/api/checkout/sessions/object`, `/api/accounts/object`.
- **Fixture requirement:** Step 6 tests must use provider-shaped fixtures with exact snake_case casing (`amount_total`, `payment_status`, `payment_intent`, `metadata`, `charges_enabled`, `capabilities.card_payments`) and a top-level `account` on connected-account events — the parser normalizes into internal camelCase only after the fixture boundary.

---

## 15) Open questions

- **Verified live sender / Connect webhook endpoint provisioning** and the production `STRIPE_CONNECT_WEBHOOK_SECRET` require the owner (test mode uses the Stripe CLI / a test endpoint). Not blocking for build.
- **Lawyer sign-off** of the non-custodial flow before real money moves is gating per `docs/business/incorporation-and-finances.md` item #5 — a business gate outside this build, not a code blocker for test mode.
