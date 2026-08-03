import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { AthleteStripeService } from './AthleteStripeService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { UnauthorizedError } from '../../shared/errors';
import { PostHogService } from '../../services/infrastructure/PostHogService';

@injectable()
export class AthleteStripeController {
  constructor(
    private readonly athleteStripeService: AthleteStripeService,
    private readonly posthog: PostHogService
  ) {}

  startOnboarding = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const result = await this.athleteStripeService.startOnboarding(req.authenticatedUserId);
    this.posthog.capture({
      distinctId: req.authenticatedUserId,
      event: 'stripe_onboarding_started',
    });
    ResponseHandler.success(res, 200, result);
  };

  getStatus = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const status = await this.athleteStripeService.getStatus(req.authenticatedUserId);
    ResponseHandler.success(res, 200, status);
  };
}
