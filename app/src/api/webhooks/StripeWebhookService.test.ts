import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const prisma = { $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb('TX')) };
const athletes = { findByStripeAccountId: vi.fn(), setChargesEnabled: vi.fn() };
const campaigns = { findByIdWithAthlete: vi.fn(), applyDonationEvent: vi.fn() };
const donations = {
  findById: vi.fn(),
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
    logger as unknown as Logger
  );
}

// Provider-shaped fixtures — exact Stripe snake_case casing + top-level `account`.
function checkoutEvent(objectOverrides: Record<string, unknown> = {}, type = 'checkout.session.completed') {
  return {
    id: 'evt_success_1',
    type,
    account: 'acct_athlete',
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
const campaignWithAthlete = { id: 'c1', athlete: { id: 'ath1', stripeAccountId: 'acct_athlete' } };

beforeEach(() => {
  vi.clearAllMocks();
  prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb('TX'));
  donations.findById.mockResolvedValue(donationRow);
  campaigns.findByIdWithAthlete.mockResolvedValue(campaignWithAthlete);
});

describe('StripeWebhookService — checkout success fold', () => {
  it('appends the ledger, marks SUCCEEDED, persists the PI, and folds the projection by the STORED amount', async () => {
    await makeService().process(checkoutEvent());

    expect(webhooks.upsertAudit).toHaveBeenCalledWith('evt_success_1', 'checkout.session.completed', expect.anything());
    expect(ledger.append).toHaveBeenCalledTimes(1);
    const [tx, ledgerInput] = ledger.append.mock.calls[0];
    expect(tx).toBe('TX');
    expect(ledgerInput).toMatchObject({
      donationId: 'd1',
      campaignId: 'c1',
      athleteId: 'ath1',
      donationEventType: 'DONATION_SUCCEEDED',
      amountCents: 5000, // stored amount, NOT amount_total (9999)
      idempotencyKey: 'evt_success_1',
      stripeObjectId: 'cs_test_1',
    });
    expect(donations.setStatus).toHaveBeenCalledWith('d1', 'SUCCEEDED', 'TX');
    expect(donations.setPaymentIntentId).toHaveBeenCalledWith('d1', 'pi_1', 'TX');
    expect(campaigns.applyDonationEvent).toHaveBeenCalledWith('TX', 'c1', 5000, 1);
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
});

describe('StripeWebhookService — refund/dispute by PaymentIntent', () => {
  it('records DONATION_REFUNDED and does not un-fund the campaign', async () => {
    donations.findByPaymentIntentId.mockResolvedValue(donationRow);
    const event = {
      id: 'evt_refund_1',
      type: 'charge.refunded',
      account: 'acct_athlete',
      created: 1_784_000_100,
      data: { object: { id: 'ch_1', payment_intent: 'pi_1' } },
    } as unknown as Stripe.Event;

    await makeService().process(event);

    expect(donations.findByPaymentIntentId).toHaveBeenCalledWith('pi_1');
    expect(ledger.append.mock.calls[0][1]).toMatchObject({ donationEventType: 'DONATION_REFUNDED' });
    expect(donations.setStatus).toHaveBeenCalledWith('d1', 'REFUNDED', 'TX');
    expect(campaigns.applyDonationEvent).not.toHaveBeenCalled();
  });

  it('records DISPUTE_OPENED without changing donation status', async () => {
    donations.findByPaymentIntentId.mockResolvedValue(donationRow);
    const event = {
      id: 'evt_dispute_1',
      type: 'charge.dispute.created',
      account: 'acct_athlete',
      created: 1_784_000_200,
      data: { object: { id: 'dp_1', payment_intent: 'pi_1' } },
    } as unknown as Stripe.Event;

    await makeService().process(event);

    expect(ledger.append.mock.calls[0][1]).toMatchObject({ donationEventType: 'DISPUTE_OPENED' });
    expect(donations.setStatus).not.toHaveBeenCalled();
  });
});

describe('StripeWebhookService — account.updated', () => {
  it('sets chargesEnabled when Stripe reports charges_enabled + active card_payments', async () => {
    athletes.findByStripeAccountId.mockResolvedValue({ id: 'ath1', stripeChargesEnabledAt: null });
    const event = {
      id: 'evt_acct_1',
      type: 'account.updated',
      account: 'acct_athlete',
      created: 1_784_000_300,
      data: { object: { id: 'acct_athlete', charges_enabled: true, capabilities: { card_payments: 'active' } } },
    } as unknown as Stripe.Event;

    await makeService().process(event);
    expect(athletes.setChargesEnabled).toHaveBeenCalledWith('ath1', expect.any(Date));
  });

  it('clears chargesEnabled when charges are toggled off', async () => {
    athletes.findByStripeAccountId.mockResolvedValue({ id: 'ath1', stripeChargesEnabledAt: new Date() });
    const event = {
      id: 'evt_acct_2',
      type: 'account.updated',
      account: 'acct_athlete',
      created: 1_784_000_400,
      data: { object: { id: 'acct_athlete', charges_enabled: false, capabilities: { card_payments: 'inactive' } } },
    } as unknown as Stripe.Event;

    await makeService().process(event);
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
      created: 1_784_000_600,
      data: { object: { id: 'po_2', status: 'paid', amount: 100, currency: 'cad', arrival_date: null } },
    } as unknown as Stripe.Event;

    await makeService().process(event);
    expect(payoutEvents.recordIfNew).not.toHaveBeenCalled();
    expect(webhooks.markProcessed).toHaveBeenCalledWith('evt_payout_2');
  });
});
