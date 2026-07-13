import type { AthleteDirectoryItem } from 'fad-common';
import type { MockAthlete } from './mockAthletes';
import type { FeedItem, RacingSoon } from './communityFeed';
import { unsplashPhoto } from './unsplash';
import {
  directoryItemToMockAthlete,
  feedItemToRacingSoon,
  feedItemToView,
  isRunnerSport,
  profileToMockAthlete,
  profileToRichProfile,
} from './adapters';
import { fetchAthleteDirectory, fetchAthleteProfile, fetchCommunityFeed } from './api';
import type { ProfileView } from './dataSourceTypes';

// Pure, framework-free loaders that compose the typed API helpers with the
// adapters into the view-model arrays the pages consume. Kept out of the
// `'use client'` hook module so they stay directly unit-verifiable against a
// running API. Directory and community are filtered to the runner sports so API
// mode matches mock mode's runners-only surfaces.

export async function loadApiDirectory(): Promise<MockAthlete[]> {
  const response = await fetchAthleteDirectory({ limit: 100 });
  return response.items
    .filter((item) => isRunnerSport(item.primarySport))
    .map(directoryItemToMockAthlete);
}

function buildAvatarMap(directory: AthleteDirectoryItem[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of directory) {
    if (item.heroMediaUrl) {
      map.set(item.athleteSlug, unsplashPhoto(item.heroMediaUrl, 200));
    }
  }
  return map;
}

export async function loadApiCommunity(): Promise<{ feed: FeedItem[]; racingSoon: RacingSoon[] }> {
  const [directory, feed] = await Promise.all([
    fetchAthleteDirectory({ limit: 100 }),
    fetchCommunityFeed({ limit: 100 }),
  ]);
  const runnerDirectory = directory.items.filter((item) => isRunnerSport(item.primarySport));
  const avatarBySlug = buildAvatarMap(runnerDirectory);

  // Keep only feed items whose athlete is in the runners-only directory: this
  // guarantees every card has an avatar and matches mock mode's runners-only feed.
  const runnerFeed = feed.items.filter((item) => avatarBySlug.has(item.athleteSlug));

  const feedItems = runnerFeed.map((item, index) => feedItemToView(item, index, avatarBySlug));
  const racingSoon = runnerFeed
    .filter((item) => item.kind === 'roadmap' && item.category === 'race')
    .map((item) => feedItemToRacingSoon(item, avatarBySlug));

  return { feed: feedItems, racingSoon };
}

export async function loadApiProfile(
  slug: string,
  heroMediaUrlFallback: string
): Promise<ProfileView> {
  const profile = await fetchAthleteProfile(slug);
  return {
    athlete: profileToMockAthlete(profile, heroMediaUrlFallback),
    profile: profileToRichProfile(profile),
  };
}
