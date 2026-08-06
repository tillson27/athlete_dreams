'use client';

import { useEffect, useState } from 'react';
import { runnerAthletes, type MockAthlete } from './mockAthletes';
import { buildFeed, buildRacingSoon, type FeedItem, type RacingSoon } from './communityFeed';
import { loadApiCommunity, loadApiDirectory, loadApiProfile } from './apiLoaders';
import { loadEdits, subscribeToEdits } from './athleteEdits';
import {
  loadPublishedOnboardingAthlete,
  subscribeToPublishedOnboardingAthlete,
} from './onboardingProfileView';
import type { ProfileView } from './dataSourceTypes';

export type { ProfileView } from './dataSourceTypes';

// Data-source seam. Pages consume these hooks and always receive the same
// view-model shapes; the flag decides whether the data comes from the client's
// mock modules or the live API. API is the local-dev default; static previews
// set mock explicitly so their render output keeps the prototype fixtures.

export type DataSource = 'mock' | 'api';

export const DATA_SOURCE: DataSource =
  process.env.NEXT_PUBLIC_DATA_SOURCE === 'mock' ? 'mock' : 'api';

type AsyncState<T> = { data: T | null; loading: boolean; error: string | null };

function useApiResource<T>(
  enabled: boolean,
  loader: () => Promise<T>,
  fallback: T | null
): AsyncState<T> {
  const [data, setData] = useState<T | null>(fallback);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);
    setError(null);
    loader()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Failed to load data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { data, loading, error };
}

export function useDirectoryAthletes(): {
  athletes: MockAthlete[];
  loading: boolean;
  error: string | null;
} {
  const { data, loading, error } = useApiResource<MockAthlete[]>(
    DATA_SOURCE === 'api',
    loadApiDirectory,
    DATA_SOURCE === 'mock' ? runnerAthletes : null
  );
  const [localAthlete, setLocalAthlete] = useState<MockAthlete | null>(null);

  useEffect(() => {
    if (DATA_SOURCE !== 'mock') return;
    let unsubscribeEdits: (() => void) | null = null;
    const sync = () => {
      const athlete = loadPublishedOnboardingAthlete();
      unsubscribeEdits?.();
      unsubscribeEdits = athlete
        ? subscribeToEdits(athlete.athleteSlug, sync)
        : null;
      const edits = athlete ? loadEdits(athlete.athleteSlug) : null;
      setLocalAthlete(
        athlete && edits?.coverPhoto ? { ...athlete, heroMediaUrl: edits.coverPhoto } : athlete
      );
    };
    sync();
    const unsubscribeProfile = subscribeToPublishedOnboardingAthlete(sync);
    return () => {
      unsubscribeProfile();
      unsubscribeEdits?.();
    };
  }, []);

  return {
    athletes: localAthlete ? prependUniqueAthlete(data ?? [], localAthlete) : data ?? [],
    loading,
    error,
  };
}

function prependUniqueAthlete(athletes: MockAthlete[], localAthlete: MockAthlete): MockAthlete[] {
  return [
    localAthlete,
    ...athletes.filter((athlete) => athlete.athleteSlug !== localAthlete.athleteSlug),
  ];
}

export function useCommunityData(): {
  feed: FeedItem[];
  racingSoon: RacingSoon[];
  loading: boolean;
  error: string | null;
} {
  const { data, loading, error } = useApiResource(DATA_SOURCE === 'api', loadApiCommunity, {
    feed: DATA_SOURCE === 'mock' ? buildFeed() : [],
    racingSoon: DATA_SOURCE === 'mock' ? buildRacingSoon() : [],
  });
  return { feed: data?.feed ?? [], racingSoon: data?.racingSoon ?? [], loading, error };
}

// The profile page server-renders mock data (static params); this hook swaps in
// API data client-side when the flag is on, using the server-rendered hero only
// until the persisted profile cover is available.
export function useAthleteProfileData(
  slug: string,
  initial: ProfileView
): AsyncState<ProfileView> {
  const result = useApiResource<ProfileView>(
    DATA_SOURCE === 'api' && slug.length > 0,
    () => loadApiProfile(slug, initial.athlete.heroMediaUrl),
    DATA_SOURCE === 'mock' ? initial : null
  );
  return result;
}
