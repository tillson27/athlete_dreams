import { injectable } from 'tsyringe';
import type {
  AthleteDirectoryItem,
  AthleteDirectoryQuery,
  AthleteProfile as AthleteProfileDto,
  AthleteProfileDraft,
  CreateAthleteProfileRequest,
  DeleteAthleteProfileChildRequest,
  PublicAthleteProfile,
  PublishAthleteProfileRequest,
  PublishAthleteProfileResponse,
  ReorderAthleteProfileChildrenRequest,
  UpsertAthleteProfileDraftRequest,
  UpsertAthleteMediaAssetRequest,
  UpsertAthletePersonalBestRequest,
  UpsertAthleteResultRequest,
  UpsertAthleteRoadmapEventRequest,
  UpsertAthleteStoryChapterRequest,
  UpsertAthleteTrainingSnapshotRequest,
} from 'fad-common';
import { AthleteRepository } from '../../repositories/AthleteRepository';
import {
  AthleteProfileChildRepository,
  type AthleteProfileChildMutationResult,
} from '../../repositories/AthleteProfileChildRepository';
import { CampaignRepository } from '../../repositories/CampaignRepository';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors';
import type { AthleteProfile } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  buildAthleteProfileCompletion,
  canMapPublicAthleteProfile,
  getPublishMissingFieldKeys,
  toAthleteProfileDraft,
  toLegacyAthleteProfileDto,
  toPublicAthleteProfile,
} from './athleteProfileMappers';

type CompletePublicAthleteProfile = AthleteProfile & {
  athleteSlug: string;
  fullName: string;
  primarySport: NonNullable<AthleteProfile['primarySport']>;
};

@injectable()
export class AthleteService {
  constructor(
    private readonly athleteRepository: AthleteRepository,
    private readonly athleteProfileChildRepository: AthleteProfileChildRepository,
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

  async getProfileBySlug(
    athleteSlug: string,
    viewerUserId?: string
  ): Promise<PublicAthleteProfile> {
    const profile = await this.athleteRepository.findPublicBySlug(athleteSlug);
    if (!profile || !canMapPublicAthleteProfile(profile)) {
      throw new NotFoundError('Published athlete profile');
    }

    const viewerIsFollowing = viewerUserId
      ? await this.athleteRepository.isFollowedByUser(viewerUserId, profile.id)
      : null;

    return toPublicAthleteProfile(profile, viewerIsFollowing);
  }

  async getDraftForUser(userId: string): Promise<AthleteProfileDraft> {
    const profile = await this.athleteRepository.findOrCreateDraftByUserId(userId);
    return toAthleteProfileDraft(profile);
  }

  async upsertDraftForUser(
    userId: string,
    input: UpsertAthleteProfileDraftRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureSlugAvailableForUser(input.athleteSlug, userId);

    const existing = await this.athleteRepository.findDraftByUserId(userId);
    if (existing && input.expectedProfileVersion === undefined) {
      throw new ConflictError('expectedProfileVersion is required to update a profile draft', {
        actualProfileVersion: existing.profileVersion,
      });
    }

    if (!existing && input.expectedProfileVersion !== undefined && input.expectedProfileVersion > 0) {
      throw new ConflictError('Athlete profile has been updated since this draft was loaded', {
        expectedProfileVersion: input.expectedProfileVersion,
        actualProfileVersion: null,
      });
    }

    try {
      const result = await this.athleteRepository.upsertDraftForUser(userId, input);
      if (result.stale) {
        return await this.throwStaleProfileConflict(userId, input.expectedProfileVersion);
      }
      return toAthleteProfileDraft(result.profile);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError('Athlete slug is already taken', {
          athleteSlug: input.athleteSlug,
        });
      }
      throw error;
    }
  }

  async publishProfileForUser(
    userId: string,
    input: PublishAthleteProfileRequest
  ): Promise<PublishAthleteProfileResponse> {
    const existing = await this.athleteRepository.findDraftByUserId(userId);
    if (!existing) throw new NotFoundError('Athlete profile draft');

    if (
      input.expectedProfileVersion !== undefined &&
      existing.profileVersion !== input.expectedProfileVersion
    ) {
      throw new ConflictError('Athlete profile has been updated since this draft was loaded', {
        expectedProfileVersion: input.expectedProfileVersion,
        actualProfileVersion: existing.profileVersion,
      });
    }

    const completion = buildAthleteProfileCompletion(existing);
    const missingFieldKeys = getPublishMissingFieldKeys(existing);
    if (missingFieldKeys.length > 0) {
      return {
        profile: null,
        completion,
        published: false,
      };
    }

    if (canMapPublicAthleteProfile(existing)) {
      return {
        profile: toPublicAthleteProfile(existing, null),
        completion,
        published: true,
      };
    }

    try {
      const result = await this.athleteRepository.publish(
        existing.id,
        input.expectedProfileVersion
      );
      if (result.stale) {
        return await this.throwStaleProfileConflict(userId, input.expectedProfileVersion);
      }

      return {
        profile: toPublicAthleteProfile(result.profile, null),
        completion: buildAthleteProfileCompletion(result.profile),
        published: true,
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError('Athlete slug is already taken', {
          athleteSlug: existing.athleteSlug,
        });
      }
      throw error;
    }
  }

