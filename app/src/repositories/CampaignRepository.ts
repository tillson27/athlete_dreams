import { injectable } from 'tsyringe';
import {
  type AthleteProfile,
  type Campaign,
  type CampaignCostLine,
  CampaignStatus,
  type CampaignType,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

export type CampaignWithAthlete = Campaign & {
  costLines: CampaignCostLine[];
  athlete: AthleteProfile;
};

export type ActiveFeedCursor = { createdAt: Date; campaignId: string };

@injectable()
export class CampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listActiveFeed(params: {
    limit: number;
    cursor?: ActiveFeedCursor;
  }): Promise<{ campaigns: CampaignWithAthlete[]; hasMore: boolean }> {
    const where: Prisma.CampaignWhereInput = {
      campaignStatus: CampaignStatus.ACTIVE,
      deletedAt: null,
      AND: [openCampaignWhere()],
      ...(params.cursor
        ? {
            OR: [
              { createdAt: { lt: params.cursor.createdAt } },
              { createdAt: params.cursor.createdAt, id: { lt: params.cursor.campaignId } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.campaign.findMany({
      where,
      include: { costLines: true, athlete: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: params.limit + 1,
    });

    const hasMore = rows.length > params.limit;
    return { campaigns: hasMore ? rows.slice(0, params.limit) : rows, hasMore };
  }

  listActiveForAthlete(athleteId: string, limit: number): Promise<CampaignWithAthlete[]> {
    return this.prisma.campaign.findMany({
      where: { athleteId, deletedAt: null, campaignStatus: CampaignStatus.ACTIVE, ...openCampaignWhere() },
      include: { costLines: true, athlete: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
  }

  findActiveBySlug(
    campaignSlug: string
  ): Promise<(Campaign & { costLines: CampaignCostLine[] }) | null> {
    return this.prisma.campaign.findFirst({
      where: { campaignSlug, deletedAt: null, campaignStatus: CampaignStatus.ACTIVE, ...openCampaignWhere() },
      include: { costLines: true },
    });
  }

  // Read a campaign by id joined with its athlete (whose row now carries the
  // Stripe fields). Consumed by the donation-create guards, the Checkout product
  // name, and the success-URL athlete slug (Step 5). Not status-filtered — the
  // service distinguishes "not found" from "not active".
  findByIdWithAthlete(campaignId: string): Promise<CampaignWithAthlete | null> {
    return this.prisma.campaign.findFirst({
      where: { id: campaignId, deletedAt: null },
      include: { costLines: true, athlete: true },
    });
  }

  findBySlugForOwner(campaignSlug: string, userId: string): Promise<CampaignWithAthlete | null> {
    return this.prisma.campaign.findFirst({
      where: { campaignSlug, deletedAt: null, athlete: { userId } },
      include: { costLines: true, athlete: true },
    });
  }

  updateStatus(
    campaignId: string,
    campaignStatus: CampaignStatus
  ): Promise<CampaignWithAthlete> {
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { campaignStatus },
      include: { costLines: true, athlete: true },
    });
  }

  // Atomic projection fold, run INSIDE the webhook's `$transaction` (Step 6).
  // Positive deltas add successful funding; negative deltas reverse refunds or
  // disputes so public totals never overstate money actually available.
  async applyDonationEvent(
    tx: Prisma.TransactionClient,
    campaignId: string,
    deltaCents: number,
    supporterDelta: number
  ): Promise<void> {
    const campaign = await tx.campaign.update({
      where: { id: campaignId },
      data: {
        raisedAmountCents: { increment: deltaCents },
        supporterCount: { increment: supporterDelta },
      },
      select: { raisedAmountCents: true, targetAmountCents: true, campaignStatus: true },
    });
    if (
      campaign.campaignStatus === CampaignStatus.ACTIVE &&
      campaign.raisedAmountCents >= campaign.targetAmountCents
    ) {
      await tx.campaign.update({
        where: { id: campaignId },
        data: { campaignStatus: CampaignStatus.FUNDED },
      });
      return;
    }
    if (
      campaign.campaignStatus === CampaignStatus.FUNDED &&
      campaign.raisedAmountCents < campaign.targetAmountCents
    ) {
      await tx.campaign.update({
        where: { id: campaignId },
        data: { campaignStatus: CampaignStatus.ACTIVE },
      });
    }
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

function openCampaignWhere(): Prisma.CampaignWhereInput {
  return {
    OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }],
  };
}
