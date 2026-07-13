import {
  athleteDirectoryItemSchema,
  athleteDirectoryResponseSchema,
  athleteProfileDraftSchema,
  athleteDashboardSchema,
  followAthleteResponseSchema,
  publicAthleteProfileSchema,
  publishAthleteProfileResponseSchema,
  type AthleteDashboard,
  type AthleteDirectoryItem,
  type AthleteDirectoryQuery,
  type AthleteDirectoryResponse,
  type AthleteProfileDraft,
  type DeleteAthleteProfileChildRequest,
  type FollowAthleteResponse,
  type PublicAthleteProfile,
  type PublishAthleteProfileRequest,
  type PublishAthleteProfileResponse,
  type ReorderAthleteProfileChildrenRequest,
  type UpsertAthleteMediaAssetRequest,
  type UpsertAthletePersonalBestRequest,
  type UpsertAthleteProfileDraftRequest,
  type UpsertAthleteResultRequest,
  type UpsertAthleteRoadmapEventRequest,
  type UpsertAthleteStoryChapterRequest,
  type UpsertAthleteTrainingSnapshotRequest,
} from 'fad-common';
import { apiFetch } from './client';

export type AthleteDirectoryFilters = Partial<AthleteDirectoryQuery>;

const athleteDirectoryPayloadSchema = {
  parse(value: unknown): AthleteDirectoryResponse {
    const parsedResponse = athleteDirectoryResponseSchema.safeParse(value);
    if (parsedResponse.success) return parsedResponse.data;

    return {
      items: athleteDirectoryItemSchema.array().parse(value),
      nextCursor: null,
    };
  },
};

export async function listAthletes(
  filters: AthleteDirectoryFilters = {}
): Promise<AthleteDirectoryItem[]> {
  const response = await apiFetch<AthleteDirectoryResponse>('/v1/athletes', {
    query: filters,
    schema: athleteDirectoryPayloadSchema,
  });
  return response.items;
}

export async function getPublicAthleteProfile(
  athleteSlug: string,
  accessToken?: string | null
): Promise<PublicAthleteProfile> {
  return apiFetch(`/v1/athletes/${athleteSlug}`, {
    accessToken,
    schema: publicAthleteProfileSchema,
  });
}

export async function getMyDraft(accessToken: string): Promise<AthleteProfileDraft> {
  return apiFetch('/v1/athletes/me/draft', {
    accessToken,
    schema: athleteProfileDraftSchema,
  });
}

export async function getMyDashboard(accessToken: string): Promise<AthleteDashboard> {
  return apiFetch('/v1/athletes/me/dashboard', {
    accessToken,
    schema: athleteDashboardSchema,
  });
}

export async function upsertMyDraft(
  accessToken: string,
  body: UpsertAthleteProfileDraftRequest
): Promise<AthleteProfileDraft> {
  return apiFetch('/v1/athletes/me/draft', {
    method: 'PUT',
    accessToken,
    body,
    schema: athleteProfileDraftSchema,
  });
}

export async function publishMyProfile(
  accessToken: string,
  body: PublishAthleteProfileRequest
): Promise<PublishAthleteProfileResponse> {
  return apiFetch('/v1/athletes/me/publish', {
    method: 'POST',
    accessToken,
    body,
    schema: publishAthleteProfileResponseSchema,
  });
}

export async function followAthlete(
  athleteSlug: string,
  accessToken: string
): Promise<FollowAthleteResponse> {
  return apiFetch(`/v1/athletes/${athleteSlug}/follow`, {
    method: 'POST',
    accessToken,
    schema: followAthleteResponseSchema,
  });
}

export async function unfollowAthlete(
  athleteSlug: string,
  accessToken: string
): Promise<FollowAthleteResponse> {
  return apiFetch(`/v1/athletes/${athleteSlug}/follow`, {
    method: 'DELETE',
    accessToken,
    schema: followAthleteResponseSchema,
  });
}

export async function upsertMyPersonalBest(
  accessToken: string,
  body: UpsertAthletePersonalBestRequest,
  athletePersonalBestId?: string
): Promise<AthleteProfileDraft> {
  const path = athletePersonalBestId
    ? `/v1/athletes/me/personal-bests/${athletePersonalBestId}`
    : '/v1/athletes/me/personal-bests';
  return apiFetch(path, {
    method: athletePersonalBestId ? 'PUT' : 'POST',
    accessToken,
    body,
    schema: athleteProfileDraftSchema,
  });
}

