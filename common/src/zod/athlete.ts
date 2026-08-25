import { z } from 'zod';
import {
  idSchema,
  isoDateTimeSchema,
  mediaRefSchema,
  moneyCentsSchema,
  paginationResponseSchema,
  slugSchema,
} from './shared';
import { AthleteLevel, PayoutStatus, SportCategory } from '../types/enums';

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
  photoRefs: z.array(mediaRefSchema),
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
  photoRefs: z.array(mediaRefSchema),
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

// Exported because the client mirrors core value titles back into the legacy
// `values` array, and has to apply the same truncation to recognise an already
// mirrored title rather than treating it as a second, distinct value.
export const ATHLETE_VALUE_MAX_LENGTH = 40;
export const ATHLETE_VALUES_MAX = 8;
export const ATHLETE_CORE_VALUES_MAX = 12;

// `body` is the optional "what it means to you" prose; a title-only core value is
// valid. `.default('')` keeps the inferred output type `string` so consumers never
// need a null-check.
export const athleteCoreValueSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().max(2000).default(''),
});

export type AthleteCoreValue = z.infer<typeof athleteCoreValueSchema>;

export const ATHLETE_STORY_QUESTION_IDS = ['origin', 'chasing', 'hardest', 'corner'] as const;

export type AthleteStoryQuestionId = (typeof ATHLETE_STORY_QUESTION_IDS)[number];

export const athleteStoryAnswerSchema = z.object({
  selections: z.array(z.string().max(80)).max(8),
  extraWords: z.string().max(500).optional(),
});

export const athleteStoryAnswersSchema = z.record(athleteStoryAnswerSchema);

export type AthleteStoryAnswers = z.infer<typeof athleteStoryAnswersSchema>;

export const athleteMediaSchema = z.object({
  athleteMediaId: idSchema,
  mediaUrl: mediaRefSchema,
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
  values: z.array(z.string().max(ATHLETE_VALUE_MAX_LENGTH)),
  coreValues: z.array(athleteCoreValueSchema).optional(),
  storyIntro: z.string().max(2000).nullable().optional(),
  storyBody: z.array(z.string().max(6000)).optional(),
  presentation: z.record(z.unknown()).nullable().optional(),
  socialInstagramHandle: z.string().max(60).nullable(),
  socialTwitterHandle: z.string().max(60).nullable(),
  socialStravaUrl: z.string().url().nullable(),
  heroMediaUrl: mediaRefSchema.nullable(),
  accomplishments: z.array(athleteAccomplishmentSchema),
  personalBests: z.array(personalBestSchema).optional(),
  raceResults: z.array(athleteRaceResultSchema).optional(),
  roadmap: z.array(athleteRoadmapItemSchema).optional(),
  gallery: z.array(mediaRefSchema).optional(),
  media: z.array(athleteMediaSchema),
  publishedAt: isoDateTimeSchema.nullable().optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type AthleteProfile = z.infer<typeof athleteProfileSchema>;

// GET /v1/athletes/me returns the caller's own rich profile, including the
// unpublished draft state (`publishedAt: null`); the shape is identical to the
// public profile, so this alias names the owner-scoped contract for clarity.
export const myAthleteProfileResponseSchema = athleteProfileSchema;

export type MyAthleteProfileResponse = z.infer<typeof myAthleteProfileResponseSchema>;

export const athleteDirectoryItemSchema = z.object({
  athleteId: idSchema,
  athleteSlug: slugSchema,
  fullName: z.string(),
  headline: z.string().nullable(),
  primarySport: sportSchema,
  runnerLevel: athleteLevelSchema.optional(),
  hometown: z.string().nullable(),
  countryCode: z.string().nullable(),
  heroMediaUrl: mediaRefSchema.nullable(),
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
    values: z.array(z.string().max(ATHLETE_VALUE_MAX_LENGTH)).max(ATHLETE_VALUES_MAX).optional(),
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
    values: z.array(z.string().max(ATHLETE_VALUE_MAX_LENGTH)).max(ATHLETE_VALUES_MAX).optional(),
    coreValues: z.array(athleteCoreValueSchema).max(ATHLETE_CORE_VALUES_MAX).optional(),
    storyIntro: z.string().max(2000).optional(),
    storyBody: z.array(z.string().max(6000)).max(20).optional(),
    presentation: z.record(z.unknown()).optional(),
    socialInstagramHandle: z.string().max(60).optional(),
    socialTwitterHandle: z.string().max(60).optional(),
    socialStravaUrl: z.string().url().optional(),
    heroMediaUrl: mediaRefSchema.nullable().optional(),
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

const setPersonalBestInputSchema = z.object({
  label: z.string().min(1).max(40),
  value: z.string().min(1).max(40),
  resultUrl: z.string().url().optional(),
});

export const replacePersonalBestsRequestSchema = z
  .object({
    personalBests: z.array(setPersonalBestInputSchema).max(8),
  })
  .strict();

export type ReplacePersonalBestsRequest = z.infer<typeof replacePersonalBestsRequestSchema>;

const setHighlightInputSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().max(2000).optional(),
  resultUrl: z.string().url().optional(),
  occurredOn: z.string().date().optional(),
  photoRefs: z.array(mediaRefSchema).max(12).optional(),
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
  photoRefs: z.array(mediaRefSchema).max(12).optional(),
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

// Exported so the editor can stop the athlete at the cap while picking photos,
// rather than letting the save PUT fail validation after the fact.
export const ATHLETE_GALLERY_MAX_PHOTOS = 12;

export const setAthleteGalleryRequestSchema = z
  .object({
    gallery: z.array(mediaRefSchema).max(ATHLETE_GALLERY_MAX_PHOTOS),
  })
  .strict();

export type SetAthleteGalleryRequest = z.infer<typeof setAthleteGalleryRequestSchema>;

export const athletePayoutSchema = z.object({
  stripePayoutId: z.string(),
  payoutStatus: z.nativeEnum(PayoutStatus),
  amountCents: moneyCentsSchema,
  currency: z.string(),
  arrivalDate: isoDateTimeSchema.nullable(),
  occurredAt: isoDateTimeSchema,
});

export type AthletePayout = z.infer<typeof athletePayoutSchema>;

export const athleteStripeStatusSchema = z.object({
  stripeConnected: z.boolean(),
  chargesEnabled: z.boolean(),
  payoutsEnabled: z.boolean(),
  onboardingUrl: z.string().url().optional(),
  recentPayouts: z.array(athletePayoutSchema),
});

export type AthleteStripeStatus = z.infer<typeof athleteStripeStatusSchema>;

export const athleteStripeOnboardingResponseSchema = z.object({
  onboardingUrl: z.string().url(),
});

export type AthleteStripeOnboardingResponse = z.infer<
  typeof athleteStripeOnboardingResponseSchema
>;

export const publishAthleteProfileResponseSchema = z.object({
  athleteId: idSchema,
  athleteSlug: slugSchema,
  publishedAt: isoDateTimeSchema,
});

export type PublishAthleteProfileResponse = z.infer<typeof publishAthleteProfileResponseSchema>;
