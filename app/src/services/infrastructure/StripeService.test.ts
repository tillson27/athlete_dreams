import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sessionsCreate = vi.fn();
const accountsCreate = vi.fn();
const accountsRetrieve = vi.fn();
const accountLinksCreate = vi.fn();
const constructEvent = vi.fn();
const stripeConstructor = vi.fn();

vi.mock('stripe', () => ({
  default: class MockStripe {
    checkout = { sessions: { create: sessionsCreate } };
    accounts = { create: accountsCreate, retrieve: accountsRetrieve };
    accountLinks = { create: accountLinksCreate };
    webhooks = { constructEvent };
    constructor(...args: unknown[]) {
      stripeConstructor(...args);
    }
  },
}));

async function loadService() {
  const { StripeService } = await import('./StripeService');
  return new StripeService();
}

const REQUIRED_ENV = {
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_ACCOUNT_ONBOARDING_RETURN_URL: 'http://localhost:3000/return',
  STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL: 'http://localhost:3000/refresh',
  STRIPE_CHECKOUT_SUCCESS_URL: 'http://localhost:3000/donate/thanks',
  STRIPE_CHECKOUT_CANCEL_URL: 'http://localhost:3000',
  STRIPE_CONNECT_WEBHOOK_SECRET: 'whsec_123',
};

describe('StripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const [key, value] of Object.entries(REQUIRED_ENV)) {
      process.env[key] = value;
    }
  });

  afterEach(() => {
    for (const key of Object.keys(REQUIRED_ENV)) {
      delete process.env[key];
    }
  });

  it('throws when STRIPE_SECRET_KEY is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    await expect(loadService()).rejects.toThrow('STRIPE_SECRET_KEY is required');
  });

  it('pins the GA API version and enables network retries', async () => {
    await loadService();
    expect(stripeConstructor).toHaveBeenCalledWith(
      'sk_test_123',
      expect.objectContaining({ apiVersion: '2026-06-24.dahlia', maxNetworkRetries: 2 })
    );
  });

  it('creates a Standard connected account via controller properties (no fees to platform)', async () => {
    accountsCreate.mockResolvedValue({ id: 'acct_1' });
    const service = await loadService();
    await service.createConnectedAccount();
    expect(accountsCreate).toHaveBeenCalledWith({
      controller: {
        stripe_dashboard: { type: 'full' },
        fees: { payer: 'account' },
        losses: { payments: 'stripe' },
      },
    });
  });

  it('creates a donation Checkout Session as a direct charge with NO application fee', async () => {
    sessionsCreate.mockResolvedValue({ id: 'cs_test_1', url: 'https://checkout.stripe.com/x' });
    const service = await loadService();

    await service.createDonationCheckoutSession({
      stripeAccountId: 'acct_athlete',
      amountCents: 5000,
      currency: 'cad',
      productName: 'Donation to Sam',
      athleteSlug: 'sam-runner',
      metadata: { donationId: 'd1', campaignId: 'c1' },
      idempotencyKey: 'd1',
    });

    expect(sessionsCreate).toHaveBeenCalledTimes(1);
    const [params, options] = sessionsCreate.mock.calls[0];

    // [STRICT] non-custodial invariant assertions.
    expect(params).not.toHaveProperty('application_fee_amount');
    expect(params).not.toHaveProperty('transfer_data');
    expect(params).not.toHaveProperty('on_behalf_of');
    expect(options).toEqual({ stripeAccount: 'acct_athlete', idempotencyKey: 'd1' });

    expect(params.mode).toBe('payment');
    expect(params.submit_type).toBe('donate');
    expect(params.line_items[0].price_data).toEqual({
      currency: 'cad',
      product_data: { name: 'Donation to Sam' },
      unit_amount: 5000,
    });
    expect(params.metadata).toEqual({ donationId: 'd1', campaignId: 'c1' });
    expect(params.success_url).toBe(
      'http://localhost:3000/donate/thanks?session_id={CHECKOUT_SESSION_ID}&athlete=sam-runner'
    );
    expect(params.cancel_url).toBe('http://localhost:3000');
  });

  it('verifies webhook signatures against the Connect secret and the raw body', async () => {
    const rawBody = Buffer.from('{"id":"evt_1"}');
    constructEvent.mockReturnValue({ id: 'evt_1', type: 'checkout.session.completed' });
    const service = await loadService();

    const event = service.constructWebhookEvent(rawBody, 'sig_header');

    expect(constructEvent).toHaveBeenCalledWith(rawBody, 'sig_header', 'whsec_123');
    expect(event.id).toBe('evt_1');
  });
});
