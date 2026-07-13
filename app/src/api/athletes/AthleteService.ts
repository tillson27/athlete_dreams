import { injectable } from 'tsyringe';
import type {
  AthleteDashboard,
  AthleteDirectoryItem,
  AthleteDirectoryQuery,
  AthleteProfile as AthleteProfileDto,
  AthleteProfileDraft,
  AthleteRecentBacker,
  CreateAthleteProfileRequest,
  DeleteAthleteProfileChildRequest,
  FollowAthleteResponse,
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
import {
  AthleteRepository,
  type AthleteDirectoryRead,
} from '../../repositories/AthleteRepository';
import {
  AthleteProfileChildRepository,
  type AthleteProfileChildMutationResult,
} from '../../repositories/AthleteProfileChildRepository';
import {
  CampaignRepository,
  type CampaignSupportMetrics,
  type RecentCampaignBacker,
} from '../../repositories/CampaignRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors';
import { AthleteProfileStatus, type AthleteProfile, Prisma } from '@prisma/client';
import { toCampaignSummaryDto } from '../campaigns/campaignMappers';
import {
  type AthleteSupportRead,
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
    private readonly campaignRepository: CampaignRepository,
    private readonly userRepository: UserRepository
  ) {}

  async listDirectory(query: AthleteDirectoryQuery): Promise<AthleteDirectoryItem[]> {
    const athletes = await this.athleteRepository.listDirectory({
      primarySport: query.sport,
      countryCode: query.countryCode,
      search: query.search,
      limit: query.limit,
    });
    const campaignMetricsByAthleteId =
      await this.campaignRepository.getSupportMetricsForAthletes(
        athletes.map((athlete) => athlete.id)
      );
    return athletes.map((athlete) =>
      this.buildDirectoryItem(athlete, campaignMetricsByAthleteId.get(athlete.id))
    );
  }

  async getProfileBySlug(
    athleteSlug: string,
    viewerUserId?: string
  ): Promise<PublicAthleteProfile> {
    const profile = await this.athleteRepository.findPublicBySlug(athleteSlug);
    if (!profile || !canMapPublicAthleteProfile(profile)) {
      throw new NotFoundError('Published athlete profile');
    }

    const [viewerIsFollowing, supportRead] = await Promise.all([
      viewerUserId
        ? this.athleteRepository.isFollowedByUser(viewerUserId, profile.id)
        : Promise.resolve(null),
      this.getAthleteSupportRead(profile.id),
    ]);

    return toPublicAthleteProfile(profile, viewerIsFollowing, supportRead);
  }

  async getDraftForUser(userId: string): Promise<AthleteProfileDraft> {
    const profile = await this.athleteRepository.findOrCreateDraftByUserId(userId);
    return toAthleteProfileDraft(profile);
  }

  async getDashboardForUser(userId: string): Promise<AthleteDashboard> {
    const [profile, user] = await Promise.all([
      this.athleteRepository.findOrCreateDraftByUserId(userId),
      this.userRepository.findById(userId),
    ]);
    if (!user) throw new NotFoundError('User');

    const supportRead = await this.getAthleteSupportRead(profile.id);
    const draft = toAthleteProfileDraft(profile, supportRead);
    const publicProfileUrl =
      profile.profileStatus === AthleteProfileStatus.PUBLISHED &&
      profile.publishedAt &&
      profile.athleteSlug
        ? `/athletes/${profile.athleteSlug}`
        : null;
    const manageProfileUrl = profile.athleteSlug
      ? `/athletes/${profile.athleteSlug}/manage`
      : '/register';

    return {
      userId,
      athleteId: profile.id,
      athleteSlug: profile.athleteSlug,
      fullName: (profile.fullName ?? user.displayName.trim()) || 'Athlete',
      profileStatus: profile.profileStatus,
      publicProfileUrl,
      manageProfileUrl,
      profileVersion: profile.profileVersion,
      completion: draft.completion,
      draft,
      quickActions: buildDashboardQuickActions(publicProfileUrl, manageProfileUrl),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  async followAthlete(
    userId: string,
    athleteSlug: string
  ): Promise<FollowAthleteResponse> {
    const athlete = await this.athleteRepository.findPublicIdentityBySlug(athleteSlug);
    if (!athlete) throw new NotFoundError('Published athlete profile');

    const followerCount = await this.athleteRepository.follow(userId, athlete.id);
    return {
      athleteId: athlete.id,
      athleteSlug: athlete.athleteSlug,
      isFollowing: true,
      followerCount,
    };
  }

  async unfollowAthlete(
    userId: string,
    athleteSlug: string
  ): Promise<FollowAthleteResponse> {
    const athlete = await this.athleteRepository.findPublicIdentityBySlug(athleteSlug);
    if (!athlete) throw new NotFoundError('Published athlete profile');

    const followerCount = await this.athleteRepository.unfollow(userId, athlete.id);
    return {
      athleteId: athlete.id,
      athleteSlug: athlete.athleteSlug,
      isFollowing: false,
      followerCount,
    };
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

    const completion = buildAthleteProfileCompletion(existing);
    if (canMapPublicAthleteProfile(existing)) {
      return {
        profile: toPublicAthleteProfile(
          existing,
          null,
          await this.getAthleteSupportRead(existing.id)
        ),
        completion,
        published: true,
      };
    }

    if (
      input.expectedProfileVersion !== undefined &&
      existing.profileVersion !== input.expectedProfileVersion
    ) {
      throw new ConflictError('Athlete profile has been updated since this draft was loaded', {
        expectedProfileVersion: input.expectedProfileVersion,
        actualProfileVersion: existing.profileVersion,
      });
    }

    const missingFieldKeys = getPublishMissingFieldKeys(existing);
    if (missingFieldKeys.length > 0) {
      return {
        profile: null,
        completion,
        published: false,
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
        profile: toPublicAthleteProfile(
          result.profile,
          null,
          await this.getAthleteSupportRead(result.profile.id)
        ),
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

  private buildDirectoryItem(
    athlete: AthleteDirectoryRead,
    campaignMetrics?: CampaignSupportMetrics
  ): AthleteDirectoryItem {
    const publicAthlete = requireCompletePublicProfile(athlete);
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
      supportEnabled:
        publicAthlete.supportEnabled &&
        (campaignMetrics?.activeCampaignCount ?? 0) > 0,
      followerCount: athlete._count.follows,
      activeCampaignCount: campaignMetrics?.activeCampaignCount ?? 0,
      totalRaisedCents: campaignMetrics?.totalRaisedCents ?? 0,
    };
  }

  private async getAthleteSupportRead(athleteId: string): Promise<AthleteSupportRead> {
    const [activeCampaigns, recentBackers] = await Promise.all([
      this.campaignRepository.listActiveForAthlete(athleteId),
      this.campaignRepository.listRecentBackersForAthlete(athleteId, 12),
    ]);
    const activeCampaignSummaries = activeCampaigns.map(toCampaignSummaryDto);

    return {
      supporterCount: activeCampaignSummaries.reduce(
        (totalSupporterCount, campaign) => totalSupporterCount + campaign.supporterCount,
        0
      ),
      activeCampaigns: activeCampaignSummaries,
      recentBackers: recentBackers.map(toRecentBackerDto),
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

function toRecentBackerDto(backer: RecentCampaignBacker): AthleteRecentBacker {
  const displayName = toBackerDisplayName(backer);
  return {
    displayName,
    backedAt: backer.createdAt.toISOString(),
    amountCents: backer.donationAmountCents,
    initials: backer.isAnonymous ? null : toBackerInitials(displayName),
    isAnonymous: backer.isAnonymous,
  };
}

function toBackerDisplayName(backer: RecentCampaignBacker): string {
  if (backer.isAnonymous) return 'Anonymous';
  const displayName = backer.supporterDisplayName.trim();
  return displayName || 'Supporter';
}

function toBackerInitials(displayName: string): string | null {
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase() ?? '')
    .join('');
  return initials || null;
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

function buildDashboardQuickActions(
  publicProfileUrl: string | null,
  manageProfileUrl: string | null
): AthleteDashboard['quickActions'] {
  const actions: AthleteDashboard['quickActions'] = [
    {
      label: 'Edit profile',
      href: manageProfileUrl ?? '/register',
    },
    {
      label: 'Community feed',
      href: '/community',
    },
  ];

  if (publicProfileUrl) {
    actions.unshift({
      label: 'View public profile',
      href: publicProfileUrl,
    });
  }

  return actions;
}
