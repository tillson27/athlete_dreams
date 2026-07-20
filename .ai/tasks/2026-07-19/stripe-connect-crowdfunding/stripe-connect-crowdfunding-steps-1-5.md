# Stripe Connect Crowdfunding — Steps 1-5

## Step 1 - Contracts, schema, env & migration draft

### Metadata
**Status:** Incomplete
**Prereqs:** None
**Size:** medium
**Owner:** claude
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Land the Zod contracts, Prisma schema changes (drafted migration), and env vars that every later step consumes — the non-custodial donation data model and API shapes.
**Done When:**
- `common/src/types/enums.ts` exports `DonationEventType`; `common/src/zod/donation.ts` exports `createDonationResponseSchema` (`{ donation, checkoutUrl }`); `common/src/zod/athlete.ts` exports `athleteStripeStatusSchema` + `athleteStripeOnboardingResponseSchema`; `npm run build --prefix common` succeeds.
- `app/prisma/schema.prisma` adds `AthleteProfile.stripeAccountId @unique` + `stripeChargesEnabledAt`, `Donation.stripePaymentIntentId String? @unique`, `DonationEvent`, `WebhookEvent`, enum `DonationEventType`; a migration is **drafted** via `npm run migrate:create --prefix app -- --name add_stripe_connect_donations` (not applied). **Why `stripePaymentIntentId`:** refund/dispute webhooks reference the PaymentIntent, not the Checkout Session — this column is how those events map back to a `Donation` (see context §9, §11).
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
      export const athleteStripeStatusSchema = z.object({
        stripeConnected: z.boolean(),
        chargesEnabled: z.boolean(),
        onboardingUrl: z.string().url().optional(),
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
- Add env vars to `app/.env.example`: `STRIPE_SECRET_KEY`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `STRIPE_ACCOUNT_ONBOARDING_RETURN_URL`, `STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL`, `STRIPE_CHECKOUT_SUCCESS_URL`, `STRIPE_CHECKOUT_CANCEL_URL`, `DONATION_MINIMUM_CENTS`, `DEFAULT_CURRENCY=cad` (with comments; placeholders only, no real secrets).

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 2 - StripeService infrastructure

### Metadata
**Status:** Incomplete
**Prereqs:** 1
**Size:** medium
**Owner:** claude
**Completed At:**
**Completion Notes:**

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
        productName: string; metadata: Record<string,string>; idempotencyKey: string;
      }) {
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
          success_url: `${process.env.STRIPE_CHECKOUT_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: process.env.STRIPE_CHECKOUT_CANCEL_URL!,
          // NO application_fee_amount => zero platform fee (non-custodial)
        }, { stripeAccount: input.stripeAccountId, idempotencyKey: input.idempotencyKey });
      }
      constructWebhookEvent(rawBody: Buffer, signature: string) {
        return this.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_CONNECT_WEBHOOK_SECRET!);
      }
      ```

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 3 - Repositories: donation, donation-event, webhook-event + athlete/campaign extensions

### Metadata
**Status:** Incomplete
**Prereqs:** 1
**Size:** medium
**Owner:** claude
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Add repository-per-aggregate data access for the donation money loop and the atomic campaign-projection fold, following the existing repository pattern (only repos touch `PrismaService`).
**Done When:**
- `DonationRepository` (`createPending`, `findByProviderRef`, `findByPaymentIntentId`, `setProviderRef`, `setPaymentIntentId`, `setStatus`, `listForCampaign`), `DonationEventRepository` (`append`, `existsByIdempotencyKey`), `WebhookEventRepository` (`recordIfNew(eventId, type, payload): Promise<boolean>`) exist and are `@injectable()`. `findByPaymentIntentId` + `setPaymentIntentId` back the refund/dispute → donation mapping (context §11); `setStatus`/`setPaymentIntentId` must accept an optional `tx` so they run inside the webhook fold.
- `AthleteRepository` gains `setStripeAccount`, `setChargesEnabled`, `findByStripeAccountId`; `CampaignRepository` gains `applyDonationEvent(...)` that atomically updates `raisedAmountCents`/`supporterCount` and flips `FUNDED` at target — accepting an existing Prisma `tx` — **and** a read method `findByIdWithAthlete(campaignId)` that returns the campaign joined with its athlete's `stripeAccountId`, `stripeChargesEnabledAt`, and `fullName` (consumed by Step 5's donation-create guards + Checkout product name).

**References:**
- Context §9, §12 (Failure modes and concurrency).
- Pattern: `app/src/repositories/CampaignRepository.ts`, `AthleteRepository.ts`, `app/src/services/infrastructure/PrismaService.ts`, `app/src/shared/keysetCursor.ts`.

### Plan
- Donation + ledger + webhook repos (constructor-inject `PrismaService`).
    - Snippet:
      ```ts
      async recordIfNew(eventId: string, eventType: string, payload: Prisma.InputJsonValue) {
        try { await this.prisma.client.webhookEvent.create({
          data: { eventId, provider: 'stripe', eventType, payload } }); return true; }
        catch (e) { if (isUniqueViolation(e, 'eventId')) return false; throw e; }
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
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 4 - Athlete Stripe onboarding API (Account Links + status)

### Metadata
**Status:** Incomplete
**Prereqs:** 2, 3
**Size:** medium
**Owner:** claude
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Let an authenticated athlete connect (or create) their Standard Stripe account via Stripe-hosted onboarding and read their payout-readiness status.
**Done When:**
- `POST /v1/athletes/me/stripe/onboarding-link` (auth) creates a Standard account if none exists, persists `stripeAccountId`, mints a fresh Account Link, returns `{ onboardingUrl }` (`athleteStripeOnboardingResponseSchema`).
- `GET /v1/athletes/me/stripe/status` (auth) returns `{ stripeConnected, chargesEnabled, onboardingUrl? }` (`athleteStripeStatusSchema`), deriving `chargesEnabled` from `stripeChargesEnabledAt` (kept fresh by the webhook in Step 6) and/or a live `retrieveAccount` check.
- Endpoints are gated to the athlete owning the profile (via `req.authenticatedUserId`); tests cover create-vs-reuse and status shape.

**References:**
- Context §7 (Functional requirements), §8.
- Pattern: `app/src/api/athletes/{AthleteRouterFactory,AthleteController,AthleteService}.ts`, `app/src/middleware/AuthenticationMiddleware.ts`, `app/src/shared/{ResponseHandler,requestParsers,errors}.ts`, `BaseRouterFactory.ts`. Wire new routes in `app/src/app.ts`.

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
- Controller + RouterFactory (auth.required), mount in `buildApp()`.
- Status derivation from `stripeChargesEnabledAt`; optionally reconcile via `retrieveAccount` when not yet enabled.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

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
