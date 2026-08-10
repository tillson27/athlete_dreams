import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { StripeWebhookService } from './StripeWebhookService';
import type { PrismaService } from '../../services/infrastructure/PrismaService';
import type { AthleteRepository } from '../../repositories/AthleteRepository';
import type { CampaignRepository } from '../../repositories/CampaignRepository';
import type { DonationRepository } from '../../repositories/DonationRepository';
import type { DonationEventRepository } from '../../repositories/DonationEventRepository';
import type { PayoutEventRepository } from '../../repositories/PayoutEventRepository';
import type { WebhookEventRepository } from '../../repositories/WebhookEventRepository';
import type { Logger } from '../../services/infrastructure/Logger';

const transactionClient = {
  donationEvent: {
    aggregate: vi.fn(async () => ({ _sum: { amountCents: 0 } })),
  },
};
const prisma = {
  $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(transactionClient)),
};
const athletes = { findByStripeAccountId: vi.fn(), setChargesEnabled: vi.fn() };
const campaigns = { findByIdWithAthlete: vi.fn(), applyDonationEvent: vi.fn() };
const donations = {
  findById: vi.fn(),
  findByProviderRef: vi.fn(),
  findByPaymentIntentId: vi.fn(),
  setStatus: vi.fn(),
  setPaymentIntentId: vi.fn(),
};
const ledger = { append: vi.fn() };
const payoutEvents = { recordIfNew: vi.fn() };
const webhooks = { upsertAudit: vi.fn(), markProcessed: vi.fn() };
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

function makeService(): StripeWebhookService {
  return new StripeWebhookService(
    prisma as unknown as PrismaService,
    athletes as unknown as AthleteRepository,
    campaigns as unknown as CampaignRepository,
    donations as unknown as DonationRepository,
    ledger as unknown as DonationEventRepository,
    payoutEvents as unknown as PayoutEventRepository,
    webhooks as unknown as WebhookEventRepository,
    logger as unknown as Logger,
    { capture: vi.fn(), identify: vi.fn(), captureException: vi.fn(), flush: vi.fn(), shutdown: vi.fn() } as unknown as import('../../services/infrastructure/PostHogService').PostHogService
  );
}

// Provider-shaped fixtures — exact Stripe snake_case casing + top-level `account`.
function checkoutEvent(objectOverrides: Record<string, unknown> = {}, type = 'checkout.session.completed') {
  return {
    id: 'evt_success_1',
    type,
    account: 'acct_athlete',
    livemode: false,
    created: 1_784_000_000,
    data: {
      object: {
        id: 'cs_test_1',
        payment_status: 'paid',
        payment_intent: 'pi_1',
        currency: 'cad',
        amount_total: 9999, // deliberately != stored amount to prove we ignore it
        metadata: { donationId: 'd1', campaignId: 'c1' },
        ...objectOverrides,
      },
    },
  } as unknown as Stripe.Event;
}

const donationRow = { id: 'd1', campaignId: 'c1', donationAmountCents: 5000, donationStatus: 'PENDING' };
const succeededDonationRow = { ...donationRow, donationStatus: 'SUCCEEDED' };
const campaignWithAthlete = { id: 'c1', athlete: { id: 'ath1', stripeAccountId: 'acct_athlete' } };
const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test_unit';
  transactionClient.donationEvent.aggregate.mockResolvedValue({ _sum: { amountCents: 0 } });
  prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
    cb(transactionClient)
  );
  donations.findById.mockResolvedValue(donationRow);
  donations.findByProviderRef.mockResolvedValue(null);
  donations.findByPaymentIntentId.mockResolvedValue(null);
  campaigns.findByIdWithAthlete.mockResolvedValue(campaignWithAthlete);
});

afterEach(() => {
  if (originalStripeSecretKey === undefined) {
    delete process.env.STRIPE_SECRET_KEY;
    return;
  }
  process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
});

