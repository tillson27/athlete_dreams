import { injectable } from 'tsyringe';
import { type Donation, DonationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

export interface CreatePendingDonationInput {
  campaignId: string;
  supporterUserId?: string | null;
  supporterDisplayName: string;
  supporterEmail?: string | null;
  donationAmountCents: number;
  donationMessage?: string | null;
  isAnonymous: boolean;
}

// `findById`, `setStatus`, and `setPaymentIntentId` accept an optional Prisma
// transaction client so the webhook fold (Step 6) can read + mutate the donation
// inside the same `$transaction` as the ledger append and campaign projection.
@injectable()
export class DonationRepository {
  constructor(private readonly prisma: PrismaService) {}

  createPending(input: CreatePendingDonationInput): Promise<Donation> {
    return this.prisma.donation.create({
      data: {
        campaignId: input.campaignId,
        supporterUserId: input.supporterUserId ?? null,
        supporterDisplayName: input.supporterDisplayName,
        supporterEmail: input.supporterEmail ?? null,
        donationAmountCents: input.donationAmountCents,
        donationMessage: input.donationMessage ?? null,
        isAnonymous: input.isAnonymous,
        donationStatus: DonationStatus.PENDING,
      },
    });
  }

  findById(donationId: string, tx?: Prisma.TransactionClient): Promise<Donation | null> {
    const db: Prisma.TransactionClient = tx ?? this.prisma;
    return db.donation.findUnique({ where: { id: donationId } });
  }

  findByProviderRef(paymentProviderRef: string): Promise<Donation | null> {
    return this.prisma.donation.findUnique({ where: { paymentProviderRef } });
  }

  // Refund/dispute webhooks reference the PaymentIntent, not the Checkout
  // Session — this is how those events map back to a Donation (context §11).
  findByPaymentIntentId(stripePaymentIntentId: string): Promise<Donation | null> {
    return this.prisma.donation.findUnique({ where: { stripePaymentIntentId } });
  }

  setProviderRef(donationId: string, paymentProviderRef: string): Promise<Donation> {
    return this.prisma.donation.update({
      where: { id: donationId },
      data: { paymentProviderRef },
    });
  }

  markFailedIfPending(donationId: string): Promise<{ count: number }> {
    return this.prisma.donation.updateMany({
      where: { id: donationId, donationStatus: DonationStatus.PENDING },
      data: { donationStatus: DonationStatus.FAILED },
    });
  }

  setPaymentIntentId(
    donationId: string,
    stripePaymentIntentId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Donation> {
    const db: Prisma.TransactionClient = tx ?? this.prisma;
    return db.donation.update({
      where: { id: donationId },
      data: { stripePaymentIntentId },
    });
  }

  setStatus(
    donationId: string,
    donationStatus: DonationStatus,
    tx?: Prisma.TransactionClient
  ): Promise<Donation> {
    const db: Prisma.TransactionClient = tx ?? this.prisma;
    return db.donation.update({
      where: { id: donationId },
      data: { donationStatus },
    });
  }

  listForCampaign(campaignId: string, limit: number): Promise<Donation[]> {
    return this.prisma.donation.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
