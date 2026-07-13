import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { communityFeedQuerySchema } from 'fad-common';
import { CommunityFeedService } from './CommunityFeedService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { parseRequestQuery } from '../../shared/requestParsers';

@injectable()
export class CommunityController {
  constructor(private readonly communityFeedService: CommunityFeedService) {}

  getFeed = async (req: Request, res: Response): Promise<void> => {
    const query = parseRequestQuery(communityFeedQuerySchema, req);
    const feed = await this.communityFeedService.listFeed(query, req.authenticatedUserId);
    ResponseHandler.success(res, 200, feed);
  };
}
