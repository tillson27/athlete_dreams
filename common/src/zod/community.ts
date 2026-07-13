import { z } from 'zod';
import { sportCategorySchema, athleteSourceLinkSchema, verificationStatusSchema } from './athlete';
import { httpUrlSchema, idSchema, isoDateTimeSchema, paginationResponseSchema, slugSchema } from './shared';
import {
  CommunityFeedCategory,
  CommunityFeedKind,
  CommunityFeedTargetType,
  ReactionKind,
} from '../types/enums';

export const communityFeedKindSchema = z.nativeEnum(CommunityFeedKind);
export const communityFeedCategorySchema = z.nativeEnum(CommunityFeedCategory);
export const communityFeedTargetTypeSchema = z.nativeEnum(CommunityFeedTargetType);
export const reactionKindSchema = z.nativeEnum(ReactionKind);

export const followAthleteResponseSchema = z.object({
  athleteId: idSchema,
  athleteSlug: slugSchema,
  isFollowing: z.boolean(),
  followerCount: z.number().int().nonnegative(),
});

export type FollowAthleteResponse = z.infer<typeof followAthleteResponseSchema>;

export const communityFeedQuerySchema = z
  .object({
    scope: z.enum(['EVERYONE', 'FOLLOWING']).optional().default('EVERYONE'),
    sport: sportCategorySchema.optional(),
    category: communityFeedCategorySchema.optional(),
    athleteSlug: slugSchema.optional(),
    limit: z.coerce.number().int().positive().max(50).optional().default(20),
    cursor: z.string().max(512).optional(),
  })
  .strict();

export type CommunityFeedQuery = z.infer<typeof communityFeedQuerySchema>;

export const communityFeedItemSchema = z.object({
  communityFeedItemId: z.string().min(1).max(160),
  targetType: communityFeedTargetTypeSchema,
  targetId: idSchema,
  athleteId: idSchema,
  athleteSlug: slugSchema,
  athleteName: z.string().min(1).max(120),
  athleteAvatarUrl: httpUrlSchema.nullable(),
  primarySport: sportCategorySchema,
  disciplineLabel: z.string().max(80).nullable(),
  feedKind: communityFeedKindSchema,
  feedCategory: communityFeedCategorySchema,
  headline: z.string().min(1).max(180),
  detail: z.string().max(400).nullable(),
  photoUrl: httpUrlSchema.nullable(),
  occurredAt: isoDateTimeSchema,
  sourceLinks: z.array(athleteSourceLinkSchema).max(6),
  verificationStatus: verificationStatusSchema,
  cheerCount: z.number().int().nonnegative(),
  viewerReactionKind: reactionKindSchema.nullable(),
});

export type CommunityFeedItem = z.infer<typeof communityFeedItemSchema>;

export const communityFeedResponseSchema = paginationResponseSchema(communityFeedItemSchema);

export type CommunityFeedResponse = z.infer<typeof communityFeedResponseSchema>;

export const communityReactionRequestSchema = z
  .object({
    targetType: communityFeedTargetTypeSchema,
    targetId: idSchema,
    reactionKind: reactionKindSchema.default(ReactionKind.Cheer),
  })
  .strict();

export type CommunityReactionRequest = z.infer<typeof communityReactionRequestSchema>;

export const communityReactionResponseSchema = z.object({
  targetType: communityFeedTargetTypeSchema,
  targetId: idSchema,
  reactionKind: reactionKindSchema,
  hasReacted: z.boolean(),
  reactionCount: z.number().int().nonnegative(),
});

export type CommunityReactionResponse = z.infer<typeof communityReactionResponseSchema>;

export const racingSoonItemSchema = z.object({
  athleteId: idSchema,
  athleteSlug: slugSchema,
  athleteName: z.string().min(1).max(120),
  athleteAvatarUrl: httpUrlSchema.nullable(),
  eventName: z.string().min(1).max(180),
  eventDate: z.string().date().nullable(),
  eventDateLabel: z.string().min(1).max(120),
});

export type RacingSoonItem = z.infer<typeof racingSoonItemSchema>;
