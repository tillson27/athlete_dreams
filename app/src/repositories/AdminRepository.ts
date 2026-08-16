import { injectable } from 'tsyringe';
import {
  CampaignStatus,
  DonationStatus,
  Prisma,
  type PlatformRole,
  type SportCategory,
} from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';
import type { KeysetCursor } from '../shared/keysetCursor';

const adminUserInclude = Prisma.validator<Prisma.UserInclude>()({
  platformRoleAssignments: { select: { role: true } },
  athleteProfile: { select: { id: true, athleteSlug: true, publishedAt: true } },
});

export type AdminUserRow = Prisma.UserGetPayload<{ include: typeof adminUserInclude }>;

const adminCampaignInclude = Prisma.validator<Prisma.CampaignInclude>()({
  athlete: { select: { athleteSlug: true, fullName: true } },
});

export type AdminCampaignRow = Prisma.CampaignGetPayload<{ include: typeof adminCampaignInclude }>;

const adminDonationInclude = Prisma.validator<Prisma.DonationInclude>()({
  campaign: {
    select: {
      campaignTitle: true,
      athlete: { select: { fullName: true } },
    },
  },
});

export type AdminDonationRow = Prisma.DonationGetPayload<{ include: typeof adminDonationInclude }>;

export interface AdminUserListParams {
  search?: string;
  role?: PlatformRole;
  limit: number;
  cursor?: KeysetCursor;
}

export interface AdminAthleteListParams {
  published?: 'true' | 'false';
  sport?: SportCategory;
  limit: number;
  cursor?: KeysetCursor;
}

export interface AdminCampaignListParams {
  status?: CampaignStatus;
  athleteId?: string;
  limit: number;
  cursor?: KeysetCursor;
}

export interface AdminDonationListParams {
  status?: DonationStatus;
  athleteId?: string;
  limit: number;
  cursor?: KeysetCursor;
}

export interface AdminAnalyticsRows {
  userSignupsByDay: { date: Date; count: bigint }[];
  donationsByDay: { date: Date; count: bigint; amountCents: bigint | null }[];
}

@injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(params: AdminUserListParams): Promise<{ users: AdminUserRow[]; hasMore: boolean }> {
    const users = await this.prisma.user.findMany({
      where: adminUserWhere(params),
      include: adminUserInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: params.limit + 1,
    });
    const hasMore = users.length > params.limit;
    return { users: hasMore ? users.slice(0, params.limit) : users, hasMore };
  }

  async listAthletes(params: AdminAthleteListParams): Promise<{
    athletes: Prisma.AthleteProfileGetPayload<object>[];
    hasMore: boolean;
  }> {
    const athletes = await this.prisma.athleteProfile.findMany({
      where: adminAthleteWhere(params),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: params.limit + 1,
    });
    const hasMore = athletes.length > params.limit;
    return { athletes: athletes.slice(0, params.limit), hasMore };
  }

  async setAthletePublished(athleteId: string, publish: boolean): Promise<boolean> {
    const result = await this.prisma.athleteProfile.updateMany({
      where: { id: athleteId, deletedAt: null },
      data: { publishedAt: publish ? new Date() : null },
    });
    return result.count > 0;
  }

  async listCampaigns(params: AdminCampaignListParams): Promise<{
    campaigns: AdminCampaignRow[];
    hasMore: boolean;
  }> {
    const campaigns = await this.prisma.campaign.findMany({
      where: adminCampaignWhere(params),
      include: adminCampaignInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: params.limit + 1,
    });
    const hasMore = campaigns.length > params.limit;
    return { campaigns: campaigns.slice(0, params.limit), hasMore };
  }

  async updateCampaignStatus(campaignId: string, campaignStatus: CampaignStatus): Promise<boolean> {
    const result = await this.prisma.campaign.updateMany({
      where: { id: campaignId, deletedAt: null },
      data: { campaignStatus },
    });
    return result.count > 0;
  }

  async listDonations(params: AdminDonationListParams): Promise<{
    donations: AdminDonationRow[];
    hasMore: boolean;
  }> {
    const donations = await this.prisma.donation.findMany({
      where: adminDonationWhere(params),
      include: adminDonationInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: params.limit + 1,
    });
    const hasMore = donations.length > params.limit;
    return { donations: donations.slice(0, params.limit), hasMore };
  }

  findUserDetail(userId: string): Promise<AdminUserRow | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: adminUserInclude,
    });
  }

  async replaceUserRoles(userId: string, roles: PlatformRole[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.platformRoleAssignment.deleteMany({ where: { userId } });
      if (roles.length > 0) {
        await tx.platformRoleAssignment.createMany({
          data: roles.map((role) => ({ userId, role })),
          skipDuplicates: true,
        });
      }
    });
  }

  async softDeleteUser(userId: string, deletedAt: Date): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: { id: userId, deletedAt: null },
      data: { deletedAt },
    });
    return result.count > 0;
  }

  async getAnalyticsCounts(since: Date): Promise<{
    totalUsers: number;
    totalAthletes: number;
    publishedAthletes: number;
    activeCampaigns: number;
    totalRaisedCents: number;
    totalSucceededDonations: number;
    signupsLast30Days: number;
    athletesLast30Days: number;
  }> {
    const [
      totalUsers,
      totalAthletes,
      publishedAthletes,
      activeCampaigns,
      totalRaised,
      totalSucceededDonations,
      signupsLast30Days,
      athletesLast30Days,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.athleteProfile.count({ where: { deletedAt: null } }),
      this.prisma.athleteProfile.count({ where: { deletedAt: null, publishedAt: { not: null } } }),
      this.prisma.campaign.count({
        where: { deletedAt: null, campaignStatus: CampaignStatus.ACTIVE },
      }),
      this.prisma.donation.aggregate({
        where: { donationStatus: DonationStatus.SUCCEEDED },
        _sum: { donationAmountCents: true },
      }),
      this.prisma.donation.count({ where: { donationStatus: DonationStatus.SUCCEEDED } }),
      this.prisma.user.count({ where: { deletedAt: null, createdAt: { gte: since } } }),
      this.prisma.athleteProfile.count({ where: { deletedAt: null, createdAt: { gte: since } } }),
    ]);

    return {
      totalUsers,
      totalAthletes,
      publishedAthletes,
      activeCampaigns,
      totalRaisedCents: totalRaised._sum.donationAmountCents ?? 0,
      totalSucceededDonations,
      signupsLast30Days,
      athletesLast30Days,
    };
  }

  getAnalyticsRows(since: Date): Promise<AdminAnalyticsRows> {
    return this.prisma.$transaction(async (tx) => {
      const userSignupsByDay = await tx.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('day', "createdAt") AS date, COUNT(*) AS count
        FROM "users"
        WHERE "createdAt" >= ${since}
          AND "deletedAt" IS NULL
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      const donationsByDay = await tx.$queryRaw<
        { date: Date; count: bigint; amountCents: bigint | null }[]
      >`
        SELECT DATE_TRUNC('day', "createdAt") AS date,
               COUNT(*) AS count,
               SUM("donationAmountCents") AS "amountCents"
        FROM "donations"
        WHERE "createdAt" >= ${since}
          AND "donationStatus" = 'SUCCEEDED'::"DonationStatus"
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      return { userSignupsByDay, donationsByDay };
    });
  }
}

function adminAthleteWhere(params: AdminAthleteListParams): Prisma.AthleteProfileWhereInput {
  return {
    deletedAt: null,
    ...(params.published === 'true' ? { publishedAt: { not: null } } : {}),
    ...(params.published === 'false' ? { publishedAt: null } : {}),
    ...(params.sport ? { primarySport: params.sport } : {}),
    ...(params.cursor
      ? {
          OR: [
            { createdAt: { lt: params.cursor.createdAt } },
            { createdAt: params.cursor.createdAt, id: { lt: params.cursor.id } },
          ],
        }
      : {}),
  };
}

function adminCampaignWhere(params: AdminCampaignListParams): Prisma.CampaignWhereInput {
  return {
    deletedAt: null,
    ...(params.status ? { campaignStatus: params.status } : {}),
    ...(params.athleteId ? { athleteId: params.athleteId } : {}),
    ...(params.cursor
      ? {
          OR: [
            { createdAt: { lt: params.cursor.createdAt } },
            { createdAt: params.cursor.createdAt, id: { lt: params.cursor.id } },
          ],
        }
      : {}),
  };
}

function adminDonationWhere(params: AdminDonationListParams): Prisma.DonationWhereInput {
  return {
    ...(params.status ? { donationStatus: params.status } : {}),
    campaign: {
      deletedAt: null,
      ...(params.athleteId ? { athleteId: params.athleteId } : {}),
    },
    ...(params.cursor
      ? {
          OR: [
            { createdAt: { lt: params.cursor.createdAt } },
            { createdAt: params.cursor.createdAt, id: { lt: params.cursor.id } },
          ],
        }
      : {}),
  };
}

function adminUserWhere(params: AdminUserListParams): Prisma.UserWhereInput {
  const filters: Prisma.UserWhereInput[] = [];
  if (params.search) {
    filters.push({
      OR: [
        { email: { startsWith: params.search, mode: 'insensitive' } },
        { displayName: { startsWith: params.search, mode: 'insensitive' } },
      ],
    });
  }
  if (params.role) {
    filters.push({ platformRoleAssignments: { some: { role: params.role } } });
  }
  if (params.cursor) {
    filters.push({
      OR: [
        { createdAt: { lt: params.cursor.createdAt } },
        { createdAt: params.cursor.createdAt, id: { lt: params.cursor.id } },
      ],
    });
  }
  return {
    deletedAt: null,
    ...(filters.length > 0 ? { AND: filters } : {}),
  };
}
