import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { AthleteController } from './AthleteController';
import { AuthenticationMiddleware } from '../../middleware/AuthenticationMiddleware';

@injectable()
export class AthleteRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/athletes';

  constructor(
    private readonly athleteController: AthleteController,
    private readonly auth: AuthenticationMiddleware
  ) {
    super();
  }

  build(): Router {
    const router = Router();
    router.get('/', this.wrap(this.athleteController.listDirectory));
    router.get('/:athleteSlug', this.wrap(this.athleteController.getProfile));
    router.post('/', this.auth.required, this.wrap(this.athleteController.createMyProfile));
    return router;
  }
}
