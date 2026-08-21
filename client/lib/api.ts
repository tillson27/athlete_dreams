import {
  athleteCampaignsResponseSchema,
  athleteDirectoryResponseSchema,
  athleteProfileSchema,
  athleteStripeOnboardingResponseSchema,
  athleteStripeStatusSchema,
  authActionResponseSchema,
  authSessionSchema,
  communityFeedResponseSchema,
  createDonationResponseSchema,
  errorResponseSchema,
  followListResponseSchema,
  adminAddAllowlistEntryRequestSchema,
  adminAllowlistEntrySchema,
  adminAllowlistResponseSchema,
  adminAnalyticsResponseSchema,
  adminAthleteListResponseSchema,
  adminAthletePublishRequestSchema,
  adminCampaignListResponseSchema,
  adminDonationListResponseSchema,
  adminUpdateCampaignStatusRequestSchema,
  adminUpdateUserRolesRequestSchema,
  adminUserDetailSchema,
  adminUserDonationListResponseSchema,
  adminUserListResponseSchema,
  adminUserStripeStatusSchema,
  publishAthleteProfileResponseSchema,
  userSchema,
  type AdminAddAllowlistEntryRequest,
  type AdminAllowlistEntry,
  type AdminAllowlistResponse,
  type AdminAnalyticsResponse,
  type AdminAthleteListQuery,
  type AdminAthleteListResponse,
  type AdminAthletePublishRequest,
  type AdminCampaignListQuery,
  type AdminCampaignListResponse,
  type AdminDonationListQuery,
  type AdminDonationListResponse,
  type AdminUpdateCampaignStatusRequest,
  type AdminUpdateUserRolesRequest,
  type AdminUserDetail,
  type AdminUserDonationListQuery,
  type AdminUserDonationListResponse,
  type AdminUserListQuery,
  type AdminUserListResponse,
  type AdminUserStripeStatus,
  type AthleteCampaignsResponse,
  type AthleteDirectoryQuery,
  type AthleteDirectoryResponse,
  type AthleteProfile,
  type AthleteStripeOnboardingResponse,
  type AthleteStripeStatus,
  type AuthActionResponse,
  type AuthSession,
  type CommunityFeedQuery,
  type CommunityFeedResponse,
  type CreateAthleteProfileRequest,
  type CreateDonationRequest,
  type CreateDonationResponse,
  type FollowListResponse,
  type ForgotPasswordRequest,
  type PublishAthleteProfileResponse,
  type ReplacePersonalBestsRequest,
  type ResendVerificationRequest,
  type ResetPasswordRequest,
  type SetAthleteGalleryRequest,
  type SetAthleteHighlightsRequest,
  type SetAthleteRaceResultsRequest,
  type SetAthleteRoadmapRequest,
  type SignInRequest,
  type SignUpRequest,
  type UpdateAthleteProfileRequest,
  type User,
  type VerifyEmailRequest,
} from 'fad-common';

type SafeParseResult<T> = { success: true; data: T } | { success: false };
type Parser<T> = { safeParse: (data: unknown) => SafeParseResult<T> };

// Typed fetch layer over the Express API (`NEXT_PUBLIC_API_BASE_URL`). Every
// helper unwraps the `{ data }` / `{ error }` envelope and validates the payload
// against its `fad-common` schema, so callers always receive a parsed, typed
// response or a thrown `ApiError`.

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
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
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

export function forgotPassword(body: ForgotPasswordRequest): Promise<AuthActionResponse> {
  return apiRequest('/v1/auth/forgot-password', authActionResponseSchema, {
    method: 'POST',
    body,
  });
}

export function resetPassword(body: ResetPasswordRequest): Promise<AuthActionResponse> {
  return apiRequest('/v1/auth/reset-password', authActionResponseSchema, {
    method: 'POST',
    body,
  });
}

export function verifyEmail(body: VerifyEmailRequest): Promise<AuthActionResponse> {
  return apiRequest('/v1/auth/verify-email', authActionResponseSchema, {
    method: 'POST',
    body,
  });
}

export function resendVerification(
  body: ResendVerificationRequest
): Promise<AuthActionResponse> {
  return apiRequest('/v1/auth/resend-verification', authActionResponseSchema, {
    method: 'POST',
    body,
  });
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

// --- Stripe Connect (athlete onboarding + payout status; api mode only) ---

// Creates/reuses the athlete's Standard connected account and returns a fresh,
// single-use Stripe-hosted onboarding URL to redirect to.
export function startStripeOnboarding(): Promise<AthleteStripeOnboardingResponse> {
  return apiRequest('/v1/athletes/me/stripe/onboarding-link', athleteStripeOnboardingResponseSchema, {
    method: 'POST',
    authed: true,
  });
}

export function fetchStripeStatus(): Promise<AthleteStripeStatus> {
  return apiRequest('/v1/athletes/me/stripe/status', athleteStripeStatusSchema, { authed: true });
}

// --- Donations (guest or signed-in; returns a Stripe-hosted checkout URL) ---

// authed: true so a signed-in supporter is attributed (supporterUserId); the
// request only attaches the bearer if a token exists, so guests donate fine.
export function createDonation(body: CreateDonationRequest): Promise<CreateDonationResponse> {
  return apiRequest('/v1/donations', createDonationResponseSchema, {
    method: 'POST',
    body,
    authed: true,
  });
}

export function fetchAdminUsers(
  params: Partial<AdminUserListQuery> = {}
): Promise<AdminUserListResponse> {
  const query = toQueryString({
    search: params.search,
    role: params.role,
    limit: params.limit,
    cursor: params.cursor,
  });
  return apiRequest(`/v1/admin/users${query}`, adminUserListResponseSchema, { authed: true });
}

export function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  return apiRequest(
    `/v1/admin/users/${encodeURIComponent(userId)}`,
    adminUserDetailSchema,
    { authed: true }
  );
}

