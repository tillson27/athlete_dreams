import { injectable } from 'tsyringe';
import type { Campaign as CampaignDto, CreateCampaignRequest } from 'fad-common';
import { CampaignRepository } from '../../repositories/CampaignRepository';
import { AthleteRepository } from '../../repositories/AthleteRepository';
import { ForbiddenError, NotFoundError } from '../../shared/errors';
import type { Campaign, CampaignCostLine } from '@prisma/client';

@injectable()
export class CampaignService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly athleteRepository: AthleteRepository
  ) {}

  async getCampaignBySlug(campaignSlug: string): Promise<CampaignDto> {
    const campaign = await this.campaignRepository.findBySlug(campaignSlug);
    if (!campaign) throw new NotFoundError('Campaign');
    return toCampaignDto(campaign, campaign.costLines);
  }

  async createForAthlete(userId: string, input: CreateCampaignRequest): Promise<CampaignDto> {
    const athlete = await this.athleteRepository.findByUserId(userId);
    if (!athlete) throw new ForbiddenError('Must have an athlete profile to create a campaign');
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
