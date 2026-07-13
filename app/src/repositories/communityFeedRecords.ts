import {
  AthleteResultKind,
  Prisma,
} from '@prisma/client';
import {
  CommunityFeedCategory as CommunityFeedCategoryEnum,
  CommunityFeedKind as CommunityFeedKindEnum,
  CommunityFeedTargetType as CommunityFeedTargetTypeEnum,
  VerificationStatus as VerificationStatusEnum,
  type AthleteSourceLink,
  type CommunityFeedCategory,
  type CommunityFeedKind,
  type CommunityFeedTargetType,
  type SportCategory,
  type VerificationStatus,
} from 'fad-common';

export const feedAthleteSelect = {
  id: true,
  athleteSlug: true,
  fullName: true,
  profileImageUrl: true,
  heroMediaUrl: true,
  primarySport: true,
  disciplineLabel: true,
} satisfies Prisma.AthleteProfileSelect;

const feedTargetTypeOrder: CommunityFeedTargetType[] = [
  CommunityFeedTargetTypeEnum.AthleteResult,
  CommunityFeedTargetTypeEnum.AthleteEvent,
  CommunityFeedTargetTypeEnum.AthleteTrainingSnapshot,
  CommunityFeedTargetTypeEnum.AthleteProfileMilestone,
];

type FeedAthleteRead = Prisma.AthleteProfileGetPayload<{
  select: typeof feedAthleteSelect;
}>;

export type ResultFeedRead = Prisma.AthleteResultGetPayload<{
  include: {
    athlete: { select: typeof feedAthleteSelect };
    sourceLinks: true;
    media: true;
  };
}>;

export type EventFeedRead = Prisma.AthleteEventGetPayload<{
  include: {
    athlete: { select: typeof feedAthleteSelect };
    sourceLinks: true;
  };
}>;

export type TrainingFeedRead = Prisma.AthleteTrainingSnapshotGetPayload<{
  include: {
    athlete: { select: typeof feedAthleteSelect };
  };
}>;

export type MilestoneFeedRead = Prisma.AthleteProfileMilestoneGetPayload<{
  include: {
    athlete: { select: typeof feedAthleteSelect };
  };
}>;

export type CommunityFeedCursor = {
  occurredAt: Date;
  targetType: CommunityFeedTargetType;
  targetId: string;
};

export type CommunityFeedRecord = {
  targetType: CommunityFeedTargetType;
  targetId: string;
  athleteId: string;
  athleteSlug: string;
  athleteName: string;
  athleteAvatarUrl: string | null;
  primarySport: SportCategory;
  disciplineLabel: string | null;
  feedKind: CommunityFeedKind;
  feedCategory: CommunityFeedCategory;
  headline: string;
  detail: string | null;
  photoUrl: string | null;
  occurredAt: Date;
  sourceLinks: AthleteSourceLink[];
  verificationStatus: VerificationStatus;
};

export type CommunityFeedTarget = {
  targetType: CommunityFeedTargetType;
  targetId: string;
};

export function communityFeedTargetKey(target: CommunityFeedTarget): string {
  return `${target.targetType}:${target.targetId}`;
}

export function compareCommunityFeedRecords(
  left: CommunityFeedRecord,
  right: CommunityFeedRecord
): number {
  const occurredAtDelta = right.occurredAt.getTime() - left.occurredAt.getTime();
  if (occurredAtDelta !== 0) return occurredAtDelta;

  const targetTypeDelta = compareTargetTypes(left.targetType, right.targetType);
  if (targetTypeDelta !== 0) return targetTypeDelta;

  return left.targetId.localeCompare(right.targetId);
}

export function compareTargetTypes(
  left: CommunityFeedTargetType,
  right: CommunityFeedTargetType
): number {
  return feedTargetTypeOrder.indexOf(left) - feedTargetTypeOrder.indexOf(right);
}

export function isCommunityFeedTargetType(value: string): value is CommunityFeedTargetType {
  return feedTargetTypeOrder.includes(value as CommunityFeedTargetType);
}

