import { z } from 'zod';
import { campaignSummarySchema } from './campaign';
import {
  httpUrlSchema,
  idSchema,
  isoDateTimeSchema,
  moneyCentsSchema,
  paginationResponseSchema,
  slugSchema,
} from './shared';
import {
  AthleteLevel,
  AthleteMediaKind,
  AthleteMediaRole,
  AthleteProfileStatus,
  AthleteResultKind,
  AthleteStoryChapterIcon,
  AthleteStoryChapterTone,
  SportCategory,
  VerificationStatus,
} from '../types/enums';

export const sportCategorySchema = z.nativeEnum(SportCategory);
export const athleteProfileStatusSchema = z.nativeEnum(AthleteProfileStatus);
export const athleteLevelSchema = z.nativeEnum(AthleteLevel);
export const athleteResultKindSchema = z.nativeEnum(AthleteResultKind);
export const verificationStatusSchema = z.nativeEnum(VerificationStatus);
export const athleteMediaKindSchema = z.nativeEnum(AthleteMediaKind);
export const athleteMediaRoleSchema = z.nativeEnum(AthleteMediaRole);
export const athleteStoryChapterIconSchema = z.nativeEnum(AthleteStoryChapterIcon);
export const athleteStoryChapterToneSchema = z.nativeEnum(AthleteStoryChapterTone);

const sportSchema = sportCategorySchema;
const displayDateSchema = z.string().min(1).max(120);
const sortOrderSchema = z.number().int().nonnegative();
const nullableHttpUrlSchema = httpUrlSchema.nullable();

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
  athleteLevel: athleteLevelSchema.nullable().optional(),
  disciplineLabel: z.string().max(80).nullable().optional(),
  hometown: z.string().nullable(),
  countryCode: z.string().nullable(),
  heroMediaUrl: z.string().url().nullable(),
  values: z.array(z.string().max(40)).max(8).optional(),
  supportEnabled: z.boolean().optional(),
  followerCount: z.number().int().nonnegative().optional(),
  activeCampaignCount: z.number().int().nonnegative(),
  totalRaisedCents: z.number().int().nonnegative(),
});

export type AthleteDirectoryItem = z.infer<typeof athleteDirectoryItemSchema>;

export const athleteDirectoryResponseSchema = paginationResponseSchema(athleteDirectoryItemSchema);

export type AthleteDirectoryResponse = z.infer<typeof athleteDirectoryResponseSchema>;

export const athleteSourceLinkSchema = z
  .object({
    label: z.string().min(1).max(80),
    href: httpUrlSchema,
  })
  .strict();

export type AthleteSourceLink = z.infer<typeof athleteSourceLinkSchema>;

export const athleteCoreValueSchema = z.object({
  title: z.string().min(1).max(60),
  body: z.string().max(240),
});

export type AthleteCoreValue = z.infer<typeof athleteCoreValueSchema>;

export const athleteStorySchema = z.object({
  intro: z.string().max(1200).nullable(),
  body: z.array(z.string().min(1).max(2400)).max(12),
});

export type AthleteStory = z.infer<typeof athleteStorySchema>;

export const athletePersonalBestSchema = z.object({
  athletePersonalBestId: idSchema,
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(80),
  sourceUrl: nullableHttpUrlSchema,
  verificationStatus: verificationStatusSchema,
  verifiedAt: isoDateTimeSchema.nullable(),
  sortOrder: sortOrderSchema,
});

export type AthletePersonalBest = z.infer<typeof athletePersonalBestSchema>;

export const athleteResultSchema = z.object({
  athleteResultId: idSchema,
  resultKind: athleteResultKindSchema,
  title: z.string().min(1).max(180),
  resultText: z.string().min(1).max(280),
  eventDate: z.string().date().nullable(),
  eventDateLabel: displayDateSchema.nullable(),
  sourceLinks: z.array(athleteSourceLinkSchema).max(6),
  verificationStatus: verificationStatusSchema,
  verifiedAt: isoDateTimeSchema.nullable(),
  mediaUrls: z.array(httpUrlSchema).max(8),
  sortOrder: sortOrderSchema,
});

export type AthleteResult = z.infer<typeof athleteResultSchema>;