describe('StripeWebhookService — checkout success fold', () => {
  it('rejects a live-mode event when the configured Stripe key is test-mode', async () => {
    await expect(makeService().process({ ...checkoutEvent(), livemode: true })).rejects.toThrow(
      'webhook mode'
    );
    expect(webhooks.upsertAudit).not.toHaveBeenCalled();
    expect(webhooks.markProcessed).not.toHaveBeenCalled();
  });

  it('appends the ledger, marks SUCCEEDED, persists the PI, and folds the projection by the STORED amount', async () => {
    await makeService().process(checkoutEvent());

    expect(webhooks.upsertAudit).toHaveBeenCalledWith('evt_success_1', 'checkout.session.completed', expect.anything());
    expect(ledger.append).toHaveBeenCalledTimes(1);
    const [tx, ledgerInput] = ledger.append.mock.calls[0];
    expect(tx).toBe(transactionClient);
    expect(ledgerInput).toMatchObject({
      donationId: 'd1',
      campaignId: 'c1',
      athleteId: 'ath1',
      donationEventType: 'DONATION_SUCCEEDED',
      amountCents: 5000, // stored amount, NOT amount_total (9999)
      idempotencyKey: 'evt_success_1',
      stripeObjectId: 'cs_test_1',
    });
    expect(donations.setStatus).toHaveBeenCalledWith('d1', 'SUCCEEDED', transactionClient);
    expect(donations.setPaymentIntentId).toHaveBeenCalledWith('d1', 'pi_1', transactionClient);
    expect(campaigns.applyDonationEvent).toHaveBeenCalledWith(transactionClient, 'c1', 5000, 1);
    expect(webhooks.markProcessed).toHaveBeenCalledWith('evt_success_1');
  });

  it('does not fulfill when the event connected account does not match the campaign athlete', async () => {
    await makeService().process({ ...checkoutEvent(), account: 'acct_other' });

    expect(ledger.append).not.toHaveBeenCalled();
    expect(donations.setStatus).not.toHaveBeenCalled();
    expect(campaigns.applyDonationEvent).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        eventStripeAccountId: 'acct_other',
        expectedStripeAccountId: 'acct_athlete',
      }),
      'webhook.connected_account_mismatch'
    );
    expect(webhooks.markProcessed).toHaveBeenCalledWith('evt_success_1');
  });

  it('does not fulfill when a Connect money event is missing the connected account', async () => {
    const event = checkoutEvent() as Stripe.Event & { account?: string };
    delete event.account;

    await makeService().process(event);

    expect(ledger.append).not.toHaveBeenCalled();
    expect(donations.setStatus).not.toHaveBeenCalled();
    expect(campaigns.applyDonationEvent).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ expectedStripeAccountId: 'acct_athlete' }),
      'webhook.missing_connected_account'
    );
    expect(webhooks.markProcessed).toHaveBeenCalledWith('evt_success_1');
  });

  it('does not fulfill an unpaid (async-pending) session', async () => {
    await makeService().process(checkoutEvent({ payment_status: 'unpaid' }));
    expect(ledger.append).not.toHaveBeenCalled();
    expect(campaigns.applyDonationEvent).not.toHaveBeenCalled();
    expect(webhooks.markProcessed).toHaveBeenCalledWith('evt_success_1');
  });

  it('treats a duplicate event id (P2002 on ledger append) as already-applied and stays 2xx', async () => {
    ledger.append.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5.22.0' })
    );
    await expect(makeService().process(checkoutEvent())).resolves.toBeUndefined();
    expect(campaigns.applyDonationEvent).not.toHaveBeenCalled();
    expect(webhooks.markProcessed).toHaveBeenCalledWith('evt_success_1');
  });

  it('rethrows a transient error so Stripe retries (processedAt left null)', async () => {
    ledger.append.mockRejectedValueOnce(new Error('deadlock'));
    await expect(makeService().process(checkoutEvent())).rejects.toThrow('deadlock');
    expect(webhooks.markProcessed).not.toHaveBeenCalled();
  });

  it('no-ops (audits only) when the donation is unknown', async () => {
    donations.findById.mockResolvedValue(null);
    await makeService().process(checkoutEvent());
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
    expect(webhooks.markProcessed).toHaveBeenCalledWith('evt_success_1');
  });

  it('marks an expired Checkout Session as failed while using the existing FAILED status', async () => {
    await makeService().process(checkoutEvent({}, 'checkout.session.expired'));

    expect(ledger.append.mock.calls[0][1]).toMatchObject({
      donationEventType: 'DONATION_FAILED',
      amountCents: 5000,
      stripeObjectId: 'cs_test_1',
    });
    expect(donations.setStatus).toHaveBeenCalledWith('d1', 'FAILED', transactionClient);
  });

  it('reconciles an early PaymentIntent failure from PaymentIntent metadata', async () => {
    const event = {
      id: 'evt_pi_failed_1',
      type: 'payment_intent.payment_failed',
      account: 'acct_athlete',
      livemode: false,
      created: 1_784_000_050,
      data: {
        object: {
          id: 'pi_early',
          currency: 'cad',
          metadata: { donationId: 'd1', campaignId: 'c1' },
        },
      },
    } as unknown as Stripe.Event;

    await makeService().process(event);

    expect(donations.findByPaymentIntentId).toHaveBeenCalledWith('pi_early');
    expect(donations.findById).toHaveBeenCalledWith('d1');
    expect(ledger.append.mock.calls[0][1]).toMatchObject({
      donationEventType: 'DONATION_FAILED',
      stripeObjectId: 'pi_early',
    });
    expect(donations.setStatus).toHaveBeenCalledWith('d1', 'FAILED', transactionClient);
  });
});

