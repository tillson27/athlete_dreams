import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { activeCampaignFeedQuerySchema, createCampaignRequestSchema, slugSchema } from 'fad-common';
import { CampaignService } from './CampaignService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { parseRequestBody, parseRequestParams, parseRequestQuery } from '../../shared/requestParsers';
import { UnauthorizedError } from '../../shared/errors';
import { PostHogService } from '../../services/infrastructure/PostHogService';

const campaignSlugParamSchema = z.object({ campaignSlug: slugSchema });
const athleteSlugParamSchema = z.object({ athleteSlug: slugSchema });

@injectable()
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly posthog: PostHogService
  ) {}

  listActiveFeed = async (req: Request, res: Response): Promise<void> => {
    const query = parseRequestQuery(activeCampaignFeedQuerySchema, req);
    const feed = await this.campaignService.listActiveFeed({ limit: query.limit, cursor: query.cursor });
    ResponseHandler.success(res, 200, feed);
  };

  listForAthlete = async (req: Request, res: Response): Promise<void> => {
    const params = parseRequestParams(athleteSlugParamSchema, req);
    const campaigns = await this.campaignService.listForAthleteSlug(params.athleteSlug);
    ResponseHandler.success(res, 200, campaigns);
  };

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    const params = parseRequestParams(campaignSlugParamSchema, req);
    const campaign = await this.campaignService.getCampaignBySlug(params.campaignSlug);
    ResponseHandler.success(res, 200, campaign);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(createCampaignRequestSchema, req);
    const campaign = await this.campaignService.createForAthlete(req.authenticatedUserId, body);
    this.posthog.capture({
      distinctId: req.authenticatedUserId,
      event: 'campaign_created',
      properties: {
        campaign_id: campaign.campaignId,
        campaign_slug: campaign.campaignSlug,
        campaign_type: campaign.campaignType,
        target_amount_cents: campaign.targetAmountCents,
      },
    });
    ResponseHandler.success(res, 201, campaign);
  };
}
