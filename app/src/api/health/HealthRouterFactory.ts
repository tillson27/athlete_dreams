import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { HealthController } from './HealthController';

@injectable()
export class HealthRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/health';

  constructor(private readonly healthController: HealthController) {
    super();
  }

  build(): Router {
    const router = Router();
    router.get('/live', this.wrap(this.healthController.live));
    router.get('/ready', this.wrap(this.healthController.ready));
    return router;
  }
}
