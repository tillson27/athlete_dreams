import {
  athleteCampaignsResponseSchema,
  athleteDirectoryResponseSchema,
  athleteProfileSchema,
  communityFeedResponseSchema,
  errorResponseSchema,
  type AthleteCampaignsResponse,
  type AthleteDirectoryQuery,
  type AthleteDirectoryResponse,
  type AthleteProfile,
  type CommunityFeedQuery,
  type CommunityFeedResponse,
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
export class ApiError extends Error {
  readonly code: string;
  readonly status: number | null;

  constructor(message: string, code: string, status: number | null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
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

async function apiGet<T>(path: string, schema: Parser<T>): Promise<T> {
  const url = `${resolveBaseUrl()}${path}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { accept: 'application/json' } });
  } catch {
    throw new ApiError(`Request to ${path} failed to reach the API.`, 'network_error', null);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      `Response from ${path} was not valid JSON.`,
      'invalid_response',
      response.status
    );
  }

  if (!response.ok) {
    const parsedError = errorResponseSchema.safeParse(body);
    if (parsedError.success) {
      throw new ApiError(
        parsedError.data.error.message,
        parsedError.data.error.code,
        response.status
      );
    }
    throw new ApiError(`Request to ${path} failed.`, 'http_error', response.status);
  }

  if (typeof body !== 'object' || body === null || !('data' in body)) {
    throw new ApiError(
      `Response from ${path} was missing the data envelope.`,
      'invalid_response',
      response.status
    );
  }

  const parsed = schema.safeParse((body as { data: unknown }).data);
  if (!parsed.success) {
    throw new ApiError(
      `Response from ${path} did not match the expected schema.`,
      'invalid_response',
      response.status
    );
  }
  return parsed.data;
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
