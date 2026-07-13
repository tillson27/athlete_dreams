import { z } from 'zod';
import { idSchema, isoDateTimeSchema, paginationResponseSchema, slugSchema } from './shared';
import { AthleteLevel, SportCategory } from '../types/enums';

const sportSchema = z.nativeEnum(SportCategory);
const athleteLevelSchema = z.nativeEnum(AthleteLevel);

// Public API contract: an athlete handle is lowercase letters, digits, and dots
// (3-30 chars), stored without the leading '@' (client renders it as `@handle`).
export const handleSchema = z.string().regex(/^[a-z0-9.]{3,30}$/);

const highlightLinkSchema = z.object({
  label: z.string().min(1).max(120),
  href: z.string().url(),
});

export const athleteAccomplishmentSchema = z.object({
  athleteAccomplishmentId: idSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  detail: z.string().max(2000).nullable(),
  resultUrl: z.string().url().nullable(),
  photoRefs: z.array(z.string().max(500)),
  occurredOn: z.string().date().nullable(),
});

export type AthleteAccomplishment = z.infer<typeof athleteAccomplishmentSchema>;

export const personalBestSchema = z.object({
  personalBestId: idSchema,
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(80),
  resultUrl: z.string().url().nullable(),
  sortOrder: z.number().int().nonnegative(),
});

export type PersonalBest = z.infer<typeof personalBestSchema>;

export const athleteRaceResultSchema = z.object({
  athleteRaceResultId: idSchema,
  resultName: z.string().min(1).max(200),
  displayDate: z.string().min(1).max(120),
  occurredOn: z.string().date().nullable(),
  resultSummary: z.string().min(1).max(2000),
  resultUrl: z.string().url().nullable(),
  links: z.array(highlightLinkSchema),
  photoRefs: z.array(z.string().max(500)),
  sortOrder: z.number().int().nonnegative(),
});

export type AthleteRaceResult = z.infer<typeof athleteRaceResultSchema>;

export const athleteRoadmapItemSchema = z.object({
  athleteEventId: idSchema,
  eventName: z.string().min(1).max(200),
  displayDate: z.string().min(1).max(120),
  sortOrder: z.number().int().nonnegative(),
});

export type AthleteRoadmapItem = z.infer<typeof athleteRoadmapItemSchema>;

export const athleteCoreValueSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
});

export type AthleteCoreValue = z.infer<typeof athleteCoreValueSchema>;

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
  handle: handleSchema.nullable().optional(),
  fullName: z.string().min(1).max(120),
  headline: z.string().max(160).nullable(),
  bio: z.string().max(4000).nullable(),
  runnerLevel: athleteLevelSchema.optional(),
  disciplineLabel: z.string().max(160).nullable().optional(),
  primarySport: sportSchema,
  secondarySports: z.array(sportSchema),
  hometown: z.string().max(120).nullable(),
  countryCode: z.string().length(2).nullable(),
  values: z.array(z.string().max(40)),
  coreValues: z.array(athleteCoreValueSchema).optional(),
  storyIntro: z.string().max(2000).nullable().optional(),
  storyBody: z.array(z.string().max(6000)).optional(),
  presentation: z.record(z.unknown()).nullable().optional(),
  socialInstagramHandle: z.string().max(60).nullable(),
  socialTwitterHandle: z.string().max(60).nullable(),
  socialStravaUrl: z.string().url().nullable(),
  accomplishments: z.array(athleteAccomplishmentSchema),
  personalBests: z.array(personalBestSchema).optional(),
  raceResults: z.array(athleteRaceResultSchema).optional(),
  roadmap: z.array(athleteRoadmapItemSchema).optional(),
  gallery: z.array(z.string().url()).optional(),
  media: z.array(athleteMediaSchema),
  publishedAt: isoDateTimeSchema.nullable().optional(),
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
  runnerLevel: athleteLevelSchema.optional(),
  hometown: z.string().nullable(),
  countryCode: z.string().nullable(),
  heroMediaUrl: z.string().url().nullable(),
  activeCampaignCount: z.number().int().nonnegative(),
  totalRaisedCents: z.number().int().nonnegative(),
});

