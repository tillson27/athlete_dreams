import { injectable } from 'tsyringe';
import {
  CampaignStatus,
  DonationStatus,
  Prisma,
  type Campaign,
  type CampaignCostLine,
  type CampaignType,
} from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

const supportSummaryCampaignStatuses = [CampaignStatus.ACTIVE, CampaignStatus.FUNDED];
const campaignWithCostLinesInclude = {
  costLines: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.CampaignInclude;
const recentCampaignBackerSelect = {
  supporterDisplayName: true,
  donationAmountCents: true,
  isAnonymous: true,
  createdAt: true,
} satisfies Prisma.DonationSelect;

export type CampaignWithCostLines = Campaign & { costLines: CampaignCostLine[] };
export type CampaignSupportMetrics = {
  activeCampaignCount: number;
  totalRaisedCents: number;
};
export type RecentCampaignBacker = Prisma.DonationGetPayload<{
  select: typeof recentCampaignBackerSelect;
}>;

@injectable()
export class CampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  listActiveForAthlete(athleteId: string): Promise<CampaignWithCostLines[]> {
    return this.prisma.campaign.findMany({
      where: {
        athleteId,
        deletedAt: null,
        campaignStatus: { in: supportSummaryCampaignStatuses },
      },
      include: campaignWithCostLinesInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSupportMetricsForAthletes(
    athleteIds: string[]
  ): Promise<Map<string, CampaignSupportMetrics>> {
    if (athleteIds.length === 0) return new Map();

    const campaignMetricRows = await this.prisma.campaign.groupBy({
      by: ['athleteId'],
      where: {
        athleteId: { in: athleteIds },
        deletedAt: null,
        campaignStatus: { in: supportSummaryCampaignStatuses },
      },
      _count: { _all: true },
      _sum: {
        raisedAmountCents: true,
      },
    });

    return new Map(
      campaignMetricRows.map((row) => [
        row.athleteId,
        {
          activeCampaignCount: row._count._all,
          totalRaisedCents: row._sum.raisedAmountCents ?? 0,
        },
      ])
    );
  }

  listRecentBackersForAthlete(
    athleteId: string,
    limit: number
  ): Promise<RecentCampaignBacker[]> {
    const recentBackerLimit = Math.min(Math.max(limit, 0), 12);
    if (recentBackerLimit === 0) return Promise.resolve([]);

    return this.prisma.donation.findMany({
      where: {
        donationStatus: DonationStatus.SUCCEEDED,
        campaign: {
          athleteId,
          deletedAt: null,
          campaignStatus: { in: supportSummaryCampaignStatuses },
        },
      },
      select: recentCampaignBackerSelect,
      orderBy: { createdAt: 'desc' },
      take: recentBackerLimit,
    });
  }

  findBySlug(campaignSlug: string): Promise<CampaignWithCostLines | null> {
    return this.prisma.campaign.findFirst({
      where: {
        campaignSlug,
        deletedAt: null,
        campaignStatus: { in: supportSummaryCampaignStatuses },
      },
      include: campaignWithCostLinesInclude,
    });
  }

  create(input: {
    athleteId: string;
    campaignSlug: string;
    athleteEventId?: string;
    campaignTitle: string;
    campaignType: CampaignType;
    campaignStory: string;
    targetAmountCents: number;
    costLines?: { label: string; amountCents: number; notes?: string }[];
    closesAt?: Date;
  }): Promise<CampaignWithCostLines> {
    return this.prisma.campaign.create({
      data: {
        athleteId: input.athleteId,
        campaignSlug: input.campaignSlug,
        athleteEventId: input.athleteEventId,
        campaignTitle: input.campaignTitle,
        campaignType: input.campaignType,
        campaignStory: input.campaignStory,
        targetAmountCents: input.targetAmountCents,
        closesAt: input.closesAt,
        costLines: input.costLines
          ? {
              create: input.costLines.map((line, sortOrder) => ({
                label: line.label,
                amountCents: line.amountCents,
                notes: line.notes,
                sortOrder,
              })),
            }
          : undefined,
      },
      include: campaignWithCostLinesInclude,
    });
  }
}
