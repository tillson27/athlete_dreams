import type {
  AthleteProfile as LegacyAthleteProfileDto,
  AthleteProfileCompletion,
  AthleteProfileDraft,
  AthleteSupportSummary,
  PublicAthleteProfile,
} from 'fad-common';
import {
  AthleteProfileStatus,
  type AthleteProfile,
  type AthleteEvent,
  type AthleteEventSourceLink,
  type AthleteMedia,
  type AthletePersonalBest,
  type AthleteResult,
  type AthleteResultSourceLink,
  type AthleteStoryChapter,
  type AthleteTrainingSnapshot,
} from '@prisma/client';
import type { AthleteProfileRead } from '../../repositories/AthleteRepository';

export type AthleteSupportRead = Pick<
  AthleteSupportSummary,
  'supporterCount' | 'activeCampaigns' | 'recentBackers'
>;

const publishRequiredFieldKeys = [
  'athleteSlug',
  'fullName',
  'primarySport',
  'headline',
  'story',
] as const;

export function toLegacyAthleteProfileDto(
  athlete: AthleteProfile & {
    athleteSlug: string;
    fullName: string;
    primarySport: NonNullable<AthleteProfile['primarySport']>;
  }
): LegacyAthleteProfileDto {
  return {
    athleteId: athlete.id,
    userId: athlete.userId,
    athleteSlug: athlete.athleteSlug,
    fullName: athlete.fullName,
    headline: athlete.headline,
    bio: athlete.bio,
    primarySport: athlete.primarySport,
    secondarySports: athlete.secondarySports,
    hometown: athlete.hometown,
    countryCode: athlete.countryCode,
    values: athlete.values,
    socialInstagramHandle: athlete.socialInstagramHandle,
    socialTwitterHandle: athlete.socialTwitterHandle,
    socialStravaUrl: athlete.socialStravaUrl,
    accomplishments: [],
    media: [],
    createdAt: athlete.createdAt.toISOString(),
    updatedAt: athlete.updatedAt.toISOString(),
  };
}

export function canMapPublicAthleteProfile(profile: AthleteProfileRead): boolean {
  return Boolean(
    profile.profileStatus === AthleteProfileStatus.PUBLISHED &&
      profile.publishedAt &&
      profile.athleteSlug &&
      profile.fullName &&
      profile.primarySport
  );
}