export const athleteRoadmapEventSchema = z.object({
  athleteRoadmapEventId: idSchema,
  eventName: z.string().min(1).max(180),
  eventDate: z.string().date().nullable(),
  eventDateLabel: displayDateSchema,
  eventLocation: z.string().max(180).nullable(),
  sourceLinks: z.array(athleteSourceLinkSchema).max(4),
  sortOrder: sortOrderSchema,
});

export type AthleteRoadmapEvent = z.infer<typeof athleteRoadmapEventSchema>;

export const athleteStoryChapterSchema = z.object({
  athleteStoryChapterId: idSchema,
  eraLabel: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(1800),
  chapterIcon: athleteStoryChapterIconSchema,
  chapterTone: athleteStoryChapterToneSchema,
  imageUrl: nullableHttpUrlSchema,
  isCurrent: z.boolean(),
  sortOrder: sortOrderSchema,
});

export type AthleteStoryChapter = z.infer<typeof athleteStoryChapterSchema>;

export const athleteTrainingSnapshotSchema = z.object({
  athleteTrainingSnapshotId: idSchema,
  weeklyDistanceLabel: z.string().max(40).nullable(),
  weeklyTimeLabel: z.string().max(40).nullable(),
  weeklyElevationGainLabel: z.string().max(40).nullable(),
  weeklyLoadLabel: z.string().max(80).nullable(),
  latestSessionTitle: z.string().max(160).nullable(),
  latestSessionMeta: z.string().max(160).nullable(),
  capturedAt: isoDateTimeSchema,
});

export type AthleteTrainingSnapshot = z.infer<typeof athleteTrainingSnapshotSchema>;

export const athletePowerPeakSchema = z.object({
  label: z.string().min(1).max(40),
  watts: z.string().min(1).max(40),
});

export type AthletePowerPeak = z.infer<typeof athletePowerPeakSchema>;

export const athletePowerProfileSchema = z.object({
  ftpWatts: z.string().max(40).nullable(),
  wattsPerKg: z.string().max(40).nullable(),
  riderWeight: z.string().max(40).nullable(),
  riderType: z.string().max(80).nullable(),
  peaks: z.array(athletePowerPeakSchema).max(12),
});

export type AthletePowerProfile = z.infer<typeof athletePowerProfileSchema>;

export const athleteMediaAssetSchema = z.object({
  athleteMediaAssetId: idSchema,
  mediaKind: athleteMediaKindSchema,
  mediaRole: athleteMediaRoleSchema,
  mediaUrl: httpUrlSchema,
  thumbnailUrl: nullableHttpUrlSchema,
  altText: z.string().max(180).nullable(),
  caption: z.string().max(280).nullable(),
  durationLabel: z.string().max(40).nullable(),
  relatedAthleteResultId: idSchema.nullable(),
  relatedStoryChapterId: idSchema.nullable(),
  sortOrder: sortOrderSchema,
  createdAt: isoDateTimeSchema,
});

export type AthleteMediaAsset = z.infer<typeof athleteMediaAssetSchema>;

export const athleteRecentBackerSchema = z.object({
  displayName: z.string().min(1).max(120),
  backedAt: isoDateTimeSchema,
  amountCents: moneyCentsSchema,
  initials: z.string().min(1).max(4).nullable(),
  isAnonymous: z.boolean(),
});

export type AthleteRecentBacker = z.infer<typeof athleteRecentBackerSchema>;

export const athleteSupportSummarySchema = z.object({
  supportEnabled: z.boolean(),
  backCtaBlurb: z.string().max(160).nullable(),
  supporterCount: z.number().int().nonnegative(),
  activeCampaigns: z.array(campaignSummarySchema),
  recentBackers: z.array(athleteRecentBackerSchema).max(12),
});

export type AthleteSupportSummary = z.infer<typeof athleteSupportSummarySchema>;

