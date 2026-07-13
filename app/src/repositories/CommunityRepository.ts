import { injectable } from 'tsyringe';
import {
  AthleteProfileStatus,
  AthleteResultKind,
  CommunityFeedTargetType as PrismaCommunityFeedTargetType,
  ReactionKind as PrismaReactionKind,
  Prisma,
  VerificationStatus as PrismaVerificationStatus,
} from '@prisma/client';
import {
  CommunityFeedCategory as CommunityFeedCategoryEnum,
  CommunityFeedTargetType as CommunityFeedTargetTypeEnum,
  ReactionKind as ReactionKindEnum,
  type CommunityFeedCategory,
  type CommunityFeedTargetType,
  type ReactionKind,
  type SportCategory,
} from 'fad-common';
import { PrismaService } from '../services/infrastructure/PrismaService';
import {
  compareTargetTypes,
  communityFeedTargetKey,
  feedAthleteSelect,
  toEventFeedRecord,
  toProfileMilestoneFeedRecord,
  toResultFeedRecord,
  toTrainingSnapshotFeedRecord,
  type CommunityFeedCursor,
  type CommunityFeedRecord,
  type CommunityFeedTarget,
} from './communityFeedRecords';

export type { CommunityFeedCursor, CommunityFeedRecord, CommunityFeedTarget };

export type CommunityFeedListFilters = {
  scope: 'EVERYONE' | 'FOLLOWING';
  viewerUserId?: string;
  sport?: SportCategory;
  category?: CommunityFeedCategory;
  athleteSlug?: string;
  perSourceLimit: number;
  cursor?: CommunityFeedCursor;
};

@injectable()
export class CommunityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listFeedRecords(filters: CommunityFeedListFilters): Promise<CommunityFeedRecord[]> {
    const athleteWhere = buildPublishedAthleteWhere(filters);
    const [results, events, trainingSnapshots, milestones] = await Promise.all([
      shouldQueryResults(filters.category)
        ? this.listResultRecords(filters, athleteWhere)
        : Promise.resolve([]),
      shouldQueryEvents(filters.category)
        ? this.listEventRecords(filters, athleteWhere)
        : Promise.resolve([]),
      shouldQueryTrainingSnapshots(filters.category)
        ? this.listTrainingSnapshotRecords(filters, athleteWhere)
        : Promise.resolve([]),
      shouldQueryProfileMilestones(filters.category)
        ? this.listProfileMilestoneRecords(filters, athleteWhere)
        : Promise.resolve([]),
    ]);

