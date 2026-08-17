import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AthleteStripeService } from './AthleteStripeService';
import type { AthleteRepository } from '../../repositories/AthleteRepository';
import type { PayoutEventRepository } from '../../repositories/PayoutEventRepository';
import type { StripeService } from '../../services/infrastructure/StripeService';
import type { Logger } from '../../services/infrastructure/Logger';

const athletes = {
  findByUserId: vi.fn(),
  setStripeAccount: vi.fn(),
  setChargesEnabled: vi.fn(),
};
const payoutEvents = { listRecentForAthlete: vi.fn() };
const stripe = {
  createConnectedAccount: vi.fn(),
  createAccountLink: vi.fn(),
  retrieveAccount: vi.fn(),
};
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

function makeService(): AthleteStripeService {
  return new AthleteStripeService(
    athletes as unknown as AthleteRepository,
    payoutEvents as unknown as PayoutEventRepository,
    stripe as unknown as StripeService,
    logger as unknown as Logger
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  payoutEvents.listRecentForAthlete.mockResolvedValue([]);
  stripe.createAccountLink.mockResolvedValue({ url: 'https://connect.stripe.com/setup/x' });
});

describe('AthleteStripeService.startOnboarding', () => {
  it('creates a Standard account when the athlete has none, then mints a link', async () => {
    athletes.findByUserId.mockResolvedValue({ id: 'a1', stripeAccountId: null });
    stripe.createConnectedAccount.mockResolvedValue({ id: 'acct_new' });

    const result = await makeService().startOnboarding('u1');

    expect(stripe.createConnectedAccount).toHaveBeenCalledTimes(1);
    expect(athletes.setStripeAccount).toHaveBeenCalledWith('a1', 'acct_new');
    expect(stripe.createAccountLink).toHaveBeenCalledWith('acct_new');
    expect(result).toEqual({ onboardingUrl: 'https://connect.stripe.com/setup/x' });
  });

  it('reuses an existing connected account', async () => {
    athletes.findByUserId.mockResolvedValue({ id: 'a1', stripeAccountId: 'acct_existing' });

    await makeService().startOnboarding('u1');

    expect(stripe.createConnectedAccount).not.toHaveBeenCalled();
    expect(athletes.setStripeAccount).not.toHaveBeenCalled();
    expect(stripe.createAccountLink).toHaveBeenCalledWith('acct_existing');
  });

  it('returns a typed service error when Stripe account creation fails', async () => {
    athletes.findByUserId.mockResolvedValue({ id: 'a1', stripeAccountId: null });
    stripe.createConnectedAccount.mockRejectedValue(new Error('stripe unavailable'));

    await expect(makeService().startOnboarding('u1')).rejects.toMatchObject({
      httpStatus: 503,
      errorCode: 'service_unavailable',
    });

    expect(athletes.setStripeAccount).not.toHaveBeenCalled();
    expect(stripe.createAccountLink).not.toHaveBeenCalled();
  });

  it('returns a typed service error when Stripe account link creation fails', async () => {
    athletes.findByUserId.mockResolvedValue({ id: 'a1', stripeAccountId: 'acct_existing' });
    stripe.createAccountLink.mockRejectedValue(new Error('missing return url'));

    await expect(makeService().startOnboarding('u1')).rejects.toMatchObject({
      httpStatus: 503,
      errorCode: 'service_unavailable',
    });
  });

  it('rejects when the caller has no athlete profile', async () => {
    athletes.findByUserId.mockResolvedValue(null);
    await expect(makeService().startOnboarding('u1')).rejects.toThrow('athlete profile');
  });
});

