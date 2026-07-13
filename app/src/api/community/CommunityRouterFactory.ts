import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { CommunityController } from './CommunityController';
import { AuthenticationMiddleware } from '../../middleware/AuthenticationMiddleware';

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
    router.get('/feed', this.auth.optional, this.wrap(this.communityController.getFeed));
    return router;
  }
}