export const publicAthleteProfileSchema = z.object({
  athleteId: idSchema,
  userId: idSchema,
  athleteSlug: slugSchema,
  fullName: z.string().min(1).max(120),
  profileStatus: athleteProfileStatusSchema,
  publishedAt: isoDateTimeSchema,
  profileVersion: z.number().int().nonnegative(),
  headline: z.string().max(160).nullable(),
  tagline: z.string().max(160).nullable(),
  primarySport: sportSchema,
  secondarySports: z.array(sportSchema),
  athleteLevel: athleteLevelSchema.nullable(),
  disciplineLabel: z.string().max(80).nullable(),
  hometown: z.string().max(120).nullable(),
  countryCode: z.string().length(2).nullable(),
  heroMediaUrl: nullableHttpUrlSchema,
  profileImageUrl: nullableHttpUrlSchema,
  socialInstagramHandle: z.string().max(60).nullable(),
  socialTwitterHandle: z.string().max(60).nullable(),
  socialStravaUrl: nullableHttpUrlSchema,
  values: z.array(z.string().max(40)).max(8),
  coreValues: z.array(athleteCoreValueSchema).max(8),
  story: athleteStorySchema,
  arcSubtitle: z.string().max(240).nullable(),
  storyChapters: z.array(athleteStoryChapterSchema),
  personalBests: z.array(athletePersonalBestSchema),
  results: z.array(athleteResultSchema),
  roadmapTitle: z.string().max(120).nullable(),
  roadmapEvents: z.array(athleteRoadmapEventSchema),
  trainingSnapshot: athleteTrainingSnapshotSchema.nullable(),
  powerProfile: athletePowerProfileSchema.nullable(),
  mediaAssets: z.array(athleteMediaAssetSchema),
  followerCount: z.number().int().nonnegative(),
  viewerIsFollowing: z.boolean().nullable(),
  support: athleteSupportSummarySchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type PublicAthleteProfile = z.infer<typeof publicAthleteProfileSchema>;

export const athleteProfileCompletionItemSchema = z.object({
  completionItemKey: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  isComplete: z.boolean(),
  href: z.string().min(1).max(240).nullable(),
  ctaLabel: z.string().min(1).max(80).nullable(),
});

export type AthleteProfileCompletionItem = z.infer<typeof athleteProfileCompletionItemSchema>;

export const athleteProfileCompletionSchema = z.object({
  completionPercent: z.number().int().min(0).max(100),
  completedItemCount: z.number().int().nonnegative(),
  totalItemCount: z.number().int().positive(),
  missingFieldKeys: z.array(z.string().min(1).max(80)),
  items: z.array(athleteProfileCompletionItemSchema),
});

export type AthleteProfileCompletion = z.infer<typeof athleteProfileCompletionSchema>;

export const athleteProfileDraftSchema = z.object({
  athleteId: idSchema,
  userId: idSchema,
  athleteSlug: slugSchema.nullable(),
  fullName: z.string().min(1).max(120).nullable(),
  profileStatus: athleteProfileStatusSchema,
  profileVersion: z.number().int().nonnegative(),
  headline: z.string().max(160).nullable(),
  tagline: z.string().max(160).nullable(),
  primarySport: sportSchema.nullable(),
  secondarySports: z.array(sportSchema),
  athleteLevel: athleteLevelSchema.nullable(),
  disciplineLabel: z.string().max(80).nullable(),
  hometown: z.string().max(120).nullable(),
  countryCode: z.string().length(2).nullable(),
  heroMediaUrl: nullableHttpUrlSchema,
  profileImageUrl: nullableHttpUrlSchema,
  socialInstagramHandle: z.string().max(60).nullable(),
  socialTwitterHandle: z.string().max(60).nullable(),
  socialStravaUrl: nullableHttpUrlSchema,
  values: z.array(z.string().max(40)).max(8),
  coreValues: z.array(athleteCoreValueSchema).max(8),
  story: athleteStorySchema,
  arcSubtitle: z.string().max(240).nullable(),
  storyChapters: z.array(athleteStoryChapterSchema),
  personalBests: z.array(athletePersonalBestSchema),
  results: z.array(athleteResultSchema),
  roadmapTitle: z.string().max(120).nullable(),
  roadmapEvents: z.array(athleteRoadmapEventSchema),
  trainingSnapshot: athleteTrainingSnapshotSchema.nullable(),
  powerProfile: athletePowerProfileSchema.nullable(),
  mediaAssets: z.array(athleteMediaAssetSchema),
  support: athleteSupportSummarySchema,
  completion: athleteProfileCompletionSchema,
  publishedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type AthleteProfileDraft = z.infer<typeof athleteProfileDraftSchema>;

const athleteSourceLinkInputSchema = z
  .object({
    label: z.string().min(1).max(80),
    href: httpUrlSchema,
  })
  .strict();

const personalBestInputSchema = z
  .object({
    athletePersonalBestId: idSchema.optional(),
    label: z.string().min(1).max(80),
    value: z.string().min(1).max(80),
    sourceUrl: httpUrlSchema.optional().nullable(),
    sortOrder: sortOrderSchema.optional(),
  })
  .strict();

const athleteResultInputSchema = z
  .object({
    athleteResultId: idSchema.optional(),
    resultKind: athleteResultKindSchema,
    title: z.string().min(1).max(180),
    resultText: z.string().min(1).max(280),
    eventDate: z.string().date().optional().nullable(),
    eventDateLabel: displayDateSchema.optional().nullable(),
    sourceLinks: z.array(athleteSourceLinkInputSchema).max(6).optional(),
    mediaUrls: z.array(httpUrlSchema).max(8).optional(),
    sortOrder: sortOrderSchema.optional(),
  })
  .strict();

const athleteRoadmapEventInputSchema = z
  .object({
    athleteRoadmapEventId: idSchema.optional(),
    eventName: z.string().min(1).max(180),
    eventDate: z.string().date().optional().nullable(),
    eventDateLabel: displayDateSchema,
    eventLocation: z.string().max(180).optional().nullable(),
    sourceLinks: z.array(athleteSourceLinkInputSchema).max(4).optional(),
    sortOrder: sortOrderSchema.optional(),
  })
  .strict();

const athleteStoryChapterInputSchema = z
  .object({
    athleteStoryChapterId: idSchema.optional(),
    eraLabel: z.string().min(1).max(80),
    title: z.string().min(1).max(120),
    body: z.string().min(1).max(1800),
    chapterIcon: athleteStoryChapterIconSchema,
    chapterTone: athleteStoryChapterToneSchema,
    imageUrl: httpUrlSchema.optional().nullable(),
    isCurrent: z.boolean().optional(),
    sortOrder: sortOrderSchema.optional(),
  })
  .strict();

const athleteMediaAssetInputSchema = z
  .object({
    athleteMediaAssetId: idSchema.optional(),
    mediaKind: athleteMediaKindSchema,
    mediaRole: athleteMediaRoleSchema,
    mediaUrl: httpUrlSchema,
    thumbnailUrl: httpUrlSchema.optional().nullable(),
    altText: z.string().max(180).optional().nullable(),
    caption: z.string().max(280).optional().nullable(),
    durationLabel: z.string().max(40).optional().nullable(),
    relatedAthleteResultId: idSchema.optional().nullable(),
    relatedStoryChapterId: idSchema.optional().nullable(),
    sortOrder: sortOrderSchema.optional(),
  })
  .strict();

export const upsertAthleteProfileDraftRequestSchema = z
  .object({
    expectedProfileVersion: z.number().int().nonnegative().optional(),
    athleteSlug: slugSchema.optional().nullable(),
    fullName: z.string().min(1).max(120).optional().nullable(),
    headline: z.string().max(160).optional().nullable(),
    tagline: z.string().max(160).optional().nullable(),
    primarySport: sportSchema.optional().nullable(),
    secondarySports: z.array(sportSchema).max(5).optional(),
    athleteLevel: athleteLevelSchema.optional().nullable(),
    disciplineLabel: z.string().max(80).optional().nullable(),
    hometown: z.string().max(120).optional().nullable(),
    countryCode: z.string().length(2).optional().nullable(),
    heroMediaUrl: httpUrlSchema.optional().nullable(),
    profileImageUrl: httpUrlSchema.optional().nullable(),
    socialInstagramHandle: z.string().max(60).optional().nullable(),
    socialTwitterHandle: z.string().max(60).optional().nullable(),
    socialStravaUrl: httpUrlSchema.optional().nullable(),
    values: z.array(z.string().max(40)).max(8).optional(),
    coreValues: z.array(athleteCoreValueSchema).max(8).optional(),
    story: athleteStorySchema.optional(),
    arcSubtitle: z.string().max(240).optional().nullable(),
    storyChapters: z.array(athleteStoryChapterInputSchema).max(12).optional(),
    personalBests: z.array(personalBestInputSchema).max(24).optional(),
    results: z.array(athleteResultInputSchema).max(80).optional(),
    roadmapTitle: z.string().max(120).optional().nullable(),
    roadmapEvents: z.array(athleteRoadmapEventInputSchema).max(40).optional(),
    trainingSnapshot: z
      .object({
        weeklyDistanceLabel: z.string().max(40).optional().nullable(),
        weeklyTimeLabel: z.string().max(40).optional().nullable(),
        weeklyElevationGainLabel: z.string().max(40).optional().nullable(),
        weeklyLoadLabel: z.string().max(80).optional().nullable(),
        latestSessionTitle: z.string().max(160).optional().nullable(),
        latestSessionMeta: z.string().max(160).optional().nullable(),
        capturedAt: isoDateTimeSchema.optional(),
      })
      .strict()
      .optional()
      .nullable(),
    powerProfile: athletePowerProfileSchema.optional().nullable(),
    mediaAssets: z.array(athleteMediaAssetInputSchema).max(80).optional(),
    supportEnabled: z.boolean().optional(),
    backCtaBlurb: z.string().max(160).optional().nullable(),
  })
  .strict();

export type UpsertAthleteProfileDraftRequest = z.infer<
  typeof upsertAthleteProfileDraftRequestSchema
>;

export const publishAthleteProfileRequestSchema = z
  .object({
    expectedProfileVersion: z.number().int().nonnegative().optional(),
  })
  .strict();

export type PublishAthleteProfileRequest = z.infer<typeof publishAthleteProfileRequestSchema>;

export const publishAthleteProfileResponseSchema = z.object({
  profile: publicAthleteProfileSchema.nullable(),
  completion: athleteProfileCompletionSchema,
  published: z.boolean(),
});

export type PublishAthleteProfileResponse = z.infer<
  typeof publishAthleteProfileResponseSchema
>;

export const upsertAthletePersonalBestRequestSchema = personalBestInputSchema;
export type UpsertAthletePersonalBestRequest = z.infer<
  typeof upsertAthletePersonalBestRequestSchema
>;

export const upsertAthleteResultRequestSchema = athleteResultInputSchema;
export type UpsertAthleteResultRequest = z.infer<typeof upsertAthleteResultRequestSchema>;

export const upsertAthleteStoryChapterRequestSchema = athleteStoryChapterInputSchema;
export type UpsertAthleteStoryChapterRequest = z.infer<
  typeof upsertAthleteStoryChapterRequestSchema
>;

export const upsertAthleteRoadmapEventRequestSchema = athleteRoadmapEventInputSchema;
export type UpsertAthleteRoadmapEventRequest = z.infer<
  typeof upsertAthleteRoadmapEventRequestSchema
>;

export const upsertAthleteTrainingSnapshotRequestSchema = z
  .object({
    weeklyDistanceLabel: z.string().max(40).optional().nullable(),
    weeklyTimeLabel: z.string().max(40).optional().nullable(),
    weeklyElevationGainLabel: z.string().max(40).optional().nullable(),
    weeklyLoadLabel: z.string().max(80).optional().nullable(),
    latestSessionTitle: z.string().max(160).optional().nullable(),
    latestSessionMeta: z.string().max(160).optional().nullable(),
    capturedAt: isoDateTimeSchema.optional(),
  })
  .strict();

export type UpsertAthleteTrainingSnapshotRequest = z.infer<
  typeof upsertAthleteTrainingSnapshotRequestSchema
>;

export const upsertAthleteMediaAssetRequestSchema = athleteMediaAssetInputSchema;
export type UpsertAthleteMediaAssetRequest = z.infer<
  typeof upsertAthleteMediaAssetRequestSchema
>;

export const reorderAthleteProfileChildrenRequestSchema = z
  .object({
    expectedProfileVersion: z.number().int().nonnegative().optional(),
    orderedChildIds: z.array(idSchema).min(1).max(100),
  })
  .strict();

export type ReorderAthleteProfileChildrenRequest = z.infer<
  typeof reorderAthleteProfileChildrenRequestSchema
>;

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
