import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { createCampaignRequestSchema, slugSchema } from 'fad-common';
import { CampaignService } from './CampaignService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { parseRequestBody, parseRequestParams } from '../../shared/requestParsers';
import { UnauthorizedError } from '../../shared/errors';

const campaignSlugParamSchema = z.object({ campaignSlug: slugSchema });

@injectable()
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    const params = parseRequestParams(campaignSlugParamSchema, req);
    const campaign = await this.campaignService.getCampaignBySlug(params.campaignSlug);
    ResponseHandler.success(res, 200, campaign);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(createCampaignRequestSchema, req);
    const campaign = await this.campaignService.createForAthlete(req.authenticatedUserId, body);
    ResponseHandler.success(res, 201, campaign);
  };
}
