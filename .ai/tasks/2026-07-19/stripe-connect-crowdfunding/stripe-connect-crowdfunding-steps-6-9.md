# Stripe Connect Crowdfunding — Steps 6-9

## Step 6 - Stripe Connect webhook processor + raw-body mount

### Metadata
**Status:** Incomplete
**Prereqs:** 2, 3, 5
**Size:** medium
**Owner:** claude
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Process signature-verified Stripe **Connect** webhooks idempotently — the source of truth for donation fulfillment and connected-account status — appending to the `DonationEvent` ledger and folding the projection in one transaction.
**Done When:**
- `POST /v1/webhooks/stripe` is mounted with `express.raw({ type: 'application/json' })` **before** the global `express.json(...)` in `app/src/app.ts`; the signature is verified via `StripeService.constructWebhookEvent` against the Connect secret.
- Handlers, gated on `WebhookEvent.recordIfNew` (idempotent) and reading the top-level `event.account`:
  - `checkout.session.completed` / `checkout.session.async_payment_succeeded` **and** `payment_status !== 'unpaid'` → `DONATION_SUCCEEDED`: locate the donation via `session.metadata.donationId`, append `DonationEvent`, set `Donation.SUCCEEDED`, **persist `session.payment_intent` to `Donation.stripePaymentIntentId`**, `CampaignRepository.applyDonationEvent` (increment + `FUNDED` flip) — all in one `prisma.$transaction`.
  - `checkout.session.async_payment_failed` / `payment_intent.payment_failed` → `DONATION_FAILED`.
  - `charge.refunded` → `DONATION_REFUNDED`; `charge.dispute.created` → `DISPUTE_OPENED` — resolve the donation via the charge/dispute `payment_intent` → `DonationRepository.findByPaymentIntentId` (these events carry no session id/metadata); append ledger; do not un-fund a met goal. If no donation matches, record the `WebhookEvent`, warn, return 2xx.
  - `account.updated` → set `stripeChargesEnabledAt` when `charges_enabled && capabilities.card_payments === 'active'`, else clear it.
- Returns 2xx only after durable record; non-2xx on transient failure so Stripe retries. Tests: duplicate event id no-ops; unpaid session not fulfilled; ledger→projection fold + `FUNDED`; overfunding accepted; raw-body mount ordering; refund/dispute resolved by `payment_intent`. **Fixtures must be provider-shaped** — real Stripe event JSON with exact snake_case casing (`amount_total`, `payment_status`, `payment_intent`, `metadata`, `charges_enabled`, `capabilities.card_payments`) and a top-level `account` on connected-account events; the parser normalizes to internal types only after the fixture boundary (context §14).

**References:**
- Context §7, §11, §12, §14 (webhook evidence block).
- `app/src/app.ts` (current single global `express.json({ limit: '15mb' })` — the mount point), `StripeService`, `WebhookEventRepository`, `DonationEventRepository`, `DonationRepository`, `CampaignRepository`, `AthleteRepository`, `app/src/services/infrastructure/PrismaService.ts`.

### Plan
- Raw-body mount before JSON parser.
    - Snippet:
      ```ts
      // app/src/app.ts — BEFORE app.use(express.json(...))
      app.post('/v1/webhooks/stripe',
        express.raw({ type: 'application/json' }),
        container.resolve(StripeWebhookController).handle);
      app.use(express.json({ limit: '15mb' }));
      ```
- Verify + idempotency-gate + transactional fold.
    - Snippet:
      ```ts
      const event = this.stripe.constructWebhookEvent(req.body, req.headers['stripe-signature'] as string);
      if (!(await this.webhooks.recordIfNew(event.id, event.type, event.data.object as any))) return res.sendStatus(200);
      switch (event.type) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded': {
          const s = event.data.object; if (s.payment_status === 'unpaid') break;
          await this.prisma.client.$transaction(async (tx) => {
            await this.ledger.append(tx, /* DONATION_SUCCEEDED from s.metadata + event.account */);
            await this.donations.setStatus(tx, s.metadata.donationId, 'SUCCEEDED');
            if (s.payment_intent) await this.donations.setPaymentIntentId(tx, s.metadata.donationId, s.payment_intent as string);
            await this.campaigns.applyDonationEvent(tx, s.metadata.campaignId, s.amount_total ?? 0, 1);
          });
          break;
        }
        // charge.refunded / charge.dispute.created: resolve donation by payment_intent
        //   const pi = (event.data.object as Stripe.Charge).payment_intent
        //            ?? (event.data.object as Stripe.Dispute).payment_intent;
        //   const donation = await this.donations.findByPaymentIntentId(pi as string);
        // ...failed / account.updated
      }
      res.sendStatus(200);
      ```
- `account.updated` → `athletes.findByStripeAccountId(event.account)` then set/clear `stripeChargesEnabledAt`.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 7 - Client: API helpers + athlete "Connect Stripe / payout status" UI

### Metadata
**Status:** Incomplete
**Prereqs:** 4
**Size:** medium
**Owner:** claude
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Give athletes an in-product way to connect their Stripe account and see payout readiness, using the existing typed API layer and session seam (api mode).
**Done When:**
- `client/lib/api.ts` adds `startStripeOnboarding(): Promise<{ onboardingUrl }>` and `fetchStripeStatus(): Promise<AthleteStripeStatus>` (authed; validated against `fad-common` schemas via the existing `apiRequest` pattern).
- The dashboard/manage area renders a "Connect Stripe to receive donations" card with states: not connected → "Connect Stripe" (redirect to `onboardingUrl`); onboarding incomplete → "Finish setup"; charges enabled → "Ready to receive donations." Returning from Stripe re-fetches status.
- UI is api-mode only; in mock/static builds the card is hidden or shows a "coming soon" note. `npm run ci` passes.

