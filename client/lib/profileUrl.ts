// Single source for the public profile address so domain changes touch one file.
export const PROFILE_HOST = 'athletearc.ca';

type AthleteRoutePreference = 'auto' | 'static' | 'runtime';
type SearchParamsReader = Pick<URLSearchParams, 'get'>;

export type AthleteRoute = { kind: 'profile' | 'manage'; athleteSlug: string };

function shouldUseRuntimeAthleteRoute(routePreference: AthleteRoutePreference): boolean {
  if (routePreference === 'runtime') return true;
  if (routePreference === 'static') return false;
  // 'auto': the static export only pre-renders mock athlete pages; real athlete
  // slugs must go through query-param routing on the /athletes page.
  return process.env.NEXT_PUBLIC_DATA_SOURCE !== 'mock';
}

export function staticAthleteProfileHref(athleteSlug: string): string {
  return `/athletes/${encodeURIComponent(athleteSlug)}`;
}

export function staticAthleteManageHref(athleteSlug: string): string {
  return `${staticAthleteProfileHref(athleteSlug)}/manage`;
}

export function runtimeAthleteProfileHref(athleteSlug: string): string {
  return `/athletes?profile=${encodeURIComponent(athleteSlug)}`;
}

export function runtimeAthleteManageHref(athleteSlug: string): string {
  return `/athletes?manage=${encodeURIComponent(athleteSlug)}`;
}

export function athleteProfileHref(
  athleteSlug: string,
  routePreference: AthleteRoutePreference = 'auto'
): string {
  return shouldUseRuntimeAthleteRoute(routePreference)
    ? runtimeAthleteProfileHref(athleteSlug)
    : staticAthleteProfileHref(athleteSlug);
}

export function athleteManageHref(
  athleteSlug: string,
  routePreference: AthleteRoutePreference = 'auto'
): string {
  return shouldUseRuntimeAthleteRoute(routePreference)
    ? runtimeAthleteManageHref(athleteSlug)
    : staticAthleteManageHref(athleteSlug);
}

export function profileUrl(
  athleteSlug: string,
  routePreference: AthleteRoutePreference = 'auto'
): string {
  return `${PROFILE_HOST}${athleteProfileHref(athleteSlug, routePreference)}`;
}

export function athleteRouteFromPath(
  pathname: string | null,
  searchParams?: SearchParamsReader | null
): AthleteRoute | null {
  const manageParam = searchParams?.get('manage');
  if (manageParam) return { kind: 'manage', athleteSlug: manageParam };

  const profileParam = searchParams?.get('profile');
  if (profileParam) return { kind: 'profile', athleteSlug: profileParam };

  const match = pathname?.match(/^\/athletes\/([^/]+)(?:\/(manage))?\/?$/);
  if (!match) return null;
  return {
    kind: match[2] === 'manage' ? 'manage' : 'profile',
    athleteSlug: decodeURIComponent(match[1]),
  };
}
