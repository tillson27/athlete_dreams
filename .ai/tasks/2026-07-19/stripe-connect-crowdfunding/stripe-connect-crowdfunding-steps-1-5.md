# Stripe Connect Crowdfunding — Steps 1-5

## Step 1 - Contracts, schema, env & migration draft

### Metadata
**Status:** Complete (migration draft deferred — no local DB)
**Prereqs:** None
**Size:** medium
**Owner:** claude
**Completed At:** 2026-07-20
**Completion Notes:**
- Contracts landed in `common/`: `DonationEventType` + `PayoutStatus` enums (`common/src/types/enums.ts`), `createDonationResponseSchema` (`common/src/zod/donation.ts`), and `athletePayoutSchema` / `athleteStripeStatusSchema` (incl. `recentPayouts`) / `athleteStripeOnboardingResponseSchema` (`common/src/zod/athlete.ts`); `npm run build --prefix common` succeeds.
- Prisma schema (`app/prisma/schema.prisma`): `AthleteProfile.stripeAccountId @unique` + `stripeChargesEnabledAt`, `Donation.stripePaymentIntentId String? @unique`, models `DonationEvent` / `PayoutEvent` / `WebhookEvent`, enums `DonationEventType` + `PayoutStatus`. `prisma generate` validates the schema.
- `app/.env.example` documents all new Stripe/donation env vars (`STRIPE_SECRET_KEY`, `STRIPE_CONNECT_WEBHOOK_SECRET`, onboarding return/refresh URLs, checkout success/cancel URLs, `DONATION_MINIMUM_CENTS=500`, `DEFAULT_CURRENCY=cad`).
- **DEFERRED (owner action):** the drafted migration could not be created in this environment — no reachable Postgres and no `DATABASE_URL`, and `npm run migrate:create` (`prisma migrate dev --create-only`) requires a live DB to diff against migration history (hand-writing migration files is [STRICT]-forbidden). Once Postgres is up + `DATABASE_URL` set, run: `npm run migrate:create --prefix app -- --name add_stripe_connect_donations_and_payouts`.

### Context

**Objective:** Land the Zod contracts, Prisma schema changes (drafted migration), and env vars that every later step consumes — the non-custodial donation data model and API shapes.
**Done When:**
- `common/src/types/enums.ts` exports `DonationEventType` + `PayoutStatus`; `common/src/zod/donation.ts` exports `createDonationResponseSchema` (`{ donation, checkoutUrl }`); `common/src/zod/athlete.ts` exports `athletePayoutSchema`, `athleteStripeStatusSchema` (now incl. `recentPayouts`) + `athleteStripeOnboardingResponseSchema`; `npm run build --prefix common` succeeds.
- `app/prisma/schema.prisma` adds `AthleteProfile.stripeAccountId @unique` + `stripeChargesEnabledAt`, `Donation.stripePaymentIntentId String? @unique`, `DonationEvent`, `PayoutEvent`, `WebhookEvent`, enums `DonationEventType` + `PayoutStatus`; a migration is **drafted** via `npm run migrate:create --prefix app -- --name add_stripe_connect_donations_and_payouts` (not applied). **Why `stripePaymentIntentId`:** refund/dispute webhooks reference the PaymentIntent, not the Checkout Session — this column is how those events map back to a `Donation` (see context §9, §11). **Why `PayoutEvent`:** passive observability of athlete bank payouts (`payout.*` events) without ARC controlling funds (context §2, §7).
- `app/.env.example` documents all new Stripe/donation env vars.

**References:**
- Context §9 (Data model and contracts), §10 (Package-level impact).
- Existing: `common/src/zod/donation.ts`, `common/src/zod/campaign.ts`, `common/src/zod/shared.ts` (`moneyCentsSchema`, `isoDateTimeSchema`, `idSchema`), `common/src/types/enums.ts`, `common/src/index.ts`.
- Schema: `app/prisma/schema.prisma` (`Donation` model, `AthleteProfile`, `Campaign`), migration dir `app/prisma/migrations/`.

