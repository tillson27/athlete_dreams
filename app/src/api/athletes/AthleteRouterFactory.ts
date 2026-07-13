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
    router.get('/me/draft', this.auth.required, this.wrap(this.athleteController.getMyDraft));
    router.get(
      '/me/dashboard',
      this.auth.required,
      this.wrap(this.athleteController.getMyDashboard)
    );
    router.put('/me/draft', this.auth.required, this.wrap(this.athleteController.upsertMyDraft));
    router.post(
      '/me/publish',
      this.auth.required,
      this.wrap(this.athleteController.publishMyProfile)
    );
    router.put(
      '/me/personal-bests/reorder',
      this.auth.required,
      this.wrap(this.athleteController.reorderMyPersonalBests)
    );
    router.post(
      '/me/personal-bests',
      this.auth.required,
      this.wrap(this.athleteController.upsertMyPersonalBest)
    );
    router.put(
      '/me/personal-bests/:athletePersonalBestId',
      this.auth.required,
      this.wrap(this.athleteController.upsertMyPersonalBest)
    );
    router.delete(
      '/me/personal-bests/:athletePersonalBestId',
      this.auth.required,
      this.wrap(this.athleteController.deleteMyPersonalBest)
    );
    router.put(
      '/me/results/reorder',
      this.auth.required,
      this.wrap(this.athleteController.reorderMyResults)
    );
    router.post(
      '/me/results',
      this.auth.required,
      this.wrap(this.athleteController.upsertMyResult)
    );
    router.put(
      '/me/results/:athleteResultId',
      this.auth.required,
      this.wrap(this.athleteController.upsertMyResult)
    );
    router.delete(
      '/me/results/:athleteResultId',
      this.auth.required,
      this.wrap(this.athleteController.deleteMyResult)
    );
    router.put(
      '/me/roadmap-events/reorder',
      this.auth.required,
      this.wrap(this.athleteController.reorderMyRoadmapEvents)
    );
    router.post(
      '/me/roadmap-events',
      this.auth.required,
      this.wrap(this.athleteController.upsertMyRoadmapEvent)
    );
    router.put(
      '/me/roadmap-events/:athleteRoadmapEventId',
      this.auth.required,
      this.wrap(this.athleteController.upsertMyRoadmapEvent)
    );
    router.delete(
      '/me/roadmap-events/:athleteRoadmapEventId',
      this.auth.required,
      this.wrap(this.athleteController.deleteMyRoadmapEvent)
    );
    router.put(
      '/me/story-chapters/reorder',
      this.auth.required,
      this.wrap(this.athleteController.reorderMyStoryChapters)
    );
    router.post(
      '/me/story-chapters',
      this.auth.required,
      this.wrap(this.athleteController.upsertMyStoryChapter)
    );
    router.put(
      '/me/story-chapters/:athleteStoryChapterId',
      this.auth.required,
      this.wrap(this.athleteController.upsertMyStoryChapter)
    );
    router.delete(
      '/me/story-chapters/:athleteStoryChapterId',
      this.auth.required,
      this.wrap(this.athleteController.deleteMyStoryChapter)
    );
    router.put(
      '/me/training-snapshot',
      this.auth.required,
      this.wrap(this.athleteController.upsertMyTrainingSnapshot)
    );
    router.delete(
      '/me/training-snapshot',
      this.auth.required,
      this.wrap(this.athleteController.deleteMyTrainingSnapshot)
    );
    router.put(
      '/me/media-assets/reorder',
      this.auth.required,
      this.wrap(this.athleteController.reorderMyMediaAssets)
    );
    router.post(
      '/me/media-assets',
      this.auth.required,
      this.wrap(this.athleteController.upsertMyMediaAsset)
    );
    router.put(
      '/me/media-assets/:athleteMediaAssetId',
      this.auth.required,
      this.wrap(this.athleteController.upsertMyMediaAsset)
    );
    router.delete(
      '/me/media-assets/:athleteMediaAssetId',
      this.auth.required,
      this.wrap(this.athleteController.deleteMyMediaAsset)
    );
    router.post(
      '/:athleteSlug/follow',
      this.auth.required,
      this.wrap(this.athleteController.followProfile)
    );
    router.delete(
      '/:athleteSlug/follow',
      this.auth.required,
      this.wrap(this.athleteController.unfollowProfile)
    );
    router.get('/:athleteSlug', this.auth.optional, this.wrap(this.athleteController.getProfile));
    router.post('/', this.auth.required, this.wrap(this.athleteController.createMyProfile));
    return router;
  }
}
