import Stripe from 'stripe';
import { singleton } from 'tsyringe';

// [STRICT] Non-custodial invariant: every donation is a DIRECT charge on the
// athlete's connected account (Stripe-Account header via `stripeAccount`) with
// `application_fee_amount` OMITTED. This service must never introduce
// destination charges, `transfer_data`, `on_behalf_of`, or application fees —
// doing so would route funds through the platform balance and break the
// money-services-business posture (see docs/business/incorporation-and-finances.md).
const STRIPE_API_VERSION = '2026-06-24.dahlia';

export interface CreateDonationCheckoutSessionInput {
  stripeAccountId: string;
  amountCents: number;
  currency: string;
  productName: string;
  athleteSlug: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}

@singleton()
export class StripeService {
  private readonly stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required to start the API.');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION,
      maxNetworkRetries: 2,
    });
  }

  // Standard connected account via controller properties (a bare create also
  // yields Standard). The connected account is merchant of record and pays
  // Stripe's fee; Stripe owns KYC and negative-balance liability.
  createConnectedAccount(): Promise<Stripe.Account> {
    return this.stripe.accounts.create({
      controller: {
        stripe_dashboard: { type: 'full' },
        fees: { payer: 'account' },
        losses: { payments: 'stripe' },
      },
    });
  }

  // Single-use, state-less hosted onboarding URL; completion is confirmed by
  // retrieving the account and/or the `account.updated` webhook.
  createAccountLink(accountId: string): Promise<Stripe.AccountLink> {
    return this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: requireEnv('STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL'),
      return_url: requireEnv('STRIPE_ACCOUNT_ONBOARDING_RETURN_URL'),
      type: 'account_onboarding',
    });
  }

  retrieveAccount(accountId: string): Promise<Stripe.Account> {
    return this.stripe.accounts.retrieve(accountId);
  }

  // Direct-charge Checkout on the connected account: passing `stripeAccount`
  // sets the Stripe-Account header so the charge is created on the athlete's
  // account. `application_fee_amount` is intentionally omitted => zero platform
  // fee. success_url carries the session id (fulfillment lookup) + athlete slug
  // so the thank-you page can name the athlete without an authed fetch.
  createDonationCheckoutSession(
    input: CreateDonationCheckoutSessionInput
  ): Promise<Stripe.Checkout.Session> {
    const successUrl = `${requireEnv('STRIPE_CHECKOUT_SUCCESS_URL')}?session_id={CHECKOUT_SESSION_ID}&athlete=${encodeURIComponent(
      input.athleteSlug
    )}`;
    return this.stripe.checkout.sessions.create(
      {
        mode: 'payment',
        submit_type: 'donate',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency,
              product_data: { name: input.productName },
              unit_amount: input.amountCents,
            },
          },
        ],
        metadata: input.metadata,
        success_url: successUrl,
        cancel_url: requireEnv('STRIPE_CHECKOUT_CANCEL_URL'),
      },
      { stripeAccount: input.stripeAccountId, idempotencyKey: input.idempotencyKey }
    );
  }

  // Verifies the raw request body against the Connect endpoint's signing secret.
  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      requireEnv('STRIPE_CONNECT_WEBHOOK_SECRET')
    );
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for Stripe operations.`);
  }
  return value;
}
