import { injectable } from 'tsyringe';
import type { FollowListResponse, Follow as FollowDto } from 'fad-common';
import { FollowRepository, type FollowWithAthlete } from '../../repositories/FollowRepository';
import { NotFoundError } from '../../shared/errors';

const FOLLOW_LIST_LIMIT = 250;

@injectable()
export class FollowService {
  constructor(private readonly followRepository: FollowRepository) {}

  async followAthlete(followerUserId: string, athleteSlug: string): Promise<void> {
    const athleteId = await this.resolvePublishedAthleteId(athleteSlug);
    await this.followRepository.follow(followerUserId, athleteId);
  }

  async unfollowAthlete(followerUserId: string, athleteSlug: string): Promise<void> {
    const athleteId = await this.resolvePublishedAthleteId(athleteSlug);
    await this.followRepository.unfollow(followerUserId, athleteId);
  }

  async listFollows(followerUserId: string): Promise<FollowListResponse> {
    const follows = await this.followRepository.listForUser(followerUserId, FOLLOW_LIST_LIMIT);
    return { items: follows.map(toFollowDto), nextCursor: null };
  }

  private async resolvePublishedAthleteId(athleteSlug: string): Promise<string> {
    const athlete = await this.followRepository.findPublishedAthleteBySlug(athleteSlug);
    if (!athlete) throw new NotFoundError('Athlete profile');
    return athlete.id;
  }
}

function toFollowDto(follow: FollowWithAthlete): FollowDto {
  return {
    followId: follow.id,
    athleteId: follow.athleteId,
    athleteSlug: follow.athlete.athleteSlug,
    athleteName: follow.athlete.fullName,
    primarySport: follow.athlete.primarySport,
    heroMediaUrl: follow.athlete.heroMediaUrl,
    followedAt: follow.createdAt.toISOString(),
  };
}