  async upsertPersonalBestForUser(
    userId: string,
    input: UpsertAthletePersonalBestRequest,
    athletePersonalBestId?: string
  ): Promise<AthleteProfileDraft> {
    this.assertMatchingChildIds(
      athletePersonalBestId,
      input.athletePersonalBestId,
      'Athlete personal best'
    );
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.upsertPersonalBest(
        userId,
        input,
        athletePersonalBestId
      )
    );
  }

  async deletePersonalBestForUser(
    userId: string,
    athletePersonalBestId: string,
    input: DeleteAthleteProfileChildRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.deletePersonalBest(
        userId,
        athletePersonalBestId,
        input
      )
    );
  }

  async reorderPersonalBestsForUser(
    userId: string,
    input: ReorderAthleteProfileChildrenRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.reorderPersonalBests(userId, input)
    );
  }

  async upsertResultForUser(
    userId: string,
    input: UpsertAthleteResultRequest,
    athleteResultId?: string
  ): Promise<AthleteProfileDraft> {
    this.assertMatchingChildIds(athleteResultId, input.athleteResultId, 'Athlete result');
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.upsertResult(userId, input, athleteResultId)
    );
  }

  async deleteResultForUser(
    userId: string,
    athleteResultId: string,
    input: DeleteAthleteProfileChildRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.deleteResult(userId, athleteResultId, input)
    );
  }

  async reorderResultsForUser(
    userId: string,
    input: ReorderAthleteProfileChildrenRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.reorderResults(userId, input)
    );
  }

  async upsertRoadmapEventForUser(
    userId: string,
    input: UpsertAthleteRoadmapEventRequest,
    athleteRoadmapEventId?: string
  ): Promise<AthleteProfileDraft> {
    this.assertMatchingChildIds(
      athleteRoadmapEventId,
      input.athleteRoadmapEventId,
      'Athlete roadmap event'
    );
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.upsertRoadmapEvent(
        userId,
        input,
        athleteRoadmapEventId
      )
    );
  }

  async deleteRoadmapEventForUser(
    userId: string,
    athleteRoadmapEventId: string,
    input: DeleteAthleteProfileChildRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.deleteRoadmapEvent(
        userId,
        athleteRoadmapEventId,
        input
      )
    );
  }

  async reorderRoadmapEventsForUser(
    userId: string,
    input: ReorderAthleteProfileChildrenRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.reorderRoadmapEvents(userId, input)
    );
  }

  async upsertStoryChapterForUser(
    userId: string,
    input: UpsertAthleteStoryChapterRequest,
    athleteStoryChapterId?: string
  ): Promise<AthleteProfileDraft> {
    this.assertMatchingChildIds(
      athleteStoryChapterId,
      input.athleteStoryChapterId,
      'Athlete story chapter'
    );
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.upsertStoryChapter(
        userId,
        input,
        athleteStoryChapterId
      )
    );
  }

  async deleteStoryChapterForUser(
    userId: string,
    athleteStoryChapterId: string,
    input: DeleteAthleteProfileChildRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.deleteStoryChapter(
        userId,
        athleteStoryChapterId,
        input
      )
    );
  }

  async reorderStoryChaptersForUser(
    userId: string,
    input: ReorderAthleteProfileChildrenRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.reorderStoryChapters(userId, input)
    );
  }

  async upsertTrainingSnapshotForUser(
    userId: string,
    input: UpsertAthleteTrainingSnapshotRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.upsertTrainingSnapshot(userId, input)
    );
  }

  async deleteTrainingSnapshotForUser(
    userId: string,
    input: DeleteAthleteProfileChildRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.deleteTrainingSnapshot(userId, input)
    );
  }

  async upsertMediaAssetForUser(
    userId: string,
    input: UpsertAthleteMediaAssetRequest,
    athleteMediaAssetId?: string
  ): Promise<AthleteProfileDraft> {
    this.assertMatchingChildIds(athleteMediaAssetId, input.athleteMediaAssetId, 'Athlete media asset');
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.upsertMediaAsset(
        userId,
        input,
        athleteMediaAssetId
      )
    );
  }

  async deleteMediaAssetForUser(
    userId: string,
    athleteMediaAssetId: string,
    input: DeleteAthleteProfileChildRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.deleteMediaAsset(
        userId,
        athleteMediaAssetId,
        input
      )
    );
  }

  async reorderMediaAssetsForUser(
    userId: string,
    input: ReorderAthleteProfileChildrenRequest
  ): Promise<AthleteProfileDraft> {
    await this.ensureChildMutationVersion(userId, input.expectedProfileVersion);
    return this.toDraftAfterChildMutation(
      userId,
      input.expectedProfileVersion,
      await this.athleteProfileChildRepository.reorderMediaAssets(userId, input)
    );
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
    return toLegacyAthleteProfileDto(requireCompletePublicProfile(created));
  }

  private async buildDirectoryItem(athlete: AthleteProfile): Promise<AthleteDirectoryItem> {
    const publicAthlete = requireCompletePublicProfile(athlete);
    const [activeCampaignCount, totalRaisedCents] = await Promise.all([
      this.campaignRepository.countActiveForAthlete(publicAthlete.id),
      this.campaignRepository.sumRaisedForAthlete(publicAthlete.id),
    ]);
    return {
      athleteId: publicAthlete.id,
      athleteSlug: publicAthlete.athleteSlug,
      fullName: publicAthlete.fullName,
      headline: publicAthlete.headline,
      primarySport: publicAthlete.primarySport,
      athleteLevel: publicAthlete.athleteLevel,
      disciplineLabel: publicAthlete.disciplineLabel,
      hometown: publicAthlete.hometown,
      countryCode: publicAthlete.countryCode,
      heroMediaUrl: publicAthlete.heroMediaUrl,
      values: publicAthlete.values,
      supportEnabled: publicAthlete.supportEnabled,
      activeCampaignCount,
      totalRaisedCents,
    };
  }

  private async ensureSlugAvailableForUser(
    athleteSlug: string | null | undefined,
    userId: string
  ): Promise<void> {
    if (!athleteSlug) return;
    const existing = await this.athleteRepository.findAnyBySlug(athleteSlug);
    if (existing && existing.userId !== userId) {
      throw new ConflictError('Athlete slug is already taken', { athleteSlug });
    }
  }

  private async ensureChildMutationVersion(
    userId: string,
    expectedProfileVersion: number | undefined
  ): Promise<void> {
    const existing = await this.athleteRepository.findDraftByUserId(userId);
    if (existing && expectedProfileVersion === undefined) {
      throw new ConflictError('expectedProfileVersion is required to update a profile draft', {
        actualProfileVersion: existing.profileVersion,
      });
    }

    if (!existing && expectedProfileVersion !== undefined && expectedProfileVersion > 0) {
      throw new ConflictError('Athlete profile has been updated since this draft was loaded', {
        expectedProfileVersion,
        actualProfileVersion: null,
      });
    }
  }

  private async toDraftAfterChildMutation(
    userId: string,
    expectedProfileVersion: number | undefined,
    result: AthleteProfileChildMutationResult
  ): Promise<AthleteProfileDraft> {
    if (result.outcome === 'updated') return toAthleteProfileDraft(result.profile);
    if (result.outcome === 'stale') {
      return this.throwStaleProfileConflict(userId, expectedProfileVersion);
    }
    if (result.outcome === 'invalid_order') {
      throw new ConflictError('Athlete profile children have changed since this order was loaded', {
        actualChildIds: result.actualChildIds,
      });
    }
    throw new NotFoundError(result.resource);
  }

  private assertMatchingChildIds(
    routeChildId: string | undefined,
    bodyChildId: string | undefined,
    resourceName: string
  ): void {
    if (routeChildId && bodyChildId && routeChildId !== bodyChildId) {
      throw new BadRequestError(`${resourceName} ID does not match the request path`);
    }
  }

  private async throwStaleProfileConflict(
    userId: string,
    expectedProfileVersion: number | undefined
  ): Promise<never> {
    const latest = await this.athleteRepository.findDraftByUserId(userId);
    throw new ConflictError('Athlete profile has been updated since this draft was loaded', {
      expectedProfileVersion,
      actualProfileVersion: latest?.profileVersion ?? null,
    });
  }
}

function requireCompletePublicProfile(athlete: AthleteProfile): CompletePublicAthleteProfile {
  if (!isCompletePublicProfile(athlete)) {
    throw new NotFoundError('Published athlete profile');
  }
  return athlete;
}

function isCompletePublicProfile(
  athlete: AthleteProfile
): athlete is CompletePublicAthleteProfile {
  return Boolean(athlete.athleteSlug && athlete.fullName && athlete.primarySport);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