describe('StripeWebhookService — refund/dispute by PaymentIntent', () => {
  it('records a full DONATION_REFUNDED delta, marks REFUNDED, and reduces the campaign projection', async () => {
    donations.findByPaymentIntentId.mockResolvedValue(succeededDonationRow);
    const event = {
      id: 'evt_refund_1',
      type: 'charge.refunded',
      account: 'acct_athlete',
      livemode: false,
      created: 1_784_000_100,
      data: {
        object: {
          id: 'ch_1',
          payment_intent: 'pi_1',
          amount: 5000,
          amount_refunded: 5000,
          refunded: true,
          currency: 'cad',
          metadata: { donationId: 'd1' },
        },
      },
    } as unknown as Stripe.Event;

    await makeService().process(event);

    expect(donations.findByPaymentIntentId).toHaveBeenCalledWith('pi_1');
    expect(ledger.append.mock.calls[0][1]).toMatchObject({
      donationEventType: 'DONATION_REFUNDED',
      amountCents: 5000,
      currency: 'cad',
    });
    expect(donations.setStatus).toHaveBeenCalledWith('d1', 'REFUNDED', transactionClient);
    expect(campaigns.applyDonationEvent).toHaveBeenCalledWith(transactionClient, 'c1', -5000, -1);
  });

  it('does not record a refund when the event connected account mismatches the campaign athlete', async () => {
    donations.findByPaymentIntentId.mockResolvedValue(succeededDonationRow);
    const event = {
      id: 'evt_refund_wrong_account',
      type: 'charge.refunded',
      account: 'acct_other',
      livemode: false,
      created: 1_784_000_100,
      data: {
        object: {
          id: 'ch_1',
          payment_intent: 'pi_1',
          amount_refunded: 5000,
          currency: 'cad',
          metadata: { donationId: 'd1' },
        },
      },
    } as unknown as Stripe.Event;

    await makeService().process(event);

    expect(ledger.append).not.toHaveBeenCalled();
    expect(donations.setStatus).not.toHaveBeenCalled();
    expect(campaigns.applyDonationEvent).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        eventStripeAccountId: 'acct_other',
        expectedStripeAccountId: 'acct_athlete',
      }),
      'webhook.connected_account_mismatch'
    );
    expect(webhooks.markProcessed).toHaveBeenCalledWith('evt_refund_wrong_account');
  });

  it('records a partial refund amount without marking the whole donation REFUNDED', async () => {
    donations.findByPaymentIntentId.mockResolvedValue(succeededDonationRow);
    const event = {
      id: 'evt_refund_partial_1',
      type: 'charge.refunded',
      account: 'acct_athlete',
      livemode: false,
      created: 1_784_000_150,
      data: {
        object: {
          id: 'ch_1',
          payment_intent: 'pi_1',
          amount: 5000,
          amount_refunded: 1200,
          refunded: false,
          currency: 'cad',
          metadata: { donationId: 'd1' },
        },
      },
    } as unknown as Stripe.Event;

    await makeService().process(event);

    expect(ledger.append.mock.calls[0][1]).toMatchObject({
      donationEventType: 'DONATION_REFUNDED',
      amountCents: 1200,
      currency: 'cad',
    });
    expect(donations.setStatus).not.toHaveBeenCalled();
    expect(campaigns.applyDonationEvent).toHaveBeenCalledWith(transactionClient, 'c1', -1200, 0);
  });

  it('applies only the new cumulative refund delta for a later partial refund', async () => {
    donations.findByPaymentIntentId.mockResolvedValue(succeededDonationRow);
    transactionClient.donationEvent.aggregate.mockResolvedValueOnce({ _sum: { amountCents: 1200 } });
    const event = {
      id: 'evt_refund_partial_2',
      type: 'charge.refunded',
      account: 'acct_athlete',
      livemode: false,
      created: 1_784_000_175,
      data: {
        object: {
          id: 'ch_1',
          payment_intent: 'pi_1',
          amount: 5000,
          amount_refunded: 3000,
          refunded: false,
          currency: 'cad',
          metadata: { donationId: 'd1' },
        },
      },
    } as unknown as Stripe.Event;

    await makeService().process(event);

    expect(ledger.append.mock.calls[0][1]).toMatchObject({
      donationEventType: 'DONATION_REFUNDED',
      amountCents: 1800,
    });
    expect(campaigns.applyDonationEvent).toHaveBeenCalledWith(transactionClient, 'c1', -1800, 0);
  });

  it('records DISPUTE_OPENED, marks the donation failed, and reduces the campaign projection', async () => {
    donations.findByPaymentIntentId.mockResolvedValue(succeededDonationRow);
    const event = {
      id: 'evt_dispute_1',
      type: 'charge.dispute.created',
      account: 'acct_athlete',
      livemode: false,
      created: 1_784_000_200,
      data: { object: { id: 'dp_1', payment_intent: 'pi_1', amount: 5000, currency: 'cad' } },
    } as unknown as Stripe.Event;

    await makeService().process(event);

    expect(ledger.append.mock.calls[0][1]).toMatchObject({
      donationEventType: 'DISPUTE_OPENED',
      amountCents: 5000,
    });
    expect(donations.setStatus).toHaveBeenCalledWith('d1', 'FAILED', transactionClient);
    expect(campaigns.applyDonationEvent).toHaveBeenCalledWith(transactionClient, 'c1', -5000, -1);
  });
});

