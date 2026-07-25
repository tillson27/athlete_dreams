import { injectable } from 'tsyringe';
import type { PayoutEvent } from '@prisma/client';
import type {
  AthletePayout,
  AthleteStripeOnboardingResponse,
  AthleteStripeStatus,
} from 'fad-common';
import { AthleteRepository } from '../../repositories/AthleteRepository';
import { PayoutEventRepository } from '../../repositories/PayoutEventRepository';
import { StripeService } from '../../services/infrastructure/StripeService';
import { getStripeAccountReadiness } from '../../services/infrastructure/stripeAccountReadiness';
import { Logger } from '../../services/infrastructure/Logger';
import { ForbiddenError } from '../../shared/errors';

const RECENT_PAYOUTS_LIMIT = 10;

@injectable()
export class AthleteStripeService {
  constructor(
    private readonly athletes: AthleteRepository,
    private readonly payoutEvents: PayoutEventRepository,
    private readonly stripe: StripeService,
    private readonly logger: Logger
  ) {}

  async startOnboarding(userId: string): Promise<AthleteStripeOnboardingResponse> {
    const athlete = await this.athletes.findByUserId(userId);
    if (!athlete) throw new ForbiddenError('Must have an athlete profile to connect Stripe');

    let stripeAccountId = athlete.stripeAccountId;
    if (!stripeAccountId) {
      const account = await this.stripe.createConnectedAccount();
      stripeAccountId = account.id;
      await this.athletes.setStripeAccount(athlete.id, stripeAccountId);
      this.logger.info(
        { athleteId: athlete.id, accountId: stripeAccountId },
        'stripe.onboarding.link_created'
      );
    }

    const link = await this.stripe.createAccountLink(stripeAccountId);
    return { onboardingUrl: link.url };
  }

  async getStatus(userId: string): Promise<AthleteStripeStatus> {
    const athlete = await this.athletes.findByUserId(userId);
    if (!athlete) throw new ForbiddenError('Must have an athlete profile to view Stripe status');

    if (!athlete.stripeAccountId) {
      return {
        stripeConnected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        recentPayouts: [],
      };
    }

    const account = await this.stripe.retrieveAccount(athlete.stripeAccountId);
    const readiness = getStripeAccountReadiness(account);
    await this.reconcileStoredReadiness(
      athlete.id,
      athlete.stripeChargesEnabledAt,
      readiness.ready,
      athlete.stripeAccountId
    );

    let onboardingUrl: string | undefined;
    if (!readiness.ready) {
      const link = await this.stripe.createAccountLink(athlete.stripeAccountId);
      onboardingUrl = link.url;
    }

    const payouts = await this.payoutEvents.listRecentForAthlete(athlete.id, RECENT_PAYOUTS_LIMIT);

    return {
      stripeConnected: true,
      chargesEnabled: readiness.chargesEnabled,
      payoutsEnabled: readiness.payoutsEnabled,
      onboardingUrl,
      recentPayouts: payouts.map(toAthletePayout),
    };
  }

  private async reconcileStoredReadiness(
    athleteId: string,
    storedReadyAt: Date | null,
    stripeReady: boolean,
    stripeAccountId: string
  ): Promise<void> {
    if (stripeReady && storedReadyAt === null) {
      await this.athletes.setChargesEnabled(athleteId, new Date());
      this.logger.info({ accountId: stripeAccountId }, 'stripe.account.ready');
      return;
    }
    if (!stripeReady && storedReadyAt !== null) {
      await this.athletes.setChargesEnabled(athleteId, null);
      this.logger.info({ accountId: stripeAccountId }, 'stripe.account.not_ready');
    }
  }
}

function toAthletePayout(payout: PayoutEvent): AthletePayout {
  return {
    stripePayoutId: payout.stripePayoutId,
    payoutStatus: payout.payoutStatus,
    amountCents: payout.amountCents,
    currency: payout.currency,
    arrivalDate: payout.arrivalDate ? payout.arrivalDate.toISOString() : null,
    occurredAt: payout.occurredAt.toISOString(),
  };
}
