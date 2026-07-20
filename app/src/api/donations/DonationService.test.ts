import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DonationService } from './DonationService';
import type { CampaignRepository } from '../../repositories/CampaignRepository';
import type { DonationRepository } from '../../repositories/DonationRepository';
import type { StripeService } from '../../services/infrastructure/StripeService';
import type { Logger } from '../../services/infrastructure/Logger';

const campaigns = { findByIdWithAthlete: vi.fn() };
const donations = { createPending: vi.fn(), setProviderRef: vi.fn() };
const stripe = { createDonationCheckoutSession: vi.fn() };
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

function makeService(): DonationService {
  return new DonationService(
    campaigns as unknown as CampaignRepository,
    donations as unknown as DonationRepository,
    stripe as unknown as StripeService,
    logger as unknown as Logger
  );
}

function activeChargesEnabledCampaign(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    campaignStatus: 'ACTIVE',
    closesAt: null,
    athlete: {
      stripeChargesEnabledAt: new Date('2026-07-01T00:00:00.000Z'),
      stripeAccountId: 'acct_athlete',
      fullName: 'Sam Runner',
      athleteSlug: 'sam-runner',
    },
    ...overrides,
  };
}

const baseRequest = {
  campaignId: 'c1',
  supporterDisplayName: 'Pat Patron',
  supporterEmail: 'pat@example.com',
  donationAmountCents: 5000,
  donationMessage: 'Go get it!',
  isAnonymous: false,
};

function pendingDonation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'd1',
    campaignId: 'c1',
    supporterUserId: null,
    supporterDisplayName: 'Pat Patron',
    supporterEmail: 'pat@example.com',
    donationAmountCents: 5000,
    donationMessage: 'Go get it!',
    donationStatus: 'PENDING',
    isAnonymous: false,
    createdAt: new Date('2026-07-20T00:00:00.000Z'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  stripe.createDonationCheckoutSession.mockResolvedValue({
    id: 'cs_test_1',
    url: 'https://checkout.stripe.com/c/pay/cs_test_1',
  });
  donations.setProviderRef.mockResolvedValue({});
});

describe('DonationService.createDonation guards', () => {
  it('404s an unknown campaign', async () => {
    campaigns.findByIdWithAthlete.mockResolvedValue(null);
    await expect(makeService().createDonation(baseRequest)).rejects.toThrow('Campaign not found');
    expect(donations.createPending).not.toHaveBeenCalled();
  });

  it('rejects a non-ACTIVE campaign', async () => {
    campaigns.findByIdWithAthlete.mockResolvedValue(
      activeChargesEnabledCampaign({ campaignStatus: 'DRAFT' })
    );
    await expect(makeService().createDonation(baseRequest)).rejects.toThrow('not accepting donations');
    expect(stripe.createDonationCheckoutSession).not.toHaveBeenCalled();
  });

  it('rejects a campaign past its closesAt', async () => {
    campaigns.findByIdWithAthlete.mockResolvedValue(
      activeChargesEnabledCampaign({ closesAt: new Date('2020-01-01T00:00:00.000Z') })
    );
    await expect(makeService().createDonation(baseRequest)).rejects.toThrow('closed');
  });

  it('forbids donating when the athlete is not charges-enabled', async () => {
    campaigns.findByIdWithAthlete.mockResolvedValue(
      activeChargesEnabledCampaign({
        athlete: {
          stripeChargesEnabledAt: null,
          stripeAccountId: 'acct_athlete',
          fullName: 'Sam',
          athleteSlug: 'sam',
        },
      })
    );
    await expect(makeService().createDonation(baseRequest)).rejects.toThrow('not accepting donations yet');
  });

  it('rejects amounts below the minimum', async () => {
    campaigns.findByIdWithAthlete.mockResolvedValue(activeChargesEnabledCampaign());
    await expect(
      makeService().createDonation({ ...baseRequest, donationAmountCents: 400 })
    ).rejects.toThrow('below the minimum');
    expect(donations.createPending).not.toHaveBeenCalled();
  });
});

describe('DonationService.createDonation happy path', () => {
  it('creates a PENDING donation + direct-charge session with NO application fee, returns checkoutUrl', async () => {
    campaigns.findByIdWithAthlete.mockResolvedValue(activeChargesEnabledCampaign());
    donations.createPending.mockResolvedValue(pendingDonation());

    const result = await makeService().createDonation(baseRequest);

    expect(donations.createPending).toHaveBeenCalledWith({
      campaignId: 'c1',
      supporterUserId: null,
      supporterDisplayName: 'Pat Patron',
      supporterEmail: 'pat@example.com',
      donationAmountCents: 5000,
      donationMessage: 'Go get it!',
      isAnonymous: false,
    });

    const sessionInput = stripe.createDonationCheckoutSession.mock.calls[0][0];
    expect(sessionInput).not.toHaveProperty('application_fee_amount');
    expect(sessionInput).not.toHaveProperty('transfer_data');
    expect(sessionInput).toMatchObject({
      stripeAccountId: 'acct_athlete',
      amountCents: 5000,
      currency: 'cad',
      productName: 'Donation to Sam Runner',
      athleteSlug: 'sam-runner',
      metadata: { donationId: 'd1', campaignId: 'c1' },
      idempotencyKey: 'd1',
    });

    expect(donations.setProviderRef).toHaveBeenCalledWith('d1', 'cs_test_1');
    expect(result.checkoutUrl).toBe('https://checkout.stripe.com/c/pay/cs_test_1');
    expect(result.donation).toMatchObject({ donationId: 'd1', donationStatus: 'PENDING', donationAmountCents: 5000 });
  });

  it('attributes a signed-in supporter via supporterUserId', async () => {
    campaigns.findByIdWithAthlete.mockResolvedValue(activeChargesEnabledCampaign());
    donations.createPending.mockResolvedValue(pendingDonation({ supporterUserId: 'user_9' }));

    await makeService().createDonation(baseRequest, 'user_9');

    expect(donations.createPending).toHaveBeenCalledWith(
      expect.objectContaining({ supporterUserId: 'user_9' })
    );
  });
});
