import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  athleteDirectoryQuerySchema,
  createAthleteProfileRequestSchema,
  replacePersonalBestsRequestSchema,
  setAthleteGalleryRequestSchema,
  setAthleteHighlightsRequestSchema,
  setAthleteRaceResultsRequestSchema,
  setAthleteRoadmapRequestSchema,
  slugSchema,
  updateAthleteProfileRequestSchema,
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
    const directory = await this.athleteService.listDirectory(query);
    ResponseHandler.success(res, 200, directory);
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const params = parseRequestParams(athleteSlugParamSchema, req);
    const profile = await this.athleteService.getProfileBySlug(
      params.athleteSlug,
      req.authenticatedUserId
    );
    ResponseHandler.success(res, 200, profile);
  };

  getMyProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const profile = await this.athleteService.getMyProfile(req.authenticatedUserId);
    ResponseHandler.success(res, 200, profile);
  };

  createMyProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(createAthleteProfileRequestSchema, req);
    const profile = await this.athleteService.createProfileForUser(req.authenticatedUserId, body);
    ResponseHandler.success(res, 201, profile);
  };

  updateMyProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(updateAthleteProfileRequestSchema, req);
    const profile = await this.athleteService.updateMyProfile(req.authenticatedUserId, body);
    ResponseHandler.success(res, 200, profile);
  };

  publishMyProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const result = await this.athleteService.publishMyProfile(req.authenticatedUserId);
    ResponseHandler.success(res, 200, result);
  };

  replaceMyPersonalBests = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(replacePersonalBestsRequestSchema, req);
    const profile = await this.athleteService.replaceMyPersonalBests(req.authenticatedUserId, body);
    ResponseHandler.success(res, 200, profile);
  };

  replaceMyHighlights = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(setAthleteHighlightsRequestSchema, req);
    const profile = await this.athleteService.replaceMyHighlights(req.authenticatedUserId, body);
    ResponseHandler.success(res, 200, profile);
  };

  replaceMyRaceResults = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(setAthleteRaceResultsRequestSchema, req);
    const profile = await this.athleteService.replaceMyRaceResults(req.authenticatedUserId, body);
    ResponseHandler.success(res, 200, profile);
  };

  replaceMyRoadmap = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(setAthleteRoadmapRequestSchema, req);
    const profile = await this.athleteService.replaceMyRoadmap(req.authenticatedUserId, body);
    ResponseHandler.success(res, 200, profile);
  };

  replaceMyGallery = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(setAthleteGalleryRequestSchema, req);
    const profile = await this.athleteService.replaceMyGallery(req.authenticatedUserId, body);
    ResponseHandler.success(res, 200, profile);
  };
}
