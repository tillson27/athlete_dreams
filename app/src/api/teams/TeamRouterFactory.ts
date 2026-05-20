import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { TeamController } from './TeamController';
import { AuthenticationMiddleware } from '../../middleware/AuthenticationMiddleware';

@injectable()
export class TeamRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/teams';

  constructor(
    private readonly teamController: TeamController,
    private readonly auth: AuthenticationMiddleware
  ) {
    super();
  }

  build(): Router {
    const router = Router();
    router.get('/', this.auth.required, this.wrap(this.teamController.listMine));
    return router;
  }
}
