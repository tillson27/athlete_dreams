import { injectable } from 'tsyringe';
import type {
  AthleteAccomplishment as AthleteAccomplishmentDto,
  AthleteCoreValue,
  AthleteDirectoryItem,
  AthleteDirectoryQuery,
  AthleteDirectoryResponse,
  AthleteMedia as AthleteMediaDto,
  AthleteProfile as AthleteProfileDto,
  AthleteRaceResult as AthleteRaceResultDto,
  AthleteRoadmapItem,
  CreateAthleteProfileRequest,
  PersonalBest as PersonalBestDto,
} from 'fad-common';
import {
  type AthleteCampaignStats,
  type AthleteDirectoryRow,
  type AthleteProfileWithRelations,
  AthleteRepository,
} from '../../repositories/AthleteRepository';
import { ConflictError, NotFoundError } from '../../shared/errors';

type RaceResultRelation = AthleteProfileWithRelations['raceResults'][number];
type AccomplishmentRelation = AthleteProfileWithRelations['accomplishments'][number];
type MediaRelation = AthleteProfileWithRelations['media'][number];
type EventRelation = AthleteProfileWithRelations['events'][number];
type PersonalBestRelation = AthleteProfileWithRelations['personalBests'][number];

@injectable()
export class AthleteService {
  constructor(private readonly athleteRepository: AthleteRepository) {}

  async listDirectory(query: AthleteDirectoryQuery): Promise<AthleteDirectoryResponse> {
    const { items, nextCursor } = await this.athleteRepository.listDirectory({
      primarySport: query.sport,
      runnerLevel: query.runnerLevel,
      countryCode: query.countryCode,
      search: query.search,
      limit: query.limit,
      cursor: query.cursor,
    });

    const statsByAthleteId = await this.athleteRepository.getCampaignStatsForAthletes(
      items.map((athlete) => athlete.id)
    );

    return {
      items: items.map((athlete) => toDirectoryItem(athlete, statsByAthleteId.get(athlete.id))),
      nextCursor,
    };
  }

  async getProfileBySlug(
    athleteSlug: string,
    requestingUserId?: string
  ): Promise<AthleteProfileDto> {
    const athlete = await this.athleteRepository.findBySlug(athleteSlug);
    if (!athlete) throw new NotFoundError('Athlete profile');
    const isOwner = requestingUserId !== undefined && requestingUserId === athlete.userId;
    if (!athlete.publishedAt && !isOwner) throw new NotFoundError('Athlete profile');
    return toProfileDto(athlete);
  }

  async createProfileForUser(
    userId: string,
    input: CreateAthleteProfileRequest
  ): Promise<AthleteProfileDto> {
    const existing = await this.athleteRepository.findByUserId(userId);
    if (existing) throw new ConflictError('Athlete profile already exists for this user');
    const created = await this.athleteRepository.create({
      userId,
      athleteSlug: input.athleteSlug,
      fullName: input.fullName,
      primarySport: input.primarySport,
      headline: input.headline,
      bio: input.bio,
      hometown: input.hometown,
      countryCode: input.countryCode,
      values: input.values,
    });
    return toProfileDto(created);
  }
}

function toDirectoryItem(
  athlete: AthleteDirectoryRow,
  stats: AthleteCampaignStats | undefined
): AthleteDirectoryItem {
  return {
    athleteId: athlete.id,
    athleteSlug: athlete.athleteSlug,
    fullName: athlete.fullName,
    headline: athlete.headline,
    primarySport: athlete.primarySport,
    runnerLevel: athlete.runnerLevel,
    hometown: athlete.hometown,
    countryCode: athlete.countryCode,
    heroMediaUrl: athlete.heroMediaUrl,
    activeCampaignCount: stats?.activeCampaignCount ?? 0,
    totalRaisedCents: stats?.totalRaisedCents ?? 0,
  };
}

