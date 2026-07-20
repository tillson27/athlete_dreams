import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { StripeService } from '../../services/infrastructure/StripeService';
import { StripeWebhookService } from './StripeWebhookService';
import { BadRequestError } from '../../shared/errors';
import { Logger } from '../../services/infrastructure/Logger';

@injectable()
export class StripeWebhookController {
  constructor(
    private readonly stripe: StripeService,
    private readonly webhookService: StripeWebhookService,
    private readonly logger: Logger
  ) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    const signature = req.header('stripe-signature');
    if (!signature) throw new BadRequestError('Missing Stripe-Signature header');

    let event: Stripe.Event;
    try {
      event = this.stripe.constructWebhookEvent(req.body as Buffer, signature);
    } catch {
      // Never log the raw signature/secret.
      this.logger.warn({}, 'webhook.signature_invalid');
      throw new BadRequestError('Invalid webhook signature');
    }

    // 2xx is returned only AFTER durable processing. Transient failures inside
    // process() propagate to the error handler as 500 so Stripe retries; the
    // idempotency guard makes re-runs safe.
    await this.webhookService.process(event);
    res.sendStatus(200);
  };
}
