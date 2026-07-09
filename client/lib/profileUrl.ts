// Single source for the public profile address so domain changes touch one file.
export const PROFILE_HOST = 'athletearc.ca';

export function profileUrl(athleteSlug: string): string {
  return `${PROFILE_HOST}/athletes/${athleteSlug}`;
}
