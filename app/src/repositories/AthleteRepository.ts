import { injectable } from 'tsyringe';
import {
  AthleteProfileStatus,
  type AthleteProfile,
  Prisma,
  SportCategory,
} from '@prisma/client';
import type { UpsertAthleteProfileDraftRequest } from 'fad-common';
import { PrismaService } from '../services/infrastructure/PrismaService';
import { replaceDraftSections } from './athleteDraftSectionPersistence';

export const athleteProfileReadInclude = {
  coreValues: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  storyChapters: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  },
  personalBests: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  results: {
    where: { deletedAt: null },
    include: {
      sourceLinks: { orderBy: [{ sortOrder: 'asc' }] },
      media: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  },
  events: {
    where: { deletedAt: null },
    include: {
      sourceLinks: { orderBy: [{ sortOrder: 'asc' }] },
    },
    orderBy: [{ sortOrder: 'asc' }, { eventStartDate: 'asc' }, { createdAt: 'asc' }],
  },
  trainingSnapshots: {
    where: { deletedAt: null },
    orderBy: [{ capturedAt: 'desc' }, { createdAt: 'desc' }],
    take: 1,
  },
  powerProfile: {
    include: {
      peaks: { orderBy: [{ sortOrder: 'asc' }] },
    },
  },
  media: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  },
  _count: {
    select: { follows: true },
  },
} satisfies Prisma.AthleteProfileInclude;

export type AthleteProfileRead = Prisma.AthleteProfileGetPayload<{
  include: typeof athleteProfileReadInclude;
}>;

