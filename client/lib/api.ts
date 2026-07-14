import {
  athleteCampaignsResponseSchema,
  athleteDirectoryResponseSchema,
  athleteProfileSchema,
  authSessionSchema,
  communityFeedResponseSchema,
  errorResponseSchema,
  followListResponseSchema,
  publishAthleteProfileResponseSchema,
  userSchema,
  type AthleteCampaignsResponse,
  type AthleteDirectoryQuery,
  type AthleteDirectoryResponse,
  type AthleteProfile,
  type AuthSession,
  type CommunityFeedQuery,
  type CommunityFeedResponse,
  type CreateAthleteProfileRequest,
  type FollowListResponse,
  type PublishAthleteProfileResponse,
  type ReplacePersonalBestsRequest,
  type SetAthleteGalleryRequest,
  type SetAthleteHighlightsRequest,
  type SetAthleteRaceResultsRequest,
  type SetAthleteRoadmapRequest,
  type SignInRequest,
  type SignUpRequest,
  type UpdateAthleteProfileRequest,
  type User,
} from 'fad-common';

type SafeParseResult<T> = { success: true; data: T } | { success: false };
type Parser<T> = { safeParse: (data: unknown) => SafeParseResult<T> };

// Typed fetch layer over the Express API (`NEXT_PUBLIC_API_BASE_URL`). Every
// helper unwraps the `{ data }` / `{ error }` envelope and validates the payload
// against its `fad-common` schema, so callers always receive a parsed, typed
// response or a thrown `ApiError`. Used only when `NEXT_PUBLIC_DATA_SOURCE=api`
// (see `client/lib/dataSource.ts`); mock mode never touches this module.

// Public API contract: thrown by every helper on transport, envelope, or
// schema-validation failure. `code` mirrors the API error envelope code when
// present, else a client-side sentinel (`network_error` | `invalid_response`).
// `details` carries the API error envelope's `details` (e.g. the publish guard's
// `{ missing }`) so callers can render structured error UX without re-fetching.
export class ApiError extends Error {
  readonly code: string;
  readonly status: number | null;
  readonly details: unknown;

  constructor(message: string, code: string, status: number | null, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Auth seam: the session store (`client/lib/session.ts`) registers a token
// provider and an unauthorized callback at module load. Wiring the token in via
// a setter — rather than importing the session store here — keeps this module
// free of a circular dependency (session.ts imports from this module).
type TokenProvider = () => string | null;
type UnauthorizedListener = () => void;

let authTokenProvider: TokenProvider | null = null;
let onUnauthorized: UnauthorizedListener | null = null;

// Public API contract: session.ts calls this once on module load so authed
// helpers can read the current access token without a static import cycle.
export function setAuthTokenProvider(provider: TokenProvider | null): void {
  authTokenProvider = provider;
}

// Public API contract: session.ts registers a listener invoked exactly once per
// authed request that returns 401, before the `ApiError` is thrown, so the
// session can be cleared centrally (stale/expired token).
export function setOnUnauthorized(listener: UnauthorizedListener | null): void {
  onUnauthorized = listener;
}

function resolveBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new ApiError(
      'NEXT_PUBLIC_API_BASE_URL is not set; cannot reach the API.',
      'config_error',
      null
    );
  }
  return baseUrl.replace(/\/$/, '');
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  authed?: boolean;
};

async function apiRequest<T>(
  path: string,
  schema: Parser<T>,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, authed = false } = options;
  const url = `${resolveBaseUrl()}${path}`;

  const headers: Record<string, string> = { accept: 'application/json' };
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
  }
  if (authed) {
    const token = authTokenProvider?.() ?? null;
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(`Request to ${path} failed to reach the API.`, 'network_error', null);
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    throw new ApiError(
      `Response from ${path} was not valid JSON.`,
      'invalid_response',
      response.status
    );
  }

  if (!response.ok) {
    // Clear the session before surfacing the error so a stale/expired token on
    // an authed call never lingers (Context §11: token-expired mid-flow).
    if (response.status === 401 && authed) {
      onUnauthorized?.();
    }
    const parsedError = errorResponseSchema.safeParse(responseBody);
    if (parsedError.success) {
      throw new ApiError(
        parsedError.data.error.message,
        parsedError.data.error.code,
        response.status,
        parsedError.data.error.details
      );
    }
    throw new ApiError(`Request to ${path} failed.`, 'http_error', response.status);
  }

  if (typeof responseBody !== 'object' || responseBody === null || !('data' in responseBody)) {
    throw new ApiError(
      `Response from ${path} was missing the data envelope.`,
      'invalid_response',
      response.status
    );
  }

  const parsed = schema.safeParse((responseBody as { data: unknown }).data);
  if (!parsed.success) {
    throw new ApiError(
      `Response from ${path} did not match the expected schema.`,
      'invalid_response',
      response.status
    );
  }
  return parsed.data;
}

function apiGet<T>(path: string, schema: Parser<T>): Promise<T> {
  return apiRequest(path, schema);
}