### Plan
- Add `DonationEventType` enum + the two Zod schemas; keep `.strict()` on request bodies, cents for money, ISO strings for dates.
    - Snippet:
      ```ts
      // common/src/zod/donation.ts
      export const createDonationResponseSchema = z.object({
        donation: donationSchema,
        checkoutUrl: z.string().url(),
      });
      export type CreateDonationResponse = z.infer<typeof createDonationResponseSchema>;
      // common/src/zod/athlete.ts
      export const athletePayoutSchema = z.object({
        stripePayoutId: z.string(),
        payoutStatus: z.nativeEnum(PayoutStatus),
        amountCents: moneyCentsSchema,
        currency: z.string(),
        arrivalDate: isoDateTimeSchema.nullable(),
        occurredAt: isoDateTimeSchema,
      });
      export const athleteStripeStatusSchema = z.object({
        stripeConnected: z.boolean(),
        chargesEnabled: z.boolean(),
        onboardingUrl: z.string().url().optional(),
        recentPayouts: z.array(athletePayoutSchema),
      });
      export const athleteStripeOnboardingResponseSchema = z.object({
        onboardingUrl: z.string().url(),
      });
      ```
- Extend Prisma schema, then draft the migration (do not apply).
    - Snippet:
      ```prisma
      // AthleteProfile
      stripeAccountId        String?   @unique
      stripeChargesEnabledAt DateTime?

      // Donation (add to existing model)
      stripePaymentIntentId  String?   @unique

      enum DonationEventType { DONATION_SUCCEEDED DONATION_FAILED DONATION_REFUNDED DISPUTE_OPENED }
      enum PayoutStatus { PENDING IN_TRANSIT PAID FAILED CANCELED }

      model DonationEvent {
        id                String           @id @default(uuid()) @db.Uuid
        donationId        String?          @db.Uuid
        campaignId        String           @db.Uuid
        athleteId         String           @db.Uuid
        donationEventType DonationEventType
        amountCents       Int
        currency          String
        stripeAccountId   String
        stripeObjectId    String
        idempotencyKey    String           @unique
        occurredAt        DateTime
        rawPayload        Json
        createdAt         DateTime         @default(now())
        @@index([campaignId])
        @@index([donationId])
        @@map("donation_events")
      }

      model PayoutEvent {
        id              String       @id @default(uuid()) @db.Uuid
        athleteId       String       @db.Uuid
        stripeAccountId String
        stripePayoutId  String
        payoutStatus    PayoutStatus
        amountCents     Int
        currency        String
        arrivalDate     DateTime?
        idempotencyKey  String       @unique
        occurredAt      DateTime
        rawPayload      Json
        createdAt       DateTime     @default(now())
        @@index([athleteId])
        @@index([stripePayoutId])
        @@map("payout_events")
      }

      model WebhookEvent {
        id          String    @id @default(uuid()) @db.Uuid
        eventId     String    @unique
        provider    String
        eventType   String
        payload     Json
        receivedAt  DateTime  @default(now())
        processedAt DateTime?
        @@map("webhook_events")
      }
      ```
- Add env vars to `app/.env.example`: `STRIPE_SECRET_KEY`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `STRIPE_ACCOUNT_ONBOARDING_RETURN_URL`, `STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL`, `STRIPE_CHECKOUT_SUCCESS_URL`, `STRIPE_CHECKOUT_CANCEL_URL`, `DONATION_MINIMUM_CENTS=500` (settled: $5 CAD minimum), `DEFAULT_CURRENCY=cad` (with comments; placeholders only, no real secrets).

### Step checklist
- [x] Step-specific tasks complete (migration draft deferred — see Completion Notes)
- [~] `$backend-review` (`/backend-review`) run (contracts/schema/env only; no app code in this step)
- [x] `$ci` (`/ci`) run — scoped: `common` build + `prisma generate` + app type-check/lint green (full `npm run ci` blocked by pre-existing `cdk` type errors + no DB, out of scope)
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 2 - StripeService infrastructure

