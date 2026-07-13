import {
  AthleteLevel,
  AthleteMediaRole,
  AthleteResultKind,
  AthleteStoryChapterIcon,
  AthleteStoryChapterTone,
  CommunityFeedCategory,
  CommunityFeedKind,
  VerificationStatus,
  type AthleteDirectoryItem,
  type AthleteMediaAsset,
  type AthleteProfileDraft,
  type AthleteResult,
  type AthleteRoadmapEvent,
  type AthleteStoryChapter,
  type AthleteTrainingSnapshot,
  type CommunityFeedItem,
  type PublicAthleteProfile,
} from 'fad-common';
import { formatSport } from '@/lib/format';

export type ProfileHighlightView = {
  id: string;
  title: string;
  detail: string;
  date?: string;
  resultsUrl?: string;
  links?: { label: string; href: string }[];
  photos: string[];
};

export type ProfileRaceView = {
  id: string;
  name: string;
  date: string;
  result: string;
  resultsUrl?: string;
  links?: { label: string; href: string }[];
  photos: string[];
};

export type ProfileRoadmapView = {
  id: string;
  name: string;
  date: string;
};

export type ProfileEditableView = {
  highlights: ProfileHighlightView[];
  races: ProfileRaceView[];
  roadmap: ProfileRoadmapView[];
  gallery: { id: string; url: string }[];
};

export type ProfileChapterView = {
  id: string;
  era: string;
  title: string;
  icon: 'medal' | 'heart' | 'history' | 'trophy' | 'flag' | 'timer' | 'book' | 'groups';
  tone: 'primary' | 'secondary' | 'tertiary';
  body: string;
  image?: string;
  current: boolean;
};

export type ProfileView = {
  athleteId: string;
  athleteSlug: string;
  fullName: string;
  firstName: string;
  headline: string;
  primarySport: string;
  hometown: string;
  heroMediaUrl: string;
  profileImageUrl: string;
  handle: string;
  followers: string;
  followerCount: number;
  viewerIsFollowing: boolean | null;
  disciplineLabel: string;
  arcSubtitle: string;
  storyIntro: string;
  storyBody: string[];
  personalBests: { id: string; label: string; value: string }[];
  highlights: ProfileHighlightView[];
  races: ProfileRaceView[];
  roadmapTitle: string;
  roadmap: ProfileRoadmapView[];
  coreValues: { title: string; body: string }[];
  arcChapters: ProfileChapterView[];
  training: {
    weeklyKm: string;
    weeklyTime: string;
    weeklyGain: string;
    weeklyLoad?: string;
    latestTitle: string;
    latestMeta: string;
  };
  powerProfile: PublicAthleteProfile['powerProfile'];
  gallery: { id: string; url: string }[];
  featuredVideo?: { image: string; duration: string };
  supportEnabled: boolean;
  backCtaBlurb?: string;
  recentBackers: {
    name: string;
    when: string;
    amountCents: number;
    initials?: string;
  }[];
  supporterCount: number;
};

export type FeedItemView = {
  id: string;
  targetType: CommunityFeedItem['targetType'];
  targetId: string;
  athleteSlug: string;
  athleteName: string;
  avatar: string;
  discipline: string;
  primarySport: CommunityFeedItem['primarySport'];
  kind: 'result' | 'roadmap' | 'training' | 'profile';
  category: 'race' | 'training' | 'milestone' | 'roadmap';
  headline: string;
  detail: string;
  photo?: string;
  when: string;
  cheers: number;
  cheered: boolean;
  verified: boolean;
};

