import { z } from 'zod';
import { isoDateTimeSchema, mediaRefSchema, paginationResponseSchema, slugSchema } from './shared';
import { SportCategory } from '../types/enums';

const sportSchema = z.nativeEnum(SportCategory);

export const feedKindSchema = z.enum(['result', 'roadmap']);
export type FeedKind = z.infer<typeof feedKindSchema>;

export const feedCategorySchema = z.enum(['race', 'training', 'milestone']);
export type FeedCategory = z.infer<typeof feedCategorySchema>;

// Public API contract: a derived community-feed card. `feedItemId` is
// `<athleteSlug>-<kind>-<sourceId>` and `isVerified` is true when the source
// result carries a `resultUrl` (see context §9 example shape). `photoUrl` is a
// media reference (absolute URL or bare ref) or null; clients compose a display
// URL from a bare ref.
export const communityFeedItemSchema = z.object({
  feedItemId: z.string(),
  athleteSlug: slugSchema,
  athleteName: z.string(),
  primarySport: sportSchema,
  kind: feedKindSchema,
  category: feedCategorySchema,
  headline: z.string(),
  detail: z.string(),
  photoUrl: mediaRefSchema.nullable(),
  occurredAtLabel: z.string(),
  // The source date this item is ordered by, for clients that render a real
  // date stamp. Null when the source carries no date (e.g. training snapshots).
  occurredAt: isoDateTimeSchema.nullable(),
  isVerified: z.boolean(),
});

export type CommunityFeedItem = z.infer<typeof communityFeedItemSchema>;

export const communityFeedResponseSchema = paginationResponseSchema(communityFeedItemSchema);

export type CommunityFeedResponse = z.infer<typeof communityFeedResponseSchema>;

export const communityFeedQuerySchema = z.object({
  sport: sportSchema.optional(),
  category: feedCategorySchema.optional(),
  followedOnly: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().positive().max(100).optional().default(24),
  cursor: z.string().optional(),
});

export type CommunityFeedQuery = z.infer<typeof communityFeedQuerySchema>;
