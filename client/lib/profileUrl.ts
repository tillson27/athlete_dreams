// Single source for the public profile address so domain changes touch one file.
export const PROFILE_HOST = 'athletearc.ca';

type SearchParamsReader = Pick<URLSearchParams, 'get'>;

export type AthleteRoute = { kind: 'profile' | 'manage'; athleteSlug: string };

// The path form is the only form the application generates. A hard load resolves
// through the CloudFront `/athletes/<slug>` rewrite (`cdk/lib/web-stack.ts`), and
// an in-app navigation to a slug the export never pre-rendered resolves through
// `AthleteRouteFallback`.
export function athleteProfileHref(athleteSlug: string): string {
  return `/athletes/${encodeURIComponent(athleteSlug)}`;
}

export function athleteManageHref(athleteSlug: string): string {
  return `${athleteProfileHref(athleteSlug)}/manage`;
}

export function profileUrl(athleteSlug: string): string {
  return `${PROFILE_HOST}${athleteProfileHref(athleteSlug)}`;
}

// [STRICT] Keep reading `?profile=` and `?manage=` forever. The application stops
// generating them, but links in that form are already posted publicly (the
// athlete's Instagram card carries one); dropping the read breaks them for good.
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
