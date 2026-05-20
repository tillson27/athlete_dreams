import { injectable } from 'tsyringe';
import type {
  AthleteDirectoryItem,
  AthleteDirectoryQuery,
  AthleteProfile as AthleteProfileDto,
  CreateAthleteProfileRequest,
} from 'fad-common';
import { AthleteRepository } from '../../repositories/AthleteRepository';
import { CampaignRepository } from '../../repositories/CampaignRepository';
import { ConflictError, NotFoundError } from '../../shared/errors';
import type { AthleteProfile } from '@prisma/client';

@injectable()
export class AthleteService {
  constructor(
    private readonly athleteRepository: AthleteRepository,
    private readonly campaignRepository: CampaignRepository
  ) {}

  async listDirectory(query: AthleteDirectoryQuery): Promise<AthleteDirectoryItem[]> {
    const athletes = await this.athleteRepository.listDirectory({
      primarySport: query.sport,
      countryCode: query.countryCode,
      search: query.search,
      limit: query.limit,
    });
    return Promise.all(athletes.map((athlete) => this.buildDirectoryItem(athlete)));
  }

  async getProfileBySlug(athleteSlug: string): Promise<AthleteProfileDto> {
    const athlete = await this.athleteRepository.findBySlug(athleteSlug);
    if (!athlete) throw new NotFoundError('Athlete profile');
    return toProfileDto(athlete);
  }

  async createProfileForUser(
    userId: string,
    input: CreateAthleteProfileRequest
  ): Promise<AthleteProfileDto> {
    const existing = await this.athleteRepository.findByUserId(userId);
    if (existing) throw new ConflictError('Athlete profile already exists for this user');
    const created = await this.athleteRepository.create({
      userId,
      athleteSlug: input.athleteSlug,
      fullName: input.fullName,
      primarySport: input.primarySport,
      headline: input.headline,
      bio: input.bio,
      hometown: input.hometown,
      countryCode: input.countryCode,
      values: input.values,
    });
    return toProfileDto(created);
  }

  private async buildDirectoryItem(athlete: AthleteProfile): Promise<AthleteDirectoryItem> {
    const [activeCampaignCount, totalRaisedCents] = await Promise.all([
      this.campaignRepository.countActiveForAthlete(athlete.id),
      this.campaignRepository.sumRaisedForAthlete(athlete.id),
    ]);
    return {
      athleteId: athlete.id,
      athleteSlug: athlete.athleteSlug,
      fullName: athlete.fullName,
      headline: athlete.headline,
      primarySport: athlete.primarySport,
      hometown: athlete.hometown,
      countryCode: athlete.countryCode,
      heroMediaUrl: athlete.heroMediaUrl,
      activeCampaignCount,
      totalRaisedCents,
    };
  }
}

function toProfileDto(athlete: AthleteProfile): AthleteProfileDto {
  return {
    athleteId: athlete.id,
    userId: athlete.userId,
    athleteSlug: athlete.athleteSlug,
    fullName: athlete.fullName,
    headline: athlete.headline,
    bio: athlete.bio,
    primarySport: athlete.primarySport,
    secondarySports: athlete.secondarySports,
    hometown: athlete.hometown,
    countryCode: athlete.countryCode,
    values: athlete.values,
    socialInstagramHandle: athlete.socialInstagramHandle,
    socialTwitterHandle: athlete.socialTwitterHandle,
    socialStravaUrl: athlete.socialStravaUrl,
    accomplishments: [],
    media: [],
    createdAt: athlete.createdAt.toISOString(),
    updatedAt: athlete.updatedAt.toISOString(),
  };
}
