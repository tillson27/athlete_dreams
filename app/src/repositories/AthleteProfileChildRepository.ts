import { injectable } from 'tsyringe';
import {
  AthleteMediaRole,
  AthleteProfileStatus,
  MediaKind,
  Prisma,
} from '@prisma/client';
import type {
  DeleteAthleteProfileChildRequest,
  ReorderAthleteProfileChildrenRequest,
  UpsertAthleteMediaAssetRequest,
  UpsertAthletePersonalBestRequest,
  UpsertAthleteResultRequest,
  UpsertAthleteRoadmapEventRequest,
  UpsertAthleteStoryChapterRequest,
  UpsertAthleteTrainingSnapshotRequest,
} from 'fad-common';
import { PrismaService } from '../services/infrastructure/PrismaService';
import {
  athleteProfileReadInclude,
  type AthleteProfileRead,
} from './AthleteRepository';

export type AthleteProfileChildMutationResult =
  | { outcome: 'updated'; profile: AthleteProfileRead }
  | { outcome: 'stale' }
  | { outcome: 'not_found'; resource: string }
  | { outcome: 'invalid_order'; actualChildIds: string[] };

type ChildMutationFailure = Exclude<
  AthleteProfileChildMutationResult,
  { outcome: 'updated' } | { outcome: 'stale' }
>;

class ChildMutationAbort extends Error {
  constructor(readonly result: ChildMutationFailure) {
    super('Athlete profile child mutation aborted');
  }
}