export async function upsertMyResult(
  accessToken: string,
  body: UpsertAthleteResultRequest,
  athleteResultId?: string
): Promise<AthleteProfileDraft> {
  const path = athleteResultId
    ? `/v1/athletes/me/results/${athleteResultId}`
    : '/v1/athletes/me/results';
  return apiFetch(path, {
    method: athleteResultId ? 'PUT' : 'POST',
    accessToken,
    body,
    schema: athleteProfileDraftSchema,
  });
}

export async function deleteMyResult(
  accessToken: string,
  athleteResultId: string,
  body: DeleteAthleteProfileChildRequest
): Promise<AthleteProfileDraft> {
  return apiFetch(`/v1/athletes/me/results/${athleteResultId}`, {
    method: 'DELETE',
    accessToken,
    body,
    schema: athleteProfileDraftSchema,
  });
}

export async function reorderMyResults(
  accessToken: string,
  body: ReorderAthleteProfileChildrenRequest
): Promise<AthleteProfileDraft> {
  return apiFetch('/v1/athletes/me/results/reorder', {
    method: 'PUT',
    accessToken,
    body,
    schema: athleteProfileDraftSchema,
  });
}

export async function upsertMyRoadmapEvent(
  accessToken: string,
  body: UpsertAthleteRoadmapEventRequest,
  athleteRoadmapEventId?: string
): Promise<AthleteProfileDraft> {
  const path = athleteRoadmapEventId
    ? `/v1/athletes/me/roadmap-events/${athleteRoadmapEventId}`
    : '/v1/athletes/me/roadmap-events';
  return apiFetch(path, {
    method: athleteRoadmapEventId ? 'PUT' : 'POST',
    accessToken,
    body,
    schema: athleteProfileDraftSchema,
  });
}

export async function deleteMyRoadmapEvent(
  accessToken: string,
  athleteRoadmapEventId: string,
  body: DeleteAthleteProfileChildRequest
): Promise<AthleteProfileDraft> {
  return apiFetch(`/v1/athletes/me/roadmap-events/${athleteRoadmapEventId}`, {
    method: 'DELETE',
    accessToken,
    body,
    schema: athleteProfileDraftSchema,
  });
}

export async function reorderMyRoadmapEvents(
  accessToken: string,
  body: ReorderAthleteProfileChildrenRequest
): Promise<AthleteProfileDraft> {
  return apiFetch('/v1/athletes/me/roadmap-events/reorder', {
    method: 'PUT',
    accessToken,
    body,
    schema: athleteProfileDraftSchema,
  });
}

export async function upsertMyStoryChapter(
  accessToken: string,
  body: UpsertAthleteStoryChapterRequest,
  athleteStoryChapterId?: string
): Promise<AthleteProfileDraft> {
  const path = athleteStoryChapterId
    ? `/v1/athletes/me/story-chapters/${athleteStoryChapterId}`
    : '/v1/athletes/me/story-chapters';
  return apiFetch(path, {
    method: athleteStoryChapterId ? 'PUT' : 'POST',
    accessToken,
    body,
    schema: athleteProfileDraftSchema,
  });
}

export async function upsertMyTrainingSnapshot(
  accessToken: string,
  body: UpsertAthleteTrainingSnapshotRequest
): Promise<AthleteProfileDraft> {
  return apiFetch('/v1/athletes/me/training-snapshot', {
    method: 'PUT',
    accessToken,
    body,
    schema: athleteProfileDraftSchema,
  });
}

export async function upsertMyMediaAsset(
  accessToken: string,
  body: UpsertAthleteMediaAssetRequest,
  athleteMediaAssetId?: string
): Promise<AthleteProfileDraft> {
  const path = athleteMediaAssetId
    ? `/v1/athletes/me/media-assets/${athleteMediaAssetId}`
    : '/v1/athletes/me/media-assets';
  return apiFetch(path, {
    method: athleteMediaAssetId ? 'PUT' : 'POST',
    accessToken,
    body,
    schema: athleteProfileDraftSchema,
  });
}

export async function deleteMyMediaAsset(
  accessToken: string,
  athleteMediaAssetId: string,
  body: DeleteAthleteProfileChildRequest
): Promise<AthleteProfileDraft> {
  return apiFetch(`/v1/athletes/me/media-assets/${athleteMediaAssetId}`, {
    method: 'DELETE',
    accessToken,
    body,
    schema: athleteProfileDraftSchema,
  });
}
