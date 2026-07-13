import type {
  Campaign as CampaignDto,
  CampaignCostLine as CampaignCostLineDto,
  CampaignSummary,
} from 'fad-common';
import type {
  Campaign as PrismaCampaign,
  CampaignCostLine as PrismaCampaignCostLine,
} from '@prisma/client';

export type CampaignWithCostLines = PrismaCampaign & {
  costLines: PrismaCampaignCostLine[];
};

export function toCampaignDto(campaign: CampaignWithCostLines): CampaignDto {
  return {
    ...toCampaignBaseDto(campaign),
    campaignStory: campaign.campaignStory,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}

export function toCampaignSummaryDto(campaign: CampaignWithCostLines): CampaignSummary {
  return {
    ...toCampaignBaseDto(campaign),
    campaignStoryExcerpt: toCampaignStoryExcerpt(campaign.campaignStory),
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}

function toCampaignBaseDto(campaign: CampaignWithCostLines) {
  return {
    campaignId: campaign.id,
    campaignSlug: campaign.campaignSlug,
    athleteId: campaign.athleteId,
    athleteEventId: campaign.athleteEventId,
    campaignTitle: campaign.campaignTitle,
    campaignType: campaign.campaignType,
    campaignStatus: campaign.campaignStatus,
    targetAmountCents: campaign.targetAmountCents,
    raisedAmountCents: campaign.raisedAmountCents,
    supporterCount: campaign.supporterCount,
    costLines: campaign.costLines
      .slice()
      .sort(compareCampaignCostLines)
      .map(toCampaignCostLineDto),
    closesAt: campaign.closesAt ? campaign.closesAt.toISOString() : null,
  };
}

function toCampaignCostLineDto(line: PrismaCampaignCostLine): CampaignCostLineDto {
  return {
    campaignCostLineId: line.id,
    label: line.label,
    amountCents: line.amountCents,
    notes: line.notes,
  };
}

function compareCampaignCostLines(
  left: PrismaCampaignCostLine,
  right: PrismaCampaignCostLine
): number {
  return left.sortOrder - right.sortOrder || left.id.localeCompare(right.id);
}

function toCampaignStoryExcerpt(campaignStory: string): string | null {
  const trimmedStory = campaignStory.trim();
  if (!trimmedStory) return null;
  if (trimmedStory.length <= 1200) return trimmedStory;
  return `${trimmedStory.slice(0, 1197).trimEnd()}...`;
}
