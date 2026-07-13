import { errorResponseSchema, type ErrorResponse } from 'fad-common';

type QueryValue = string | number | boolean | null | undefined;

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  accessToken?: string | null;
  body?: unknown;
  query?: Record<string, QueryValue>;
  schema?: { parse: (value: unknown) => unknown };
};

const DEFAULT_API_BASE_URL = 'http://localhost:4000';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, response: ErrorResponse) {
    super(response.error.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = response.error.code;
    this.details = response.error.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { accessToken, body, query, schema, headers, ...requestInit } = options;
  const response = await fetch(buildApiUrl(path, query), {
    ...requestInit,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: requestInit.cache ?? 'no-store',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const json = await response.json().catch(() => undefined);
  if (!response.ok) {
    const parsedError = errorResponseSchema.safeParse(json);
    if (parsedError.success) throw new ApiError(response.status, parsedError.data);
    throw new Error(`API request failed with status ${response.status}`);
  }

  const payload = isDataEnvelope(json) ? json.data : json;
  return (schema ? schema.parse(payload) : payload) as T;
}

function buildApiUrl(path: string, query?: Record<string, QueryValue>): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const url = new URL(path.startsWith('/') ? path : `/${path}`, baseUrl);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function isDataEnvelope(value: unknown): value is { data: unknown } {
  return typeof value === 'object' && value !== null && 'data' in value;
}