export type AthleteDirectoryItem = z.infer<typeof athleteDirectoryItemSchema>;

export const athleteDirectoryResponseSchema = paginationResponseSchema(athleteDirectoryItemSchema);

export type AthleteDirectoryResponse = z.infer<typeof athleteDirectoryResponseSchema>;

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

export const updateAthleteProfileRequestSchema = z
  .object({
    handle: handleSchema.optional(),
    fullName: z.string().min(1).max(120).optional(),
    headline: z.string().max(160).optional(),
    bio: z.string().max(4000).optional(),
    runnerLevel: athleteLevelSchema.optional(),
    disciplineLabel: z.string().max(160).optional(),
    hometown: z.string().max(120).optional(),
    countryCode: z.string().length(2).optional(),
    secondarySports: z.array(sportSchema).max(8).optional(),
    values: z.array(z.string().max(40)).max(8).optional(),
    coreValues: z.array(athleteCoreValueSchema).max(12).optional(),
    storyIntro: z.string().max(2000).optional(),
    storyBody: z.array(z.string().max(6000)).max(20).optional(),
    presentation: z.record(z.unknown()).optional(),
    socialInstagramHandle: z.string().max(60).optional(),
    socialTwitterHandle: z.string().max(60).optional(),
    socialStravaUrl: z.string().url().optional(),
    heroMediaUrl: z.string().url().optional(),
  })
  .strict();

export type UpdateAthleteProfileRequest = z.infer<typeof updateAthleteProfileRequestSchema>;

export const athleteDirectoryQuerySchema = z.object({
  sport: sportSchema.optional(),
  runnerLevel: athleteLevelSchema.optional(),
  search: z.string().max(120).optional(),
  countryCode: z.string().length(2).optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(24),
  cursor: z.string().optional(),
});

export type AthleteDirectoryQuery = z.infer<typeof athleteDirectoryQuerySchema>;

const setHighlightInputSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().max(2000).optional(),
  resultUrl: z.string().url().optional(),
  photoRefs: z.array(z.string().max(500)).max(12).optional(),
});

export const setAthleteHighlightsRequestSchema = z
  .object({
    highlights: z.array(setHighlightInputSchema).max(20),
  })
  .strict();

export type SetAthleteHighlightsRequest = z.infer<typeof setAthleteHighlightsRequestSchema>;

const setRaceResultInputSchema = z.object({
  resultName: z.string().min(1).max(200),
  displayDate: z.string().min(1).max(120),
  resultSummary: z.string().min(1).max(2000),
  resultUrl: z.string().url().optional(),
  links: z.array(highlightLinkSchema).max(12).optional(),
  photoRefs: z.array(z.string().max(500)).max(12).optional(),
});

export const setAthleteRaceResultsRequestSchema = z
  .object({
    races: z.array(setRaceResultInputSchema).max(30),
  })
  .strict();

export type SetAthleteRaceResultsRequest = z.infer<typeof setAthleteRaceResultsRequestSchema>;

const setRoadmapInputSchema = z.object({
  eventName: z.string().min(1).max(200),
  displayDate: z.string().min(1).max(120),
});

export const setAthleteRoadmapRequestSchema = z
  .object({
    roadmap: z.array(setRoadmapInputSchema).max(10),
  })
  .strict();

export type SetAthleteRoadmapRequest = z.infer<typeof setAthleteRoadmapRequestSchema>;

export const setAthleteGalleryRequestSchema = z
  .object({
    gallery: z.array(z.string().url()).max(12),
  })
  .strict();

export type SetAthleteGalleryRequest = z.infer<typeof setAthleteGalleryRequestSchema>;

export const publishAthleteProfileResponseSchema = z.object({
  athleteId: idSchema,
  athleteSlug: slugSchema,
  publishedAt: isoDateTimeSchema,
});

export type PublishAthleteProfileResponse = z.infer<typeof publishAthleteProfileResponseSchema>;
