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
import { Logger } from '../../services/infrastructure/Logger';
import { ForbiddenError } from '../../shared/errors';

const RECENT_PAYOUTS_LIMIT = 10;

// Focused, auditable slice for the athlete's Stripe/non-custodial surface —
// kept separate from AthleteService so the "no fees/transfers" invariant is easy
// to review in one place (context §10).
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
      return { stripeConnected: false, chargesEnabled: false, recentPayouts: [] };
    }

    // Prefer the webhook-maintained timestamp; if not yet enabled, reconcile once
    // against the live account so status is self-healing even before/without a
    // configured webhook (Stripe test mode).
    let chargesEnabledAt = athlete.stripeChargesEnabledAt;
    if (!chargesEnabledAt) {
      const account = await this.stripe.retrieveAccount(athlete.stripeAccountId);
      if (account.charges_enabled && account.capabilities?.card_payments === 'active') {
        chargesEnabledAt = new Date();
        await this.athletes.setChargesEnabled(athlete.id, chargesEnabledAt);
        this.logger.info(
          { accountId: athlete.stripeAccountId },
          'stripe.account.charges_enabled'
        );
      }
    }

    const chargesEnabled = chargesEnabledAt !== null;

    // Not-yet-enabled accounts get a fresh single-use link so the card can offer
    // "finish setup". Enabled accounts need no link.
    let onboardingUrl: string | undefined;
    if (!chargesEnabled) {
      const link = await this.stripe.createAccountLink(athlete.stripeAccountId);
      onboardingUrl = link.url;
    }

    const payouts = await this.payoutEvents.listRecentForAthlete(athlete.id, RECENT_PAYOUTS_LIMIT);

    return {
      stripeConnected: true,
      chargesEnabled,
      onboardingUrl,
      recentPayouts: payouts.map(toAthletePayout),
    };
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