describe('StripeWebhookService — account.updated', () => {
  it('sets readiness when Stripe reports charges, payouts, and active card payments', async () => {
    athletes.findByStripeAccountId.mockResolvedValue({ id: 'ath1', stripeChargesEnabledAt: null });
    const event = {
      id: 'evt_acct_1',
      type: 'account.updated',
      account: 'acct_athlete',
      livemode: false,
      created: 1_784_000_300,
      data: {
        object: {
          id: 'acct_athlete',
          charges_enabled: true,
          payouts_enabled: true,
          capabilities: { card_payments: 'active' },
        },
      },
    } as unknown as Stripe.Event;

    await makeService().process(event);
    expect(athletes.setChargesEnabled).toHaveBeenCalledWith('ath1', expect.any(Date));
  });

  it('clears readiness when charges are toggled off', async () => {
    athletes.findByStripeAccountId.mockResolvedValue({ id: 'ath1', stripeChargesEnabledAt: new Date() });
    const event = {
      id: 'evt_acct_2',
      type: 'account.updated',
      account: 'acct_athlete',
      livemode: false,
      created: 1_784_000_400,
      data: {
        object: {
          id: 'acct_athlete',
          charges_enabled: false,
          payouts_enabled: true,
          capabilities: { card_payments: 'inactive' },
        },
      },
    } as unknown as Stripe.Event;

    await makeService().process(event);
    expect(athletes.setChargesEnabled).toHaveBeenCalledWith('ath1', null);
  });

  it('clears readiness when payments are enabled but payouts are disabled', async () => {
    athletes.findByStripeAccountId.mockResolvedValue({ id: 'ath1', stripeChargesEnabledAt: new Date() });
    const event = {
      id: 'evt_acct_3',
      type: 'account.updated',
      account: 'acct_athlete',
      livemode: false,
      created: 1_784_000_450,
      data: {
        object: {
          id: 'acct_athlete',
          charges_enabled: true,
          payouts_enabled: false,
          capabilities: { card_payments: 'active' },
        },
      },
    } as unknown as Stripe.Event;

    await makeService().process(event);
    expect(athletes.setChargesEnabled).toHaveBeenCalledWith('ath1', null);
  });

  it('clears readiness when the connected account deauthorizes the application', async () => {
    athletes.findByStripeAccountId.mockResolvedValue({ id: 'ath1', stripeChargesEnabledAt: new Date() });
    const event = {
      id: 'evt_deauth_1',
      type: 'account.application.deauthorized',
      account: 'acct_athlete',
      livemode: false,
      created: 1_784_000_475,
      data: { object: { id: 'ca_1', object: 'application' } },
    } as unknown as Stripe.Event;

    await makeService().process(event);

    expect(athletes.findByStripeAccountId).toHaveBeenCalledWith('acct_athlete');
    expect(athletes.setChargesEnabled).toHaveBeenCalledWith('ath1', null);
  });
});