### Metadata
**Status:** Complete
**Prereqs:** 1
**Size:** medium
**Owner:** claude
**Completed At:** 2026-07-20
**Completion Notes:**
- Added `stripe@^22.3.2` (stripe-node v22; SDK-baked `ApiVersion` is exactly `2026-06-24.dahlia`, matching the pin) to `app/package.json`.
- `app/src/services/infrastructure/StripeService.ts`: `@singleton()` with constructor env-guard (mirrors `JwtService`), pinned `apiVersion: '2026-06-24.dahlia'`, `maxNetworkRetries: 2`. Methods: `createConnectedAccount()` (Standard controller props), `createAccountLink(accountId)`, `retrieveAccount(accountId)`, `createDonationCheckoutSession(input)` (direct charge — passes `{ stripeAccount, idempotencyKey }`, omits `application_fee_amount`), `constructWebhookEvent(rawBody, signature)` (raw body + Connect secret).
- Unit test `StripeService.test.ts` (stripe module mocked, no DB): asserts env guard, API-version pin, Standard account controller props, and the **non-custodial invariant** (no `application_fee_amount`/`transfer_data`/`on_behalf_of`; direct charge via `stripeAccount`) + raw-body/Connect-secret webhook verification. 5/5 pass.
- Validation: app type-check ✓, app lint ✓, StripeService test ✓ (scoped; full `npm run ci` blocked by pre-existing cdk errors + no DB).

### Context

**Objective:** Add the `stripe` dependency and a `@singleton() StripeService` that wraps all Stripe calls this feature needs — Standard connected-account creation, Account Links, account retrieval, direct-charge Checkout Session creation, and webhook signature verification.
**Done When:**
- `stripe` is added to `app/package.json`; `StripeService` constructs a pinned client and guards on a missing secret key (mirroring `JwtService`).
- `StripeService` exposes: `createConnectedAccount()`, `createAccountLink(accountId)`, `retrieveAccount(accountId)`, `createDonationCheckoutSession(input)`, `constructWebhookEvent(rawBody, signature)`.
- No destination-charge/transfer/application-fee code exists; `createDonationCheckoutSession` passes `{ stripeAccount }` and omits `application_fee_amount`.

**References:**
- Context §8 (Proposed approach), §14 (Provider contract evidence block).
- Pattern: `app/src/services/infrastructure/JwtService.ts` (singleton + constructor env-guard), `PrismaService.ts`, `Logger.ts`.

### Plan
- Add dep and construct the pinned client.
    - Snippet:
      ```ts
      import Stripe from 'stripe';
      @singleton()
      export class StripeService {
        private readonly stripe: Stripe;
        constructor() {
          const key = process.env.STRIPE_SECRET_KEY;
          if (!key) throw new Error('STRIPE_SECRET_KEY is required');
          this.stripe = new Stripe(key, { apiVersion: '2026-06-24.dahlia', maxNetworkRetries: 2 });
        }
      }
      ```
- Standard account (controller properties) + Account Link.
    - Snippet:
      ```ts
      createConnectedAccount() {
        return this.stripe.accounts.create({
          controller: {
            stripe_dashboard: { type: 'full' },
            fees: { payer: 'account' },
            losses: { payments: 'stripe' },
          },
        });
      }
      createAccountLink(accountId: string) {
        return this.stripe.accountLinks.create({
          account: accountId,
          refresh_url: process.env.STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL!,
          return_url: process.env.STRIPE_ACCOUNT_ONBOARDING_RETURN_URL!,
          type: 'account_onboarding',
        });
      }
      ```
