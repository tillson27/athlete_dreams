import { injectable } from 'tsyringe';
import type {
  ActiveCampaignFeedResponse,
  Campaign as CampaignDto,
  CampaignSummary,
  CreateCampaignRequest,
} from 'fad-common';
import {
  CampaignRepository,
  type ActiveFeedCursor,
  type CampaignWithAthlete,
} from '../../repositories/CampaignRepository';
import { AthleteRepository } from '../../repositories/AthleteRepository';
import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';
import type { Campaign, CampaignCostLine } from '@prisma/client';

@injectable()
export class CampaignService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly athleteRepository: AthleteRepository
  ) {}

  async listActiveFeed(params: { limit: number; cursor?: string }): Promise<ActiveCampaignFeedResponse> {
    const { campaigns, hasMore } = await this.campaignRepository.listActiveFeed({
      limit: params.limit,
      cursor: params.cursor ? decodeActiveFeedCursor(params.cursor) : undefined,
    });
    const items = campaigns.map(toCampaignSummary);
    const lastCampaign = campaigns.at(-1);
    const nextCursor =
      hasMore && lastCampaign
        ? encodeActiveFeedCursor({ createdAt: lastCampaign.createdAt, campaignId: lastCampaign.id })
        : null;
    return { items, nextCursor };
  }

  async listForAthleteSlug(athleteSlug: string): Promise<CampaignSummary[]> {
    const athlete = await this.athleteRepository.findBySlug(athleteSlug);
    if (!athlete || athlete.publishedAt === null) throw new NotFoundError('Athlete profile');
    const campaigns = await this.campaignRepository.listActiveForAthlete(athlete.id);
    return campaigns.map(toCampaignSummary);
  }

  async getCampaignBySlug(campaignSlug: string): Promise<CampaignDto> {
    const campaign = await this.campaignRepository.findBySlug(campaignSlug);
    if (!campaign) throw new NotFoundError('Campaign');
    return toCampaignDto(campaign, campaign.costLines);
  }

  async createForAthlete(userId: string, input: CreateCampaignRequest): Promise<CampaignDto> {
    const athlete = await this.athleteRepository.findByUserId(userId);
    if (!athlete) throw new ForbiddenError('Must have an athlete profile to create a campaign');
    assertCostLinesMatchTarget(input);
    const created = await this.campaignRepository.create({
      athleteId: athlete.id,
      campaignSlug: input.campaignSlug,
      athleteEventId: input.athleteEventId,
      campaignTitle: input.campaignTitle,
      campaignType: input.campaignType,
      campaignStory: input.campaignStory,
      targetAmountCents: input.targetAmountCents,
      costLines: input.costLines,
      closesAt: input.closesAt ? new Date(input.closesAt) : undefined,
    });
    return toCampaignDto(created, created.costLines);
  }
}

// Transparency ([STRICT] product differentiator): supporters must see exactly what
// they fund, so the cost breakdown has to reconcile to the campaign target.
function assertCostLinesMatchTarget(input: CreateCampaignRequest): void {
  const costLines = input.costLines ?? [];
  const costLinesTotalCents = costLines.reduce((sum, line) => sum + line.amountCents, 0);
  if (costLinesTotalCents === input.targetAmountCents) return;
  throw new ValidationError('Cost line total must equal the campaign target', {
    targetAmountCents: input.targetAmountCents,
    costLinesTotalCents,
    costLines: costLines.map((line) => ({ label: line.label, amountCents: line.amountCents })),
  });
}

const CURSOR_SEPARATOR = '|';

function encodeActiveFeedCursor(cursor: ActiveFeedCursor): string {
  const raw = `${cursor.createdAt.toISOString()}${CURSOR_SEPARATOR}${cursor.campaignId}`;
  return Buffer.from(raw, 'utf8').toString('base64url');
}

function decodeActiveFeedCursor(encoded: string): ActiveFeedCursor {
  const raw = Buffer.from(encoded, 'base64url').toString('utf8');
  const separatorIndex = raw.indexOf(CURSOR_SEPARATOR);
  if (separatorIndex === -1) throw new ValidationError('Invalid cursor');
  const createdAtIso = raw.slice(0, separatorIndex);
  const campaignId = raw.slice(separatorIndex + 1);
  const createdAt = new Date(createdAtIso);
  if (Number.isNaN(createdAt.getTime()) || campaignId.length === 0) {
    throw new ValidationError('Invalid cursor');
  }
  return { createdAt, campaignId };
}

function toCampaignSummary(campaign: CampaignWithAthlete): CampaignSummary {
  return {
    campaignId: campaign.id,
    campaignSlug: campaign.campaignSlug,
    campaignTitle: campaign.campaignTitle,
    campaignType: campaign.campaignType,
    campaignStatus: campaign.campaignStatus,
    athleteId: campaign.athleteId,
    athleteSlug: campaign.athlete.athleteSlug,
    athleteName: campaign.athlete.fullName,
    primarySport: campaign.athlete.primarySport,
    heroMediaUrl: campaign.athlete.heroMediaUrl,
    targetAmountCents: campaign.targetAmountCents,
    raisedAmountCents: campaign.raisedAmountCents,
    supporterCount: campaign.supporterCount,
    closesAt: campaign.closesAt ? campaign.closesAt.toISOString() : null,
  };
}

function toCampaignDto(campaign: Campaign, costLines: CampaignCostLine[]): CampaignDto {
  return {
    campaignId: campaign.id,
    campaignSlug: campaign.campaignSlug,
    athleteId: campaign.athleteId,
    athleteEventId: campaign.athleteEventId,
    campaignTitle: campaign.campaignTitle,
    campaignType: campaign.campaignType,
    campaignStatus: campaign.campaignStatus,
    campaignStory: campaign.campaignStory,
    targetAmountCents: campaign.targetAmountCents,
    raisedAmountCents: campaign.raisedAmountCents,
    supporterCount: campaign.supporterCount,
    costLines: costLines.map((line) => ({
      campaignCostLineId: line.id,
      label: line.label,
      amountCents: line.amountCents,
      notes: line.notes,
    })),
    closesAt: campaign.closesAt ? campaign.closesAt.toISOString() : null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}
