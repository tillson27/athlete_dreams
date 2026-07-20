import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { AthleteStripeService } from './AthleteStripeService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { UnauthorizedError } from '../../shared/errors';

@injectable()
export class AthleteStripeController {
  constructor(private readonly athleteStripeService: AthleteStripeService) {}

  startOnboarding = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const result = await this.athleteStripeService.startOnboarding(req.authenticatedUserId);
    ResponseHandler.success(res, 200, result);
  };

  getStatus = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const status = await this.athleteStripeService.getStatus(req.authenticatedUserId);
    ResponseHandler.success(res, 200, status);
  };
}
