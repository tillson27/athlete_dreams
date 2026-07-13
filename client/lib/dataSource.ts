'use client';

import { useEffect, useState } from 'react';
import { runnerAthletes, type MockAthlete } from './mockAthletes';
import { buildFeed, buildRacingSoon, type FeedItem, type RacingSoon } from './communityFeed';
import { loadApiCommunity, loadApiDirectory, loadApiProfile } from './apiLoaders';
import type { ProfileView } from './dataSourceTypes';

export type { ProfileView } from './dataSourceTypes';

// Data-source seam. Pages consume these hooks and always receive the same
// view-model shapes; the flag decides whether the data comes from the client's
// mock modules (default) or the live API. Mock mode is fully synchronous so its
// render output is byte-identical to before this seam existed. API mode fetches
// client-side (documented limitation: static-params generation always uses mock
// data — see the task context §2 out-of-scope SSR gap).

export type DataSource = 'mock' | 'api';

export const DATA_SOURCE: DataSource =
  process.env.NEXT_PUBLIC_DATA_SOURCE === 'api' ? 'api' : 'mock';

type AsyncState<T> = { data: T; loading: boolean; error: string | null };

function useApiResource<T>(
  enabled: boolean,
  loader: () => Promise<T>,
  fallback: T
): AsyncState<T> {
  const [data, setData] = useState<T>(fallback);
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
    runnerAthletes
  );
  return { athletes: data, loading, error };
}

export function useCommunityData(): {
  feed: FeedItem[];
  racingSoon: RacingSoon[];
  loading: boolean;
  error: string | null;
} {
  const { data, loading, error } = useApiResource(DATA_SOURCE === 'api', loadApiCommunity, {
    feed: buildFeed(),
    racingSoon: buildRacingSoon(),
  });
  return { feed: data.feed, racingSoon: data.racingSoon, loading, error };
}

// The profile page server-renders mock data (static params); this hook swaps in
// API data client-side when the flag is on, preserving the hero image from the
// server-rendered mock athlete (the profile contract omits `heroMediaUrl`).
export function useAthleteProfileData(slug: string, initial: ProfileView): ProfileView {
  const { data } = useApiResource<ProfileView>(
    DATA_SOURCE === 'api',
    () => loadApiProfile(slug, initial.athlete.heroMediaUrl),
    initial
  );
  return data;
}
