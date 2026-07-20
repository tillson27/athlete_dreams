import { injectable } from 'tsyringe';
import { type Prisma, type WebhookEvent } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

// WebhookEvent is an AUDIT row only — never the money-application gate. The
// exactly-once guard is the `DonationEvent.idempotencyKey @unique` append inside
// the fold (Step 6). `upsertAudit` records the delivery; `markProcessed` stamps
// `processedAt` only after the fold commits, so a crash between "seen" and
// "applied" leaves `processedAt` null and is safely retried by Stripe.
@injectable()
export class WebhookEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertAudit(
    eventId: string,
    eventType: string,
    payload: Prisma.InputJsonValue
  ): Promise<WebhookEvent> {
    return this.prisma.webhookEvent.upsert({
      where: { eventId },
      create: { eventId, provider: 'stripe', eventType, payload },
      update: {},
    });
  }

  markProcessed(eventId: string): Promise<WebhookEvent> {
    return this.prisma.webhookEvent.update({
      where: { eventId },
      data: { processedAt: new Date() },
    });
  }
}
