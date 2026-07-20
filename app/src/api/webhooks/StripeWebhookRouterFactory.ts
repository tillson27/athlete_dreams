import express, { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { StripeWebhookController } from './StripeWebhookController';

@injectable()
export class StripeWebhookRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/webhooks';

  constructor(private readonly stripeWebhookController: StripeWebhookController) {
    super();
  }

  build(): Router {
    const router = Router();
    // Raw body (not JSON) so the Stripe signature is verified against the exact
    // bytes. Scoped to this route; the global JSON parser is mounted after this
    // router in buildApp().
    router.post(
      '/stripe',
      express.raw({ type: 'application/json' }),
      this.wrap(this.stripeWebhookController.handle)
    );
    return router;
  }
}