export type RacingSoonView = {
  athleteSlug: string;
  athleteName: string;
  avatar: string;
  event: string;
  date: string;
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&w=1400&q=70';

export function directoryLevelLabel(level: AthleteDirectoryItem['athleteLevel']): string {
  if (level === AthleteLevel.Elite) return 'Pro & Elite';
  if (level === AthleteLevel.Competitive) return 'Competitive';
  return 'Everyday';
}

export function toProfileView(profile: PublicAthleteProfile): ProfileView {
  const heroMediaUrl = profile.heroMediaUrl ?? profile.profileImageUrl ?? FALLBACK_IMAGE;
  const profileImageUrl = profile.profileImageUrl ?? heroMediaUrl;
  const highlights = profile.results
    .filter((result) => result.resultKind !== AthleteResultKind.Race)
    .map(toHighlightView);
  const races = profile.results
    .filter((result) => result.resultKind === AthleteResultKind.Race)
    .map(toRaceView);
  const gallery = profile.mediaAssets
    .filter((asset) => asset.mediaRole === AthleteMediaRole.Gallery)
    .map((asset) => ({ id: asset.athleteMediaAssetId, url: asset.mediaUrl }));
  const featuredVideo = profile.mediaAssets.find(
    (asset) => asset.mediaRole === AthleteMediaRole.FeaturedVideo
  );

  return {
    athleteId: profile.athleteId,
    athleteSlug: profile.athleteSlug,
    fullName: profile.fullName,
    firstName: profile.fullName.trim().split(/\s+/)[0] || 'This athlete',
    headline: profile.headline ?? profile.tagline ?? '',
    primarySport: profile.primarySport,
    hometown: profile.hometown ?? 'Location coming soon',
    heroMediaUrl,
    profileImageUrl,
    handle: handleForProfile(profile),
    followers: formatCompactCount(profile.followerCount),
    followerCount: profile.followerCount,
    viewerIsFollowing: profile.viewerIsFollowing,
    disciplineLabel: profile.disciplineLabel ?? formatSport(profile.primarySport),
    arcSubtitle:
      profile.arcSubtitle ??
      `The chapters behind ${profile.fullName}'s athlete story, in their own words.`,
    storyIntro: profile.story.intro ?? profile.headline ?? profile.tagline ?? '',
    storyBody: profile.story.body,
    personalBests: profile.personalBests.map((best) => ({
      id: best.athletePersonalBestId,
      label: best.label,
      value: best.value,
    })),
    highlights,
    races,
    roadmapTitle: profile.roadmapTitle ?? '2026 Roadmap',
    roadmap: profile.roadmapEvents.map(toRoadmapView),
    coreValues: profile.coreValues.length
      ? profile.coreValues
      : profile.values.map((value) => ({ title: value, body: '' })),
    arcChapters: profile.storyChapters.map(toChapterView),
    training: toTrainingView(profile.trainingSnapshot),
    powerProfile: profile.powerProfile,
    gallery,
    featuredVideo: featuredVideo
      ? {
          image: featuredVideo.thumbnailUrl ?? featuredVideo.mediaUrl,
          duration: featuredVideo.durationLabel ?? 'Film coming soon',
        }
      : undefined,
    supportEnabled: profile.support.supportEnabled,
    backCtaBlurb: profile.support.backCtaBlurb ?? undefined,
    recentBackers: profile.support.recentBackers.map((backer) => ({
      name: backer.displayName,
      when: formatDisplayDate(backer.backedAt),
      amountCents: backer.amountCents,
      initials: backer.initials ?? undefined,
    })),
    supporterCount: profile.support.supporterCount,
  };
}

export function toEditableView(profile: PublicAthleteProfile | AthleteProfileDraft): ProfileEditableView {
  return {
    highlights: profile.results
      .filter((result) => result.resultKind !== AthleteResultKind.Race)
      .map(toHighlightView),
    races: profile.results
      .filter((result) => result.resultKind === AthleteResultKind.Race)
      .map(toRaceView),
    roadmap: profile.roadmapEvents.map(toRoadmapView),
    gallery: profile.mediaAssets
      .filter((asset) => asset.mediaRole === AthleteMediaRole.Gallery)
      .map((asset) => ({ id: asset.athleteMediaAssetId, url: asset.mediaUrl })),
  };
}

export function toFeedItemView(item: CommunityFeedItem): FeedItemView {
  return {
    id: item.communityFeedItemId,
    targetType: item.targetType,
    targetId: item.targetId,
    athleteSlug: item.athleteSlug,
    athleteName: item.athleteName,
    avatar: item.athleteAvatarUrl ?? FALLBACK_IMAGE,
    discipline: item.disciplineLabel ?? formatSport(item.primarySport),
    primarySport: item.primarySport,
    kind: toFeedKindView(item.feedKind),
    category: toFeedCategoryView(item.feedCategory),
    headline: item.headline,
    detail: item.detail ?? '',
    photo: item.photoUrl ?? undefined,
    when: formatDisplayDate(item.occurredAt),
    cheers: item.cheerCount,
    cheered: Boolean(item.viewerReactionKind),
    verified: item.verificationStatus === VerificationStatus.Verified,
  };
}

export function toRacingSoonView(items: CommunityFeedItem[]): RacingSoonView[] {
  return items
    .filter(
      (item) =>
        item.feedKind === CommunityFeedKind.Roadmap ||
        item.feedCategory === CommunityFeedCategory.Roadmap
    )
    .map((item) => ({
      athleteSlug: item.athleteSlug,
      athleteName: item.athleteName,
      avatar: item.athleteAvatarUrl ?? FALLBACK_IMAGE,
      event: item.headline.replace(/^Is racing\s+/i, ''),
      date: item.detail?.replace(/^Up next\s+.\s+/i, '') ?? formatDisplayDate(item.occurredAt),
    }));
}

function toHighlightView(result: AthleteResult): ProfileHighlightView {
  return {
    id: result.athleteResultId,
    title: result.title,
    detail: result.resultText,
    date: result.eventDateLabel ?? result.eventDate ?? undefined,
    resultsUrl: result.sourceLinks[0]?.href,
    links: result.sourceLinks,
    photos: result.mediaUrls,
  };
}

function toRaceView(result: AthleteResult): ProfileRaceView {
  return {
    id: result.athleteResultId,
    name: result.title,
    date: result.eventDateLabel ?? result.eventDate ?? 'Date TBD',
    result: result.resultText,
    resultsUrl: result.sourceLinks[0]?.href,
    links: result.sourceLinks,
    photos: result.mediaUrls,
  };
}

function toRoadmapView(event: AthleteRoadmapEvent): ProfileRoadmapView {
  return {
    id: event.athleteRoadmapEventId,
    name: event.eventName,
    date: event.eventDateLabel,
  };
}

function toChapterView(chapter: AthleteStoryChapter): ProfileChapterView {
  return {
    id: chapter.athleteStoryChapterId,
    era: chapter.eraLabel,
    title: chapter.title,
    icon: chapterIconToView(chapter.chapterIcon),
    tone: chapterToneToView(chapter.chapterTone),
    body: chapter.body,
    image: chapter.imageUrl ?? undefined,
    current: chapter.isCurrent,
  };
}

function toTrainingView(snapshot: AthleteTrainingSnapshot | null): ProfileView['training'] {
  return {
    weeklyKm: snapshot?.weeklyDistanceLabel ?? 'Not added',
    weeklyTime: snapshot?.weeklyTimeLabel ?? 'Not added',
    weeklyGain: snapshot?.weeklyElevationGainLabel ?? 'Not added',
    weeklyLoad: snapshot?.weeklyLoadLabel ?? undefined,
    latestTitle: snapshot?.latestSessionTitle ?? 'Training update coming soon',
    latestMeta: snapshot?.latestSessionMeta ?? 'No recent session logged yet.',
  };
}

function handleForProfile(profile: PublicAthleteProfile): string {
  if (profile.socialInstagramHandle) {
    return profile.socialInstagramHandle.startsWith('@')
      ? profile.socialInstagramHandle
      : `@${profile.socialInstagramHandle}`;
  }
  return `@${profile.athleteSlug.replaceAll('-', '')}`;
}

function chapterIconToView(
  icon: AthleteStoryChapter['chapterIcon']
): ProfileChapterView['icon'] {
  if (icon === AthleteStoryChapterIcon.Heart) return 'heart';
  if (icon === AthleteStoryChapterIcon.History) return 'history';
  if (icon === AthleteStoryChapterIcon.Trophy) return 'trophy';
  if (icon === AthleteStoryChapterIcon.Flag) return 'flag';
  if (icon === AthleteStoryChapterIcon.Timer) return 'timer';
  if (icon === AthleteStoryChapterIcon.Book) return 'book';
  if (icon === AthleteStoryChapterIcon.Groups) return 'groups';
  return 'medal';
}

function chapterToneToView(
  tone: AthleteStoryChapter['chapterTone']
): ProfileChapterView['tone'] {
  if (tone === AthleteStoryChapterTone.Secondary) return 'secondary';
  if (tone === AthleteStoryChapterTone.Tertiary) return 'tertiary';
  return 'primary';
}

function toFeedKindView(kind: CommunityFeedItem['feedKind']): FeedItemView['kind'] {
  if (kind === CommunityFeedKind.Roadmap) return 'roadmap';
  if (kind === CommunityFeedKind.Training) return 'training';
  if (kind === CommunityFeedKind.Profile) return 'profile';
  return 'result';
}

function toFeedCategoryView(
  category: CommunityFeedItem['feedCategory']
): FeedItemView['category'] {
  if (category === CommunityFeedCategory.Training) return 'training';
  if (category === CommunityFeedCategory.Milestone) return 'milestone';
  if (category === CommunityFeedCategory.Roadmap) return 'roadmap';
  return 'race';
}

function formatCompactCount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  })
    .format(value)
    .toLowerCase();
}

function formatDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getUTCFullYear() === new Date().getUTCFullYear() ? undefined : 'numeric',
  }).format(date);
}
