import { injectable } from 'tsyringe';
import type Stripe from 'stripe';
import {
  type Donation,
  DonationEventType,
  DonationStatus,
  PayoutStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../services/infrastructure/PrismaService';
import { AthleteRepository } from '../../repositories/AthleteRepository';
import { CampaignRepository } from '../../repositories/CampaignRepository';
import { DonationRepository } from '../../repositories/DonationRepository';
import { DonationEventRepository } from '../../repositories/DonationEventRepository';
import { PayoutEventRepository } from '../../repositories/PayoutEventRepository';
import { WebhookEventRepository } from '../../repositories/WebhookEventRepository';
import { Logger } from '../../services/infrastructure/Logger';
import { PostHogService } from '../../services/infrastructure/PostHogService';
import { getStripeAccountReadiness } from '../../services/infrastructure/stripeAccountReadiness';
import { BadRequestError } from '../../shared/errors';

const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY ?? 'cad';

// Source of truth for donation fulfillment and connected-account status. The
// exactly-once guard for money application is the `DonationEvent.idempotencyKey`
// (= Stripe event id) unique constraint appended INSIDE the same $transaction as
// the projection fold — NOT the WebhookEvent audit row (see Step 6 design). A
// transient failure throws (→ non-2xx → Stripe retries); processedAt stays null.
@injectable()
export class StripeWebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly athletes: AthleteRepository,
    private readonly campaigns: CampaignRepository,
    private readonly donations: DonationRepository,
    private readonly ledger: DonationEventRepository,
    private readonly payoutEvents: PayoutEventRepository,
    private readonly webhooks: WebhookEventRepository,
    private readonly logger: Logger,
    private readonly posthog: PostHogService
  ) {}

  async process(event: Stripe.Event): Promise<void> {
    this.assertLivemodeMatchesRuntime(event);

    await this.webhooks.upsertAudit(
      event.id,
      event.type,
      event.data.object as unknown as Prisma.InputJsonValue
    );
    this.logger.info({ eventId: event.id, type: event.type }, 'webhook.received');

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await this.handleCheckoutSucceeded(event);
        break;
      case 'checkout.session.async_payment_failed':
        await this.handleSessionFailed(event);
        break;
      case 'checkout.session.expired':
        await this.handleSessionExpired(event);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event);
        break;
      case 'charge.dispute.created':
        await this.handleDisputeOpened(event);
        break;
      case 'account.updated':
        await this.handleAccountUpdated(event);
        break;
      case 'account.application.deauthorized':
        await this.handleAccountApplicationDeauthorized(event);
        break;
      case 'payout.paid':
      case 'payout.failed':
      case 'payout.updated':
      case 'payout.created':
        await this.handlePayout(event);
        break;
      default:
        // Unhandled event type: the audit row is enough.
        break;
    }

    await this.webhooks.markProcessed(event.id);
  }

  private assertLivemodeMatchesRuntime(event: Stripe.Event): void {
    const expectedLivemode = getExpectedStripeLivemode();
    if (expectedLivemode === null || event.livemode === expectedLivemode) return;

    this.logger.warn(
      { eventId: event.id, eventLivemode: event.livemode, expectedLivemode },
      'webhook.livemode_mismatch'
    );
    throw new BadRequestError('Stripe webhook mode does not match the configured Stripe key');
  }

  private async handleCheckoutSucceeded(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    // Async payment methods can complete the session while still unpaid — wait
    // for async_payment_succeeded instead of fulfilling now.
    if (session.payment_status === 'unpaid') return;

    const donationId = session.metadata?.donationId;
    if (!donationId) {
      this.logger.warn({ eventId: event.id }, 'webhook.missing_donation_metadata');
      return;
    }

    const donation = await this.donations.findById(donationId);
    if (!donation) {
      this.logger.warn({ eventId: event.id, donationId }, 'webhook.unknown_donation');
      return;
    }

    const campaign = await this.campaigns.findByIdWithAthlete(donation.campaignId);
    if (!campaign) {
      this.logger.warn({ eventId: event.id, campaignId: donation.campaignId }, 'webhook.unknown_campaign');
      return;
    }

    const paymentIntentId = extractId(session.payment_intent);
    const stripeAccountId = event.account ?? campaign.athlete.stripeAccountId ?? '';

    try {
      await this.prisma.$transaction(async (tx) => {
        // Append FIRST: a duplicate delivery hits the idempotencyKey unique
        // constraint (P2002) and rolls back the whole fold — exactly-once.
        await this.ledger.append(tx, {
          donationId: donation.id,
          campaignId: donation.campaignId,
          athleteId: campaign.athlete.id,
          donationEventType: DonationEventType.DONATION_SUCCEEDED,
          // Trust the server-validated stored amount, NOT the nullable
          // session.amount_total (which would silently increment by 0 if absent).
          amountCents: donation.donationAmountCents,
          currency: session.currency ?? DEFAULT_CURRENCY,
          stripeAccountId,
          stripeObjectId: session.id,
          idempotencyKey: event.id,
          occurredAt: new Date(event.created * 1000),
          rawPayload: session as unknown as Prisma.InputJsonValue,
        });
        await this.donations.setStatus(donation.id, DonationStatus.SUCCEEDED, tx);
        if (paymentIntentId) {
          await this.donations.setPaymentIntentId(donation.id, paymentIntentId, tx);
        }
        await this.campaigns.applyDonationEvent(tx, donation.campaignId, donation.donationAmountCents, 1);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Duplicate event id ⇒ already applied. No-op, still 2xx.
        return;
      }
      throw error;
    }

    this.logger.info({ donationId: donation.id }, 'donation.succeeded');
    this.posthog.capture({
      distinctId: `donation:${donation.id}`,
      event: 'donation_succeeded',
      properties: {
        donation_id: donation.id,
        campaign_id: donation.campaignId,
        amount_cents: donation.donationAmountCents,
        stripe_event_id: event.id,
      },
    });
  }

  private async handleSessionFailed(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    await this.recordSessionFailure(event, session);
  }

  private async handleSessionExpired(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    await this.recordSessionFailure(event, session);
  }

  private async recordSessionFailure(
    event: Stripe.Event,
    session: Stripe.Checkout.Session
  ): Promise<void> {
    const donationId = session.metadata?.donationId;
    if (donationId) {
      await this.recordDonationFailure(event, donationId, session.id, session.currency);
      return;
    }

    const donation = await this.donations.findByProviderRef(session.id);
    if (!donation) {
      this.logger.warn({ eventId: event.id }, 'webhook.missing_donation_metadata');
      return;
    }
    await this.recordDonationFailure(event, donation.id, session.id, session.currency);
  }

  private async handlePaymentIntentFailed(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const donation = await this.donations.findByPaymentIntentId(paymentIntent.id);
    if (donation) {
      await this.recordDonationFailure(event, donation.id, paymentIntent.id, paymentIntent.currency);
      return;
    }

    const donationId = getMetadataDonationId(paymentIntent);
    if (!donationId) {
      this.logger.warn({ eventId: event.id, paymentIntentId: paymentIntent.id }, 'webhook.unknown_donation');
      return;
    }
    await this.recordDonationFailure(event, donationId, paymentIntent.id, paymentIntent.currency);
  }

  private async recordDonationFailure(
    event: Stripe.Event,
    donationId: string,
    stripeObjectId: string,
    currency: string | null
  ): Promise<void> {
    const donation = await this.donations.findById(donationId);
    if (!donation) {
      this.logger.warn({ eventId: event.id, donationId }, 'webhook.unknown_donation');
      return;
    }
    if (donation.donationStatus !== DonationStatus.PENDING) {
      this.logger.warn(
        { eventId: event.id, donationId, donationStatus: donation.donationStatus },
        'webhook.donation_failure_non_pending'
      );
      return;
    }
    const campaign = await this.campaigns.findByIdWithAthlete(donation.campaignId);
    const stripeAccountId = event.account ?? campaign?.athlete.stripeAccountId ?? '';
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.ledger.append(tx, {
          donationId: donation.id,
          campaignId: donation.campaignId,
          athleteId: campaign?.athlete.id ?? donation.campaignId,
          donationEventType: DonationEventType.DONATION_FAILED,
          amountCents: donation.donationAmountCents,
          currency: currency ?? DEFAULT_CURRENCY,
          stripeAccountId,
          stripeObjectId,
          idempotencyKey: event.id,
          occurredAt: new Date(event.created * 1000),
          rawPayload: event.data.object as unknown as Prisma.InputJsonValue,
        });
        // Failed donations were never added to the projection, so no campaign
        // decrement — only reflect the donation's own status.
        await this.donations.setStatus(donation.id, DonationStatus.FAILED, tx);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return;
      throw error;
    }
    this.logger.info({ donationId: donation.id }, 'donation.failed');
    this.posthog.capture({
      distinctId: `donation:${donation.id}`,
      event: 'donation_failed',
      properties: {
        donation_id: donation.id,
        campaign_id: donation.campaignId,
        amount_cents: donation.donationAmountCents,
        stripe_event_id: event.id,
        stripe_event_type: event.type,
      },
    });
  }

  private async handleChargeRefunded(event: Stripe.Event): Promise<void> {
    const charge = event.data.object as Stripe.Charge;
    await this.recordChargeLevelEvent(
      event,
      {
        paymentIntentId: extractId(charge.payment_intent),
        donationId: getMetadataDonationId(charge),
        stripeObjectId: charge.id,
        donationEventType: DonationEventType.DONATION_REFUNDED,
        amountCents: normalizeStripeAmount(charge.amount_refunded),
        currency: charge.currency,
        newStatus: null,
      }
    );
  }

  private async handleDisputeOpened(event: Stripe.Event): Promise<void> {
    const dispute = event.data.object as Stripe.Dispute;
    await this.recordChargeLevelEvent(
      event,
      {
        paymentIntentId: extractId(dispute.payment_intent),
        donationId: getMetadataDonationId(dispute),
        stripeObjectId: dispute.id,
        donationEventType: DonationEventType.DISPUTE_OPENED,
        amountCents: normalizeStripeAmount(dispute.amount),
        currency: dispute.currency,
        newStatus: DonationStatus.FAILED,
      }
    );
  }

  private async recordChargeLevelEvent(
    event: Stripe.Event,
    input: {
      paymentIntentId: string | null;
      donationId: string | undefined;
      stripeObjectId: string;
      donationEventType: DonationEventType;
      amountCents: number | null;
      currency: string | null;
      newStatus: DonationStatus | null;
    }
  ): Promise<void> {
    const donation = await this.findDonationForProviderObject(
      event,
      input.paymentIntentId,
      input.donationId
    );
    if (!donation) {
      return;
    }
    const campaign = await this.campaigns.findByIdWithAthlete(donation.campaignId);
    const stripeAccountId = event.account ?? campaign?.athlete.stripeAccountId ?? '';
    try {
      await this.prisma.$transaction(async (tx) => {
        const projection = await this.buildChargeProjectionDelta(tx, donation, input);
        await this.ledger.append(tx, {
          donationId: donation.id,
          campaignId: donation.campaignId,
          athleteId: campaign?.athlete.id ?? donation.campaignId,
          donationEventType: input.donationEventType,
          amountCents: projection.ledgerAmountCents,
          currency: input.currency ?? DEFAULT_CURRENCY,
          stripeAccountId,
          stripeObjectId: input.stripeObjectId,
          idempotencyKey: event.id,
          occurredAt: new Date(event.created * 1000),
          rawPayload: event.data.object as unknown as Prisma.InputJsonValue,
        });
        if (input.newStatus) {
          await this.donations.setStatus(donation.id, input.newStatus, tx);
        } else if (projection.newStatus) {
          await this.donations.setStatus(donation.id, projection.newStatus, tx);
        }
        if (projection.campaignDeltaCents !== 0 || projection.supporterDelta !== 0) {
          await this.campaigns.applyDonationEvent(
            tx,
            donation.campaignId,
            projection.campaignDeltaCents,
            projection.supporterDelta
          );
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return;
      throw error;
    }

    // Capture a PostHog event for charge-level outcomes (refunds and disputes).
    const posthogEvent =
      input.donationEventType === DonationEventType.DONATION_REFUNDED
        ? 'donation_refunded'
        : input.donationEventType === DonationEventType.DISPUTE_OPENED
          ? 'dispute_opened'
          : null;
    if (posthogEvent) {
      this.posthog.capture({
        distinctId: `donation:${donation.id}`,
        event: posthogEvent,
        properties: {
          donation_id: donation.id,
          campaign_id: donation.campaignId,
          amount_cents: input.amountCents ?? donation.donationAmountCents,
          stripe_event_id: event.id,
          stripe_event_type: event.type,
        },
      });
    }
  }

  private async buildChargeProjectionDelta(
    tx: Prisma.TransactionClient,
    donation: Donation,
    input: {
      donationEventType: DonationEventType;
      amountCents: number | null;
      newStatus: DonationStatus | null;
    }
  ): Promise<{
    ledgerAmountCents: number;
    campaignDeltaCents: number;
    supporterDelta: number;
    newStatus: DonationStatus | null;
  }> {
    if (input.donationEventType === DonationEventType.DONATION_REFUNDED) {
      const cumulativeRefundedCents = Math.min(
        input.amountCents ?? donation.donationAmountCents,
        donation.donationAmountCents
      );
      const priorRefunded = await tx.donationEvent.aggregate({
        where: {
          donationId: donation.id,
          donationEventType: DonationEventType.DONATION_REFUNDED,
        },
        _sum: { amountCents: true },
      });
      const priorRefundedCents = Math.min(
        priorRefunded._sum.amountCents ?? 0,
        donation.donationAmountCents
      );
      const deltaCents = Math.max(0, cumulativeRefundedCents - priorRefundedCents);
      const fullyRefunded =
        cumulativeRefundedCents >= donation.donationAmountCents &&
        donation.donationStatus === DonationStatus.SUCCEEDED;
      return {
        ledgerAmountCents: deltaCents,
        campaignDeltaCents: -deltaCents,
        supporterDelta: fullyRefunded ? -1 : 0,
        newStatus: fullyRefunded ? DonationStatus.REFUNDED : null,
      };
    }

    if (input.donationEventType === DonationEventType.DISPUTE_OPENED) {
      const disputedCents = Math.min(
        input.amountCents ?? donation.donationAmountCents,
        donation.donationAmountCents
      );
      const supporterDelta = donation.donationStatus === DonationStatus.SUCCEEDED ? -1 : 0;
      return {
        ledgerAmountCents: disputedCents,
        campaignDeltaCents: -disputedCents,
        supporterDelta,
        newStatus: null,
      };
    }

    return {
      ledgerAmountCents: input.amountCents ?? donation.donationAmountCents,
      campaignDeltaCents: 0,
      supporterDelta: 0,
      newStatus: null,
    };
  }

  private async handleAccountUpdated(event: Stripe.Event): Promise<void> {
    const account = event.data.object as Stripe.Account;
    const athlete = await this.athletes.findByStripeAccountId(account.id);
    if (!athlete) {
      this.logger.warn({ eventId: event.id, accountId: account.id }, 'webhook.unknown_account');
      return;
    }
    const readiness = getStripeAccountReadiness(account);
    if (readiness.ready && athlete.stripeChargesEnabledAt === null) {
      await this.athletes.setChargesEnabled(athlete.id, new Date());
      this.logger.info({ accountId: account.id }, 'stripe.account.ready');
    } else if (!readiness.ready && athlete.stripeChargesEnabledAt !== null) {
      await this.athletes.setChargesEnabled(athlete.id, null);
    }
  }

  private async handleAccountApplicationDeauthorized(event: Stripe.Event): Promise<void> {
    const accountId = event.account;
    if (!accountId) {
      this.logger.warn({ eventId: event.id }, 'webhook.deauthorized_missing_account');
      return;
    }

    const athlete = await this.athletes.findByStripeAccountId(accountId);
    if (!athlete) {
      this.logger.warn({ eventId: event.id, accountId }, 'webhook.unknown_account');
      return;
    }

    await this.athletes.setChargesEnabled(athlete.id, null);
    this.logger.info({ accountId }, 'stripe.account.deauthorized');
  }

  private async findDonationForProviderObject(
    event: Stripe.Event,
    paymentIntentId: string | null,
    donationId: string | undefined
  ): Promise<Donation | null> {
    if (paymentIntentId) {
      const donation = await this.donations.findByPaymentIntentId(paymentIntentId);
      if (donation) return donation;
    }

    if (donationId) {
      const donation = await this.donations.findById(donationId);
      if (donation) return donation;
    }

    this.logger.warn({ eventId: event.id, paymentIntentId, donationId }, 'webhook.unknown_donation');
    return null;
  }

  private async handlePayout(event: Stripe.Event): Promise<void> {
    const payout = event.data.object as Stripe.Payout;
    const accountId = event.account;
    if (!accountId) {
      this.logger.warn({ eventId: event.id }, 'webhook.payout_missing_account');
      return;
    }
    const athlete = await this.athletes.findByStripeAccountId(accountId);
    if (!athlete) {
      this.logger.warn({ eventId: event.id, accountId }, 'webhook.unknown_account');
      return;
    }
    // Observability only — never touches donation/campaign projections.
    await this.payoutEvents.recordIfNew({
      athleteId: athlete.id,
      stripeAccountId: accountId,
      stripePayoutId: payout.id,
      payoutStatus: mapPayoutStatus(payout.status),
      amountCents: payout.amount,
      currency: payout.currency,
      arrivalDate: payout.arrival_date ? new Date(payout.arrival_date * 1000) : null,
      idempotencyKey: event.id,
      occurredAt: new Date(event.created * 1000),
      rawPayload: payout as unknown as Prisma.InputJsonValue,
    });
    this.logger.info(
      {
        athleteId: athlete.id,
        stripePayoutId: payout.id,
        payoutStatus: payout.status,
        amountCents: payout.amount,
      },
      'payout.recorded'
    );
  }
}

function extractId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

function getExpectedStripeLivemode(): boolean | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_')) return true;
  if (secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_')) return false;
  return null;
}

function getMetadataDonationId(value: { metadata?: Stripe.Metadata | null }): string | undefined {
  const donationId = value.metadata?.donationId;
  return donationId && donationId.length > 0 ? donationId : undefined;
}

function normalizeStripeAmount(amount: number | null | undefined): number | null {
  return typeof amount === 'number' && amount > 0 ? amount : null;
}

function mapPayoutStatus(status: string): PayoutStatus {
  switch (status) {
    case 'paid':
      return PayoutStatus.PAID;
    case 'in_transit':
      return PayoutStatus.IN_TRANSIT;
    case 'canceled':
      return PayoutStatus.CANCELED;
    case 'failed':
      return PayoutStatus.FAILED;
    case 'pending':
    default:
      return PayoutStatus.PENDING;
  }
}