**References:**
- Context §8, §10 (client/).
- `client/lib/api.ts` (`apiRequest`, envelope + `safeParse`, `authed`), `client/lib/session.ts` (auth token provider seam), `client/lib/dataSource.ts` (`DATA_SOURCE`), the dashboard/manage surfaces `client/app/(marketing)/athletes/[athleteSlug]/manage/` and `/dashboard`.

### Plan
- API helpers following the existing helper style.
    - Snippet:
      ```ts
      export const startStripeOnboarding = () =>
        apiRequest('/v1/athletes/me/stripe/onboarding-link', athleteStripeOnboardingResponseSchema, { method: 'POST', authed: true });
      export const fetchStripeStatus = () =>
        apiRequest('/v1/athletes/me/stripe/status', athleteStripeStatusSchema, { authed: true });
      ```
- Connect card component with the three states + redirect + on-return refetch (read `?stripe_return=1` or refetch on mount).

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 8 - Client: donor donation flow (widget + Checkout redirect + return pages)

### Metadata
**Status:** Incomplete
**Prereqs:** 5, 6
**Size:** medium
**Owner:** claude
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Turn the dead-end "Back this athlete" CTAs into a real donation entry that collects an amount + optional message/anonymity and required disclosures, then redirects to the Stripe-hosted Checkout page.
**Done When:**
- The `supportEnabled`-gated CTAs in `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx` (≈ lines 166, 565, 602 / `#back` section) open a donation widget: preset chips ($25/$50/$100) + custom amount, optional message, "donate anonymously," and the required legal disclosure line (not-a-charity / not-tax-deductible / athlete income is taxable / ARC does not control spending).
- Submitting calls `createDonation(...)` and `window.location.assign(checkoutUrl)`. A `/donate/thanks` success page reads `session_id` and confirms; cancel returns to the profile with a soft message.
- The widget only shows when api mode + campaign `ACTIVE` + athlete charges-enabled; otherwise the profile keeps the existing `/support` teaser link. The donate target is wired end-to-end: `client/lib/apiLoaders.ts` (`loadApiProfile`) must **actually call** the existing `fetchAthleteCampaigns(slug)` helper (today it is defined in `api.ts` but never invoked; `loadApiProfile` fetches profile data only) and pass the campaigns into the adapter, and `client/lib/adapters.ts` (`profileToMockAthlete`) is updated to map them into the view model (replacing hard-coded `campaigns: []`). Fixing the adapter alone is insufficient — without the loader fetching campaigns, the view model has none and the widget has no `campaignId`. `npm run ci` passes.

**References:**
- Context §7, §8, §11.
- `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx` (CTAs at lines ~168/566/604 + `supportEnabled` gate + `#back` section 548-573), `client/app/(marketing)/support/page.tsx` (existing teaser), `client/lib/api.ts` (add `createDonation`; existing `fetchAthleteCampaigns`), `client/lib/apiLoaders.ts` (`loadApiProfile` — add the campaigns fetch), `client/lib/adapters.ts` (`profileToMockAthlete`), `client/lib/session.ts`.

### Plan
- `createDonation` helper + donation widget (client island).
    - Snippet:
      ```ts
      export const createDonation = (body: CreateDonationRequest) =>
        apiRequest('/v1/donations', createDonationResponseSchema, { method: 'POST', body, authed: false });
      // on submit:
      const { checkoutUrl } = await createDonation({ campaignId, donationAmountCents, supporterDisplayName, isAnonymous, donationMessage });
      window.location.assign(checkoutUrl);
      ```
- Success page `app/(marketing)/donate/thanks/page.tsx`; cancel → back to `athleteProfileHref(slug)` with a soft message. Gate the widget on `supportEnabled && isApiMode && campaign?.campaignStatus === 'ACTIVE' && chargesEnabled`.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 9 - Final Validation & Cleanup

### Metadata
**Status:** Incomplete
**Prereqs:** 1, 2, 3, 4, 5, 6, 7, 8
**Owner:** claude
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Verify the end-to-end non-custodial money loop is correct and clean, in Stripe test mode.
**Done When:**
- The full loop is exercised in test mode (Stripe CLI forwarding to `/v1/webhooks/stripe`): athlete onboards → charges enabled; donor donates → redirected to Checkout → pays with a test card → webhook flips `Donation` to `SUCCEEDED`, appends a `DonationEvent`, increments the campaign, and flips `FUNDED` at target.
- A reviewer confirms the **non-custodial invariant**: only direct charges, `application_fee_amount` omitted, no destination-charge/transfer/platform-fee code anywhere.

### Final Step Checklist
* [ ] Confirm all prior steps are complete
* [ ] Review and resolve any outstanding TODOs introduced during this task
* [ ] Verify the non-custodial invariant (no `application_fee_amount`, no `transfer_data`/`on_behalf_of`/destination charges) across `StripeService` and callers
* [ ] Confirm legal disclosure copy is present at the point of donation (and flagged for owner/lawyer review before live)
* [ ] Run the `$e2e-review` (`/e2e-review`) skill with all required context provided
* [ ] Run the `$ci` (`/ci`) skill and confirm it passes
- [ ] Fix any issues caused by `$ci` (`/ci`)
* [ ] Update task metadata in the steps docs and the steps guide index
* [ ] Move `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/` to `.ai/tasks/2026-07-19/completed/stripe-connect-crowdfunding/`
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
