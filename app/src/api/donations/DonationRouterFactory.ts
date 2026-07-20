import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { DonationController } from './DonationController';
import { AuthenticationMiddleware } from '../../middleware/AuthenticationMiddleware';

@injectable()
export class DonationRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/donations';

  constructor(
    private readonly donationController: DonationController,
    private readonly auth: AuthenticationMiddleware
  ) {
    super();
  }

  build(): Router {
    const router = Router();
    router.post('/', this.auth.optional, this.wrap(this.donationController.create));
    return router;
  }
}
