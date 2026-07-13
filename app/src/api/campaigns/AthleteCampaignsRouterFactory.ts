import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { CampaignController } from './CampaignController';

// Campaign ownership stays in the campaigns feature folder; this router mounts a
// campaign sub-resource under the athletes base path without editing the athletes
// feature (Express allows two routers to share one mount path).
@injectable()
export class AthleteCampaignsRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/athletes';

  constructor(private readonly campaignController: CampaignController) {
    super();
  }

  build(): Router {
    const router = Router();
    router.get('/:athleteSlug/campaigns', this.wrap(this.campaignController.listForAthlete));
    return router;
  }
}
