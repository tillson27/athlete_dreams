import { injectable } from 'tsyringe';
import type { Campaign as CampaignDto, CreateCampaignRequest } from 'fad-common';
import { CampaignRepository } from '../../repositories/CampaignRepository';
import { AthleteRepository } from '../../repositories/AthleteRepository';
import { ForbiddenError, NotFoundError } from '../../shared/errors';
import { toCampaignDto } from './campaignMappers';

@injectable()
export class CampaignService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly athleteRepository: AthleteRepository
  ) {}

  async getCampaignBySlug(campaignSlug: string): Promise<CampaignDto> {
    const campaign = await this.campaignRepository.findBySlug(campaignSlug);
    if (!campaign) throw new NotFoundError('Campaign');
    return toCampaignDto(campaign);
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
    return toCampaignDto(created);
  }
}
