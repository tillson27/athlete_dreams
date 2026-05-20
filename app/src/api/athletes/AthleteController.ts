import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  athleteDirectoryQuerySchema,
  createAthleteProfileRequestSchema,
  slugSchema,
} from 'fad-common';
import { AthleteService } from './AthleteService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import {
  parseRequestBody,
  parseRequestParams,
  parseRequestQuery,
} from '../../shared/requestParsers';
import { UnauthorizedError } from '../../shared/errors';

const athleteSlugParamSchema = z.object({ athleteSlug: slugSchema });

@injectable()
export class AthleteController {
  constructor(private readonly athleteService: AthleteService) {}

  listDirectory = async (req: Request, res: Response): Promise<void> => {
    const query = parseRequestQuery(athleteDirectoryQuerySchema, req);
    const items = await this.athleteService.listDirectory(query);
    ResponseHandler.success(res, 200, items);
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const params = parseRequestParams(athleteSlugParamSchema, req);
    const profile = await this.athleteService.getProfileBySlug(params.athleteSlug);
    ResponseHandler.success(res, 200, profile);
  };

  createMyProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(createAthleteProfileRequestSchema, req);
    const profile = await this.athleteService.createProfileForUser(req.authenticatedUserId, body);
    ResponseHandler.success(res, 201, profile);
  };
}
