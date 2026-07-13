import { injectable } from 'tsyringe';
import { type AthleteLevel, CampaignStatus, Prisma, SportCategory } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';
import { decodeKeysetCursor, encodeKeysetCursor } from '../shared/keysetCursor';

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

export interface AthleteCampaignStats {
  activeCampaignCount: number;
  totalRaisedCents: number;
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
}
