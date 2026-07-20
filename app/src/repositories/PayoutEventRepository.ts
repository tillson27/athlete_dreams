import { injectable } from 'tsyringe';
import { type PayoutEvent, type PayoutStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

export interface RecordPayoutEventInput {
  athleteId: string;
  stripeAccountId: string;
  stripePayoutId: string;
  payoutStatus: PayoutStatus;
  amountCents: number;
  currency: string;
  arrivalDate?: Date | null;
  idempotencyKey: string;
  occurredAt: Date;
  rawPayload: Prisma.InputJsonValue;
}

// Payout events are a standalone, append-only audit stream giving passive
// visibility into athlete bank payouts (`payout.*`). They NEVER touch
// donation/campaign projections — ARC only records them (non-custodial).
// `recordIfNew` is idempotent per Stripe event id via the `idempotencyKey`
// unique constraint (P2002 ⇒ already recorded).
@injectable()
export class PayoutEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async recordIfNew(input: RecordPayoutEventInput): Promise<boolean> {
    try {
      await this.prisma.payoutEvent.create({
        data: {
          athleteId: input.athleteId,
          stripeAccountId: input.stripeAccountId,
          stripePayoutId: input.stripePayoutId,
          payoutStatus: input.payoutStatus,
          amountCents: input.amountCents,
          currency: input.currency,
          arrivalDate: input.arrivalDate ?? null,
          idempotencyKey: input.idempotencyKey,
          occurredAt: input.occurredAt,
          rawPayload: input.rawPayload,
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }
      throw error;
    }
  }

  listRecentForAthlete(athleteId: string, limit: number): Promise<PayoutEvent[]> {
    return this.prisma.payoutEvent.findMany({
      where: { athleteId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });
  }
}
