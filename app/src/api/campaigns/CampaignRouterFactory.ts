import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { CampaignController } from './CampaignController';
import { AuthenticationMiddleware } from '../../middleware/AuthenticationMiddleware';

@injectable()
export class CampaignRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/campaigns';

  constructor(
    private readonly campaignController: CampaignController,
    private readonly auth: AuthenticationMiddleware
  ) {
    super();
  }

  build(): Router {
    const router = Router();
    router.get('/:campaignSlug', this.wrap(this.campaignController.getBySlug));
    router.post('/', this.auth.required, this.wrap(this.campaignController.create));
    return router;
  }
}
