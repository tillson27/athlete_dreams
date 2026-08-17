'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MockAthlete } from '@/lib/mockAthletes';
import type { RichAthleteProfile } from '@/lib/athleteProfiles';
import { DATA_SOURCE, useAthleteProfileData } from '@/lib/dataSource';
import type { ProfileView } from '@/lib/dataSourceTypes';
import { loadEdits, subscribeToEdits } from '@/lib/athleteEdits';
import { loadOnboardingProfileView, subscribeToOnboardingProfile } from '@/lib/onboardingProfileView';
import { nameFromSlug } from '@/lib/slugify';
import { AthleteProfile } from './AthleteProfile';
import { Icon } from '@/components/ui/Icon';

// Client boundary for the athlete profile. The page always server-renders mock
// data (static-params generation is mock-only); when `NEXT_PUBLIC_DATA_SOURCE=api`
// this swaps in live API data client-side. Mock mode returns the initial props
// unchanged, so the server-rendered markup is preserved (no hydration churn).
export function AthleteProfileHydrator({
  athleteSlug,
  athlete,
  profile,
}: {
  athleteSlug?: string;
  athlete?: MockAthlete;
  profile?: RichAthleteProfile;
}) {
  const slug = athlete?.athleteSlug ?? profile?.athleteSlug ?? athleteSlug;
  const safeSlug = slug ?? '';
  const initial = athlete && profile ? { athlete, profile } : buildFallbackProfile(safeSlug);
  const { data, loading, error } = useAthleteProfileData(safeSlug, initial);
  const [mockDraftView, setMockDraftView] = useState<ProfileView | null>(null);
  const [mockCoverPhoto, setMockCoverPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (DATA_SOURCE !== 'mock' || !safeSlug) {
      setMockDraftView(null);
      setMockCoverPhoto(null);
      return;
    }
    const sync = () => {
      const edits = loadEdits(safeSlug);
      const coverPhoto = edits?.coverPhoto ?? null;
      setMockCoverPhoto(coverPhoto);
      setMockDraftView(athlete && profile ? null : loadOnboardingProfileView(safeSlug, coverPhoto ?? undefined));
    };
    sync();
    const unsubscribeOnboarding = subscribeToOnboardingProfile(sync);
    const unsubscribeEdits = subscribeToEdits(safeSlug, sync);
    return () => {
      unsubscribeOnboarding();
      unsubscribeEdits();
    };
  }, [safeSlug, athlete, profile]);
  const view =
    mockDraftView ??
    (mockCoverPhoto && DATA_SOURCE === 'mock' && data
      ? { ...data, athlete: { ...data.athlete, heroMediaUrl: mockCoverPhoto } }
      : data);

  if (!slug) return <ProfileUnavailable />;
  if (DATA_SOURCE === 'api' && loading) {
    return <ProfileLoading athleteName={initial.athlete.fullName} />;
  }
  if (DATA_SOURCE === 'api' && error) {
    return <ProfileUnavailable />;
  }
  if (!view) return <ProfileLoading athleteName={initial.athlete.fullName} />;

  return <AthleteProfile athlete={view.athlete} profile={view.profile} />;
}

function buildFallbackProfile(athleteSlug: string): {
  athlete: MockAthlete;
  profile: RichAthleteProfile;
} {
  const athleteName = athleteSlug ? nameFromSlug(athleteSlug) : 'Athlete';
  return {
    athlete: {
      athleteSlug,
      fullName: athleteName,
      headline: 'Athlete profile',
      bio: '',
      primarySport: 'RUNNING',
      runnerLevel: 'EVERYDAY',
      hometown: '',
      countryCode: 'CA',
      heroMediaUrl: '',
      values: [],
      activeCampaignCount: 0,
      totalRaisedCents: 0,
      campaigns: [],
      accomplishments: [],
    },
    profile: {
      athleteSlug,
      handle: '',
      followers: '',
      disciplineLabel: 'Running',
      arcSubtitle: '',
      storyIntro: '',
      storyBody: [],
      personalBests: [],
      careerHighlights: [],
      moreResults: [],
      moreResultsLabel: 'See more results',
      previousRaces: [],
      morePreviousRaces: [],
      moreRacesLabel: 'See more races',
      roadmapTitle: 'Roadmap',
      roadmap: [],
      coreValues: [],
      arcChapters: [],
      instagramPosts: [],
      training: {
        weeklyKm: '',
        weeklyTime: '',
        weeklyGain: '',
        latestTitle: '',
        latestMeta: '',
      },
      galleryPhotos: [],
      supportEnabled: false,
    },
  };
}

function ProfileLoading({ athleteName }: { athleteName: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-12 text-center sm:py-16">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6 sm:p-8">
        <Icon name="sync" className="mx-auto h-8 w-8 animate-spin text-primary" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-on-surface">
          Loading {athleteName}
        </h1>
      </div>
    </div>
  );
}

function ProfileUnavailable() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-12 text-center sm:py-16">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6 sm:p-8">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
          <Icon name="person" className="h-7 w-7" />
        </span>
        <h1 className="font-display text-2xl font-extrabold text-on-surface">Profile not found</h1>
        <Link
          href="/athletes"
          className="label-bold mt-6 inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-5 text-on-primary"
        >
          Back to athletes
        </Link>
      </div>
    </div>
  );
}