export function toResultFeedRecord(result: ResultFeedRead): CommunityFeedRecord {
  const athlete = requirePublishedFeedAthlete(result.athlete);
  const isRace = result.resultKind === AthleteResultKind.RACE;
  return {
    ...athlete,
    targetType: CommunityFeedTargetTypeEnum.AthleteResult,
    targetId: result.id,
    feedKind: CommunityFeedKindEnum.Result,
    feedCategory: isRace
      ? CommunityFeedCategoryEnum.Race
      : CommunityFeedCategoryEnum.Milestone,
    headline: isRace ? `Raced ${result.title}` : `Hit a milestone - ${result.title}`,
    detail: result.resultText,
    photoUrl: result.media[0]?.mediaUrl ?? null,
    occurredAt: result.createdAt,
    sourceLinks: result.sourceLinks.map(toSourceLink),
    verificationStatus: result.verificationStatus as VerificationStatus,
  };
}

export function toEventFeedRecord(event: EventFeedRead): CommunityFeedRecord {
  const athlete = requirePublishedFeedAthlete(event.athlete);
  return {
    ...athlete,
    targetType: CommunityFeedTargetTypeEnum.AthleteEvent,
    targetId: event.id,
    feedKind: CommunityFeedKindEnum.Roadmap,
    feedCategory: CommunityFeedCategoryEnum.Roadmap,
    headline: `Is racing ${event.eventName}`,
    detail: `Up next - ${event.eventDateLabel ?? toDateOnly(event.eventStartDate) ?? 'Date TBD'}`,
    photoUrl: null,
    occurredAt: event.createdAt,
    sourceLinks: event.sourceLinks.map(toSourceLink),
    verificationStatus: VerificationStatusEnum.Unverified,
  };
}

export function toTrainingSnapshotFeedRecord(
  snapshot: TrainingFeedRead
): CommunityFeedRecord {
  const athlete = requirePublishedFeedAthlete(snapshot.athlete);
  const detailParts = [
    snapshot.latestSessionMeta,
    snapshot.weeklyDistanceLabel,
    snapshot.weeklyTimeLabel,
    snapshot.weeklyElevationGainLabel,
  ].filter((detailPart): detailPart is string => Boolean(detailPart));

  return {
    ...athlete,
    targetType: CommunityFeedTargetTypeEnum.AthleteTrainingSnapshot,
    targetId: snapshot.id,
    feedKind: CommunityFeedKindEnum.Training,
    feedCategory: CommunityFeedCategoryEnum.Training,
    headline: snapshot.latestSessionTitle
      ? `Logged a training block - ${snapshot.latestSessionTitle}`
      : 'Logged a training snapshot',
    detail: detailParts.length > 0 ? detailParts.join(' | ') : null,
    photoUrl: null,
    occurredAt: snapshot.capturedAt,
    sourceLinks: [],
    verificationStatus: VerificationStatusEnum.Unverified,
  };
}

export function toProfileMilestoneFeedRecord(
  milestone: MilestoneFeedRead
): CommunityFeedRecord {
  const athlete = requirePublishedFeedAthlete(milestone.athlete);
  return {
    ...athlete,
    targetType: CommunityFeedTargetTypeEnum.AthleteProfileMilestone,
    targetId: milestone.id,
    feedKind: CommunityFeedKindEnum.Profile,
    feedCategory: CommunityFeedCategoryEnum.Milestone,
    headline: `Hit a milestone - ${milestone.headline}`,
    detail: milestone.detail,
    photoUrl: milestone.photoUrl,
    occurredAt: milestone.occurredAt,
    sourceLinks: [],
    verificationStatus: VerificationStatusEnum.Unverified,
  };
}

function requirePublishedFeedAthlete(athlete: FeedAthleteRead): {
  athleteId: string;
  athleteSlug: string;
  athleteName: string;
  athleteAvatarUrl: string | null;
  primarySport: SportCategory;
  disciplineLabel: string | null;
} {
  if (!athlete.athleteSlug || !athlete.fullName || !athlete.primarySport) {
    throw new Error('Cannot map incomplete published athlete feed record');
  }

  return {
    athleteId: athlete.id,
    athleteSlug: athlete.athleteSlug,
    athleteName: athlete.fullName,
    athleteAvatarUrl: athlete.profileImageUrl ?? athlete.heroMediaUrl,
    primarySport: athlete.primarySport as SportCategory,
    disciplineLabel: athlete.disciplineLabel,
  };
}

function toSourceLink(link: { label: string; href: string }): AthleteSourceLink {
  return {
    label: link.label,
    href: link.href,
  };
}

function toDateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}
