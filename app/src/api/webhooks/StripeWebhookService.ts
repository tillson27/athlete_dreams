import { injectable } from 'tsyringe';
import type Stripe from 'stripe';
import { DonationEventType, DonationStatus, PayoutStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../services/infrastructure/PrismaService';
import { AthleteRepository } from '../../repositories/AthleteRepository';
import { CampaignRepository } from '../../repositories/CampaignRepository';
import { DonationRepository } from '../../repositories/DonationRepository';
import { DonationEventRepository } from '../../repositories/DonationEventRepository';
import { PayoutEventRepository } from '../../repositories/PayoutEventRepository';
import { WebhookEventRepository } from '../../repositories/WebhookEventRepository';
import { Logger } from '../../services/infrastructure/Logger';

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
    private readonly logger: Logger
  ) {}

  async process(event: Stripe.Event): Promise<void> {
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
  }

  private async handleSessionFailed(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    const donationId = session.metadata?.donationId;
    if (!donationId) {
      this.logger.warn({ eventId: event.id }, 'webhook.missing_donation_metadata');
      return;
    }
    await this.recordDonationFailure(event, donationId, session.id, session.currency);
  }

  private async handlePaymentIntentFailed(event: Stripe.Event): Promise<void> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    // Pending donations have no stored PaymentIntent id (set only on success),
    // so this is best-effort — most Checkout failures arrive as
    // async_payment_failed with session metadata instead.
    const donation = await this.donations.findByPaymentIntentId(paymentIntent.id);
    if (!donation) {
      this.logger.warn({ eventId: event.id, paymentIntentId: paymentIntent.id }, 'webhook.unknown_donation');
      return;
    }
    await this.recordDonationFailure(event, donation.id, paymentIntent.id, paymentIntent.currency);
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
  }

  private async handleChargeRefunded(event: Stripe.Event): Promise<void> {
    const charge = event.data.object as Stripe.Charge;
    await this.recordChargeLevelEvent(
      event,
      extractId(charge.payment_intent),
      charge.id,
      DonationEventType.DONATION_REFUNDED,
      DonationStatus.REFUNDED
    );
  }

  private async handleDisputeOpened(event: Stripe.Event): Promise<void> {
    const dispute = event.data.object as Stripe.Dispute;
    // A dispute is not a refund — record the ledger event but leave the donation
    // status unchanged (there is no DISPUTED donation status).
    await this.recordChargeLevelEvent(
      event,
      extractId(dispute.payment_intent),
      dispute.id,
      DonationEventType.DISPUTE_OPENED,
      null
    );
  }

  // Refund/dispute events carry no session id/metadata — resolve the donation by
  // PaymentIntent (persisted during the success fold). Campaign projections are
  // NOT decremented: a refund/dispute does not un-fund a met goal (context §11).
  private async recordChargeLevelEvent(
    event: Stripe.Event,
    paymentIntentId: string | null,
    stripeObjectId: string,
    donationEventType: DonationEventType,
    newStatus: DonationStatus | null
  ): Promise<void> {
    if (!paymentIntentId) {
      this.logger.warn({ eventId: event.id }, 'webhook.missing_payment_intent');
      return;
    }
    const donation = await this.donations.findByPaymentIntentId(paymentIntentId);
    if (!donation) {
      this.logger.warn({ eventId: event.id, paymentIntentId }, 'webhook.unknown_donation');
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
          donationEventType,
          amountCents: donation.donationAmountCents,
          currency: DEFAULT_CURRENCY,
          stripeAccountId,
          stripeObjectId,
          idempotencyKey: event.id,
          occurredAt: new Date(event.created * 1000),
          rawPayload: event.data.object as unknown as Prisma.InputJsonValue,
        });
        if (newStatus) {
          await this.donations.setStatus(donation.id, newStatus, tx);
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return;
      throw error;
    }
  }

  private async handleAccountUpdated(event: Stripe.Event): Promise<void> {
    const account = event.data.object as Stripe.Account;
    const athlete = await this.athletes.findByStripeAccountId(account.id);
    if (!athlete) {
      this.logger.warn({ eventId: event.id, accountId: account.id }, 'webhook.unknown_account');
      return;
    }
    const enabled =
      account.charges_enabled === true && account.capabilities?.card_payments === 'active';
    if (enabled && athlete.stripeChargesEnabledAt === null) {
      await this.athletes.setChargesEnabled(athlete.id, new Date());
      this.logger.info({ accountId: account.id }, 'stripe.account.charges_enabled');
    } else if (!enabled && athlete.stripeChargesEnabledAt !== null) {
      await this.athletes.setChargesEnabled(athlete.id, null);
    }
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

// Stripe expandable fields are `string | { id } | null`.
function extractId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
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