type DraftMutationResult =
  | { stale: false; profile: AthleteProfileRead }
  | { stale: true; profile: null };

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
        profileStatus: AthleteProfileStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  findPublicBySlug(athleteSlug: string): Promise<AthleteProfileRead | null> {
    return this.prisma.athleteProfile.findFirst({
      where: {
        athleteSlug,
        profileStatus: AthleteProfileStatus.PUBLISHED,
        publishedAt: { not: null },
        deletedAt: null,
      },
      include: athleteProfileReadInclude,
    });
  }

  findAnyBySlug(athleteSlug: string): Promise<AthleteProfile | null> {
    return this.prisma.athleteProfile.findFirst({
      where: { athleteSlug, deletedAt: null },
    });
  }

  findByUserId(userId: string): Promise<AthleteProfile | null> {
    return this.prisma.athleteProfile.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  findDraftByUserId(userId: string): Promise<AthleteProfileRead | null> {
    return this.prisma.athleteProfile.findFirst({
      where: { userId, deletedAt: null },
      include: athleteProfileReadInclude,
    });
  }

  async findOrCreateDraftByUserId(userId: string): Promise<AthleteProfileRead> {
    const existing = await this.findDraftByUserId(userId);
    if (existing) return existing;

    try {
      return await this.prisma.athleteProfile.create({
        data: {
          userId,
          profileStatus: AthleteProfileStatus.DRAFT,
        },
        include: athleteProfileReadInclude,
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      const createdByConcurrentRequest = await this.findDraftByUserId(userId);
      if (!createdByConcurrentRequest) throw error;
      return createdByConcurrentRequest;
    }
  }

  async upsertDraftForUser(
    userId: string,
    input: UpsertAthleteProfileDraftRequest
  ): Promise<DraftMutationResult> {
    const existing = await this.findDraftByUserId(userId);
    if (!existing) {
      const profile = await this.prisma.$transaction(async (tx) => {
        const created = await tx.athleteProfile.create({
          data: {
            ...buildDraftCreateData(input),
            userId,
            profileStatus: AthleteProfileStatus.DRAFT,
          },
          include: athleteProfileReadInclude,
        });
        await replaceDraftSections(tx, created.id, input);
        return tx.athleteProfile.findUniqueOrThrow({
          where: { id: created.id },
          include: athleteProfileReadInclude,
        });
      });
      return { stale: false, profile };
    }

    const profile = await this.prisma.$transaction(async (tx) => {
      const result = await tx.athleteProfile.updateMany({
        where: {
          id: existing.id,
          ...(input.expectedProfileVersion !== undefined
            ? { profileVersion: input.expectedProfileVersion }
            : {}),
        },
        data: {
          ...buildDraftUpdateData(input),
          profileStatus: AthleteProfileStatus.DRAFT,
          publishedAt: null,
          profileVersion: { increment: 1 },
        },
      });

      if (result.count === 0) return null;

      await replaceDraftSections(tx, existing.id, input);
      return tx.athleteProfile.findUniqueOrThrow({
        where: { id: existing.id },
        include: athleteProfileReadInclude,
      });
    });

    if (!profile) return { stale: true, profile: null };
    return { stale: false, profile };
  }

  async publish(
    athleteId: string,
    expectedProfileVersion?: number
  ): Promise<DraftMutationResult> {
    const profile = await this.prisma.$transaction(async (tx) => {
      const result = await tx.athleteProfile.updateMany({
        where: {
          id: athleteId,
          deletedAt: null,
          ...(expectedProfileVersion !== undefined
            ? { profileVersion: expectedProfileVersion }
            : {}),
        },
        data: {
          profileStatus: AthleteProfileStatus.PUBLISHED,
          publishedAt: new Date(),
          profileVersion: { increment: 1 },
        },
      });

      if (result.count === 0) return null;

      return tx.athleteProfile.findUniqueOrThrow({
        where: { id: athleteId },
        include: athleteProfileReadInclude,
      });
    });

    if (!profile) return { stale: true, profile: null };
    return { stale: false, profile };
  }

  isFollowedByUser(userId: string, athleteId: string): Promise<boolean> {
    return this.prisma.athleteFollow
      .findUnique({
        where: { userId_athleteId: { userId, athleteId } },
        select: { id: true },
      })
      .then(Boolean);
  }

  async listDirectory(filters: {
    primarySport?: SportCategory;
    countryCode?: string;
    search?: string;
    limit: number;
  }): Promise<AthleteProfile[]> {
    const where: Prisma.AthleteProfileWhereInput = {
      deletedAt: null,
      profileStatus: AthleteProfileStatus.PUBLISHED,
      athleteSlug: { not: null },
      fullName: { not: null },
      primarySport: { not: null },
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

type DraftProfileCreateData = Pick<
  Prisma.AthleteProfileUncheckedCreateInput,
  | 'athleteSlug'
  | 'fullName'
  | 'headline'
  | 'tagline'
  | 'primarySport'
  | 'secondarySports'
  | 'athleteLevel'
  | 'disciplineLabel'
  | 'hometown'
  | 'countryCode'
  | 'heroMediaUrl'
  | 'profileImageUrl'
  | 'socialInstagramHandle'
  | 'socialTwitterHandle'
  | 'socialStravaUrl'
  | 'values'
  | 'storyIntro'
  | 'storyBody'
  | 'arcSubtitle'
  | 'roadmapTitle'
  | 'supportEnabled'
  | 'backCtaBlurb'
>;

function buildDraftCreateData(input: UpsertAthleteProfileDraftRequest): DraftProfileCreateData {
  return {
    athleteSlug: input.athleteSlug,
    fullName: input.fullName,
    headline: input.headline,
    tagline: input.tagline,
    primarySport: input.primarySport,
    secondarySports: input.secondarySports ?? [],
    athleteLevel: input.athleteLevel,
    disciplineLabel: input.disciplineLabel,
    hometown: input.hometown,
    countryCode: input.countryCode,
    heroMediaUrl: input.heroMediaUrl,
    profileImageUrl: input.profileImageUrl,
    socialInstagramHandle: input.socialInstagramHandle,
    socialTwitterHandle: input.socialTwitterHandle,
    socialStravaUrl: input.socialStravaUrl,
    values: input.values ?? [],
    storyIntro: input.story?.intro,
    storyBody: input.story?.body ?? [],
    arcSubtitle: input.arcSubtitle,
    roadmapTitle: input.roadmapTitle,
    supportEnabled: input.supportEnabled ?? false,
    backCtaBlurb: input.backCtaBlurb,
  };
}

function buildDraftUpdateData(
  input: UpsertAthleteProfileDraftRequest
): Prisma.AthleteProfileUncheckedUpdateManyInput {
  const data: Prisma.AthleteProfileUncheckedUpdateManyInput = {};
  setIfPresent(data, input, 'athleteSlug');
  setIfPresent(data, input, 'fullName');
  setIfPresent(data, input, 'headline');
  setIfPresent(data, input, 'tagline');
  setIfPresent(data, input, 'primarySport');
  setIfPresent(data, input, 'secondarySports');
  setIfPresent(data, input, 'athleteLevel');
  setIfPresent(data, input, 'disciplineLabel');
  setIfPresent(data, input, 'hometown');
  setIfPresent(data, input, 'countryCode');
  setIfPresent(data, input, 'heroMediaUrl');
  setIfPresent(data, input, 'profileImageUrl');
  setIfPresent(data, input, 'socialInstagramHandle');
  setIfPresent(data, input, 'socialTwitterHandle');
  setIfPresent(data, input, 'socialStravaUrl');
  setIfPresent(data, input, 'values');
  setIfPresent(data, input, 'arcSubtitle');
  setIfPresent(data, input, 'roadmapTitle');
  setIfPresent(data, input, 'supportEnabled');
  setIfPresent(data, input, 'backCtaBlurb');

  if (input.story !== undefined) {
    data.storyIntro = input.story.intro;
    data.storyBody = input.story.body;
  }

  return data;
}

function setIfPresent<
  TKey extends keyof UpsertAthleteProfileDraftRequest &
    keyof Prisma.AthleteProfileUncheckedUpdateManyInput,
>(
  data: Prisma.AthleteProfileUncheckedUpdateManyInput,
  input: UpsertAthleteProfileDraftRequest,
  key: TKey
): void {
  if (input[key] !== undefined) {
    data[key] = input[key] as never;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
