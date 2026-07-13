import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { slugSchema } from 'fad-common';
import { FollowService } from './FollowService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { parseRequestParams } from '../../shared/requestParsers';
import { UnauthorizedError } from '../../shared/errors';

const athleteSlugParamSchema = z.object({ athleteSlug: slugSchema });

@injectable()
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  follow = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params = parseRequestParams(athleteSlugParamSchema, req);
    await this.followService.followAthlete(req.authenticatedUserId, params.athleteSlug);
    const follows = await this.followService.listFollows(req.authenticatedUserId);
    ResponseHandler.success(res, 200, follows);
  };

  unfollow = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params = parseRequestParams(athleteSlugParamSchema, req);
    await this.followService.unfollowAthlete(req.authenticatedUserId, params.athleteSlug);
    const follows = await this.followService.listFollows(req.authenticatedUserId);
    ResponseHandler.success(res, 200, follows);
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const follows = await this.followService.listFollows(req.authenticatedUserId);
    ResponseHandler.success(res, 200, follows);
  };
}