- Direct-charge Checkout (zero fee, on the connected account) + webhook verify.
    - Snippet:
      ```ts
      createDonationCheckoutSession(input: {
        stripeAccountId: string; amountCents: number; currency: string;
        productName: string; athleteSlug: string; metadata: Record<string,string>; idempotencyKey: string;
      }) {
        // success_url carries session_id (fulfillment lookup) + athlete slug so the
        // /donate/thanks page can name the athlete without an authed fetch (Step 8, #5).
        const successUrl = `${process.env.STRIPE_CHECKOUT_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}&athlete=${encodeURIComponent(input.athleteSlug)}`;
        return this.stripe.checkout.sessions.create({
          mode: 'payment',
          submit_type: 'donate',
          line_items: [{
            quantity: 1,
            price_data: { currency: input.currency,
              product_data: { name: input.productName },
              unit_amount: input.amountCents },
          }],
          metadata: input.metadata,
          success_url: successUrl,
          cancel_url: process.env.STRIPE_CHECKOUT_CANCEL_URL!,
          // NO application_fee_amount => zero platform fee (non-custodial)
        }, { stripeAccount: input.stripeAccountId, idempotencyKey: input.idempotencyKey });
      }
      constructWebhookEvent(rawBody: Buffer, signature: string) {
        return this.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_CONNECT_WEBHOOK_SECRET!);
      }
      ```

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run (self-review vs app/AGENTS.md: no fad-common type duplication, no direct Prisma import, no secret logging; env guard mirrors JwtService)
- [x] `$ci` (`/ci`) run — scoped: app type-check + lint + StripeService unit test green
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 3 - Repositories: donation, donation-event, webhook-event + athlete/campaign extensions

