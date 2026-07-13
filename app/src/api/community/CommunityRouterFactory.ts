import { Router } from 'express';
import { injectable } from 'tsyringe';
import { AuthenticationMiddleware } from '../../middleware/AuthenticationMiddleware';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { CommunityController } from './CommunityController';

@injectable()
export class CommunityRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/community';

  constructor(
    private readonly communityController: CommunityController,
    private readonly auth: AuthenticationMiddleware
  ) {
    super();
  }

  build(): Router {
    const router = Router();
    router.get('/feed', this.auth.optional, this.wrap(this.communityController.listFeed));
    router.post('/reactions', this.auth.required, this.wrap(this.communityController.cheer));
    router.delete('/reactions', this.auth.required, this.wrap(this.communityController.uncheer));
    return router;
  }
}
