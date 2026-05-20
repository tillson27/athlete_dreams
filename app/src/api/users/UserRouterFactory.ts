import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { UserController } from './UserController';
import { AuthenticationMiddleware } from '../../middleware/AuthenticationMiddleware';

@injectable()
export class UserRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/users';

  constructor(
    private readonly userController: UserController,
    private readonly auth: AuthenticationMiddleware
  ) {
    super();
  }

  build(): Router {
    const router = Router();
    router.get('/me', this.auth.required, this.wrap(this.userController.getMe));
    router.patch('/me', this.auth.required, this.wrap(this.userController.updateMe));
    return router;
  }
}
