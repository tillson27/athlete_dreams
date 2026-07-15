import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { FollowController } from './FollowController';
import { AuthenticationMiddleware } from '../../middleware/AuthenticationMiddleware';

// Mounts the caller's follow list under the users base path; two routers sharing
// one mount path keeps follow ownership inside the follows feature folder.
@injectable()
export class MyFollowsRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/users';

  constructor(
    private readonly followController: FollowController,
    private readonly auth: AuthenticationMiddleware
  ) {
    super();
  }

  build(): Router {
    const router = Router();
    router.get('/me/follows', this.auth.required, this.wrap(this.followController.listMine));
    return router;
  }
}