describe('AthleteStripeService.getStatus', () => {
  it('reports not connected when there is no Stripe account', async () => {
    athletes.findByUserId.mockResolvedValue({ id: 'a1', stripeAccountId: null });

    const status = await makeService().getStatus('u1');

    expect(status).toEqual({
      stripeConnected: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      recentPayouts: [],
    });
    expect(stripe.retrieveAccount).not.toHaveBeenCalled();
  });

  it('reports fully ready from the live account, mapping payouts', async () => {
    athletes.findByUserId.mockResolvedValue({
      id: 'a1',
      stripeAccountId: 'acct_1',
      stripeChargesEnabledAt: new Date('2026-07-01T00:00:00.000Z'),
    });
    stripe.retrieveAccount.mockResolvedValue({
      charges_enabled: true,
      payouts_enabled: true,
      capabilities: { card_payments: 'active' },
    });
    payoutEvents.listRecentForAthlete.mockResolvedValue([
      {
        stripePayoutId: 'po_1',
        payoutStatus: 'PAID',
        amountCents: 5000,
        currency: 'cad',
        arrivalDate: new Date('2026-07-10T00:00:00.000Z'),
        occurredAt: new Date('2026-07-09T00:00:00.000Z'),
      },
    ]);

    const status = await makeService().getStatus('u1');

    expect(stripe.retrieveAccount).toHaveBeenCalledWith('acct_1');
    expect(status.stripeConnected).toBe(true);
    expect(status.chargesEnabled).toBe(true);
    expect(status.payoutsEnabled).toBe(true);
    expect(status.onboardingUrl).toBeUndefined();
    expect(status.recentPayouts).toEqual([
      {
        stripePayoutId: 'po_1',
        payoutStatus: 'PAID',
        amountCents: 5000,
        currency: 'cad',
        arrivalDate: '2026-07-10T00:00:00.000Z',
        occurredAt: '2026-07-09T00:00:00.000Z',
      },
    ]);
  });

  it('reconciles a live account and persists chargesEnabled when Stripe reports active', async () => {
    athletes.findByUserId.mockResolvedValue({
      id: 'a1',
      stripeAccountId: 'acct_1',
      stripeChargesEnabledAt: null,
    });
    stripe.retrieveAccount.mockResolvedValue({
      charges_enabled: true,
      payouts_enabled: true,
      capabilities: { card_payments: 'active' },
    });

    const status = await makeService().getStatus('u1');

    expect(athletes.setChargesEnabled).toHaveBeenCalledWith('a1', expect.any(Date));
    expect(status.chargesEnabled).toBe(true);
    expect(status.payoutsEnabled).toBe(true);
    expect(status.onboardingUrl).toBeUndefined();
  });

  it('keeps payments enabled but clears readiness when payouts are disabled', async () => {
    athletes.findByUserId.mockResolvedValue({
      id: 'a1',
      stripeAccountId: 'acct_1',
      stripeChargesEnabledAt: new Date('2026-07-01T00:00:00.000Z'),
    });
    stripe.retrieveAccount.mockResolvedValue({
      charges_enabled: true,
      payouts_enabled: false,
      capabilities: { card_payments: 'active' },
    });

    const status = await makeService().getStatus('u1');

    expect(status.chargesEnabled).toBe(true);
    expect(status.payoutsEnabled).toBe(false);
    expect(status.onboardingUrl).toBe('https://connect.stripe.com/setup/x');
    expect(athletes.setChargesEnabled).toHaveBeenCalledWith('a1', null);
  });

  it('offers a resume link when the account is connected but not yet charges-enabled', async () => {
    athletes.findByUserId.mockResolvedValue({
      id: 'a1',
      stripeAccountId: 'acct_1',
      stripeChargesEnabledAt: null,
    });
    stripe.retrieveAccount.mockResolvedValue({
      charges_enabled: false,
      payouts_enabled: false,
      capabilities: { card_payments: 'pending' },
    });

    const status = await makeService().getStatus('u1');

    expect(status.chargesEnabled).toBe(false);
    expect(status.payoutsEnabled).toBe(false);
    expect(status.onboardingUrl).toBe('https://connect.stripe.com/setup/x');
    expect(athletes.setChargesEnabled).not.toHaveBeenCalled();
  });
});