function toProfileDto(athlete: AthleteProfileWithRelations): AthleteProfileDto {
  return {
    athleteId: athlete.id,
    userId: athlete.userId,
    athleteSlug: athlete.athleteSlug,
    handle: athlete.handle,
    fullName: athlete.fullName,
    headline: athlete.headline,
    bio: athlete.bio,
    runnerLevel: athlete.runnerLevel,
    disciplineLabel: athlete.disciplineLabel,
    primarySport: athlete.primarySport,
    secondarySports: athlete.secondarySports,
    hometown: athlete.hometown,
    countryCode: athlete.countryCode,
    values: athlete.values,
    coreValues: toCoreValues(athlete.coreValues),
    storyIntro: athlete.storyIntro,
    storyBody: athlete.storyBody,
    presentation: toPresentation(athlete.presentation),
    socialInstagramHandle: athlete.socialInstagramHandle,
    socialTwitterHandle: athlete.socialTwitterHandle,
    socialStravaUrl: athlete.socialStravaUrl,
    accomplishments: athlete.accomplishments.map(toAccomplishmentDto),
    personalBests: athlete.personalBests.map(toPersonalBestDto),
    raceResults: athlete.raceResults.map(toRaceResultDto),
    roadmap: athlete.events.map(toRoadmapItem),
    gallery: toGallery(athlete.media),
    media: athlete.media.map(toMediaDto),
    publishedAt: athlete.publishedAt ? athlete.publishedAt.toISOString() : null,
    createdAt: athlete.createdAt.toISOString(),
    updatedAt: athlete.updatedAt.toISOString(),
  };
}

function toAccomplishmentDto(accomplishment: AccomplishmentRelation): AthleteAccomplishmentDto {
  return {
    athleteAccomplishmentId: accomplishment.id,
    title: accomplishment.title,
    description: accomplishment.description,
    detail: accomplishment.detail,
    resultUrl: accomplishment.resultUrl,
    photoRefs: accomplishment.photoRefs,
    occurredOn: toDateOnly(accomplishment.occurredOn),
  };
}

function toPersonalBestDto(personalBest: PersonalBestRelation): PersonalBestDto {
  return {
    personalBestId: personalBest.id,
    label: personalBest.label,
    value: personalBest.value,
    resultUrl: personalBest.resultUrl,
    sortOrder: personalBest.sortOrder,
  };
}

function toRaceResultDto(raceResult: RaceResultRelation): AthleteRaceResultDto {
  return {
    athleteRaceResultId: raceResult.id,
    resultName: raceResult.resultName,
    displayDate: raceResult.displayDate,
    occurredOn: toDateOnly(raceResult.occurredOn),
    resultSummary: raceResult.resultSummary,
    resultUrl: raceResult.resultUrl,
    links: toLinks(raceResult.links),
    photoRefs: raceResult.photoRefs,
    sortOrder: raceResult.sortOrder,
  };
}

function toRoadmapItem(event: EventRelation, index: number): AthleteRoadmapItem {
  return {
    athleteEventId: event.id,
    eventName: event.eventName,
    displayDate: event.displayDate ?? toDateOnly(event.eventStartDate) ?? event.eventName,
    sortOrder: index,
  };
}

function toMediaDto(media: MediaRelation): AthleteMediaDto {
  return {
    athleteMediaId: media.id,
    mediaUrl: media.mediaUrl,
    mediaKind: media.mediaKind,
    caption: media.caption,
  };
}

function toGallery(media: MediaRelation[]): string[] {
  return media.filter((entry) => entry.mediaKind === 'IMAGE').map((entry) => entry.mediaUrl);
}

function toCoreValues(value: unknown): AthleteCoreValue[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is AthleteCoreValue =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as { title?: unknown }).title === 'string' &&
      typeof (entry as { body?: unknown }).body === 'string'
  );
}

function toLinks(value: unknown): { label: string; href: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is { label: string; href: string } =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as { label?: unknown }).label === 'string' &&
      typeof (entry as { href?: unknown }).href === 'string'
  );
}

function toPresentation(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toDateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}
