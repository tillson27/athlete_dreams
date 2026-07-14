import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  athleteDirectoryQuerySchema,
  createAthleteProfileRequestSchema,
  deleteAthleteProfileChildRequestSchema,
  idSchema,
  publishAthleteProfileRequestSchema,
  reorderAthleteProfileChildrenRequestSchema,
  slugSchema,
  upsertAthleteMediaAssetRequestSchema,
  upsertAthletePersonalBestRequestSchema,
  upsertAthleteProfileDraftRequestSchema,
  upsertAthleteResultRequestSchema,
  upsertAthleteRoadmapEventRequestSchema,
  upsertAthleteStoryChapterRequestSchema,
  upsertAthleteTrainingSnapshotRequestSchema,
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
const personalBestParamSchema = z.object({ athletePersonalBestId: idSchema });
const resultParamSchema = z.object({ athleteResultId: idSchema });
const roadmapEventParamSchema = z.object({ athleteRoadmapEventId: idSchema });
const storyChapterParamSchema = z.object({ athleteStoryChapterId: idSchema });
const mediaAssetParamSchema = z.object({ athleteMediaAssetId: idSchema });

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

  getMyDraft = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const profile = await this.athleteService.getDraftForUser(req.authenticatedUserId);
    ResponseHandler.success(res, 200, profile);
  };

  getMyDashboard = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const dashboard = await this.athleteService.getDashboardForUser(req.authenticatedUserId);
    ResponseHandler.success(res, 200, dashboard);
  };

  followProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params = parseRequestParams(athleteSlugParamSchema, req);
    const result = await this.athleteService.followAthlete(
      req.authenticatedUserId,
      params.athleteSlug
    );
    ResponseHandler.success(res, 200, result);
  };

  unfollowProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params = parseRequestParams(athleteSlugParamSchema, req);
    const result = await this.athleteService.unfollowAthlete(
      req.authenticatedUserId,
      params.athleteSlug
    );
    ResponseHandler.success(res, 200, result);
  };

  upsertMyDraft = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(upsertAthleteProfileDraftRequestSchema, req);
    const profile = await this.athleteService.upsertDraftForUser(
      req.authenticatedUserId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  publishMyProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(publishAthleteProfileRequestSchema, req);
    const result = await this.athleteService.publishProfileForUser(
      req.authenticatedUserId,
      body
    );
    ResponseHandler.success(res, 200, result);
  };

  upsertMyPersonalBest = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params =
      req.params.athletePersonalBestId !== undefined
        ? parseRequestParams(personalBestParamSchema, req)
        : { athletePersonalBestId: undefined };
    const body = parseRequestBody(upsertAthletePersonalBestRequestSchema, req);
    const profile = await this.athleteService.upsertPersonalBestForUser(
      req.authenticatedUserId,
      body,
      params.athletePersonalBestId
    );
    ResponseHandler.success(res, 200, profile);
  };

  deleteMyPersonalBest = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params = parseRequestParams(personalBestParamSchema, req);
    const body = parseRequestBody(deleteAthleteProfileChildRequestSchema, req);
    const profile = await this.athleteService.deletePersonalBestForUser(
      req.authenticatedUserId,
      params.athletePersonalBestId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  reorderMyPersonalBests = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(reorderAthleteProfileChildrenRequestSchema, req);
    const profile = await this.athleteService.reorderPersonalBestsForUser(
      req.authenticatedUserId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  upsertMyResult = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params =
      req.params.athleteResultId !== undefined
        ? parseRequestParams(resultParamSchema, req)
        : { athleteResultId: undefined };
    const body = parseRequestBody(upsertAthleteResultRequestSchema, req);
    const profile = await this.athleteService.upsertResultForUser(
      req.authenticatedUserId,
      body,
      params.athleteResultId
    );
    ResponseHandler.success(res, 200, profile);
  };

  deleteMyResult = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params = parseRequestParams(resultParamSchema, req);
    const body = parseRequestBody(deleteAthleteProfileChildRequestSchema, req);
    const profile = await this.athleteService.deleteResultForUser(
      req.authenticatedUserId,
      params.athleteResultId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  reorderMyResults = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(reorderAthleteProfileChildrenRequestSchema, req);
    const profile = await this.athleteService.reorderResultsForUser(
      req.authenticatedUserId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  upsertMyRoadmapEvent = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params =
      req.params.athleteRoadmapEventId !== undefined
        ? parseRequestParams(roadmapEventParamSchema, req)
        : { athleteRoadmapEventId: undefined };
    const body = parseRequestBody(upsertAthleteRoadmapEventRequestSchema, req);
    const profile = await this.athleteService.upsertRoadmapEventForUser(
      req.authenticatedUserId,
      body,
      params.athleteRoadmapEventId
    );
    ResponseHandler.success(res, 200, profile);
  };

  deleteMyRoadmapEvent = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params = parseRequestParams(roadmapEventParamSchema, req);
    const body = parseRequestBody(deleteAthleteProfileChildRequestSchema, req);
    const profile = await this.athleteService.deleteRoadmapEventForUser(
      req.authenticatedUserId,
      params.athleteRoadmapEventId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  reorderMyRoadmapEvents = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(reorderAthleteProfileChildrenRequestSchema, req);
    const profile = await this.athleteService.reorderRoadmapEventsForUser(
      req.authenticatedUserId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  upsertMyStoryChapter = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params =
      req.params.athleteStoryChapterId !== undefined
        ? parseRequestParams(storyChapterParamSchema, req)
        : { athleteStoryChapterId: undefined };
    const body = parseRequestBody(upsertAthleteStoryChapterRequestSchema, req);
    const profile = await this.athleteService.upsertStoryChapterForUser(
      req.authenticatedUserId,
      body,
      params.athleteStoryChapterId
    );
    ResponseHandler.success(res, 200, profile);
  };

  deleteMyStoryChapter = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params = parseRequestParams(storyChapterParamSchema, req);
    const body = parseRequestBody(deleteAthleteProfileChildRequestSchema, req);
    const profile = await this.athleteService.deleteStoryChapterForUser(
      req.authenticatedUserId,
      params.athleteStoryChapterId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  reorderMyStoryChapters = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(reorderAthleteProfileChildrenRequestSchema, req);
    const profile = await this.athleteService.reorderStoryChaptersForUser(
      req.authenticatedUserId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  upsertMyTrainingSnapshot = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(upsertAthleteTrainingSnapshotRequestSchema, req);
    const profile = await this.athleteService.upsertTrainingSnapshotForUser(
      req.authenticatedUserId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  deleteMyTrainingSnapshot = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(deleteAthleteProfileChildRequestSchema, req);
    const profile = await this.athleteService.deleteTrainingSnapshotForUser(
      req.authenticatedUserId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  upsertMyMediaAsset = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params =
      req.params.athleteMediaAssetId !== undefined
        ? parseRequestParams(mediaAssetParamSchema, req)
        : { athleteMediaAssetId: undefined };
    const body = parseRequestBody(upsertAthleteMediaAssetRequestSchema, req);
    const profile = await this.athleteService.upsertMediaAssetForUser(
      req.authenticatedUserId,
      body,
      params.athleteMediaAssetId
    );
    ResponseHandler.success(res, 200, profile);
  };

  deleteMyMediaAsset = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const params = parseRequestParams(mediaAssetParamSchema, req);
    const body = parseRequestBody(deleteAthleteProfileChildRequestSchema, req);
    const profile = await this.athleteService.deleteMediaAssetForUser(
      req.authenticatedUserId,
      params.athleteMediaAssetId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  reorderMyMediaAssets = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(reorderAthleteProfileChildrenRequestSchema, req);
    const profile = await this.athleteService.reorderMediaAssetsForUser(
      req.authenticatedUserId,
      body
    );
    ResponseHandler.success(res, 200, profile);
  };

  createMyProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(createAthleteProfileRequestSchema, req);
    const profile = await this.athleteService.createProfileForUser(req.authenticatedUserId, body);
    ResponseHandler.success(res, 201, profile);
  };
}
