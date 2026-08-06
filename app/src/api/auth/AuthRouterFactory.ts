import { Router } from 'express';
import { injectable } from 'tsyringe';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { AuthController } from './AuthController';
import { createRateLimit } from '../../middleware/rateLimit';

@injectable()
export class AuthRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/auth';

  constructor(private readonly authController: AuthController) {
    super();
  }

  build(): Router {
    const router = Router();
    router.use(
      createRateLimit({
        keyPrefix: 'auth',
        windowMs: authRateLimitWindowMs(),
        maxRequests: authRateLimitMaxRequests(),
      })
    );
    router.post('/sign-up', this.wrap(this.authController.signUp));
    router.post('/sign-in', this.wrap(this.authController.signIn));
    router.post('/forgot-password', this.wrap(this.authController.forgotPassword));
    router.post('/reset-password', this.wrap(this.authController.resetPassword));
    router.post('/verify-email', this.wrap(this.authController.verifyEmail));
    router.post('/resend-verification', this.wrap(this.authController.resendVerification));
    return router;
  }
}

function authRateLimitWindowMs(): number {
  return positiveEnvNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60_000);
}

function authRateLimitMaxRequests(): number {
  return positiveEnvNumber(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 20);
}

function positiveEnvNumber(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) return fallback;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
