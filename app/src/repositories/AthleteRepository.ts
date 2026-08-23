import { injectable } from 'tsyringe';
import {
  type AthleteLevel,
  type AthleteProfile,
  CampaignStatus,
  MediaKind,
  Prisma,
  SportCategory,
} from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';
import { decodeKeysetCursor, encodeKeysetCursor } from '../shared/keysetCursor';
import { parseEventStartDate } from '../shared/displayDate';

const richProfileInclude = Prisma.validator<Prisma.AthleteProfileInclude>()({
  personalBests: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] },
  raceResults: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  accomplishments: { orderBy: { createdAt: 'asc' } },
  media: { orderBy: { createdAt: 'asc' } },
  events: { orderBy: [{ eventStartDate: 'asc' }, { createdAt: 'asc' }] },
});

export type AthleteProfileWithRelations = Prisma.AthleteProfileGetPayload<{
  include: typeof richProfileInclude;
}>;

const directoryColumns = Prisma.validator<Prisma.AthleteProfileSelect>()({
  id: true,
  athleteSlug: true,
  fullName: true,
  headline: true,
  primarySport: true,
  runnerLevel: true,
  hometown: true,
  countryCode: true,
  heroMediaUrl: true,
  createdAt: true,
});

export type AthleteDirectoryRow = Prisma.AthleteProfileGetPayload<{
  select: typeof directoryColumns;
}>;

// The community feed surfaces at most one item per category per athlete (first
// highlight, latest race, next roadmap event, training snapshot — mirroring
// `client/lib/communityFeed.ts`), so each relation is capped at one row to keep
// this derived-feed query lean instead of pulling the full rich profile.
const feedSourceInclude = Prisma.validator<Prisma.AthleteProfileInclude>()({
  raceResults: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], take: 1 },
  accomplishments: { orderBy: { createdAt: 'asc' }, take: 1 },
  events: { orderBy: [{ eventStartDate: 'asc' }, { createdAt: 'asc' }], take: 1 },
});

const feedSourceColumns = Prisma.validator<Prisma.AthleteProfileSelect>()({
  id: true,
  athleteSlug: true,
  fullName: true,
  primarySport: true,
  presentation: true,
  ...feedSourceInclude,
});

export type AthleteFeedSourceRow = Prisma.AthleteProfileGetPayload<{
  select: typeof feedSourceColumns;
}>;

export interface AthleteCampaignStats {
  activeCampaignCount: number;
  totalRaisedCents: number;
}

// JSON columns (coreValues, presentation, race-result links) accept the client's
// validated structural values; Prisma types them as its opaque InputJsonValue,
// so callers pass a plain object/array and the repository casts at the boundary.
type JsonPatchValue = Record<string, unknown> | unknown[];

export interface AthleteProfilePatch {
  handle?: string;
  fullName?: string;
  headline?: string;
  bio?: string;
  runnerLevel?: AthleteLevel;
  disciplineLabel?: string;
  hometown?: string;
  countryCode?: string;
  secondarySports?: SportCategory[];
  values?: string[];
  coreValues?: JsonPatchValue;
  storyIntro?: string;
  storyBody?: string[];
  presentation?: JsonPatchValue;
  socialInstagramHandle?: string;
  socialTwitterHandle?: string;
  socialStravaUrl?: string;
  heroMediaUrl?: string;
}

export interface HighlightInput {
  title: string;
  detail?: string;
  resultUrl?: string;
  occurredOn?: Date;
  photoRefs: string[];
}

export interface PersonalBestInput {
  label: string;
  value: string;
  resultUrl?: string;
}

export interface RaceResultInput {
  resultName: string;
  displayDate: string;
  resultSummary: string;
  resultUrl?: string;
  links?: JsonPatchValue;
  photoRefs: string[];
}

export interface RoadmapEventInput {
  eventName: string;
  displayDate: string;
}

// Highlights, gallery, and roadmap have no `sortOrder` column, yet the editor's
// save-all model is order-sensitive. Stamping strictly increasing `createdAt`
// values makes the `createdAt asc` read ordering total, so a set-replace round
// trip preserves the submitted array order.
function orderedTimestamps(count: number): Date[] {
  const base = Date.now();
  return Array.from({ length: count }, (_, index) => new Date(base + index));
}

