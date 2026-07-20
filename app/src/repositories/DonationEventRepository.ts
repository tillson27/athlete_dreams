import { injectable } from 'tsyringe';
import { type DonationEvent, type DonationEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

export interface AppendDonationEventInput {
  donationId?: string | null;
  campaignId: string;
  athleteId: string;
  donationEventType: DonationEventType;
  amountCents: number;
  currency: string;
  stripeAccountId: string;
  stripeObjectId: string;
  idempotencyKey: string;
  occurredAt: Date;
  rawPayload: Prisma.InputJsonValue;
}

// The append-only ledger is the source of truth. `idempotencyKey` (= Stripe
// event id) is `@unique`; appending inside the webhook fold transaction makes a
// duplicate delivery raise P2002 — the exactly-once guard for money application
// (Step 6). `append` therefore requires the caller's transaction client.
@injectable()
export class DonationEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  append(tx: Prisma.TransactionClient, input: AppendDonationEventInput): Promise<DonationEvent> {
    return tx.donationEvent.create({
      data: {
        donationId: input.donationId ?? null,
        campaignId: input.campaignId,
        athleteId: input.athleteId,
        donationEventType: input.donationEventType,
        amountCents: input.amountCents,
        currency: input.currency,
        stripeAccountId: input.stripeAccountId,
        stripeObjectId: input.stripeObjectId,
        idempotencyKey: input.idempotencyKey,
        occurredAt: input.occurredAt,
        rawPayload: input.rawPayload,
      },
    });
  }

  async existsByIdempotencyKey(idempotencyKey: string): Promise<boolean> {
    const existing = await this.prisma.donationEvent.findUnique({
      where: { idempotencyKey },
      select: { id: true },
    });
    return existing !== null;
  }
}
