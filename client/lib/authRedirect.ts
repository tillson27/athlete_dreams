const DEFAULT_AUTH_DESTINATION = '/dashboard';

export function authHref(path: '/sign-in' | '/sign-up', next: string): string {
  return `${path}?next=${encodeURIComponent(safeAuthDestination(next, '/register/personal-basics'))}`;
}

export function safeAuthDestination(
  rawValue: string | null | undefined,
  fallback: string = DEFAULT_AUTH_DESTINATION
): string {
  if (!rawValue || !rawValue.startsWith('/') || rawValue.startsWith('//')) {
    return fallback;
  }
  return rawValue;
}
