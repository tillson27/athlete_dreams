import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import {
  communityFeedQuerySchema,
  communityReactionRequestSchema,
} from 'fad-common';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { UnauthorizedError } from '../../shared/errors';
import { parseRequestBody, parseRequestQuery } from '../../shared/requestParsers';
import { CommunityService } from './CommunityService';

@injectable()
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  listFeed = async (req: Request, res: Response): Promise<void> => {
    const query = parseRequestQuery(communityFeedQuerySchema, req);
    const feed = await this.communityService.listFeed(query, req.authenticatedUserId);
    ResponseHandler.success(res, 200, feed);
  };

  cheer = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(communityReactionRequestSchema, req);
    const result = await this.communityService.cheer(req.authenticatedUserId, body);
    ResponseHandler.success(res, 200, result);
  };

  uncheer = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(communityReactionRequestSchema, req);
    const result = await this.communityService.uncheer(req.authenticatedUserId, body);
    ResponseHandler.success(res, 200, result);
  };
}
