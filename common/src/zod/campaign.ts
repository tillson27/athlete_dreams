import { z } from 'zod';
import {
  idSchema,
  isoDateTimeSchema,
  moneyCentsSchema,
  paginationResponseSchema,
  slugSchema,
} from './shared';
import { CampaignStatus, CampaignType, SportCategory } from '../types/enums';

const sportSchema = z.nativeEnum(SportCategory);

const campaignStatusSchema = z.nativeEnum(CampaignStatus);
const campaignTypeSchema = z.nativeEnum(CampaignType);

export const campaignCostLineSchema = z.object({
  campaignCostLineId: idSchema,
  label: z.string().min(1).max(120),
  amountCents: moneyCentsSchema,
  notes: z.string().max(400).nullable(),
});

export type CampaignCostLine = z.infer<typeof campaignCostLineSchema>;

export const campaignSchema = z.object({
  campaignId: idSchema,
  campaignSlug: slugSchema,
  athleteId: idSchema,
  athleteEventId: idSchema.nullable(),
  campaignTitle: z.string().min(1).max(160),
  campaignType: campaignTypeSchema,
  campaignStatus: campaignStatusSchema,
  campaignStory: z.string().max(10_000),
  targetAmountCents: moneyCentsSchema,
  raisedAmountCents: moneyCentsSchema,
  supporterCount: z.number().int().nonnegative(),
  costLines: z.array(campaignCostLineSchema),
  closesAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type Campaign = z.infer<typeof campaignSchema>;

export const createCampaignRequestSchema = z
  .object({
    campaignSlug: slugSchema,
    athleteEventId: idSchema.optional(),
    campaignTitle: z.string().min(1).max(160),
    campaignType: campaignTypeSchema,
    campaignStory: z.string().max(10_000),
    targetAmountCents: moneyCentsSchema,
    costLines: z
      .array(
        z.object({
          label: z.string().min(1).max(120),
          amountCents: moneyCentsSchema,
          notes: z.string().max(400).optional(),
        })
      )
      .max(20)
      .optional(),
    closesAt: isoDateTimeSchema.optional(),
  })
  .strict();

export type CreateCampaignRequest = z.infer<typeof createCampaignRequestSchema>;

export const campaignSummarySchema = z.object({
  campaignId: idSchema,
  campaignSlug: slugSchema,
  campaignTitle: z.string(),
  campaignType: campaignTypeSchema,
  campaignStatus: campaignStatusSchema,
  athleteId: idSchema,
  athleteSlug: slugSchema,
  athleteName: z.string(),
  primarySport: sportSchema,
  heroMediaUrl: z.string().url().nullable(),
  targetAmountCents: moneyCentsSchema,
  raisedAmountCents: moneyCentsSchema,
  supporterCount: z.number().int().nonnegative(),
  closesAt: isoDateTimeSchema.nullable(),
});

export type CampaignSummary = z.infer<typeof campaignSummarySchema>;

export const activeCampaignFeedResponseSchema = paginationResponseSchema(campaignSummarySchema);

export type ActiveCampaignFeedResponse = z.infer<typeof activeCampaignFeedResponseSchema>;

export const activeCampaignFeedQuerySchema = z.object({
  status: z.literal('active').optional().default('active'),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  cursor: z.string().optional(),
});

export type ActiveCampaignFeedQuery = z.infer<typeof activeCampaignFeedQuerySchema>;
