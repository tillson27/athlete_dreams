import { z } from 'zod';
import { idSchema, isoDateTimeSchema, slugSchema } from './shared';
import { SportCategory } from '../types/enums';

const sportSchema = z.nativeEnum(SportCategory);

export const athleteAccomplishmentSchema = z.object({
  athleteAccomplishmentId: idSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  occurredOn: z.string().date().nullable(),
});

export type AthleteAccomplishment = z.infer<typeof athleteAccomplishmentSchema>;

export const athleteMediaSchema = z.object({
  athleteMediaId: idSchema,
  mediaUrl: z.string().url(),
  mediaKind: z.enum(['IMAGE', 'VIDEO']),
  caption: z.string().max(280).nullable(),
});

export type AthleteMedia = z.infer<typeof athleteMediaSchema>;

export const athleteProfileSchema = z.object({
  athleteId: idSchema,
  userId: idSchema,
  athleteSlug: slugSchema,
  fullName: z.string().min(1).max(120),
  headline: z.string().max(160).nullable(),
  bio: z.string().max(4000).nullable(),
  primarySport: sportSchema,
  secondarySports: z.array(sportSchema),
  hometown: z.string().max(120).nullable(),
  countryCode: z.string().length(2).nullable(),
  values: z.array(z.string().max(40)),
  socialInstagramHandle: z.string().max(60).nullable(),
  socialTwitterHandle: z.string().max(60).nullable(),
  socialStravaUrl: z.string().url().nullable(),
  accomplishments: z.array(athleteAccomplishmentSchema),
  media: z.array(athleteMediaSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type AthleteProfile = z.infer<typeof athleteProfileSchema>;

export const athleteDirectoryItemSchema = z.object({
  athleteId: idSchema,
  athleteSlug: slugSchema,
  fullName: z.string(),
  headline: z.string().nullable(),
  primarySport: sportSchema,
  hometown: z.string().nullable(),
  countryCode: z.string().nullable(),
  heroMediaUrl: z.string().url().nullable(),
  activeCampaignCount: z.number().int().nonnegative(),
  totalRaisedCents: z.number().int().nonnegative(),
});

export type AthleteDirectoryItem = z.infer<typeof athleteDirectoryItemSchema>;

export const createAthleteProfileRequestSchema = z
  .object({
    athleteSlug: slugSchema,
    fullName: z.string().min(1).max(120),
    primarySport: sportSchema,
    headline: z.string().max(160).optional(),
    bio: z.string().max(4000).optional(),
    hometown: z.string().max(120).optional(),
    countryCode: z.string().length(2).optional(),
    values: z.array(z.string().max(40)).max(8).optional(),
  })
  .strict();

export type CreateAthleteProfileRequest = z.infer<typeof createAthleteProfileRequestSchema>;

export const athleteDirectoryQuerySchema = z.object({
  sport: sportSchema.optional(),
  search: z.string().max(120).optional(),
  countryCode: z.string().length(2).optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(24),
  cursor: z.string().optional(),
});

export type AthleteDirectoryQuery = z.infer<typeof athleteDirectoryQuerySchema>;