    return [...results, ...events, ...trainingSnapshots, ...milestones];
  }

  async targetExists(target: CommunityFeedTarget): Promise<boolean> {
    const athleteWhere = buildPublishedAthleteWhere({
      scope: 'EVERYONE',
    });
    const targetId = target.targetId;

    if (target.targetType === CommunityFeedTargetTypeEnum.AthleteResult) {
      const result = await this.prisma.athleteResult.findFirst({
        where: {
          id: targetId,
          deletedAt: null,
          verificationStatus: PrismaVerificationStatus.VERIFIED,
          athlete: { is: athleteWhere },
        },
        select: { id: true },
      });
      return Boolean(result);
    }

    if (target.targetType === CommunityFeedTargetTypeEnum.AthleteEvent) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const event = await this.prisma.athleteEvent.findFirst({
        where: {
          id: targetId,
          deletedAt: null,
          OR: [{ eventStartDate: null }, { eventStartDate: { gte: today } }],
          athlete: { is: athleteWhere },
        },
        select: { id: true },
      });
      return Boolean(event);
    }

    if (target.targetType === CommunityFeedTargetTypeEnum.AthleteTrainingSnapshot) {
      const snapshot = await this.prisma.athleteTrainingSnapshot.findFirst({
        where: {
          id: targetId,
          deletedAt: null,
          athlete: { is: athleteWhere },
        },
        select: { id: true },
      });
      return Boolean(snapshot);
    }

    const milestone = await this.prisma.athleteProfileMilestone.findFirst({
      where: {
        id: targetId,
        deletedAt: null,
        athlete: { is: athleteWhere },
      },
      select: { id: true },
    });
    return Boolean(milestone);
  }

  async getReactionCountsForTargets(
    targets: CommunityFeedTarget[]
  ): Promise<Map<string, number>> {
    if (targets.length === 0) return new Map();

    const groupedReactions = await this.prisma.communityReaction.groupBy({
      by: ['targetType', 'targetId'],
      where: {
        OR: targets.map((target) => ({
          targetType: toPrismaTargetType(target.targetType),
          targetId: target.targetId,
        })),
        reactionKind: PrismaReactionKind.CHEER,
      },
      _count: { _all: true },
    });

    return new Map(
      groupedReactions.map((reaction) => [
        communityFeedTargetKey(reaction),
        reaction._count._all,
      ])
    );
  }

  async getViewerReactionsForTargets(
    userId: string | undefined,
    targets: CommunityFeedTarget[]
  ): Promise<Map<string, ReactionKind>> {
    if (!userId || targets.length === 0) return new Map();

    const reactions = await this.prisma.communityReaction.findMany({
      where: {
        userId,
        OR: targets.map((target) => ({
          targetType: toPrismaTargetType(target.targetType),
          targetId: target.targetId,
        })),
      },
      select: {
        targetType: true,
        targetId: true,
        reactionKind: true,
      },
    });

    return new Map(
      reactions.map((reaction) => [
        communityFeedTargetKey(reaction),
        reaction.reactionKind as ReactionKind,
      ])
    );
  }

  async upsertReaction(
    userId: string,
    target: CommunityFeedTarget,
    reactionKind: ReactionKind
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      await tx.communityReaction.upsert({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: toPrismaTargetType(target.targetType),
            targetId: target.targetId,
          },
        },
        update: {
          reactionKind: toPrismaReactionKind(reactionKind),
        },
        create: {
          userId,
          targetType: toPrismaTargetType(target.targetType),
          targetId: target.targetId,
          reactionKind: toPrismaReactionKind(reactionKind),
        },
      });

      return tx.communityReaction.count({
        where: {
          targetType: toPrismaTargetType(target.targetType),
          targetId: target.targetId,
          reactionKind: toPrismaReactionKind(reactionKind),
        },
      });
    });
  }

  async deleteReaction(
    userId: string,
    target: CommunityFeedTarget,
    reactionKind: ReactionKind
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      await tx.communityReaction.deleteMany({
        where: {
          userId,
          targetType: toPrismaTargetType(target.targetType),
          targetId: target.targetId,
          reactionKind: toPrismaReactionKind(reactionKind),
        },
      });

      return tx.communityReaction.count({
        where: {
          targetType: toPrismaTargetType(target.targetType),
          targetId: target.targetId,
          reactionKind: toPrismaReactionKind(reactionKind),
        },
      });
    });
  }

  private async listResultRecords(
    filters: CommunityFeedListFilters,
    athleteWhere: Prisma.AthleteProfileWhereInput
  ): Promise<CommunityFeedRecord[]> {
    const resultWhere: Prisma.AthleteResultWhereInput = {
      AND: [
        { deletedAt: null, athlete: { is: athleteWhere } },
        { verificationStatus: PrismaVerificationStatus.VERIFIED },
        buildResultKindWhere(filters.category),
        buildCursorWhere(
          'createdAt',
          CommunityFeedTargetTypeEnum.AthleteResult,
          filters.cursor
        ),
      ],
    };

    const results = await this.prisma.athleteResult.findMany({
      where: resultWhere,
      include: {
        athlete: { select: feedAthleteSelect },
        sourceLinks: { orderBy: [{ sortOrder: 'asc' }] },
        media: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          take: 1,
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: filters.perSourceLimit,
    });

    return results.map(toResultFeedRecord);
  }

  private async listEventRecords(
    filters: CommunityFeedListFilters,
    athleteWhere: Prisma.AthleteProfileWhereInput
  ): Promise<CommunityFeedRecord[]> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const events = await this.prisma.athleteEvent.findMany({
      where: {
        AND: [
          { deletedAt: null, athlete: { is: athleteWhere } },
          { OR: [{ eventStartDate: null }, { eventStartDate: { gte: today } }] },
          buildCursorWhere(
            'createdAt',
            CommunityFeedTargetTypeEnum.AthleteEvent,
            filters.cursor
          ),
        ],
      },
      include: {
        athlete: { select: feedAthleteSelect },
        sourceLinks: { orderBy: [{ sortOrder: 'asc' }] },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: filters.perSourceLimit,
    });

    return events.map(toEventFeedRecord);
  }

  private async listTrainingSnapshotRecords(
    filters: CommunityFeedListFilters,
    athleteWhere: Prisma.AthleteProfileWhereInput
  ): Promise<CommunityFeedRecord[]> {
    const snapshots = await this.prisma.athleteTrainingSnapshot.findMany({
      where: {
        AND: [
          { deletedAt: null, athlete: { is: athleteWhere } },
          buildCursorWhere(
            'capturedAt',
            CommunityFeedTargetTypeEnum.AthleteTrainingSnapshot,
            filters.cursor
          ),
        ],
      },
      include: {
        athlete: { select: feedAthleteSelect },
      },
      orderBy: [{ capturedAt: 'desc' }, { id: 'asc' }],
      take: filters.perSourceLimit,
    });

    return snapshots.map(toTrainingSnapshotFeedRecord);
  }

  private async listProfileMilestoneRecords(
    filters: CommunityFeedListFilters,
    athleteWhere: Prisma.AthleteProfileWhereInput
  ): Promise<CommunityFeedRecord[]> {
    const milestones = await this.prisma.athleteProfileMilestone.findMany({
      where: {
        AND: [
          { deletedAt: null, athlete: { is: athleteWhere } },
          buildCursorWhere(
            'occurredAt',
            CommunityFeedTargetTypeEnum.AthleteProfileMilestone,
            filters.cursor
          ),
        ],
      },
      include: {
        athlete: { select: feedAthleteSelect },
      },
      orderBy: [{ occurredAt: 'desc' }, { id: 'asc' }],
      take: filters.perSourceLimit,
    });

    return milestones.map(toProfileMilestoneFeedRecord);
  }
}

