import { injectable } from 'tsyringe';
import { z } from 'zod';
import type { Request, Response } from 'express';
import {
  type AuthActionResponse,
  adminAddAllowlistEntryRequestSchema,
  adminAthleteListQuerySchema,
  adminAthletePublishRequestSchema,
  adminCampaignListQuerySchema,
  adminDonationListQuerySchema,
  adminUpdateCampaignStatusRequestSchema,
  adminUpdateUserRolesRequestSchema,
  adminUserDonationListQuerySchema,
  adminUserListQuerySchema,
  idSchema,
} from 'fad-common';
import { AdminService } from './AdminService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import {
  parseRequestBody,
  parseRequestParams,
  parseRequestQuery,
} from '../../shared/requestParsers';
import { Logger } from '../../services/infrastructure/Logger';
import { PostHogService } from '../../services/infrastructure/PostHogService';
import { UnauthorizedError } from '../../shared/errors';

const AUTH_ACTION_RESPONSE = { ok: true } satisfies AuthActionResponse;
const userIdParamsSchema = z.object({ userId: idSchema }).strict();
const athleteIdParamsSchema = z.object({ athleteId: idSchema }).strict();
const campaignIdParamsSchema = z.object({ campaignId: idSchema }).strict();
const allowlistEntryIdParamsSchema = z.object({ entryId: z.string().min(1) }).strict();

