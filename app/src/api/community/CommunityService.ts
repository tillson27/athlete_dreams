import { injectable } from 'tsyringe';
import type {
  CommunityFeedItem,
  CommunityFeedQuery,
  CommunityFeedResponse,
  CommunityReactionRequest,
  CommunityReactionResponse,
} from 'fad-common';
import { CommunityRepository } from '../../repositories/CommunityRepository';
import {
  compareCommunityFeedRecords,
  communityFeedTargetKey,
  isCommunityFeedTargetType,
  type CommunityFeedCursor,
  type CommunityFeedRecord,
  type CommunityFeedTarget,
} from '../../repositories/communityFeedRecords';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../shared/errors';

@injectable()
export class CommunityService {
  constructor(private readonly communityRepository: CommunityRepository) {}

  async listFeed(
    query: CommunityFeedQuery,
    viewerUserId: string | undefined
  ): Promise<CommunityFeedResponse> {
    if (query.scope === 'FOLLOWING' && !viewerUserId) {
      throw new UnauthorizedError('Following feed requires authentication');
    }

    const cursor = query.cursor ? decodeFeedCursor(query.cursor) : undefined;
    const records = await this.communityRepository.listFeedRecords({
      scope: query.scope,
      viewerUserId,
      sport: query.sport,
      category: query.category,
      athleteSlug: query.athleteSlug,
      perSourceLimit: query.limit + 1,
      cursor,
    });

    const sortedRecords = records.sort(compareCommunityFeedRecords);
    const pageRecords = sortedRecords.slice(0, query.limit);
    const hasMore = sortedRecords.length > query.limit;
    const targets = pageRecords.map(toFeedTarget);
    const [reactionCounts, viewerReactions] = await Promise.all([
      this.communityRepository.getReactionCountsForTargets(targets),
      this.communityRepository.getViewerReactionsForTargets(viewerUserId, targets),
    ]);

    return {
      items: pageRecords.map((record) =>
        toFeedItem(record, reactionCounts, viewerReactions)
      ),
      nextCursor:
        hasMore && pageRecords.length > 0
          ? encodeFeedCursor(pageRecords[pageRecords.length - 1])
          : null,
    };
  }

  async cheer(
    userId: string,
    input: CommunityReactionRequest
  ): Promise<CommunityReactionResponse> {
    const target = toReactionTarget(input);
    await this.ensureTargetExists(target);
    const reactionCount = await this.communityRepository.upsertReaction(
      userId,
      target,
      input.reactionKind
    );

    return {
      targetType: target.targetType,
      targetId: target.targetId,
      reactionKind: input.reactionKind,
      hasReacted: true,
      reactionCount,
    };
  }

  async uncheer(
    userId: string,
    input: CommunityReactionRequest
  ): Promise<CommunityReactionResponse> {
    const target = toReactionTarget(input);
    await this.ensureTargetExists(target);
    const reactionCount = await this.communityRepository.deleteReaction(
      userId,
      target,
      input.reactionKind
    );

    return {
      targetType: target.targetType,
      targetId: target.targetId,
      reactionKind: input.reactionKind,
      hasReacted: false,
      reactionCount,
    };
  }

  private async ensureTargetExists(target: CommunityFeedTarget): Promise<void> {
    const exists = await this.communityRepository.targetExists(target);
    if (!exists) throw new NotFoundError('Community feed target');
  }
}

function toFeedItem(
  record: CommunityFeedRecord,
  reactionCounts: Map<string, number>,
  viewerReactions: Map<string, CommunityReactionRequest['reactionKind']>
): CommunityFeedItem {
  const target = toFeedTarget(record);
  const targetKey = communityFeedTargetKey(target);

  return {
    communityFeedItemId: targetKey,
    targetType: record.targetType,
    targetId: record.targetId,
    athleteId: record.athleteId,
    athleteSlug: record.athleteSlug,
    athleteName: record.athleteName,
    athleteAvatarUrl: record.athleteAvatarUrl,
    primarySport: record.primarySport,
    disciplineLabel: record.disciplineLabel,
    feedKind: record.feedKind,
    feedCategory: record.feedCategory,
    headline: record.headline,
    detail: record.detail,
    photoUrl: record.photoUrl,
    occurredAt: record.occurredAt.toISOString(),
    sourceLinks: record.sourceLinks,
    verificationStatus: record.verificationStatus,
    cheerCount: reactionCounts.get(targetKey) ?? 0,
    viewerReactionKind: viewerReactions.get(targetKey) ?? null,
  };
}

function toFeedTarget(record: CommunityFeedRecord): CommunityFeedTarget {
  return {
    targetType: record.targetType,
    targetId: record.targetId,
  };
}

function toReactionTarget(input: CommunityReactionRequest): CommunityFeedTarget {
  return {
    targetType: input.targetType,
    targetId: input.targetId,
  };
}

function encodeFeedCursor(record: CommunityFeedRecord): string {
  return Buffer.from(
    JSON.stringify({
      occurredAt: record.occurredAt.toISOString(),
      targetType: record.targetType,
      targetId: record.targetId,
    }),
    'utf8'
  ).toString('base64url');
}

function decodeFeedCursor(cursor: string): CommunityFeedCursor {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      occurredAt?: unknown;
      targetType?: unknown;
      targetId?: unknown;
    };

    if (
      typeof decoded.occurredAt !== 'string' ||
      typeof decoded.targetType !== 'string' ||
      !isCommunityFeedTargetType(decoded.targetType) ||
      typeof decoded.targetId !== 'string'
    ) {
      throw new Error('Invalid cursor payload');
    }

    const occurredAt = new Date(decoded.occurredAt);
    if (Number.isNaN(occurredAt.getTime())) {
      throw new Error('Invalid cursor timestamp');
    }

    return {
      occurredAt,
      targetType: decoded.targetType as CommunityFeedCursor['targetType'],
      targetId: decoded.targetId,
    };
  } catch {
    throw new BadRequestError('Invalid community feed cursor');
  }
}
