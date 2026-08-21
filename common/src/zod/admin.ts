import { z } from 'zod';
import { CampaignStatus, CampaignType, DonationStatus, SportCategory } from '../types/enums';
import { PlatformRole } from '../types/roles';
import { athleteStripeStatusSchema } from './athlete';
import { idSchema, isoDateTimeSchema, moneyCentsSchema, paginationResponseSchema } from './shared';

export const SignupAllowlistStatus = {
  Allowed: 'ALLOWED',
  Blocked: 'BLOCKED',
} as const;

export type SignupAllowlistStatus =
  (typeof SignupAllowlistStatus)[keyof typeof SignupAllowlistStatus];

export const adminUserSummarySchema = z.object({
  userId: idSchema,
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable(),
  emailVerifiedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  roles: z.array(z.nativeEnum(PlatformRole)),
  hasAthleteProfile: z.boolean(),
});

export type AdminUserSummary = z.infer<typeof adminUserSummarySchema>;

export const adminUserListQuerySchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(PlatformRole).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

export const adminUserListResponseSchema = paginationResponseSchema(adminUserSummarySchema);

export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;

export const adminUserDetailSchema = adminUserSummarySchema.extend({
  updatedAt: isoDateTimeSchema,
  athleteSlug: z.string().nullable(),
  publishedAt: isoDateTimeSchema.nullable(),
  athleteId: idSchema.nullable(),
  signupAllowlistStatus: z.nativeEnum(SignupAllowlistStatus),
  signupAllowlistIsEnforced: z.boolean(),
});

export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;

// Public API contract: admins read Stripe state for an athlete other than
// themselves, so the connected-account id is exposed here (and nowhere in the
// athlete-facing contract) to build a Stripe dashboard deep link.
export const adminUserStripeStatusSchema = athleteStripeStatusSchema.extend({
  stripeAccountId: z.string().nullable(),
});

export type AdminUserStripeStatus = z.infer<typeof adminUserStripeStatusSchema>;

export const adminUserDonationListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export type AdminUserDonationListQuery = z.infer<typeof adminUserDonationListQuerySchema>;

export const adminUpdateUserRolesRequestSchema = z
  .object({
    roles: z.array(z.nativeEnum(PlatformRole)),
  })
  .strict();

export type AdminUpdateUserRolesRequest = z.infer<typeof adminUpdateUserRolesRequestSchema>;

export const adminAthleteItemSchema = z.object({
  athleteId: idSchema,
  userId: idSchema,
  athleteSlug: z.string(),
  fullName: z.string(),
  primarySport: z.nativeEnum(SportCategory),
  publishedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  stripeChargesEnabledAt: isoDateTimeSchema.nullable(),
});

export type AdminAthleteItem = z.infer<typeof adminAthleteItemSchema>;

