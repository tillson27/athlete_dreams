import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { AthleteStripeController } from './AthleteStripeController';
import { AuthenticationMiddleware } from '../../middleware/AuthenticationMiddleware';

@injectable()
export class AthleteStripeRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/athletes/me/stripe';

  constructor(
    private readonly athleteStripeController: AthleteStripeController,
    private readonly auth: AuthenticationMiddleware
  ) {
    super();
  }

  build(): Router {
    const router = Router();
    router.post(
      '/onboarding-link',
      this.auth.required,
      this.wrap(this.athleteStripeController.startOnboarding)
    );
    router.get('/status', this.auth.required, this.wrap(this.athleteStripeController.getStatus));
    return router;
  }
}
