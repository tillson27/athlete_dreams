import { z } from 'zod';
import {
  idSchema,
  isoDateTimeSchema,
  mediaRefSchema,
  paginationResponseSchema,
  slugSchema,
} from './shared';
import { SportCategory } from '../types/enums';

const sportSchema = z.nativeEnum(SportCategory);

export const followSchema = z.object({
  followId: idSchema,
  athleteId: idSchema,
  athleteSlug: slugSchema,
  athleteName: z.string(),
  primarySport: sportSchema,
  heroMediaUrl: mediaRefSchema.nullable(),
  followedAt: isoDateTimeSchema,
});

export type Follow = z.infer<typeof followSchema>;

export const followListResponseSchema = paginationResponseSchema(followSchema);

export type FollowListResponse = z.infer<typeof followListResponseSchema>;
