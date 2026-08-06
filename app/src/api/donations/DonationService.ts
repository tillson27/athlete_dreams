import { injectable } from 'tsyringe';
import type { Donation as DonationRow } from '@prisma/client';
import type { CreateDonationRequest, CreateDonationResponse, Donation as DonationDto } from 'fad-common';
import { CampaignRepository, type CampaignWithAthlete } from '../../repositories/CampaignRepository';
import { DonationRepository } from '../../repositories/DonationRepository';
import { StripeService } from '../../services/infrastructure/StripeService';
import { getStripeAccountReadiness } from '../../services/infrastructure/stripeAccountReadiness';
import { Logger } from '../../services/infrastructure/Logger';
import {
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from '../../shared/errors';

@injectable()
export class DonationService {
  private readonly donationMinimumCents = Number(process.env.DONATION_MINIMUM_CENTS) || 500;
  private readonly defaultCurrency = process.env.DEFAULT_CURRENCY ?? 'cad';

  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly donations: DonationRepository,
    private readonly stripe: StripeService,
    private readonly logger: Logger
  ) {}

  async createDonation(
    input: CreateDonationRequest,
    authenticatedUserId?: string
  ): Promise<CreateDonationResponse> {
    const campaign = await this.campaigns.findByIdWithAthlete(input.campaignId);
    if (!campaign) throw new NotFoundError('Campaign');

    assertCampaignAcceptingDonations(campaign);

    const stripeAccountId = campaign.athlete.stripeAccountId;
    if (!campaign.athlete.stripeChargesEnabledAt || !stripeAccountId) {
      throw new ForbiddenError('This athlete is not accepting donations yet');
    }

    const stripeAccount = await this.stripe.retrieveAccount(stripeAccountId);
    if (!getStripeAccountReadiness(stripeAccount).ready) {
      throw new ForbiddenError('This athlete is not accepting donations yet');
    }

    // Server-side minimum, enforced regardless of client input (Stripe also
    // enforces its own ~$0.50 CAD floor).
    if (input.donationAmountCents < this.donationMinimumCents) {
      throw new ValidationError('Donation is below the minimum amount', {
        donationAmountCents: input.donationAmountCents,
        minimumCents: this.donationMinimumCents,
      });
    }

    // The PENDING donation is persisted BEFORE the Checkout Session so the
    // fulfillment webhook always finds the row (context §12).
    const donation = await this.donations.createPending({
      campaignId: campaign.id,
      supporterUserId: authenticatedUserId ?? null,
      supporterDisplayName: input.supporterDisplayName,
      supporterEmail: input.supporterEmail ?? null,
      donationAmountCents: input.donationAmountCents,
      donationMessage: input.donationMessage ?? null,
      isAnonymous: input.isAnonymous ?? false,
    });

    let session: Awaited<ReturnType<StripeService['createDonationCheckoutSession']>>;
    try {
      session = await this.stripe.createDonationCheckoutSession({
        stripeAccountId,
        amountCents: input.donationAmountCents,
        currency: this.defaultCurrency,
        productName: `Donation to ${campaign.athlete.fullName}`,
        athleteSlug: campaign.athlete.athleteSlug,
        metadata: { donationId: donation.id, campaignId: campaign.id },
        idempotencyKey: donation.id,
      });
    } catch (error) {
      await this.donations.markFailedIfPending(donation.id);
      this.logger.warn({ donationId: donation.id, err: error }, 'donation.checkout_create_failed');
      throw new ServiceUnavailableError('Could not create a checkout session');
    }

    if (!session.url) {
      await this.donations.markFailedIfPending(donation.id);
      throw new ServiceUnavailableError('Could not create a checkout session');
    }

    await this.donations.setProviderRef(donation.id, session.id);

    this.logger.info(
      { donationId: donation.id, campaignId: campaign.id, amountCents: donation.donationAmountCents },
      'donation.created'
    );

    return { donation: toDonationDto(donation), checkoutUrl: session.url };
  }
}

function assertCampaignAcceptingDonations(campaign: CampaignWithAthlete): void {
  if (campaign.campaignStatus !== 'ACTIVE') {
    throw new ValidationError('Campaign is not accepting donations', {
      campaignStatus: campaign.campaignStatus,
    });
  }
  if (campaign.closesAt && campaign.closesAt.getTime() <= Date.now()) {
    throw new ValidationError('Campaign has closed', {
      closesAt: campaign.closesAt.toISOString(),
    });
  }
}

function toDonationDto(donation: DonationRow): DonationDto {
  return {
    donationId: donation.id,
    campaignId: donation.campaignId,
    supporterUserId: donation.supporterUserId,
    supporterDisplayName: donation.supporterDisplayName,
    supporterEmail: donation.supporterEmail,
    donationAmountCents: donation.donationAmountCents,
    donationMessage: donation.donationMessage,
    donationStatus: donation.donationStatus,
    isAnonymous: donation.isAnonymous,
    createdAt: donation.createdAt.toISOString(),
  };
}
