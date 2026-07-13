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
    router.post('/', this.auth.required, this.wrap(this.athleteController.createMyProfile));
    router.patch('/me', this.auth.required, this.wrap(this.athleteController.updateMyProfile));
    router.post(
      '/me/publish',
      this.auth.required,
      this.wrap(this.athleteController.publishMyProfile)
    );
    router.put(
      '/me/highlights',
      this.auth.required,
      this.wrap(this.athleteController.replaceMyHighlights)
    );
    router.put(
      '/me/races',
      this.auth.required,
      this.wrap(this.athleteController.replaceMyRaceResults)
    );
    router.put('/me/roadmap', this.auth.required, this.wrap(this.athleteController.replaceMyRoadmap));
    router.put('/me/gallery', this.auth.required, this.wrap(this.athleteController.replaceMyGallery));
    router.get('/:athleteSlug', this.auth.optional, this.wrap(this.athleteController.getProfile));
    return router;
  }
}
