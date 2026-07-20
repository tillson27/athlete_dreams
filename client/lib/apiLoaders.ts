import type { AthleteDirectoryItem, CommunityFeedItem } from 'fad-common';
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
import {
  fetchAthleteCampaigns,
  fetchAthleteDirectory,
  fetchAthleteProfile,
  fetchCommunityFeed,
} from './api';
import type { ProfileView } from './dataSourceTypes';

// Pure, framework-free loaders that compose the typed API helpers with the
// adapters into the view-model arrays the pages consume. Kept out of the
// `'use client'` hook module so they stay directly unit-verifiable against a
// running API. Directory and community are filtered to the runner sports so API
// mode matches mock mode's runners-only surfaces.

const PAGE_LIMIT = 100;
const MAX_DIRECTORY_PAGES = 20;
const MAX_FEED_PAGES = 20;

export async function loadApiDirectory(): Promise<MockAthlete[]> {
  const directory = await loadAllDirectoryItems();
  return directory
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
    loadAllDirectoryItems(),
    loadAllFeedItems(),
  ]);
  const runnerDirectory = directory.filter((item) => isRunnerSport(item.primarySport));
  const avatarBySlug = buildAvatarMap(runnerDirectory);

  // Keep only feed items whose athlete is in the runners-only directory: this
  // guarantees every card has an avatar and matches mock mode's runners-only feed.
  const runnerFeed = feed.filter((item) => avatarBySlug.has(item.athleteSlug));

  const feedItems = runnerFeed.map((item, index) => feedItemToView(item, index, avatarBySlug));
  const racingSoon = runnerFeed
    .filter((item) => item.kind === 'roadmap' && item.category === 'race')
    .map((item) => feedItemToRacingSoon(item, avatarBySlug));

  return { feed: feedItems, racingSoon };
}

async function loadAllDirectoryItems(): Promise<AthleteDirectoryItem[]> {
  const items: AthleteDirectoryItem[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_DIRECTORY_PAGES; page += 1) {
    const response = await fetchAthleteDirectory({ limit: PAGE_LIMIT, cursor });
    items.push(...response.items);
    if (!response.nextCursor) break;
    cursor = response.nextCursor;
  }
  return items;
}

async function loadAllFeedItems(): Promise<CommunityFeedItem[]> {
  const items: CommunityFeedItem[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_FEED_PAGES; page += 1) {
    const response = await fetchCommunityFeed({ limit: PAGE_LIMIT, cursor });
    items.push(...response.items);
    if (!response.nextCursor) break;
    cursor = response.nextCursor;
  }
  return items;
}

export async function loadApiProfile(
  slug: string,
  heroMediaUrlFallback: string
): Promise<ProfileView> {
  // Campaigns power the donate target; a campaigns failure must not break the
  // profile render, so it degrades to no campaigns (donate widget stays hidden).
  const [profile, campaigns] = await Promise.all([
    fetchAthleteProfile(slug),
    fetchAthleteCampaigns(slug).catch(() => []),
  ]);
  return {
    athlete: profileToMockAthlete(profile, heroMediaUrlFallback, campaigns),
    profile: profileToRichProfile(profile),
  };
}
