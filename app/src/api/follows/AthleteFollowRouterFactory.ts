import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { FollowController } from './FollowController';
import { AuthenticationMiddleware } from '../../middleware/AuthenticationMiddleware';

// Follow ownership stays in the follows feature folder; this router mounts the
// follow sub-resource under the athletes base path without editing the athletes
// feature (Express allows two routers to share one mount path).
@injectable()
export class AthleteFollowRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/athletes';

  constructor(
    private readonly followController: FollowController,
    private readonly auth: AuthenticationMiddleware
  ) {
    super();
  }

  build(): Router {
    const router = Router();
    router.post('/:athleteSlug/follow', this.auth.required, this.wrap(this.followController.follow));
    router.delete(
      '/:athleteSlug/follow',
      this.auth.required,
      this.wrap(this.followController.unfollow)
    );
    return router;
  }
}
