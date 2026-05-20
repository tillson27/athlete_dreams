import { injectable } from 'tsyringe';
import { type Campaign, type CampaignCostLine, CampaignStatus, type CampaignType } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

@injectable()
export class CampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  listActiveForAthlete(athleteId: string): Promise<(Campaign & { costLines: CampaignCostLine[] })[]> {
    return this.prisma.campaign.findMany({
      where: { athleteId, deletedAt: null, campaignStatus: { in: [CampaignStatus.ACTIVE, CampaignStatus.FUNDED] } },
      include: { costLines: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  countActiveForAthlete(athleteId: string): Promise<number> {
    return this.prisma.campaign.count({
      where: { athleteId, deletedAt: null, campaignStatus: CampaignStatus.ACTIVE },
    });
  }

  sumRaisedForAthlete(athleteId: string): Promise<number> {
    return this.prisma.campaign
      .aggregate({
        _sum: { raisedAmountCents: true },
        where: { athleteId, deletedAt: null },
      })
      .then((r) => r._sum.raisedAmountCents ?? 0);
  }

  findBySlug(campaignSlug: string): Promise<(Campaign & { costLines: CampaignCostLine[] }) | null> {
    return this.prisma.campaign.findFirst({
      where: { campaignSlug, deletedAt: null },
      include: { costLines: true },
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
  }): Promise<Campaign & { costLines: CampaignCostLine[] }> {
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
              create: input.costLines.map((line) => ({
                label: line.label,
                amountCents: line.amountCents,
                notes: line.notes,
              })),
            }
          : undefined,
      },
      include: { costLines: true },
    });
  }
}