@injectable()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly logger: Logger,
    private readonly posthog: PostHogService
  ) {}

  listUsers = async (req: Request, res: Response): Promise<void> => {
    const query = parseRequestQuery(adminUserListQuerySchema, req);
    const response = await this.adminService.listUsers(query);
    ResponseHandler.success(res, 200, response);
  };

  getUserDetail = async (req: Request, res: Response): Promise<void> => {
    const { userId } = parseRequestParams(userIdParamsSchema, req);
    const response = await this.adminService.getUserDetail(userId);
    ResponseHandler.success(res, 200, response);
  };

  listAthletes = async (req: Request, res: Response): Promise<void> => {
    const query = parseRequestQuery(adminAthleteListQuerySchema, req);
    const response = await this.adminService.listAthletes(query);
    ResponseHandler.success(res, 200, response);
  };

  publishAthlete = async (req: Request, res: Response): Promise<void> => {
    const adminUserId = requireAdminUserId(req);
    const { athleteId } = parseRequestParams(athleteIdParamsSchema, req);
    const body = parseRequestBody(adminAthletePublishRequestSchema, req);
    await this.adminService.publishAthlete(athleteId, body.publish);
    this.logger.info(
      { adminUserId, athleteId, publish: body.publish },
      'admin.athlete_published'
    );
    this.posthog.capture({
      distinctId: adminUserId,
      event: 'admin_athlete_published',
      properties: { athleteId, publish: body.publish },
    });
    ResponseHandler.success(res, 200, AUTH_ACTION_RESPONSE);
  };

  listCampaigns = async (req: Request, res: Response): Promise<void> => {
    const query = parseRequestQuery(adminCampaignListQuerySchema, req);
    const response = await this.adminService.listCampaigns(query);
    ResponseHandler.success(res, 200, response);
  };

  updateCampaignStatus = async (req: Request, res: Response): Promise<void> => {
    const adminUserId = requireAdminUserId(req);
    const { campaignId } = parseRequestParams(campaignIdParamsSchema, req);
    const body = parseRequestBody(adminUpdateCampaignStatusRequestSchema, req);
    await this.adminService.updateCampaignStatus(campaignId, body.campaignStatus);
    this.logger.info(
      { adminUserId, campaignId, campaignStatus: body.campaignStatus },
      'admin.campaign_status_changed'
    );
    this.posthog.capture({
      distinctId: adminUserId,
      event: 'admin_campaign_status_changed',
      properties: { campaignId, campaignStatus: body.campaignStatus },
    });
    ResponseHandler.success(res, 200, AUTH_ACTION_RESPONSE);
  };

  listDonations = async (req: Request, res: Response): Promise<void> => {
    const query = parseRequestQuery(adminDonationListQuerySchema, req);
    const response = await this.adminService.listDonations(query);
    ResponseHandler.success(res, 200, response);
  };

  getAllowlist = async (_req: Request, res: Response): Promise<void> => {
    const response = await this.adminService.getAllowlistEntries();
    ResponseHandler.success(res, 200, response);
  };

  addAllowlistEntry = async (req: Request, res: Response): Promise<void> => {
    const adminUserId = requireAdminUserId(req);
    const body = parseRequestBody(adminAddAllowlistEntryRequestSchema, req);
    const response = await this.adminService.addAllowlistEntry(body);
    this.logger.info(
      { adminUserId, allowlistEntryId: response.id },
      'admin.allowlist_entry_added'
    );
    this.posthog.capture({
      distinctId: adminUserId,
      event: 'admin_allowlist_entry_added',
      properties: { allowlistEntryId: response.id, entry: response.entry },
    });
    ResponseHandler.success(res, 201, response);
  };

  deleteAllowlistEntry = async (req: Request, res: Response): Promise<void> => {
    const adminUserId = requireAdminUserId(req);
    const { entryId } = parseRequestParams(allowlistEntryIdParamsSchema, req);
    await this.adminService.deleteAllowlistEntry(entryId);
    this.logger.info({ adminUserId, allowlistEntryId: entryId }, 'admin.allowlist_entry_deleted');
    this.posthog.capture({
      distinctId: adminUserId,
      event: 'admin_allowlist_entry_deleted',
      properties: { allowlistEntryId: entryId },
    });
    ResponseHandler.success(res, 200, AUTH_ACTION_RESPONSE);
  };

  updateUserRoles = async (req: Request, res: Response): Promise<void> => {
    const adminUserId = requireAdminUserId(req);
    const { userId } = parseRequestParams(userIdParamsSchema, req);
    const body = parseRequestBody(adminUpdateUserRolesRequestSchema, req);
    const response = await this.adminService.updateUserRoles(userId, body.roles);
    this.logger.info({ adminUserId, targetUserId: userId }, 'admin.user_roles_updated');
    this.posthog.capture({
      distinctId: adminUserId,
      event: 'admin_user_role_updated',
      properties: { targetUserId: userId, roles: body.roles },
    });
    ResponseHandler.success(res, 200, response);
  };

  resendUserVerification = async (req: Request, res: Response): Promise<void> => {
    const adminUserId = requireAdminUserId(req);
    const { userId } = parseRequestParams(userIdParamsSchema, req);
    await this.adminService.resendUserVerification(userId);
    this.logger.info({ adminUserId, targetUserId: userId }, 'admin.user_verification_resent');
    this.posthog.capture({
      distinctId: adminUserId,
      event: 'admin_user_verification_resent',
      properties: { targetUserId: userId },
    });
    ResponseHandler.success(res, 200, AUTH_ACTION_RESPONSE);
  };

  markUserEmailVerified = async (req: Request, res: Response): Promise<void> => {
    const adminUserId = requireAdminUserId(req);
    const { userId } = parseRequestParams(userIdParamsSchema, req);
    const response = await this.adminService.markUserEmailVerified(userId);
    this.logger.warn({ adminUserId, targetUserId: userId }, 'admin.user_email_marked_verified');
    this.posthog.capture({
      distinctId: adminUserId,
      event: 'admin_user_email_marked_verified',
      properties: { targetUserId: userId },
    });
    ResponseHandler.success(res, 200, response);
  };

  sendUserPasswordReset = async (req: Request, res: Response): Promise<void> => {
    const adminUserId = requireAdminUserId(req);
    const { userId } = parseRequestParams(userIdParamsSchema, req);
    await this.adminService.sendUserPasswordReset(userId);
    this.logger.info({ adminUserId, targetUserId: userId }, 'admin.user_password_reset_sent');
    this.posthog.capture({
      distinctId: adminUserId,
      event: 'admin_user_password_reset_sent',
      properties: { targetUserId: userId },
    });
    ResponseHandler.success(res, 200, AUTH_ACTION_RESPONSE);
  };

  addUserToAllowlist = async (req: Request, res: Response): Promise<void> => {
    const adminUserId = requireAdminUserId(req);
    const { userId } = parseRequestParams(userIdParamsSchema, req);
    const response = await this.adminService.addUserToAllowlist(userId);
    this.logger.info({ adminUserId, targetUserId: userId }, 'admin.user_added_to_allowlist');
    this.posthog.capture({
      distinctId: adminUserId,
      event: 'admin_user_added_to_allowlist',
      properties: { targetUserId: userId },
    });
    ResponseHandler.success(res, 200, response);
  };

  getUserStripeStatus = async (req: Request, res: Response): Promise<void> => {
    const { userId } = parseRequestParams(userIdParamsSchema, req);
    const response = await this.adminService.getUserStripeStatus(userId);
    ResponseHandler.success(res, 200, response);
  };

  listUserDonations = async (req: Request, res: Response): Promise<void> => {
    const { userId } = parseRequestParams(userIdParamsSchema, req);
    const query = parseRequestQuery(adminUserDonationListQuerySchema, req);
    const response = await this.adminService.listUserDonations(userId, query);
    ResponseHandler.success(res, 200, response);
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    const adminUserId = requireAdminUserId(req);
    const { userId } = parseRequestParams(userIdParamsSchema, req);
    await this.adminService.deleteUser(userId);
    this.logger.info({ adminUserId, targetUserId: userId }, 'admin.user_deleted');
    ResponseHandler.success(res, 200, AUTH_ACTION_RESPONSE);
  };

  getAnalytics = async (_req: Request, res: Response): Promise<void> => {
    const response = await this.adminService.getAnalytics();
    ResponseHandler.success(res, 200, response);
  };
}

function requireAdminUserId(req: Request): string {
  if (!req.authenticatedUserId) {
    throw new UnauthorizedError();
  }
  return req.authenticatedUserId;
}