### Metadata
**Status:** Complete
**Prereqs:** 1
**Size:** medium
**Owner:** claude
**Completed At:** 2026-07-20
**Completion Notes:**
- New repos (all `@injectable()`, Prisma reached via `PrismaService` directly): `DonationRepository` (`createPending`, `findById`(tx?), `findByProviderRef`, `findByPaymentIntentId`, `setProviderRef`, `setPaymentIntentId`(tx?), `setStatus`(tx?), `listForCampaign`), `DonationEventRepository` (`append`(tx), `existsByIdempotencyKey`), `WebhookEventRepository` (`upsertAudit`, `markProcessed`), `PayoutEventRepository` (`recordIfNew` → P2002⇒false, `listRecentForAthlete`).
- `AthleteRepository` += `setStripeAccount`, `setChargesEnabled(at|null)`, `findByStripeAccountId`.
- `CampaignRepository` += `findByIdWithAthlete` (join athlete incl. Stripe fields) and `applyDonationEvent(tx, campaignId, deltaCents, supporterDelta)` — atomic increment + FUNDED flip at target, overfunding accepted.
- Idempotency design honoured: `WebhookEvent` is audit-only (`upsertAudit`/`markProcessed`); the exactly-once money guard is `DonationEvent.idempotencyKey @unique` appended inside the fold (`append` requires the caller's `tx`). Optional-`tx` accessor via `const db: Prisma.TransactionClient = tx ?? this.prisma`.
- Unit tests (Prisma mocked, no DB): `PayoutEventRepository` recordIfNew true/false(P2002)/rethrow; `CampaignRepository.applyDonationEvent` FUNDED-flip / below-target / already-funded(overfunding). 6/6 pass.
- Validation: app type-check ✓ (TC_EXIT=0), repo unit tests ✓ (6/6). Lint: the app eslint config (`app/eslint.config.mjs`) declares **no rules** (parse-errors only, no typed linting), so a passing type-check subsumes it; the eslint process could not complete under this machine's very high load (avg ~25–31) but cannot fail on style given the empty ruleset.

### Context

**Objective:** Add repository-per-aggregate data access for the donation money loop and the atomic campaign-projection fold, following the existing repository pattern (only repos touch `PrismaService`).
**Done When:**
- `DonationRepository` (`createPending`, `findById`, `findByProviderRef`, `findByPaymentIntentId`, `setProviderRef`, `setPaymentIntentId`, `setStatus`, `listForCampaign`), `DonationEventRepository` (`append`, `existsByIdempotencyKey`), `WebhookEventRepository` (`upsertAudit(eventId, type, payload)` + `markProcessed(eventId)`) exist and are `@injectable()`. `findByPaymentIntentId` + `setPaymentIntentId` back the refund/dispute → donation mapping (context §11); `findById`/`setStatus`/`setPaymentIntentId` must accept an optional `tx` so they run inside the webhook fold. **Idempotency design (see Step 6):** `WebhookEvent` is an **audit row only** — `upsertAudit` records the delivery and `markProcessed` stamps `processedAt` after the fold commits (reprocess when `processedAt == null`). The real exactly-once guard is `DonationEvent.idempotencyKey @unique` (= event id) appended **inside** the fold transaction; a duplicate delivery raises Prisma `P2002` and is treated as already-applied. Do **not** gate money application on a pre-committed `WebhookEvent` row.
- `AthleteRepository` gains `setStripeAccount`, `setChargesEnabled`, `findByStripeAccountId`; `CampaignRepository` gains `applyDonationEvent(...)` that atomically updates `raisedAmountCents`/`supporterCount` and flips `FUNDED` at target — accepting an existing Prisma `tx` — **and** a read method `findByIdWithAthlete(campaignId)` that returns the campaign joined with its athlete's `stripeAccountId`, `stripeChargesEnabledAt`, `fullName`, and `athleteSlug` (consumed by Step 5's donation-create guards, Checkout product name, and the success-URL athlete slug for the #5 thanks page).
- `PayoutEventRepository` (`recordIfNew(input): Promise<boolean>` — idempotent append keyed on `idempotencyKey` = Stripe event id via `P2002`; `listRecentForAthlete(athleteId, limit)` ordered by `occurredAt desc`) exists and is `@injectable()`. Payout events are a standalone audit stream — they never touch donation/campaign projections. `listRecentForAthlete` backs the `recentPayouts` field on the athlete Stripe status (Step 4).

**References:**
- Context §9, §12 (Failure modes and concurrency).
- Pattern: `app/src/repositories/CampaignRepository.ts`, `AthleteRepository.ts`, `app/src/services/infrastructure/PrismaService.ts`, `app/src/shared/keysetCursor.ts`.

### Plan
- Donation + ledger + webhook repos (constructor-inject `PrismaService`). **Access note:** `PrismaService extends PrismaClient`, so models are reached directly (`this.prisma.webhookEvent.upsert(...)`, `this.prisma.donation.create(...)`) exactly like `CampaignRepository` does `this.prisma.campaign.findMany(...)` — there is **no** `this.prisma.client` accessor. **Helper note:** no unique-violation helper exists in `app/src/shared/` today; the exactly-once guard is the `DonationEvent.idempotencyKey @unique` append inside the fold — detect the duplicate by checking the Prisma error is a `PrismaClientKnownRequestError` with `code === 'P2002'` (inline, or add a small shared `isUniqueViolation` helper).
    - Snippet:
      ```ts
      import { Prisma } from '@prisma/client';
      // WebhookEvent = audit only; never the money-application gate (see Step 6).
      upsertAudit(eventId: string, eventType: string, payload: Prisma.InputJsonValue) {
        return this.prisma.webhookEvent.upsert({
          where: { eventId },
          create: { eventId, provider: 'stripe', eventType, payload },
          update: {},
        });
      }
      markProcessed(eventId: string) {
        return this.prisma.webhookEvent.update({ where: { eventId }, data: { processedAt: new Date() } });
      }
      ```
- Atomic projection fold (runs inside the webhook's `$transaction`).
    - Snippet:
      ```ts
      async applyDonationEvent(tx: Prisma.TransactionClient, campaignId: string, deltaCents: number, supporterDelta: number) {
        const c = await tx.campaign.update({ where: { id: campaignId },
          data: { raisedAmountCents: { increment: deltaCents }, supporterCount: { increment: supporterDelta } },
          select: { raisedAmountCents: true, targetAmountCents: true, campaignStatus: true } });
        if (c.campaignStatus === 'ACTIVE' && c.raisedAmountCents >= c.targetAmountCents) {
          await tx.campaign.update({ where: { id: campaignId }, data: { campaignStatus: 'FUNDED' } });
        }
      }
      ```
- Athlete Stripe writers/readers: `setStripeAccount(athleteId, accountId)`, `setChargesEnabled(athleteId, at | null)`, `findByStripeAccountId(accountId)`.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run (self-review vs app/AGENTS.md: repository-per-aggregate, Prisma only in repos, no fad-common duplication)
- [x] `$ci` (`/ci`) run — scoped: app type-check + repo unit tests green (lint = empty-ruleset parse check, subsumed by type-check; see notes re: machine load)
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 4 - Athlete Stripe onboarding API (Account Links + status)

### Metadata
**Status:** Complete
**Prereqs:** 2, 3
**Size:** medium
**Owner:** claude
**Completed At:** 2026-07-20
**Completion Notes:**
- New focused slice `app/src/api/athleteStripe/{AthleteStripeService,AthleteStripeController,AthleteStripeRouterFactory}.ts` (kept separate from `AthleteService` for auditability, per context §10). Wired into `buildApp()` via `container.resolve(AthleteStripeRouterFactory)` (registered before `AthleteRouterFactory`).
- `POST /v1/athletes/me/stripe/onboarding-link` (auth.required): resolves athlete from `authenticatedUserId`, creates a Standard account if none (persists `stripeAccountId`, logs `stripe.onboarding.link_created`), mints a fresh Account Link, returns `{ onboardingUrl }` (`athleteStripeOnboardingResponseSchema`).
- `GET /v1/athletes/me/stripe/status` (auth.required): returns `{ stripeConnected, chargesEnabled, onboardingUrl?, recentPayouts }` (`athleteStripeStatusSchema`). `chargesEnabled` prefers the webhook-maintained `stripeChargesEnabledAt`; when not yet enabled it reconciles once via `retrieveAccount` (self-healing in test mode without a configured webhook) and mints a resume link. `recentPayouts` from `PayoutEventRepository.listRecentForAthlete` (limit 10), mapped to ISO transport.
- Route mount verified non-conflicting (`/v1/athletes/:athleteSlug` matches a single segment; `/me/stripe/*` falls through).
- Unit test `AthleteStripeService.test.ts` (repos/Stripe/logger mocked, no DB): create-vs-reuse onboarding, no-athlete guard, and status shapes (not-connected / stored-enabled / live-reconcile-enables / resume-link). 7/7 pass.
- Validation: AthleteStripeService test ✓ (7/7); app type-check ✓ (see checklist).

### Context

**Objective:** Let an authenticated athlete connect (or create) their Standard Stripe account via Stripe-hosted onboarding and read their payout-readiness status. **Settled (context §10):** build this as a **focused `AthleteStripeRouterFactory` / `AthleteStripeController` / `AthleteStripeService` slice** — do **not** bolt these endpoints onto the existing `AthleteRouterFactory`/`AthleteController`/`AthleteService`. Keeping the Stripe/non-custodial surface isolated makes the "no fees/transfers" invariant easy for a reviewer to audit in one place.
**Done When:**
- `POST /v1/athletes/me/stripe/onboarding-link` (auth) creates a Standard account if none exists, persists `stripeAccountId`, mints a fresh Account Link, returns `{ onboardingUrl }` (`athleteStripeOnboardingResponseSchema`).
- `GET /v1/athletes/me/stripe/status` (auth) returns `{ stripeConnected, chargesEnabled, onboardingUrl?, recentPayouts }` (`athleteStripeStatusSchema`), deriving `chargesEnabled` from `stripeChargesEnabledAt` (kept fresh by the webhook in Step 6) and/or a live `retrieveAccount` check, and `recentPayouts` from `PayoutEventRepository.listRecentForAthlete(athleteId, limit)` (empty array when none / not connected).
- Both routes live in the new `AthleteStripeRouterFactory` (its own `container.resolve(...)` line in `buildApp()`), gated to the athlete owning the profile (via `req.authenticatedUserId`); tests cover create-vs-reuse and status shape.

**References:**
- Context §7 (Functional requirements), §8, §10 (focused-slice decision).
- Pattern to mirror (structure only — new files, not edits to these): `app/src/api/athletes/{AthleteRouterFactory,AthleteController,AthleteService}.ts`, `app/src/middleware/AuthenticationMiddleware.ts`, `app/src/shared/{ResponseHandler,requestParsers,errors}.ts`, `BaseRouterFactory.ts`. `AthleteRepository.findByUserId` already exists (resolves the athlete from `authenticatedUserId`). Wire the new `AthleteStripeRouterFactory` in `app/src/app.ts`.

### Plan
- Service: resolve athlete by `authenticatedUserId`; create/reuse account; store id; return link.
    - Snippet:
      ```ts
      async startOnboarding(userId: string) {
        const athlete = await this.athletes.findByUserId(userId);
        let accountId = athlete.stripeAccountId;
        if (!accountId) { const acct = await this.stripe.createConnectedAccount();
          accountId = acct.id; await this.athletes.setStripeAccount(athlete.id, accountId); }
        const link = await this.stripe.createAccountLink(accountId);
        return { onboardingUrl: link.url };
      }
      ```
- `AthleteStripeController` + `AthleteStripeRouterFactory` (auth.required), mounted via a new `container.resolve(AthleteStripeRouterFactory)` line in `buildApp()`.
- Status derivation from `stripeChargesEnabledAt`; optionally reconcile via `retrieveAccount` when not yet enabled. Include `recentPayouts` via `PayoutEventRepository.listRecentForAthlete`.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run (self-review vs app/AGENTS.md: thin controller, service logic, Prisma only via repos, fad-common types imported, no secret logging)
- [x] `$ci` (`/ci`) run — scoped: app type-check + AthleteStripeService unit test green
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 5 - Donation creation API (Checkout Session, direct charge)

### Metadata
**Status:** Incomplete
**Prereqs:** 2, 3
**Size:** medium
**Owner:** claude
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Create a donation and a direct-charge Stripe Checkout Session on the athlete's connected account, returning a hosted `checkoutUrl`.
**Done When:**
- `POST /v1/donations` (`auth.optional`) validates: campaign `ACTIVE`, now `< closesAt` when set, the campaign athlete's `stripeChargesEnabledAt` is set, `donationAmountCents ≥ DONATION_MINIMUM_CENTS`.
- It creates a `Donation(PENDING)` (linking `supporterUserId` when authed, else guest fields), creates a Checkout Session via `StripeService.createDonationCheckoutSession` with campaign/donation ids in `metadata` and `application_fee_amount` omitted, stores the session id in `paymentProviderRef`, and returns `{ donation, checkoutUrl }` (`createDonationResponseSchema`).
- Tests cover each guard (inactive/closed/not-charges-enabled/below-min) and the happy path (Stripe mocked); confirm no application fee / no transfer params are ever set.

**References:**
- Context §7, §8, §11 (Edge cases), §12.
- Pattern: `app/src/api/campaigns/{CampaignRouterFactory,CampaignController,CampaignService}.ts`; `createDonationRequestSchema`/`createDonationResponseSchema` from `fad-common`; `DonationRepository`, `CampaignRepository`, `StripeService`.

### Plan
- Service guards + create donation, then session; idempotency key derived from the donation id.
    - Snippet:
      ```ts
      const campaign = await this.campaigns.findByIdWithAthlete(body.campaignId);
      assertActiveAndOpen(campaign);              // else ValidationError
      if (!campaign.athlete.stripeChargesEnabledAt) throw new ForbiddenError('athlete_not_ready');
      if (body.donationAmountCents < this.minCents) throw new ValidationError('below_minimum');
      const donation = await this.donations.createPending(body, authedUserId);
      const session = await this.stripe.createDonationCheckoutSession({
        stripeAccountId: campaign.athlete.stripeAccountId!, amountCents: body.donationAmountCents,
        currency: this.currency, productName: `Donation to ${campaign.athlete.fullName}`,
        athleteSlug: campaign.athlete.athleteSlug,
        metadata: { donationId: donation.donationId, campaignId: campaign.id }, idempotencyKey: donation.donationId });
      await this.donations.setProviderRef(donation.donationId, session.id);
      return { donation, checkoutUrl: session.url! };
      ```
- Controller (`auth.optional`) + RouterFactory (`basePath '/v1/donations'`), mount in `buildApp()`.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