export function updateAdminUserRoles(
  userId: string,
  body: AdminUpdateUserRolesRequest
): Promise<AdminUserDetail> {
  return apiRequest(
    `/v1/admin/users/${encodeURIComponent(userId)}/roles`,
    adminUserDetailSchema,
    { method: 'PATCH', body: adminUpdateUserRolesRequestSchema.parse(body), authed: true }
  );
}

export function deleteAdminUser(userId: string): Promise<AuthActionResponse> {
  return apiRequest(
    `/v1/admin/users/${encodeURIComponent(userId)}`,
    authActionResponseSchema,
    { method: 'DELETE', authed: true }
  );
}

export function resendAdminUserVerification(userId: string): Promise<AuthActionResponse> {
  return apiRequest(
    `/v1/admin/users/${encodeURIComponent(userId)}/resend-verification`,
    authActionResponseSchema,
    { method: 'POST', authed: true }
  );
}

export function markAdminUserEmailVerified(userId: string): Promise<AdminUserDetail> {
  return apiRequest(
    `/v1/admin/users/${encodeURIComponent(userId)}/mark-verified`,
    adminUserDetailSchema,
    { method: 'POST', authed: true }
  );
}

export function sendAdminUserPasswordReset(userId: string): Promise<AuthActionResponse> {
  return apiRequest(
    `/v1/admin/users/${encodeURIComponent(userId)}/send-password-reset`,
    authActionResponseSchema,
    { method: 'POST', authed: true }
  );
}

export function addAdminUserToAllowlist(userId: string): Promise<AdminUserDetail> {
  return apiRequest(
    `/v1/admin/users/${encodeURIComponent(userId)}/allowlist`,
    adminUserDetailSchema,
    { method: 'POST', authed: true }
  );
}

export function fetchAdminUserStripeStatus(userId: string): Promise<AdminUserStripeStatus> {
  return apiRequest(
    `/v1/admin/users/${encodeURIComponent(userId)}/stripe`,
    adminUserStripeStatusSchema,
    { authed: true }
  );
}

export function fetchAdminUserDonations(
  userId: string,
  params: Partial<AdminUserDonationListQuery> = {}
): Promise<AdminUserDonationListResponse> {
  const query = toQueryString({ limit: params.limit, cursor: params.cursor });
  return apiRequest(
    `/v1/admin/users/${encodeURIComponent(userId)}/donations${query}`,
    adminUserDonationListResponseSchema,
    { authed: true }
  );
}

export function fetchAdminAthletes(
  params: Partial<AdminAthleteListQuery> = {}
): Promise<AdminAthleteListResponse> {
  const query = toQueryString({
    published: params.published,
    sport: params.sport,
    limit: params.limit,
    cursor: params.cursor,
  });
  return apiRequest(`/v1/admin/athletes${query}`, adminAthleteListResponseSchema, {
    authed: true,
  });
}

export function adminPublishAthlete(
  athleteId: string,
  body: AdminAthletePublishRequest
): Promise<AuthActionResponse> {
  return apiRequest(
    `/v1/admin/athletes/${encodeURIComponent(athleteId)}/publish`,
    authActionResponseSchema,
    { method: 'POST', body: adminAthletePublishRequestSchema.parse(body), authed: true }
  );
}

export function fetchAdminCampaigns(
  params: Partial<AdminCampaignListQuery> = {}
): Promise<AdminCampaignListResponse> {
  const query = toQueryString({
    status: params.status,
    athleteId: params.athleteId,
    limit: params.limit,
    cursor: params.cursor,
  });
  return apiRequest(`/v1/admin/campaigns${query}`, adminCampaignListResponseSchema, {
    authed: true,
  });
}

export function adminUpdateCampaignStatus(
  campaignId: string,
  body: AdminUpdateCampaignStatusRequest
): Promise<AuthActionResponse> {
  return apiRequest(
    `/v1/admin/campaigns/${encodeURIComponent(campaignId)}/status`,
    authActionResponseSchema,
    { method: 'PATCH', body: adminUpdateCampaignStatusRequestSchema.parse(body), authed: true }
  );
}

export function fetchAdminDonations(
  params: Partial<AdminDonationListQuery> = {}
): Promise<AdminDonationListResponse> {
  const query = toQueryString({
    status: params.status,
    athleteId: params.athleteId,
    limit: params.limit,
    cursor: params.cursor,
  });
  return apiRequest(`/v1/admin/donations${query}`, adminDonationListResponseSchema, {
    authed: true,
  });
}

export function fetchAdminAnalytics(): Promise<AdminAnalyticsResponse> {
  return apiRequest('/v1/admin/analytics', adminAnalyticsResponseSchema, { authed: true });
}

export function fetchAdminAllowlist(): Promise<AdminAllowlistResponse> {
  return apiRequest('/v1/admin/allowlist', adminAllowlistResponseSchema, { authed: true });
}

export function addAdminAllowlistEntry(
  body: AdminAddAllowlistEntryRequest
): Promise<AdminAllowlistEntry> {
  return apiRequest('/v1/admin/allowlist', adminAllowlistEntrySchema, {
    method: 'POST',
    body: adminAddAllowlistEntryRequestSchema.parse(body),
    authed: true,
  });
}

export function deleteAdminAllowlistEntry(entryId: string): Promise<AuthActionResponse> {
  return apiRequest(
    `/v1/admin/allowlist/${encodeURIComponent(entryId)}`,
    authActionResponseSchema,
    { method: 'DELETE', authed: true }
  );
}