export const adminAthleteListQuerySchema = z.object({
  published: z.enum(['true', 'false']).optional(),
  sport: z.nativeEnum(SportCategory).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export type AdminAthleteListQuery = z.infer<typeof adminAthleteListQuerySchema>;

export const adminAthleteListResponseSchema = paginationResponseSchema(adminAthleteItemSchema);

export type AdminAthleteListResponse = z.infer<typeof adminAthleteListResponseSchema>;

export const adminAthletePublishRequestSchema = z
  .object({
    publish: z.boolean(),
  })
  .strict();

export type AdminAthletePublishRequest = z.infer<typeof adminAthletePublishRequestSchema>;

export const adminCampaignItemSchema = z.object({
  campaignId: idSchema,
  campaignSlug: z.string(),
  campaignTitle: z.string(),
  campaignType: z.nativeEnum(CampaignType),
  campaignStatus: z.nativeEnum(CampaignStatus),
  targetAmountCents: moneyCentsSchema,
  raisedAmountCents: moneyCentsSchema,
  athleteId: idSchema,
  athleteSlug: z.string(),
  athleteFullName: z.string(),
  createdAt: isoDateTimeSchema,
});

export type AdminCampaignItem = z.infer<typeof adminCampaignItemSchema>;

export const adminCampaignListQuerySchema = z.object({
  status: z.nativeEnum(CampaignStatus).optional(),
  athleteId: idSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export type AdminCampaignListQuery = z.infer<typeof adminCampaignListQuerySchema>;

export const adminCampaignListResponseSchema = paginationResponseSchema(adminCampaignItemSchema);

export type AdminCampaignListResponse = z.infer<typeof adminCampaignListResponseSchema>;

export const adminUpdateCampaignStatusRequestSchema = z
  .object({
    campaignStatus: z.nativeEnum(CampaignStatus),
  })
  .strict();

export type AdminUpdateCampaignStatusRequest = z.infer<
  typeof adminUpdateCampaignStatusRequestSchema
>;

export const adminDonationItemSchema = z.object({
  donationId: idSchema,
  campaignId: idSchema,
  campaignTitle: z.string(),
  athleteFullName: z.string(),
  supporterDisplayName: z.string(),
  supporterEmail: z.string().email().nullable(),
  donationAmountCents: moneyCentsSchema,
  donationStatus: z.nativeEnum(DonationStatus),
  isAnonymous: z.boolean(),
  createdAt: isoDateTimeSchema,
});

export type AdminDonationItem = z.infer<typeof adminDonationItemSchema>;

export const adminDonationListQuerySchema = z.object({
  status: z.nativeEnum(DonationStatus).optional(),
  athleteId: idSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export type AdminDonationListQuery = z.infer<typeof adminDonationListQuerySchema>;

export const adminDonationListResponseSchema = paginationResponseSchema(adminDonationItemSchema);

export type AdminDonationListResponse = z.infer<typeof adminDonationListResponseSchema>;

export const adminUserDonationListResponseSchema =
  paginationResponseSchema(adminDonationItemSchema);

export type AdminUserDonationListResponse = z.infer<typeof adminUserDonationListResponseSchema>;

export const adminDailyStatSchema = z.object({
  date: z.string(),
  count: z.number().int().nonnegative(),
});

export type AdminDailyStat = z.infer<typeof adminDailyStatSchema>;

export const adminDonationDailyStatSchema = adminDailyStatSchema.extend({
  amountCents: z.number().int().nonnegative(),
});

export type AdminDonationDailyStat = z.infer<typeof adminDonationDailyStatSchema>;

export const adminAnalyticsResponseSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  totalAthletes: z.number().int().nonnegative(),
  publishedAthletes: z.number().int().nonnegative(),
  activeCampaigns: z.number().int().nonnegative(),
  totalRaisedCents: z.number().int().nonnegative(),
  totalSucceededDonations: z.number().int().nonnegative(),
  signupsLast30Days: z.number().int().nonnegative(),
  athletesLast30Days: z.number().int().nonnegative(),
  userSignupsByDay: z.array(adminDailyStatSchema),
  donationsByDay: z.array(adminDonationDailyStatSchema),
});

export type AdminAnalyticsResponse = z.infer<typeof adminAnalyticsResponseSchema>;

export const adminAllowlistEntrySchema = z.object({
  id: z.string(),
  entry: z.string(),
  source: z.enum(['db', 'env']),
  createdAt: isoDateTimeSchema.nullable(),
});

export type AdminAllowlistEntry = z.infer<typeof adminAllowlistEntrySchema>;

export const adminAllowlistResponseSchema = z.object({
  entries: z.array(adminAllowlistEntrySchema),
  isEnforced: z.boolean(),
});

export type AdminAllowlistResponse = z.infer<typeof adminAllowlistResponseSchema>;

export const adminAddAllowlistEntryRequestSchema = z
  .object({
    entry: z.string().min(1).max(254),
  })
  .strict();

export type AdminAddAllowlistEntryRequest = z.infer<
  typeof adminAddAllowlistEntryRequestSchema
>;
