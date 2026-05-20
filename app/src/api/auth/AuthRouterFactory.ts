import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { AuthController } from './AuthController';

@injectable()
export class AuthRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/auth';

  constructor(private readonly authController: AuthController) {
    super();
  }

  build(): Router {
    const router = Router();
    router.post('/sign-up', this.wrap(this.authController.signUp));
    router.post('/sign-in', this.wrap(this.authController.signIn));
    return router;
  }
}
