'use client';

import type { MockAthlete } from '@/lib/mockAthletes';
import type { RichAthleteProfile } from '@/lib/athleteProfiles';
import { useAthleteProfileData } from '@/lib/dataSource';
import { AthleteProfile } from './AthleteProfile';

// Client boundary for the athlete profile. The page always server-renders mock
// data (static-params generation is mock-only); when `NEXT_PUBLIC_DATA_SOURCE=api`
// this swaps in live API data client-side. Mock mode returns the initial props
// unchanged, so the server-rendered markup is preserved (no hydration churn).
export function AthleteProfileHydrator({
  athlete,
  profile,
}: {
  athlete: MockAthlete;
  profile: RichAthleteProfile;
}) {
  const view = useAthleteProfileData(athlete.athleteSlug, { athlete, profile });
  return <AthleteProfile athlete={view.athlete} profile={view.profile} />;
}
