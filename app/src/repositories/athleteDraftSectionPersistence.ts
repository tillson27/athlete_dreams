import {
  AthleteMediaRole,
  MediaKind,
  Prisma,
  VerificationStatus,
} from '@prisma/client';
import type { UpsertAthleteProfileDraftRequest } from 'fad-common';

export async function replaceDraftSections(
  tx: Prisma.TransactionClient,
  athleteId: string,
  input: UpsertAthleteProfileDraftRequest
): Promise<void> {
  if (input.coreValues !== undefined) {
    await tx.athleteCoreValue.deleteMany({ where: { athleteId } });
    if (input.coreValues.length > 0) {
      await tx.athleteCoreValue.createMany({
        data: input.coreValues.map((value, sortOrder) => ({
          athleteId,
          title: value.title,
          body: value.body,
          sortOrder,
        })),
      });
    }
  }

  if (input.storyChapters !== undefined) {
    await tx.athleteStoryChapter.deleteMany({ where: { athleteId } });
    if (input.storyChapters.length > 0) {
      await tx.athleteStoryChapter.createMany({
        data: input.storyChapters.map((chapter, index) => ({
          athleteId,
          eraLabel: chapter.eraLabel,
          title: chapter.title,
          body: chapter.body,
          chapterIcon: chapter.chapterIcon,
          chapterTone: chapter.chapterTone,
          imageUrl: chapter.imageUrl ?? null,
          isCurrent: chapter.isCurrent ?? false,
          sortOrder: chapter.sortOrder ?? index,
        })),
      });
    }
  }

  if (input.personalBests !== undefined) {
    await tx.athletePersonalBest.deleteMany({ where: { athleteId } });
    if (input.personalBests.length > 0) {
      await tx.athletePersonalBest.createMany({
        data: input.personalBests.map((best, index) => ({
          athleteId,
          label: best.label,
          value: best.value,
          sourceUrl: best.sourceUrl ?? null,
          verificationStatus: VerificationStatus.UNVERIFIED,
          sortOrder: best.sortOrder ?? index,
        })),
      });
    }
  }

  if (input.results !== undefined) {
    await tx.athleteMedia.deleteMany({
      where: { athleteId, mediaRole: AthleteMediaRole.RESULT },
    });
    await tx.athleteResult.deleteMany({ where: { athleteId } });
    for (const [index, result] of input.results.entries()) {
      const created = await tx.athleteResult.create({
        data: {
          athleteId,
          resultKind: result.resultKind,
          title: result.title,
          resultText: result.resultText,
          eventDate: result.eventDate ? new Date(result.eventDate) : null,
          eventDateLabel: result.eventDateLabel ?? null,
          verificationStatus: VerificationStatus.UNVERIFIED,
          sortOrder: result.sortOrder ?? index,
          sourceLinks:
            result.sourceLinks && result.sourceLinks.length > 0
              ? {
                  create: result.sourceLinks.map((link, sortOrder) => ({
                    label: link.label,
                    href: link.href,
                    sortOrder,
                  })),
                }
              : undefined,
        },
      });

      if (result.mediaUrls && result.mediaUrls.length > 0) {
        await tx.athleteMedia.createMany({
          data: result.mediaUrls.map((mediaUrl, sortOrder) => ({
            athleteId,
            mediaUrl,
            mediaKind: MediaKind.IMAGE,
            mediaRole: AthleteMediaRole.RESULT,
            relatedAthleteResultId: created.id,
            sortOrder,
          })),
        });
      }
    }
  }

  if (input.roadmapEvents !== undefined) {
    await tx.athleteEvent.deleteMany({ where: { athleteId } });
    for (const [index, event] of input.roadmapEvents.entries()) {
      await tx.athleteEvent.create({
        data: {
          athleteId,
          eventName: event.eventName,
          eventLocation: event.eventLocation ?? null,
          eventStartDate: event.eventDate ? new Date(event.eventDate) : null,
          eventDateLabel: event.eventDateLabel,
          sortOrder: event.sortOrder ?? index,
          sourceLinks:
            event.sourceLinks && event.sourceLinks.length > 0
              ? {
                  create: event.sourceLinks.map((link, sortOrder) => ({
                    label: link.label,
                    href: link.href,
                    sortOrder,
                  })),
                }
              : undefined,
        },
      });
    }
  }

  if (input.trainingSnapshot !== undefined) {
    await tx.athleteTrainingSnapshot.deleteMany({ where: { athleteId } });
    if (input.trainingSnapshot) {
      await tx.athleteTrainingSnapshot.create({
        data: {
          athleteId,
          weeklyDistanceLabel: input.trainingSnapshot.weeklyDistanceLabel ?? null,
          weeklyTimeLabel: input.trainingSnapshot.weeklyTimeLabel ?? null,
          weeklyElevationGainLabel:
            input.trainingSnapshot.weeklyElevationGainLabel ?? null,
          weeklyLoadLabel: input.trainingSnapshot.weeklyLoadLabel ?? null,
          latestSessionTitle: input.trainingSnapshot.latestSessionTitle ?? null,
          latestSessionMeta: input.trainingSnapshot.latestSessionMeta ?? null,
          capturedAt: input.trainingSnapshot.capturedAt
            ? new Date(input.trainingSnapshot.capturedAt)
            : new Date(),
        },
      });
    }
  }

  if (input.powerProfile !== undefined) {
    await tx.athletePowerProfile.deleteMany({ where: { athleteId } });
    if (input.powerProfile) {
      await tx.athletePowerProfile.create({
        data: {
          athleteId,
          ftpWatts: input.powerProfile.ftpWatts,
          wattsPerKg: input.powerProfile.wattsPerKg,
          riderWeight: input.powerProfile.riderWeight,
          riderType: input.powerProfile.riderType,
          peaks:
            input.powerProfile.peaks.length > 0
              ? {
                  create: input.powerProfile.peaks.map((peak, sortOrder) => ({
                    label: peak.label,
                    watts: peak.watts,
                    sortOrder,
                  })),
                }
              : undefined,
        },
      });
    }
  }

  if (input.mediaAssets !== undefined) {
    await tx.athleteMedia.deleteMany({ where: { athleteId } });
    if (input.mediaAssets.length > 0) {
      await tx.athleteMedia.createMany({
        data: input.mediaAssets.map((asset, index) => ({
          athleteId,
          mediaKind: asset.mediaKind,
          mediaRole: asset.mediaRole,
          mediaUrl: asset.mediaUrl,
          thumbnailUrl: asset.thumbnailUrl ?? null,
          altText: asset.altText ?? null,
          caption: asset.caption ?? null,
          durationLabel: asset.durationLabel ?? null,
          relatedAthleteResultId: asset.relatedAthleteResultId ?? null,
          relatedStoryChapterId: asset.relatedStoryChapterId ?? null,
          sortOrder: asset.sortOrder ?? index,
        })),
      });
    }
  }
}