export function fetchAthleteDirectory(
  params: Partial<AthleteDirectoryQuery> = {}
): Promise<AthleteDirectoryResponse> {
  const query = toQueryString({
    sport: params.sport,
    runnerLevel: params.runnerLevel,
    search: params.search,
    countryCode: params.countryCode,
    limit: params.limit,
    cursor: params.cursor,
  });
  return apiGet(`/v1/athletes${query}`, athleteDirectoryResponseSchema);
}

export function fetchAthleteProfile(athleteSlug: string): Promise<AthleteProfile> {
  return apiGet(`/v1/athletes/${encodeURIComponent(athleteSlug)}`, athleteProfileSchema);
}

export function fetchCommunityFeed(
  params: Partial<CommunityFeedQuery> = {}
): Promise<CommunityFeedResponse> {
  const query = toQueryString({
    sport: params.sport,
    category: params.category,
    followedOnly: params.followedOnly,
    limit: params.limit,
    cursor: params.cursor,
  });
  return apiGet(`/v1/community/feed${query}`, communityFeedResponseSchema);
}

export function fetchAthleteCampaigns(
  athleteSlug: string
): Promise<AthleteCampaignsResponse> {
  return apiGet(
    `/v1/athletes/${encodeURIComponent(athleteSlug)}/campaigns`,
    athleteCampaignsResponseSchema
  );
}

// --- Auth ---

export function signUp(body: SignUpRequest): Promise<AuthSession> {
  return apiRequest('/v1/auth/sign-up', authSessionSchema, { method: 'POST', body });
}

export function signIn(body: SignInRequest): Promise<AuthSession> {
  return apiRequest('/v1/auth/sign-in', authSessionSchema, { method: 'POST', body });
}

export function fetchMe(): Promise<User> {
  return apiRequest('/v1/users/me', userSchema, { authed: true });
}

// --- Follows (list-returning toggles; the endpoints return the full list) ---

export function followAthlete(athleteSlug: string): Promise<FollowListResponse> {
  return apiRequest(
    `/v1/athletes/${encodeURIComponent(athleteSlug)}/follow`,
    followListResponseSchema,
    { method: 'POST', authed: true }
  );
}

export function unfollowAthlete(athleteSlug: string): Promise<FollowListResponse> {
  return apiRequest(
    `/v1/athletes/${encodeURIComponent(athleteSlug)}/follow`,
    followListResponseSchema,
    { method: 'DELETE', authed: true }
  );
}

export function fetchMyFollows(): Promise<FollowListResponse> {
  return apiRequest('/v1/users/me/follows', followListResponseSchema, { authed: true });
}

// --- Own athlete profile: create / patch / set-replace / publish / read ---

export function createMyProfile(
  body: CreateAthleteProfileRequest
): Promise<AthleteProfile> {
  return apiRequest('/v1/athletes', athleteProfileSchema, {
    method: 'POST',
    body,
    authed: true,
  });
}

export function patchMyProfile(
  body: UpdateAthleteProfileRequest
): Promise<AthleteProfile> {
  return apiRequest('/v1/athletes/me', athleteProfileSchema, {
    method: 'PATCH',
    body,
    authed: true,
  });
}

export function replaceMyPersonalBests(
  personalBests: ReplacePersonalBestsRequest['personalBests']
): Promise<AthleteProfile> {
  return apiRequest('/v1/athletes/me/personal-bests', athleteProfileSchema, {
    method: 'PUT',
    body: { personalBests },
    authed: true,
  });
}

export function replaceMyHighlights(
  body: SetAthleteHighlightsRequest
): Promise<AthleteProfile> {
  return apiRequest('/v1/athletes/me/highlights', athleteProfileSchema, {
    method: 'PUT',
    body,
    authed: true,
  });
}

export function replaceMyRaces(
  body: SetAthleteRaceResultsRequest
): Promise<AthleteProfile> {
  return apiRequest('/v1/athletes/me/races', athleteProfileSchema, {
    method: 'PUT',
    body,
    authed: true,
  });
}

export function replaceMyRoadmap(
  body: SetAthleteRoadmapRequest
): Promise<AthleteProfile> {
  return apiRequest('/v1/athletes/me/roadmap', athleteProfileSchema, {
    method: 'PUT',
    body,
    authed: true,
  });
}

export function replaceMyGallery(
  body: SetAthleteGalleryRequest
): Promise<AthleteProfile> {
  return apiRequest('/v1/athletes/me/gallery', athleteProfileSchema, {
    method: 'PUT',
    body,
    authed: true,
  });
}

export function publishMyProfile(): Promise<PublishAthleteProfileResponse> {
  return apiRequest('/v1/athletes/me/publish', publishAthleteProfileResponseSchema, {
    method: 'POST',
    authed: true,
  });
}

// Owner-scoped profile: returns the caller's rich profile DTO including
// unpublished drafts; 404 when the user has no profile yet.
export function fetchMyProfile(): Promise<AthleteProfile> {
  return apiRequest('/v1/athletes/me', athleteProfileSchema, { authed: true });
}
