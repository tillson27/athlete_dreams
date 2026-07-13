import {
  communityFeedResponseSchema,
  communityReactionResponseSchema,
  type CommunityFeedCategory,
  type CommunityFeedResponse,
  type CommunityReactionRequest,
  type CommunityReactionResponse,
  type SportCategory,
} from 'fad-common';
import { apiFetch } from './client';

export type CommunityFeedFilters = {
  scope?: 'EVERYONE' | 'FOLLOWING';
  sport?: SportCategory;
  category?: CommunityFeedCategory;
  athleteSlug?: string;
  limit?: number;
  cursor?: string;
};

export async function listCommunityFeed(
  filters: CommunityFeedFilters = {},
  accessToken?: string | null
): Promise<CommunityFeedResponse> {
  return apiFetch('/v1/community/feed', {
    accessToken,
    query: filters,
    schema: communityFeedResponseSchema,
  });
}

export async function cheerCommunityItem(
  accessToken: string,
  body: CommunityReactionRequest
): Promise<CommunityReactionResponse> {
  return apiFetch('/v1/community/reactions', {
    method: 'POST',
    accessToken,
    body,
    schema: communityReactionResponseSchema,
  });
}

export async function uncheerCommunityItem(
  accessToken: string,
  body: CommunityReactionRequest
): Promise<CommunityReactionResponse> {
  return apiFetch('/v1/community/reactions', {
    method: 'DELETE',
    accessToken,
    body,
    schema: communityReactionResponseSchema,
  });
}