function buildPublishedAthleteWhere(
  filters: Pick<
    CommunityFeedListFilters,
    'scope' | 'viewerUserId' | 'sport' | 'athleteSlug'
  >
): Prisma.AthleteProfileWhereInput {
  return {
    profileStatus: AthleteProfileStatus.PUBLISHED,
    publishedAt: { not: null },
    deletedAt: null,
    athleteSlug: filters.athleteSlug ?? { not: null },
    fullName: { not: null },
    primarySport: filters.sport ?? { not: null },
    ...(filters.scope === 'FOLLOWING' && filters.viewerUserId
      ? { follows: { some: { userId: filters.viewerUserId } } }
      : {}),
  };
}

function shouldQueryResults(category: CommunityFeedCategory | undefined): boolean {
  return (
    category === undefined ||
    category === CommunityFeedCategoryEnum.Race ||
    category === CommunityFeedCategoryEnum.Milestone
  );
}

function shouldQueryEvents(category: CommunityFeedCategory | undefined): boolean {
  return category === undefined || category === CommunityFeedCategoryEnum.Roadmap;
}

function shouldQueryTrainingSnapshots(category: CommunityFeedCategory | undefined): boolean {
  return category === undefined || category === CommunityFeedCategoryEnum.Training;
}

function shouldQueryProfileMilestones(category: CommunityFeedCategory | undefined): boolean {
  return category === undefined || category === CommunityFeedCategoryEnum.Milestone;
}

function buildResultKindWhere(
  category: CommunityFeedCategory | undefined
): Prisma.AthleteResultWhereInput {
  if (category === CommunityFeedCategoryEnum.Race) {
    return { resultKind: AthleteResultKind.RACE };
  }

  if (category === CommunityFeedCategoryEnum.Milestone) {
    return {
      resultKind: {
        in: [AthleteResultKind.HIGHLIGHT, AthleteResultKind.MILESTONE],
      },
    };
  }

  return {};
}

function buildCursorWhere<TWhere>(
  dateFieldName: string,
  targetType: CommunityFeedTargetType,
  cursor: CommunityFeedCursor | undefined
): TWhere {
  if (!cursor) return {} as TWhere;

  const targetTypeDelta = compareTargetTypes(targetType, cursor.targetType);
  if (targetTypeDelta > 0) {
    return {
      [dateFieldName]: { lte: cursor.occurredAt },
    } as TWhere;
  }

  if (targetTypeDelta < 0) {
    return {
      [dateFieldName]: { lt: cursor.occurredAt },
    } as TWhere;
  }

  return {
    OR: [
      { [dateFieldName]: { lt: cursor.occurredAt } },
      {
        [dateFieldName]: cursor.occurredAt,
        id: { gt: cursor.targetId },
      },
    ],
  } as TWhere;
}

function toPrismaTargetType(
  targetType: CommunityFeedTargetType
): PrismaCommunityFeedTargetType {
  return targetType as PrismaCommunityFeedTargetType;
}

function toPrismaReactionKind(reactionKind: ReactionKind): PrismaReactionKind {
  if (reactionKind === ReactionKindEnum.Cheer) return PrismaReactionKind.CHEER;
  return reactionKind as PrismaReactionKind;
}