@injectable()
export class AthleteRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    userId: string;
    athleteSlug: string;
    fullName: string;
    primarySport: SportCategory;
    headline?: string;
    bio?: string;
    hometown?: string;
    countryCode?: string;
    values?: string[];
  }): Promise<AthleteProfileWithRelations> {
    return this.prisma.athleteProfile.create({
      data: {
        userId: input.userId,
        athleteSlug: input.athleteSlug,
        fullName: input.fullName,
        primarySport: input.primarySport,
        headline: input.headline,
        bio: input.bio,
        hometown: input.hometown,
        countryCode: input.countryCode,
        values: input.values ?? [],
      },
      include: richProfileInclude,
    });
  }

  findBySlug(athleteSlug: string): Promise<AthleteProfileWithRelations | null> {
    return this.prisma.athleteProfile.findFirst({
      where: { athleteSlug, deletedAt: null },
      include: richProfileInclude,
    });
  }

  findByUserId(userId: string): Promise<AthleteProfileWithRelations | null> {
    return this.prisma.athleteProfile.findFirst({
      where: { userId, deletedAt: null },
      include: richProfileInclude,
    });
  }

  findEventForAthlete(
    athleteId: string,
    athleteEventId: string
  ): Promise<{ id: string; athleteId: string } | null> {
    return this.prisma.athleteEvent.findFirst({
      where: { id: athleteEventId, athleteId },
      select: { id: true, athleteId: true },
    });
  }

  update(athleteId: string, patch: AthleteProfilePatch): Promise<AthleteProfileWithRelations> {
    const { coreValues, presentation, ...scalars } = patch;
    return this.prisma.athleteProfile.update({
      where: { id: athleteId },
      data: {
        ...scalars,
        ...(coreValues !== undefined ? { coreValues: coreValues as Prisma.InputJsonValue } : {}),
        ...(presentation !== undefined
          ? { presentation: presentation as Prisma.InputJsonValue }
          : {}),
      },
      include: richProfileInclude,
    });
  }

  // First-write-wins: publishing an already-published profile is a no-op that
  // preserves the original `publishedAt`. The guarded `updateMany` sets the
  // timestamp only when it is still null, so concurrent publishes cannot race.
  async setPublished(athleteId: string): Promise<AthleteProfileWithRelations> {
    await this.prisma.athleteProfile.updateMany({
      where: { id: athleteId, publishedAt: null },
      data: { publishedAt: new Date() },
    });
    return this.prisma.athleteProfile.findUniqueOrThrow({
      where: { id: athleteId },
      include: richProfileInclude,
    });
  }

  replaceHighlights(
    athleteId: string,
    highlights: HighlightInput[]
  ): Promise<AthleteProfileWithRelations> {
    const orderedAt = orderedTimestamps(highlights.length);
    return this.prisma.$transaction(async (tx) => {
      await tx.athleteAccomplishment.deleteMany({ where: { athleteId } });
      if (highlights.length > 0) {
        await tx.athleteAccomplishment.createMany({
          data: highlights.map((highlight, index) => ({
            athleteId,
            title: highlight.title,
            detail: highlight.detail,
            resultUrl: highlight.resultUrl,
            occurredOn: highlight.occurredOn,
            photoRefs: highlight.photoRefs,
            createdAt: orderedAt[index],
          })),
        });
      }
      return tx.athleteProfile.findUniqueOrThrow({
        where: { id: athleteId },
        include: richProfileInclude,
      });
    });
  }

  replacePersonalBests(
    athleteId: string,
    personalBests: PersonalBestInput[]
  ): Promise<AthleteProfileWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      await tx.personalBest.deleteMany({ where: { athleteId } });
      if (personalBests.length > 0) {
        await tx.personalBest.createMany({
          data: personalBests.map((personalBest, index) => ({
            athleteId,
            label: personalBest.label,
            value: personalBest.value,
            resultUrl: personalBest.resultUrl,
            sortOrder: index,
          })),
        });
      }
      return tx.athleteProfile.findUniqueOrThrow({
        where: { id: athleteId },
        include: richProfileInclude,
      });
    });
  }

  replaceRaceResults(
    athleteId: string,
    races: RaceResultInput[]
  ): Promise<AthleteProfileWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      await tx.athleteRaceResult.deleteMany({ where: { athleteId } });
      if (races.length > 0) {
        await tx.athleteRaceResult.createMany({
          data: races.map((race, index) => ({
            athleteId,
            resultName: race.resultName,
            displayDate: race.displayDate,
            resultSummary: race.resultSummary,
            resultUrl: race.resultUrl,
            links: race.links as Prisma.InputJsonValue | undefined,
            photoRefs: race.photoRefs,
            sortOrder: index,
          })),
        });
      }
      return tx.athleteProfile.findUniqueOrThrow({
        where: { id: athleteId },
        include: richProfileInclude,
      });
    });
  }

  replaceRoadmapEvents(
    athleteId: string,
    events: RoadmapEventInput[]
  ): Promise<AthleteProfileWithRelations> {
    const orderedAt = orderedTimestamps(events.length);
    return this.prisma.$transaction(async (tx) => {
      await tx.athleteEvent.deleteMany({ where: { athleteId } });
      if (events.length > 0) {
        await tx.athleteEvent.createMany({
          data: events.map((event, index) => ({
            athleteId,
            eventName: event.eventName,
            displayDate: event.displayDate,
            eventStartDate: parseEventStartDate(event.displayDate),
            createdAt: orderedAt[index],
          })),
        });
      }
      return tx.athleteProfile.findUniqueOrThrow({
        where: { id: athleteId },
        include: richProfileInclude,
      });
    });
  }

  replaceGallery(athleteId: string, imageUrls: string[]): Promise<AthleteProfileWithRelations> {
    const orderedAt = orderedTimestamps(imageUrls.length);
    return this.prisma.$transaction(async (tx) => {
      await tx.athleteMedia.deleteMany({ where: { athleteId, mediaKind: MediaKind.IMAGE } });
      if (imageUrls.length > 0) {
        await tx.athleteMedia.createMany({
          data: imageUrls.map((mediaUrl, index) => ({
            athleteId,
            mediaUrl,
            mediaKind: MediaKind.IMAGE,
            createdAt: orderedAt[index],
          })),
        });
      }
      return tx.athleteProfile.findUniqueOrThrow({
        where: { id: athleteId },
        include: richProfileInclude,
      });
    });
  }

  async listDirectory(filters: {
    primarySport?: SportCategory;
    runnerLevel?: AthleteLevel;
    countryCode?: string;
    search?: string;
    limit: number;
    cursor?: string;
  }): Promise<{ items: AthleteDirectoryRow[]; nextCursor: string | null }> {
    const cursor = filters.cursor ? decodeKeysetCursor(filters.cursor) : undefined;
    // Search and cursor each contribute their own OR group, so they are AND-ed
    // together rather than assigned to a single `OR` key (which would overwrite).
    const andConditions: Prisma.AthleteProfileWhereInput[] = [];
    if (filters.search) {
      andConditions.push({
        OR: [
          { fullName: { contains: filters.search, mode: 'insensitive' } },
          { headline: { contains: filters.search, mode: 'insensitive' } },
          { hometown: { contains: filters.search, mode: 'insensitive' } },
          { disciplineLabel: { contains: filters.search, mode: 'insensitive' } },
        ],
      });
    }
    if (cursor) {
      andConditions.push({
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { lt: cursor.id } },
        ],
      });
    }

    const where: Prisma.AthleteProfileWhereInput = {
      deletedAt: null,
      publishedAt: { not: null },
      ...(filters.primarySport ? { primarySport: filters.primarySport } : {}),
      ...(filters.runnerLevel ? { runnerLevel: filters.runnerLevel } : {}),
      ...(filters.countryCode ? { countryCode: filters.countryCode } : {}),
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    };

    const rows = await this.prisma.athleteProfile.findMany({
      where,
      select: directoryColumns,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: filters.limit + 1,
    });

    const hasMore = rows.length > filters.limit;
    const items = hasMore ? rows.slice(0, filters.limit) : rows;
    const lastItem = items.at(-1);
    const nextCursor =
      hasMore && lastItem
        ? encodeKeysetCursor({ createdAt: lastItem.createdAt, id: lastItem.id })
        : null;

    return { items, nextCursor };
  }

  async getCampaignStatsForAthletes(
    athleteIds: string[]
  ): Promise<Map<string, AthleteCampaignStats>> {
    const stats = new Map<string, AthleteCampaignStats>();
    if (athleteIds.length === 0) return stats;

    const grouped = await this.prisma.campaign.groupBy({
      by: ['athleteId', 'campaignStatus'],
      where: { athleteId: { in: athleteIds }, deletedAt: null },
      _sum: { raisedAmountCents: true },
      _count: { _all: true },
    });

    for (const row of grouped) {
      const current = stats.get(row.athleteId) ?? { activeCampaignCount: 0, totalRaisedCents: 0 };
      current.totalRaisedCents += row._sum.raisedAmountCents ?? 0;
      if (row.campaignStatus === CampaignStatus.ACTIVE) {
        current.activeCampaignCount += row._count._all;
      }
      stats.set(row.athleteId, current);
    }

    return stats;
  }

  listPublishedFeedSources(filters: {
    primarySport?: SportCategory;
    athleteIds?: string[];
    limit: number;
  }): Promise<AthleteFeedSourceRow[]> {
    return this.prisma.athleteProfile.findMany({
      where: {
        deletedAt: null,
        publishedAt: { not: null },
        ...(filters.primarySport ? { primarySport: filters.primarySport } : {}),
        ...(filters.athleteIds ? { id: { in: filters.athleteIds } } : {}),
      },
      select: feedSourceColumns,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: filters.limit,
    });
  }

  async setStripeAccount(athleteId: string, stripeAccountId: string): Promise<void> {
    await this.prisma.athleteProfile.update({
      where: { id: athleteId },
      data: { stripeAccountId },
    });
  }

  // `chargesEnabledAt` is the timestamp when Stripe first reported the account
  // as charges-enabled; passing null clears it (account.updated toggled off).
  async setChargesEnabled(athleteId: string, chargesEnabledAt: Date | null): Promise<void> {
    await this.prisma.athleteProfile.update({
      where: { id: athleteId },
      data: { stripeChargesEnabledAt: chargesEnabledAt },
    });
  }

  findByStripeAccountId(stripeAccountId: string): Promise<AthleteProfile | null> {
    return this.prisma.athleteProfile.findUnique({ where: { stripeAccountId } });
  }
}
