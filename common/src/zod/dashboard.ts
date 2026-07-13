import { z } from 'zod';
import {
  athleteProfileCompletionSchema,
  athleteProfileDraftSchema,
  athleteProfileStatusSchema,
} from './athlete';
import { idSchema, isoDateTimeSchema, slugSchema } from './shared';

export const athleteDashboardLinkSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(240),
});

export type AthleteDashboardLink = z.infer<typeof athleteDashboardLinkSchema>;

export const athleteDashboardSchema = z.object({
  userId: idSchema,
  athleteId: idSchema,
  athleteSlug: slugSchema.nullable(),
  fullName: z.string().min(1).max(120),
  profileStatus: athleteProfileStatusSchema,
  publicProfileUrl: z.string().max(240).nullable(),
  manageProfileUrl: z.string().max(240).nullable(),
  profileVersion: z.number().int().nonnegative(),
  completion: athleteProfileCompletionSchema,
  draft: athleteProfileDraftSchema,
  quickActions: z.array(athleteDashboardLinkSchema),
  updatedAt: isoDateTimeSchema,
});

export type AthleteDashboard = z.infer<typeof athleteDashboardSchema>;
