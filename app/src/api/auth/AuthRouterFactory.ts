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
    router.post('/forgot-password', this.wrap(this.authController.forgotPassword));
    router.post('/reset-password', this.wrap(this.authController.resetPassword));
    router.post('/verify-email', this.wrap(this.authController.verifyEmail));
    router.post('/resend-verification', this.wrap(this.authController.resendVerification));
    return router;
  }
}