export function toPublicAthleteProfile(
  profile: AthleteProfileRead,
  viewerIsFollowing: boolean | null,
  supportRead?: AthleteSupportRead
): PublicAthleteProfile {
  if (!profile.athleteSlug || !profile.fullName || !profile.primarySport || !profile.publishedAt) {
    throw new Error('Cannot map incomplete public athlete profile');
  }

  return {
    athleteId: profile.id,
    userId: profile.userId,
    athleteSlug: profile.athleteSlug,
    fullName: profile.fullName,
    profileStatus: profile.profileStatus,
    publishedAt: profile.publishedAt.toISOString(),
    profileVersion: profile.profileVersion,
    headline: profile.headline,
    tagline: profile.tagline,
    primarySport: profile.primarySport,
    secondarySports: profile.secondarySports,
    athleteLevel: profile.athleteLevel,
    disciplineLabel: profile.disciplineLabel,
    hometown: profile.hometown,
    countryCode: profile.countryCode,
    heroMediaUrl: profile.heroMediaUrl,
    profileImageUrl: profile.profileImageUrl,
    socialInstagramHandle: profile.socialInstagramHandle,
    socialTwitterHandle: profile.socialTwitterHandle,
    socialStravaUrl: profile.socialStravaUrl,
    values: profile.values,
    coreValues: profile.coreValues.map((value) => ({
      title: value.title,
      body: value.body,
    })),
    story: toStoryDto(profile),
    arcSubtitle: profile.arcSubtitle,
    storyChapters: profile.storyChapters.map(toStoryChapterDto),
    personalBests: profile.personalBests.map(toPersonalBestDto),
    results: profile.results.map(toResultDto),
    roadmapTitle: profile.roadmapTitle,
    roadmapEvents: profile.events.map(toRoadmapEventDto),
    trainingSnapshot: profile.trainingSnapshots[0]
      ? toTrainingSnapshotDto(profile.trainingSnapshots[0])
      : null,
    powerProfile: profile.powerProfile
      ? {
          ftpWatts: profile.powerProfile.ftpWatts,
          wattsPerKg: profile.powerProfile.wattsPerKg,
          riderWeight: profile.powerProfile.riderWeight,
          riderType: profile.powerProfile.riderType,
          peaks: profile.powerProfile.peaks.map((peak) => ({
            label: peak.label,
            watts: peak.watts,
          })),
        }
      : null,
    mediaAssets: profile.media.map(toMediaAssetDto),
    followerCount: profile._count.follows,
    viewerIsFollowing,
    support: toSupportSummary(profile, supportRead, { requireActiveCampaign: true }),
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function toAthleteProfileDraft(
  profile: AthleteProfileRead,
  supportRead?: AthleteSupportRead
): AthleteProfileDraft {
  return {
    athleteId: profile.id,
    userId: profile.userId,
    athleteSlug: profile.athleteSlug,
    fullName: profile.fullName,
    profileStatus: profile.profileStatus,
    profileVersion: profile.profileVersion,
    headline: profile.headline,
    tagline: profile.tagline,
    primarySport: profile.primarySport,
    secondarySports: profile.secondarySports,
    athleteLevel: profile.athleteLevel,
    disciplineLabel: profile.disciplineLabel,
    hometown: profile.hometown,
    countryCode: profile.countryCode,
    heroMediaUrl: profile.heroMediaUrl,
    profileImageUrl: profile.profileImageUrl,
    socialInstagramHandle: profile.socialInstagramHandle,
    socialTwitterHandle: profile.socialTwitterHandle,
    socialStravaUrl: profile.socialStravaUrl,
    values: profile.values,
    coreValues: profile.coreValues.map((value) => ({
      title: value.title,
      body: value.body,
    })),
    story: toStoryDto(profile),
    arcSubtitle: profile.arcSubtitle,
    storyChapters: profile.storyChapters.map(toStoryChapterDto),
    personalBests: profile.personalBests.map(toPersonalBestDto),
    results: profile.results.map(toResultDto),
    roadmapTitle: profile.roadmapTitle,
    roadmapEvents: profile.events.map(toRoadmapEventDto),
    trainingSnapshot: profile.trainingSnapshots[0]
      ? toTrainingSnapshotDto(profile.trainingSnapshots[0])
      : null,
    powerProfile: profile.powerProfile
      ? {
          ftpWatts: profile.powerProfile.ftpWatts,
          wattsPerKg: profile.powerProfile.wattsPerKg,
          riderWeight: profile.powerProfile.riderWeight,
          riderType: profile.powerProfile.riderType,
          peaks: profile.powerProfile.peaks.map((peak) => ({
            label: peak.label,
            watts: peak.watts,
          })),
        }
      : null,
    mediaAssets: profile.media.map(toMediaAssetDto),
    support: toSupportSummary(profile, supportRead),
    completion: buildAthleteProfileCompletion(profile),
    publishedAt: profile.publishedAt ? profile.publishedAt.toISOString() : null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function buildAthleteProfileCompletion(
  profile: AthleteProfileRead
): AthleteProfileCompletion {
  const items = [
    {
      completionItemKey: 'athleteSlug',
      label: 'Public profile URL',
      isComplete: Boolean(profile.athleteSlug),
      href: null,
      ctaLabel: null,
    },
    {
      completionItemKey: 'fullName',
      label: 'Athlete name',
      isComplete: Boolean(profile.fullName),
      href: null,
      ctaLabel: null,
    },
    {
      completionItemKey: 'primarySport',
      label: 'Primary sport',
      isComplete: Boolean(profile.primarySport),
      href: null,
      ctaLabel: null,
    },
    {
      completionItemKey: 'headline',
      label: 'Profile headline',
      isComplete: Boolean(profile.headline || profile.tagline),
      href: null,
      ctaLabel: null,
    },
    {
      completionItemKey: 'story',
      label: 'Athlete story',
      isComplete: Boolean(profile.storyIntro || profile.storyBody.length > 0),
      href: null,
      ctaLabel: null,
    },
    {
      completionItemKey: 'values',
      label: 'Values',
      isComplete: profile.values.length > 0 || profile.coreValues.length > 0,
      href: null,
      ctaLabel: null,
    },
  ];
  const completedItemCount = items.filter((item) => item.isComplete).length;

  return {
    completionPercent: Math.round((completedItemCount / items.length) * 100),
    completedItemCount,
    totalItemCount: items.length,
    missingFieldKeys: items
      .filter((item) => !item.isComplete)
      .map((item) => item.completionItemKey),
    items,
  };
}

export function getPublishMissingFieldKeys(profile: AthleteProfileRead): string[] {
  const completion = buildAthleteProfileCompletion(profile);
  return completion.missingFieldKeys.filter((fieldKey) =>
    publishRequiredFieldKeys.includes(fieldKey as (typeof publishRequiredFieldKeys)[number])
  );
}

function toStoryDto(profile: AthleteProfileRead): { intro: string | null; body: string[] } {
  return {
    intro: profile.storyIntro ?? profile.bio,
    body: profile.storyBody,
  };
}

function toSupportSummary(
  profile: AthleteProfileRead,
  supportRead?: AthleteSupportRead,
  options?: { requireActiveCampaign?: boolean }
): AthleteSupportSummary {
  const activeCampaigns = supportRead?.activeCampaigns ?? [];
  const supportEnabled =
    profile.supportEnabled &&
    (!options?.requireActiveCampaign || activeCampaigns.length > 0);
  return {
    supportEnabled,
    backCtaBlurb: profile.backCtaBlurb,
    supporterCount: supportEnabled ? supportRead?.supporterCount ?? 0 : 0,
    activeCampaigns: supportEnabled ? activeCampaigns : [],
    recentBackers: supportEnabled ? supportRead?.recentBackers ?? [] : [],
  };
}

function toStoryChapterDto(chapter: AthleteStoryChapter) {
  return {
    athleteStoryChapterId: chapter.id,
    eraLabel: chapter.eraLabel,
    title: chapter.title,
    body: chapter.body,
    chapterIcon: chapter.chapterIcon,
    chapterTone: chapter.chapterTone,
    imageUrl: chapter.imageUrl,
    isCurrent: chapter.isCurrent,
    sortOrder: chapter.sortOrder,
  };
}

function toPersonalBestDto(best: AthletePersonalBest) {
  return {
    athletePersonalBestId: best.id,
    label: best.label,
    value: best.value,
    sourceUrl: best.sourceUrl,
    verificationStatus: best.verificationStatus,
    verifiedAt: best.verifiedAt ? best.verifiedAt.toISOString() : null,
    sortOrder: best.sortOrder,
  };
}

function toResultDto(
  result: AthleteResult & {
    sourceLinks: AthleteResultSourceLink[];
    media: AthleteMedia[];
  }
) {
  return {
    athleteResultId: result.id,
    resultKind: result.resultKind,
    title: result.title,
    resultText: result.resultText,
    eventDate: toDateOnly(result.eventDate),
    eventDateLabel: result.eventDateLabel,
    sourceLinks: result.sourceLinks.map((link) => ({
      label: link.label,
      href: link.href,
    })),
    verificationStatus: result.verificationStatus,
    verifiedAt: result.verifiedAt ? result.verifiedAt.toISOString() : null,
    mediaUrls: result.media.map((media) => media.mediaUrl),
    sortOrder: result.sortOrder,
  };
}

function toRoadmapEventDto(
  event: AthleteEvent & {
    sourceLinks: AthleteEventSourceLink[];
  }
) {
  return {
    athleteRoadmapEventId: event.id,
    eventName: event.eventName,
    eventDate: toDateOnly(event.eventStartDate),
    eventDateLabel: event.eventDateLabel ?? toDateOnly(event.eventStartDate) ?? 'Date TBD',
    eventLocation: event.eventLocation,
    sourceLinks: event.sourceLinks.map((link) => ({
      label: link.label,
      href: link.href,
    })),
    sortOrder: event.sortOrder,
  };
}

function toTrainingSnapshotDto(snapshot: AthleteTrainingSnapshot) {
  return {
    athleteTrainingSnapshotId: snapshot.id,
    weeklyDistanceLabel: snapshot.weeklyDistanceLabel,
    weeklyTimeLabel: snapshot.weeklyTimeLabel,
    weeklyElevationGainLabel: snapshot.weeklyElevationGainLabel,
    weeklyLoadLabel: snapshot.weeklyLoadLabel,
    latestSessionTitle: snapshot.latestSessionTitle,
    latestSessionMeta: snapshot.latestSessionMeta,
    capturedAt: snapshot.capturedAt.toISOString(),
  };
}

function toMediaAssetDto(media: AthleteMedia) {
  return {
    athleteMediaAssetId: media.id,
    mediaKind: media.mediaKind,
    mediaRole: media.mediaRole,
    mediaUrl: media.mediaUrl,
    thumbnailUrl: media.thumbnailUrl,
    altText: media.altText,
    caption: media.caption,
    durationLabel: media.durationLabel,
    relatedAthleteResultId: media.relatedAthleteResultId,
    relatedStoryChapterId: media.relatedStoryChapterId,
    sortOrder: media.sortOrder,
    createdAt: media.createdAt.toISOString(),
  };
}

function toDateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}
