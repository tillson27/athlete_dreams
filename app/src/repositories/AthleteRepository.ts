import { injectable } from 'tsyringe';
import { type AthleteProfile, type Prisma, SportCategory } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

@injectable()
export class AthleteRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    userId: string;
    athleteSlug: string;
    fullName: string;
    primarySport: SportCategory;
    headline?: string;
    bio?: string;
    hometown?: string;
    countryCode?: string;
    values?: string[];
  }): Promise<AthleteProfile> {
    return this.prisma.athleteProfile.create({
      data: {
        userId: input.userId,
        athleteSlug: input.athleteSlug,
        fullName: input.fullName,
        primarySport: input.primarySport,
        headline: input.headline,
        bio: input.bio,
        hometown: input.hometown,
        countryCode: input.countryCode,
        values: input.values ?? [],
      },
    });
  }

  findBySlug(athleteSlug: string): Promise<AthleteProfile | null> {
    return this.prisma.athleteProfile.findFirst({
      where: { athleteSlug, deletedAt: null },
    });
  }

  findByUserId(userId: string): Promise<AthleteProfile | null> {
    return this.prisma.athleteProfile.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  async listDirectory(filters: {
    primarySport?: SportCategory;
    countryCode?: string;
    search?: string;
    limit: number;
  }): Promise<AthleteProfile[]> {
    const where: Prisma.AthleteProfileWhereInput = {
      deletedAt: null,
      ...(filters.primarySport ? { primarySport: filters.primarySport } : {}),
      ...(filters.countryCode ? { countryCode: filters.countryCode } : {}),
      ...(filters.search
        ? {
            OR: [
              { fullName: { contains: filters.search, mode: 'insensitive' } },
              { headline: { contains: filters.search, mode: 'insensitive' } },
              { hometown: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.athleteProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
    });
  }
}
