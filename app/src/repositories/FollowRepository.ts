import { injectable } from 'tsyringe';
import { type AthleteProfile, type Follow, Prisma } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

const followAthleteColumns = Prisma.validator<Prisma.AthleteProfileSelect>()({
  id: true,
  athleteSlug: true,
  fullName: true,
  primarySport: true,
  heroMediaUrl: true,
});

export type FollowAthleteSummary = Prisma.AthleteProfileGetPayload<{
  select: typeof followAthleteColumns;
}>;

export type FollowWithAthlete = Follow & { athlete: FollowAthleteSummary };

@injectable()
export class FollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Published-only lookup kept lightweight on purpose: the follow graph never
  // needs the rich profile include, so it does not go through AthleteRepository.
  findPublishedAthleteBySlug(athleteSlug: string): Promise<Pick<AthleteProfile, 'id'> | null> {
    return this.prisma.athleteProfile.findFirst({
      where: { athleteSlug, deletedAt: null, publishedAt: { not: null } },
      select: { id: true },
    });
  }

  // Idempotent: a repeat follow is a no-op update, so double-follow yields one row.
  async follow(followerUserId: string, athleteId: string): Promise<Follow> {
    return this.prisma.follow.upsert({
      where: { followerUserId_athleteId: { followerUserId, athleteId } },
      create: { followerUserId, athleteId },
      update: {},
    });
  }

  // Idempotent: deleteMany removes the pair if present and no-ops otherwise.
  async unfollow(followerUserId: string, athleteId: string): Promise<void> {
    await this.prisma.follow.deleteMany({ where: { followerUserId, athleteId } });
  }

  listForUser(followerUserId: string, limit: number): Promise<FollowWithAthlete[]> {
    return this.prisma.follow.findMany({
      where: {
        followerUserId,
        athlete: { deletedAt: null, publishedAt: { not: null } },
      },
      include: { athlete: { select: followAthleteColumns } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
