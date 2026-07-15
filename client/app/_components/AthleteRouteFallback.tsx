'use client';

import { useMemo, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { findAthleteProfile } from '@/lib/athleteProfiles';
import { athleteRouteFromPath } from '@/lib/profileUrl';
import { nameFromSlug } from '@/lib/slugify';
import { unsplashPhoto } from '@/lib/unsplash';
import { findMockAthlete } from '@/lib/mockAthletes';
import { AthleteProfileHydrator } from '@/app/(marketing)/athletes/[athleteSlug]/AthleteProfileHydrator';
import { ManageProfile } from '@/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile';

const FALLBACK_COVER = unsplashPhoto('1594882645126-14020914d58d', 1400);

export function AthleteRouteFallback({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const athleteRoute = useMemo(
    () => athleteRouteFromPath(pathname),
    [pathname]
  );

  if (!athleteRoute) return <>{children}</>;

  const athlete = findMockAthlete(athleteRoute.athleteSlug);
  if (athleteRoute.kind === 'manage') {
    return (
      <ManageProfile
        athleteSlug={athleteRoute.athleteSlug}
        athleteName={athlete?.fullName ?? nameFromSlug(athleteRoute.athleteSlug)}
        initialCoverPhoto={athlete?.heroMediaUrl ?? FALLBACK_COVER}
      />
    );
  }

  const profile = findAthleteProfile(athleteRoute.athleteSlug);
  return (
    <AthleteProfileHydrator
      athleteSlug={athleteRoute.athleteSlug}
      athlete={athlete}
      profile={profile}
    />
  );
}
