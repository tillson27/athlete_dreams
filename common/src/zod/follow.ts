import { z } from 'zod';
import { idSchema, isoDateTimeSchema, paginationResponseSchema, slugSchema } from './shared';
import { SportCategory } from '../types/enums';

const sportSchema = z.nativeEnum(SportCategory);

export const followSchema = z.object({
  followId: idSchema,
  athleteId: idSchema,
  athleteSlug: slugSchema,
  athleteName: z.string(),
  primarySport: sportSchema,
  heroMediaUrl: z.string().url().nullable(),
  followedAt: isoDateTimeSchema,
});

export type Follow = z.infer<typeof followSchema>;

export const followListResponseSchema = paginationResponseSchema(followSchema);

export type FollowListResponse = z.infer<typeof followListResponseSchema>;