describe('StripeWebhookService — payout observability', () => {
  it('records a PayoutEvent resolved via event.account, with no donation/campaign projection change', async () => {
    athletes.findByStripeAccountId.mockResolvedValue({ id: 'ath1' });
    const event = {
      id: 'evt_payout_1',
      type: 'payout.paid',
      account: 'acct_athlete',
      livemode: false,
      created: 1_784_000_500,
      data: { object: { id: 'po_1', status: 'paid', amount: 5000, currency: 'cad', arrival_date: 1_784_100_000 } },
    } as unknown as Stripe.Event;

    await makeService().process(event);

    expect(athletes.findByStripeAccountId).toHaveBeenCalledWith('acct_athlete');
    expect(payoutEvents.recordIfNew).toHaveBeenCalledWith(
      expect.objectContaining({
        athleteId: 'ath1',
        stripeAccountId: 'acct_athlete',
        stripePayoutId: 'po_1',
        payoutStatus: 'PAID',
        amountCents: 5000,
        currency: 'cad',
        idempotencyKey: 'evt_payout_1',
      })
    );
    const recorded = payoutEvents.recordIfNew.mock.calls[0][0];
    expect(recorded.arrivalDate).toBeInstanceOf(Date);
    expect(campaigns.applyDonationEvent).not.toHaveBeenCalled();
    expect(donations.setStatus).not.toHaveBeenCalled();
    expect(webhooks.markProcessed).toHaveBeenCalledWith('evt_payout_1');
  });

  it('warns and skips recording when the account resolves to no athlete', async () => {
    athletes.findByStripeAccountId.mockResolvedValue(null);
    const event = {
      id: 'evt_payout_2',
      type: 'payout.paid',
      account: 'acct_unknown',
      livemode: false,
      created: 1_784_000_600,
      data: { object: { id: 'po_2', status: 'paid', amount: 100, currency: 'cad', arrival_date: null } },
    } as unknown as Stripe.Event;

    await makeService().process(event);
    expect(payoutEvents.recordIfNew).not.toHaveBeenCalled();
    expect(webhooks.markProcessed).toHaveBeenCalledWith('evt_payout_2');
  });
});