@injectable()
export class AthleteProfileChildRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertPersonalBest(
    userId: string,
    input: UpsertAthletePersonalBestRequest,
    athletePersonalBestId?: string
  ): Promise<AthleteProfileChildMutationResult> {
    const childId = athletePersonalBestId ?? input.athletePersonalBestId;
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      if (childId) {
        const result = await tx.athletePersonalBest.updateMany({
          where: { id: childId, athleteId },
          data: {
            label: input.label,
            value: input.value,
            sourceUrl: input.sourceUrl ?? null,
            ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          },
        });
        if (result.count === 0) {
          return { outcome: 'not_found', resource: 'Athlete personal best' };
        }
        return undefined;
      }

      await tx.athletePersonalBest.create({
        data: {
          athleteId,
          label: input.label,
          value: input.value,
          sourceUrl: input.sourceUrl ?? null,
          sortOrder: input.sortOrder ?? (await tx.athletePersonalBest.count({ where: { athleteId } })),
        },
      });
      return undefined;
    });
  }

  deletePersonalBest(
    userId: string,
    athletePersonalBestId: string,
    input: DeleteAthleteProfileChildRequest
  ): Promise<AthleteProfileChildMutationResult> {
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      const result = await tx.athletePersonalBest.deleteMany({
        where: { id: athletePersonalBestId, athleteId },
      });
      return result.count === 0
        ? { outcome: 'not_found', resource: 'Athlete personal best' }
        : undefined;
    });
  }

  reorderPersonalBests(
    userId: string,
    input: ReorderAthleteProfileChildrenRequest
  ): Promise<AthleteProfileChildMutationResult> {
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      const existingIds = await this.listPersonalBestIds(tx, athleteId);
      if (!hasSameIds(existingIds, input.orderedChildIds)) {
        return { outcome: 'invalid_order', actualChildIds: existingIds };
      }
      await Promise.all(
        input.orderedChildIds.map((id, sortOrder) =>
          tx.athletePersonalBest.update({ where: { id }, data: { sortOrder } })
        )
      );
      return undefined;
    });
  }

  upsertResult(
    userId: string,
    input: UpsertAthleteResultRequest,
    athleteResultId?: string
  ): Promise<AthleteProfileChildMutationResult> {
    const childId = athleteResultId ?? input.athleteResultId;
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      if (childId) {
        const result = await tx.athleteResult.updateMany({
          where: { id: childId, athleteId, deletedAt: null },
          data: {
            resultKind: input.resultKind,
            title: input.title,
            resultText: input.resultText,
            eventDate: toOptionalDate(input.eventDate),
            eventDateLabel: input.eventDateLabel ?? null,
            ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          },
        });
        if (result.count === 0) {
          return { outcome: 'not_found', resource: 'Athlete result' };
        }
        await replaceResultSourceLinks(tx, childId, input.sourceLinks ?? []);
        await replaceResultMedia(tx, athleteId, childId, input.mediaUrls ?? []);
        return undefined;
      }

      const created = await tx.athleteResult.create({
        data: {
          athleteId,
          resultKind: input.resultKind,
          title: input.title,
          resultText: input.resultText,
          eventDate: toOptionalDate(input.eventDate),
          eventDateLabel: input.eventDateLabel ?? null,
          sortOrder: input.sortOrder ?? (await tx.athleteResult.count({ where: { athleteId, deletedAt: null } })),
          sourceLinks:
            input.sourceLinks && input.sourceLinks.length > 0
              ? {
                  create: input.sourceLinks.map((link, sortOrder) => ({
                    label: link.label,
                    href: link.href,
                    sortOrder,
                  })),
                }
              : undefined,
        },
      });
      await replaceResultMedia(tx, athleteId, created.id, input.mediaUrls ?? []);
      return undefined;
    });
  }

  deleteResult(
    userId: string,
    athleteResultId: string,
    input: DeleteAthleteProfileChildRequest
  ): Promise<AthleteProfileChildMutationResult> {
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      const existing = await tx.athleteResult.findFirst({
        where: { id: athleteResultId, athleteId, deletedAt: null },
        select: { id: true },
      });
      if (!existing) return { outcome: 'not_found', resource: 'Athlete result' };

      await tx.athleteMedia.deleteMany({ where: { athleteId, relatedAthleteResultId: athleteResultId } });
      await tx.athleteResult.delete({ where: { id: athleteResultId } });
      return undefined;
    });
  }

  reorderResults(
    userId: string,
    input: ReorderAthleteProfileChildrenRequest
  ): Promise<AthleteProfileChildMutationResult> {
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      const existingIds = await this.listResultIds(tx, athleteId);
      if (!hasSameIds(existingIds, input.orderedChildIds)) {
        return { outcome: 'invalid_order', actualChildIds: existingIds };
      }
      await Promise.all(
        input.orderedChildIds.map((id, sortOrder) =>
          tx.athleteResult.update({ where: { id }, data: { sortOrder } })
        )
      );
      return undefined;
    });
  }

  upsertRoadmapEvent(
    userId: string,
    input: UpsertAthleteRoadmapEventRequest,
    athleteRoadmapEventId?: string
  ): Promise<AthleteProfileChildMutationResult> {
    const childId = athleteRoadmapEventId ?? input.athleteRoadmapEventId;
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      if (childId) {
        const result = await tx.athleteEvent.updateMany({
          where: { id: childId, athleteId, deletedAt: null },
          data: {
            eventName: input.eventName,
            eventStartDate: toOptionalDate(input.eventDate),
            eventDateLabel: input.eventDateLabel,
            eventLocation: input.eventLocation ?? null,
            ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          },
        });
        if (result.count === 0) {
          return { outcome: 'not_found', resource: 'Athlete roadmap event' };
        }
        await replaceEventSourceLinks(tx, childId, input.sourceLinks ?? []);
        return undefined;
      }

      await tx.athleteEvent.create({
        data: {
          athleteId,
          eventName: input.eventName,
          eventStartDate: toOptionalDate(input.eventDate),
          eventDateLabel: input.eventDateLabel,
          eventLocation: input.eventLocation ?? null,
          sortOrder: input.sortOrder ?? (await tx.athleteEvent.count({ where: { athleteId, deletedAt: null } })),
          sourceLinks:
            input.sourceLinks && input.sourceLinks.length > 0
              ? {
                  create: input.sourceLinks.map((link, sortOrder) => ({
                    label: link.label,
                    href: link.href,
                    sortOrder,
                  })),
                }
              : undefined,
        },
      });
      return undefined;
    });
  }

  deleteRoadmapEvent(
    userId: string,
    athleteRoadmapEventId: string,
    input: DeleteAthleteProfileChildRequest
  ): Promise<AthleteProfileChildMutationResult> {
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      const result = await tx.athleteEvent.deleteMany({
        where: { id: athleteRoadmapEventId, athleteId, deletedAt: null },
      });
      return result.count === 0
        ? { outcome: 'not_found', resource: 'Athlete roadmap event' }
        : undefined;
    });
  }

  reorderRoadmapEvents(
    userId: string,
    input: ReorderAthleteProfileChildrenRequest
  ): Promise<AthleteProfileChildMutationResult> {
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      const existingIds = await this.listRoadmapEventIds(tx, athleteId);
      if (!hasSameIds(existingIds, input.orderedChildIds)) {
        return { outcome: 'invalid_order', actualChildIds: existingIds };
      }
      await Promise.all(
        input.orderedChildIds.map((id, sortOrder) =>
          tx.athleteEvent.update({ where: { id }, data: { sortOrder } })
        )
      );
      return undefined;
    });
  }

  upsertStoryChapter(
    userId: string,
    input: UpsertAthleteStoryChapterRequest,
    athleteStoryChapterId?: string
  ): Promise<AthleteProfileChildMutationResult> {
    const childId = athleteStoryChapterId ?? input.athleteStoryChapterId;
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      if (childId) {
        const result = await tx.athleteStoryChapter.updateMany({
          where: { id: childId, athleteId, deletedAt: null },
          data: {
            eraLabel: input.eraLabel,
            title: input.title,
            body: input.body,
            chapterIcon: input.chapterIcon,
            chapterTone: input.chapterTone,
            imageUrl: input.imageUrl ?? null,
            isCurrent: input.isCurrent ?? false,
            ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          },
        });
        if (result.count === 0) {
          return { outcome: 'not_found', resource: 'Athlete story chapter' };
        }
        return undefined;
      }

      await tx.athleteStoryChapter.create({
        data: {
          athleteId,
          eraLabel: input.eraLabel,
          title: input.title,
          body: input.body,
          chapterIcon: input.chapterIcon,
          chapterTone: input.chapterTone,
          imageUrl: input.imageUrl ?? null,
          isCurrent: input.isCurrent ?? false,
          sortOrder: input.sortOrder ?? (await tx.athleteStoryChapter.count({ where: { athleteId, deletedAt: null } })),
        },
      });
      return undefined;
    });
  }

  deleteStoryChapter(
    userId: string,
    athleteStoryChapterId: string,
    input: DeleteAthleteProfileChildRequest
  ): Promise<AthleteProfileChildMutationResult> {
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      const result = await tx.athleteStoryChapter.deleteMany({
        where: { id: athleteStoryChapterId, athleteId, deletedAt: null },
      });
      return result.count === 0
        ? { outcome: 'not_found', resource: 'Athlete story chapter' }
        : undefined;
    });
  }

  reorderStoryChapters(
    userId: string,
    input: ReorderAthleteProfileChildrenRequest
  ): Promise<AthleteProfileChildMutationResult> {
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      const existingIds = await this.listStoryChapterIds(tx, athleteId);
      if (!hasSameIds(existingIds, input.orderedChildIds)) {
        return { outcome: 'invalid_order', actualChildIds: existingIds };
      }
      await Promise.all(
        input.orderedChildIds.map((id, sortOrder) =>
          tx.athleteStoryChapter.update({ where: { id }, data: { sortOrder } })
        )
      );
      return undefined;
    });
  }

  upsertTrainingSnapshot(
    userId: string,
    input: UpsertAthleteTrainingSnapshotRequest
  ): Promise<AthleteProfileChildMutationResult> {
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      await tx.athleteTrainingSnapshot.deleteMany({ where: { athleteId } });
      await tx.athleteTrainingSnapshot.create({
        data: {
          athleteId,
          weeklyDistanceLabel: input.weeklyDistanceLabel ?? null,
          weeklyTimeLabel: input.weeklyTimeLabel ?? null,
          weeklyElevationGainLabel: input.weeklyElevationGainLabel ?? null,
          weeklyLoadLabel: input.weeklyLoadLabel ?? null,
          latestSessionTitle: input.latestSessionTitle ?? null,
          latestSessionMeta: input.latestSessionMeta ?? null,
          capturedAt: input.capturedAt ? new Date(input.capturedAt) : new Date(),
        },
      });
      return undefined;
    });
  }

  deleteTrainingSnapshot(
    userId: string,
    input: DeleteAthleteProfileChildRequest
  ): Promise<AthleteProfileChildMutationResult> {
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      const result = await tx.athleteTrainingSnapshot.deleteMany({
        where: { athleteId, deletedAt: null },
      });
      return result.count === 0
        ? { outcome: 'not_found', resource: 'Athlete training snapshot' }
        : undefined;
    });
  }

  upsertMediaAsset(
    userId: string,
    input: UpsertAthleteMediaAssetRequest,
    athleteMediaAssetId?: string
  ): Promise<AthleteProfileChildMutationResult> {
    const childId = athleteMediaAssetId ?? input.athleteMediaAssetId;
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      const targetFailure = await this.validateMediaTargets(tx, athleteId, input);
      if (targetFailure) return targetFailure;

      if (childId) {
        const result = await tx.athleteMedia.updateMany({
          where: { id: childId, athleteId, deletedAt: null },
          data: {
            mediaKind: input.mediaKind as MediaKind,
            mediaRole: input.mediaRole as AthleteMediaRole,
            mediaUrl: input.mediaUrl,
            thumbnailUrl: input.thumbnailUrl ?? null,
            altText: input.altText ?? null,
            caption: input.caption ?? null,
            durationLabel: input.durationLabel ?? null,
            relatedAthleteResultId: input.relatedAthleteResultId ?? null,
            relatedStoryChapterId: input.relatedStoryChapterId ?? null,
            ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          },
        });
        if (result.count === 0) {
          return { outcome: 'not_found', resource: 'Athlete media asset' };
        }
        return undefined;
      }

      await tx.athleteMedia.create({
        data: {
          athleteId,
          mediaKind: input.mediaKind as MediaKind,
          mediaRole: input.mediaRole as AthleteMediaRole,
          mediaUrl: input.mediaUrl,
          thumbnailUrl: input.thumbnailUrl ?? null,
          altText: input.altText ?? null,
          caption: input.caption ?? null,
          durationLabel: input.durationLabel ?? null,
          relatedAthleteResultId: input.relatedAthleteResultId ?? null,
          relatedStoryChapterId: input.relatedStoryChapterId ?? null,
          sortOrder: input.sortOrder ?? (await tx.athleteMedia.count({ where: { athleteId, deletedAt: null } })),
        },
      });
      return undefined;
    });
  }

  deleteMediaAsset(
    userId: string,
    athleteMediaAssetId: string,
    input: DeleteAthleteProfileChildRequest
  ): Promise<AthleteProfileChildMutationResult> {
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      const result = await tx.athleteMedia.deleteMany({
        where: { id: athleteMediaAssetId, athleteId, deletedAt: null },
      });
      return result.count === 0
        ? { outcome: 'not_found', resource: 'Athlete media asset' }
        : undefined;
    });
  }

  reorderMediaAssets(
    userId: string,
    input: ReorderAthleteProfileChildrenRequest
  ): Promise<AthleteProfileChildMutationResult> {
    return this.mutateDraftForUser(userId, input.expectedProfileVersion, async (tx, athleteId) => {
      const existingIds = await this.listMediaAssetIds(tx, athleteId);
      if (!hasSameIds(existingIds, input.orderedChildIds)) {
        return { outcome: 'invalid_order', actualChildIds: existingIds };
      }
      await Promise.all(
        input.orderedChildIds.map((id, sortOrder) =>
          tx.athleteMedia.update({ where: { id }, data: { sortOrder } })
        )
      );
      return undefined;
    });
  }

  private async mutateDraftForUser(
    userId: string,
    expectedProfileVersion: number | undefined,
    mutate: (
      tx: Prisma.TransactionClient,
      athleteId: string
    ) => Promise<ChildMutationFailure | undefined>
  ): Promise<AthleteProfileChildMutationResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.athleteProfile.findFirst({
          where: { userId, deletedAt: null },
          select: { id: true },
        });

        if (!existing) {
          if (expectedProfileVersion !== undefined && expectedProfileVersion > 0) {
            return { outcome: 'stale' };
          }

          const created = await tx.athleteProfile.create({
            data: {
              userId,
              profileStatus: AthleteProfileStatus.DRAFT,
              profileVersion: 1,
            },
            select: { id: true },
          });
          const failure = await mutate(tx, created.id);
          if (failure) throw new ChildMutationAbort(failure);
          return this.findProfileById(tx, created.id);
        }

        const versionedUpdate = await tx.athleteProfile.updateMany({
          where: {
            id: existing.id,
            deletedAt: null,
            ...(expectedProfileVersion !== undefined
              ? { profileVersion: expectedProfileVersion }
              : {}),
          },
          data: {
            profileStatus: AthleteProfileStatus.DRAFT,
            publishedAt: null,
            profileVersion: { increment: 1 },
          },
        });

        if (versionedUpdate.count === 0) return { outcome: 'stale' };

        const failure = await mutate(tx, existing.id);
        if (failure) throw new ChildMutationAbort(failure);
        return this.findProfileById(tx, existing.id);
      });
    } catch (error) {
      if (error instanceof ChildMutationAbort) return error.result;
      throw error;
    }
  }

  private async findProfileById(
    tx: Prisma.TransactionClient,
    athleteId: string
  ): Promise<AthleteProfileChildMutationResult> {
    const profile = await tx.athleteProfile.findUniqueOrThrow({
      where: { id: athleteId },
      include: athleteProfileReadInclude,
    });
    return { outcome: 'updated', profile };
  }

  private async listPersonalBestIds(
    tx: Prisma.TransactionClient,
    athleteId: string
  ): Promise<string[]> {
    const records = await tx.athletePersonalBest.findMany({
      where: { athleteId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    return records.map((record) => record.id);
  }

  private async listResultIds(
    tx: Prisma.TransactionClient,
    athleteId: string
  ): Promise<string[]> {
    const records = await tx.athleteResult.findMany({
      where: { athleteId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    return records.map((record) => record.id);
  }

  private async listRoadmapEventIds(
    tx: Prisma.TransactionClient,
    athleteId: string
  ): Promise<string[]> {
    const records = await tx.athleteEvent.findMany({
      where: { athleteId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { eventStartDate: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    return records.map((record) => record.id);
  }

  private async listStoryChapterIds(
    tx: Prisma.TransactionClient,
    athleteId: string
  ): Promise<string[]> {
    const records = await tx.athleteStoryChapter.findMany({
      where: { athleteId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    return records.map((record) => record.id);
  }

  private async listMediaAssetIds(
    tx: Prisma.TransactionClient,
    athleteId: string
  ): Promise<string[]> {
    const records = await tx.athleteMedia.findMany({
      where: { athleteId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    return records.map((record) => record.id);
  }

  private async validateMediaTargets(
    tx: Prisma.TransactionClient,
    athleteId: string,
    input: UpsertAthleteMediaAssetRequest
  ): Promise<ChildMutationFailure | undefined> {
    if (input.relatedAthleteResultId) {
      const result = await tx.athleteResult.findFirst({
        where: { id: input.relatedAthleteResultId, athleteId, deletedAt: null },
        select: { id: true },
      });
      if (!result) return { outcome: 'not_found', resource: 'Related athlete result' };
    }

    if (input.relatedStoryChapterId) {
      const chapter = await tx.athleteStoryChapter.findFirst({
        where: { id: input.relatedStoryChapterId, athleteId, deletedAt: null },
        select: { id: true },
      });
      if (!chapter) return { outcome: 'not_found', resource: 'Related athlete story chapter' };
    }

    return undefined;
  }
}

async function replaceResultSourceLinks(
  tx: Prisma.TransactionClient,
  athleteResultId: string,
  sourceLinks: UpsertAthleteResultRequest['sourceLinks']
): Promise<void> {
  await tx.athleteResultSourceLink.deleteMany({ where: { athleteResultId } });
  if (!sourceLinks || sourceLinks.length === 0) return;
  await tx.athleteResultSourceLink.createMany({
    data: sourceLinks.map((link, sortOrder) => ({
      athleteResultId,
      label: link.label,
      href: link.href,
      sortOrder,
    })),
  });
}

async function replaceEventSourceLinks(
  tx: Prisma.TransactionClient,
  athleteEventId: string,
  sourceLinks: UpsertAthleteRoadmapEventRequest['sourceLinks']
): Promise<void> {
  await tx.athleteEventSourceLink.deleteMany({ where: { athleteEventId } });
  if (!sourceLinks || sourceLinks.length === 0) return;
  await tx.athleteEventSourceLink.createMany({
    data: sourceLinks.map((link, sortOrder) => ({
      athleteEventId,
      label: link.label,
      href: link.href,
      sortOrder,
    })),
  });
}

async function replaceResultMedia(
  tx: Prisma.TransactionClient,
  athleteId: string,
  athleteResultId: string,
  mediaUrls: UpsertAthleteResultRequest['mediaUrls']
): Promise<void> {
  await tx.athleteMedia.deleteMany({ where: { athleteId, relatedAthleteResultId: athleteResultId } });
  if (!mediaUrls || mediaUrls.length === 0) return;
  await tx.athleteMedia.createMany({
    data: mediaUrls.map((mediaUrl, sortOrder) => ({
      athleteId,
      relatedAthleteResultId: athleteResultId,
      mediaUrl,
      mediaKind: MediaKind.IMAGE,
      mediaRole: AthleteMediaRole.RESULT,
      sortOrder,
    })),
  });
}

function toOptionalDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

function hasSameIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  if (rightSet.size !== right.length) return false;
  return left.every((id) => rightSet.has(id));
}
