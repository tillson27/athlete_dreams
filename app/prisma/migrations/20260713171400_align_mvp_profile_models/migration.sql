-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('ATHLETE', 'SUPPORTER', 'BRAND', 'ADMIN');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'MANAGER', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SportCategory" AS ENUM ('RUNNING', 'TRIATHLON', 'CYCLING', 'SWIMMING', 'CLIMBING', 'SKIING', 'SNOWBOARDING', 'HOCKEY', 'SOCCER', 'BASKETBALL', 'TRACK_AND_FIELD', 'CROSS_COUNTRY_SKIING', 'OTHER');

-- CreateEnum
CREATE TYPE "AthleteProfileStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AthleteLevel" AS ENUM ('ELITE', 'COMPETITIVE', 'EVERYDAY');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AthleteResultKind" AS ENUM ('HIGHLIGHT', 'RACE', 'MILESTONE');

-- CreateEnum
CREATE TYPE "AthleteStoryChapterIcon" AS ENUM ('MEDAL', 'HEART', 'HISTORY', 'TROPHY', 'FLAG', 'TIMER', 'BOOK', 'GROUPS');

-- CreateEnum
CREATE TYPE "AthleteStoryChapterTone" AS ENUM ('PRIMARY', 'SECONDARY', 'TERTIARY');

-- CreateEnum
CREATE TYPE "AthleteMediaRole" AS ENUM ('HERO', 'PROFILE', 'GALLERY', 'RESULT', 'STORY_CHAPTER', 'TRAINING', 'FEATURED_VIDEO');

-- CreateEnum
CREATE TYPE "CommunityFeedTargetType" AS ENUM ('ATHLETE_RESULT', 'ATHLETE_EVENT', 'ATHLETE_TRAINING_SNAPSHOT', 'ATHLETE_PROFILE_MILESTONE');

-- CreateEnum
CREATE TYPE "ReactionKind" AS ENUM ('CHEER');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'FUNDED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('EVENT', 'SEASON', 'GEAR', 'TRAVEL', 'TRAINING', 'GENERAL');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "BrandRole" AS ENUM ('OWNER', 'MARKETING', 'VIEWER');

-- CreateEnum
CREATE TYPE "SponsorshipStatus" AS ENUM ('INQUIRY', 'NEGOTIATING', 'ACTIVE', 'ENDED', 'DECLINED');

-- CreateEnum
CREATE TYPE "AmbassadorApplicationStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'SHORTLISTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_role_assignments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "PlatformRole" NOT NULL,

    CONSTRAINT "platform_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isPersonal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_memberships" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "teamRole" "TeamRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "team_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_invitations" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "invitedByUserId" UUID NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "invitedTeamRole" "TeamRole" NOT NULL,
    "invitationStatus" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitationTokenHash" TEXT NOT NULL,
    "invitationExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "athleteSlug" TEXT,
    "fullName" TEXT,
    "profileStatus" "AthleteProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "profileVersion" INTEGER NOT NULL DEFAULT 0,
    "headline" TEXT,
    "tagline" TEXT,
    "bio" TEXT,
    "storyIntro" TEXT,
    "storyBody" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primarySport" "SportCategory",
    "secondarySports" "SportCategory"[] DEFAULT ARRAY[]::"SportCategory"[],
    "athleteLevel" "AthleteLevel",
    "disciplineLabel" TEXT,
    "hometown" TEXT,
    "countryCode" VARCHAR(2),
    "values" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "arcSubtitle" TEXT,
    "roadmapTitle" TEXT,
    "supportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backCtaBlurb" TEXT,
    "socialInstagramHandle" TEXT,
    "socialTwitterHandle" TEXT,
    "socialStravaUrl" TEXT,
    "heroMediaUrl" TEXT,
    "profileImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "athlete_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_core_values" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_core_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_accomplishments" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurredOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_accomplishments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_media" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaKind" "MediaKind" NOT NULL,
    "mediaRole" "AthleteMediaRole" NOT NULL DEFAULT 'GALLERY',
    "thumbnailUrl" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "durationLabel" TEXT,
    "relatedAthleteResultId" UUID,
    "relatedStoryChapterId" UUID,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "athlete_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_events" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventLocation" TEXT,
    "eventStartDate" DATE,
    "eventEndDate" DATE,
    "eventDateLabel" TEXT,
    "eventDescription" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "athlete_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_event_source_links" (
    "id" UUID NOT NULL,
    "athleteEventId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "athlete_event_source_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_personal_bests" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_personal_bests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_results" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "resultKind" "AthleteResultKind" NOT NULL,
    "title" TEXT NOT NULL,
    "resultText" TEXT NOT NULL,
    "eventDate" DATE,
    "eventDateLabel" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "athlete_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_result_source_links" (
    "id" UUID NOT NULL,
    "athleteResultId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "athlete_result_source_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_story_chapters" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "eraLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "chapterIcon" "AthleteStoryChapterIcon" NOT NULL,
    "chapterTone" "AthleteStoryChapterTone" NOT NULL,
    "imageUrl" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "athlete_story_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_training_snapshots" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "weeklyDistanceLabel" TEXT,
    "weeklyTimeLabel" TEXT,
    "weeklyElevationGainLabel" TEXT,
    "weeklyLoadLabel" TEXT,
    "latestSessionTitle" TEXT,
    "latestSessionMeta" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "athlete_training_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_power_profiles" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "ftpWatts" TEXT,
    "wattsPerKg" TEXT,
    "riderWeight" TEXT,
    "riderType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_power_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_power_peaks" (
    "id" UUID NOT NULL,
    "athletePowerProfileId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "watts" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "athlete_power_peaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_profile_milestones" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "headline" TEXT NOT NULL,
    "detail" TEXT,
    "photoUrl" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "athlete_profile_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_follows" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "followedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_reactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "targetType" "CommunityFeedTargetType" NOT NULL,
    "targetId" UUID NOT NULL,
    "reactionKind" "ReactionKind" NOT NULL DEFAULT 'CHEER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "campaignSlug" TEXT NOT NULL,
    "athleteId" UUID NOT NULL,
    "athleteEventId" UUID,
    "campaignTitle" TEXT NOT NULL,
    "campaignType" "CampaignType" NOT NULL,
    "campaignStatus" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "campaignStory" TEXT NOT NULL,
    "targetAmountCents" INTEGER NOT NULL,
    "raisedAmountCents" INTEGER NOT NULL DEFAULT 0,
    "supporterCount" INTEGER NOT NULL DEFAULT 0,
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_cost_lines" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "campaign_cost_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_updates" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "updateTitle" TEXT NOT NULL,
    "updateBody" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "supporterUserId" UUID,
    "supporterDisplayName" TEXT NOT NULL,
    "supporterEmail" TEXT,
    "donationAmountCents" INTEGER NOT NULL,
    "donationMessage" TEXT,
    "donationStatus" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "paymentProviderRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "brandSlug" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "brandWebsite" TEXT,
    "brandLogoUrl" TEXT,
    "brandBio" TEXT,
    "brandValues" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_memberships" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "brandRole" "BrandRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "brand_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsorship_inquiries" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "sponsorshipStatus" "SponsorshipStatus" NOT NULL DEFAULT 'INQUIRY',
    "inquiryMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsorship_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_programs" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "programName" TEXT NOT NULL,
    "programDescription" TEXT,
    "isFadManaged" BOOLEAN NOT NULL DEFAULT false,
    "intakeFormConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassador_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_applications" (
    "id" UUID NOT NULL,
    "ambassadorProgramId" UUID NOT NULL,
    "applicantAthleteId" UUID NOT NULL,
    "ambassadorApplicationStatus" "AmbassadorApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "applicationPayload" JSONB NOT NULL,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassador_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_idx" ON "auth_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "platform_role_assignments_userId_role_key" ON "platform_role_assignments"("userId", "role");

-- CreateIndex
CREATE INDEX "team_memberships_userId_idx" ON "team_memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_memberships_teamId_userId_key" ON "team_memberships"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_invitations_invitationTokenHash_key" ON "team_invitations"("invitationTokenHash");

-- CreateIndex
CREATE INDEX "team_invitations_teamId_idx" ON "team_invitations"("teamId");

-- CreateIndex
CREATE INDEX "team_invitations_inviteeEmail_idx" ON "team_invitations"("inviteeEmail");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_profiles_userId_key" ON "athlete_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_profiles_athleteSlug_key" ON "athlete_profiles"("athleteSlug");

-- CreateIndex
CREATE INDEX "athlete_profiles_profileStatus_primarySport_idx" ON "athlete_profiles"("profileStatus", "primarySport");

-- CreateIndex
CREATE INDEX "athlete_profiles_profileStatus_countryCode_idx" ON "athlete_profiles"("profileStatus", "countryCode");

-- CreateIndex
CREATE INDEX "athlete_profiles_profileStatus_createdAt_idx" ON "athlete_profiles"("profileStatus", "createdAt");

-- CreateIndex
CREATE INDEX "athlete_profiles_publishedAt_idx" ON "athlete_profiles"("publishedAt");

-- CreateIndex
CREATE INDEX "athlete_core_values_athleteId_sortOrder_idx" ON "athlete_core_values"("athleteId", "sortOrder");

-- CreateIndex
CREATE INDEX "athlete_accomplishments_athleteId_idx" ON "athlete_accomplishments"("athleteId");

-- CreateIndex
CREATE INDEX "athlete_media_athleteId_mediaRole_sortOrder_idx" ON "athlete_media"("athleteId", "mediaRole", "sortOrder");

-- CreateIndex
CREATE INDEX "athlete_media_relatedAthleteResultId_idx" ON "athlete_media"("relatedAthleteResultId");

-- CreateIndex
CREATE INDEX "athlete_media_relatedStoryChapterId_idx" ON "athlete_media"("relatedStoryChapterId");

-- CreateIndex
CREATE INDEX "athlete_events_athleteId_eventStartDate_idx" ON "athlete_events"("athleteId", "eventStartDate");

-- CreateIndex
CREATE INDEX "athlete_events_athleteId_sortOrder_idx" ON "athlete_events"("athleteId", "sortOrder");

-- CreateIndex
CREATE INDEX "athlete_event_source_links_athleteEventId_sortOrder_idx" ON "athlete_event_source_links"("athleteEventId", "sortOrder");

-- CreateIndex
CREATE INDEX "athlete_personal_bests_athleteId_sortOrder_idx" ON "athlete_personal_bests"("athleteId", "sortOrder");

-- CreateIndex
CREATE INDEX "athlete_personal_bests_athleteId_verificationStatus_idx" ON "athlete_personal_bests"("athleteId", "verificationStatus");

-- CreateIndex
CREATE INDEX "athlete_results_athleteId_resultKind_sortOrder_idx" ON "athlete_results"("athleteId", "resultKind", "sortOrder");

-- CreateIndex
CREATE INDEX "athlete_results_athleteId_eventDate_idx" ON "athlete_results"("athleteId", "eventDate");

-- CreateIndex
CREATE INDEX "athlete_results_athleteId_verificationStatus_idx" ON "athlete_results"("athleteId", "verificationStatus");

-- CreateIndex
CREATE INDEX "athlete_result_source_links_athleteResultId_sortOrder_idx" ON "athlete_result_source_links"("athleteResultId", "sortOrder");

-- CreateIndex
CREATE INDEX "athlete_story_chapters_athleteId_sortOrder_idx" ON "athlete_story_chapters"("athleteId", "sortOrder");

-- CreateIndex
CREATE INDEX "athlete_training_snapshots_athleteId_capturedAt_idx" ON "athlete_training_snapshots"("athleteId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_power_profiles_athleteId_key" ON "athlete_power_profiles"("athleteId");

-- CreateIndex
CREATE INDEX "athlete_power_peaks_athletePowerProfileId_sortOrder_idx" ON "athlete_power_peaks"("athletePowerProfileId", "sortOrder");

-- CreateIndex
CREATE INDEX "athlete_profile_milestones_athleteId_occurredAt_idx" ON "athlete_profile_milestones"("athleteId", "occurredAt");

-- CreateIndex
CREATE INDEX "athlete_follows_athleteId_followedAt_idx" ON "athlete_follows"("athleteId", "followedAt");

-- CreateIndex
CREATE INDEX "athlete_follows_userId_followedAt_idx" ON "athlete_follows"("userId", "followedAt");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_follows_userId_athleteId_key" ON "athlete_follows"("userId", "athleteId");

-- CreateIndex
CREATE INDEX "community_reactions_targetType_targetId_idx" ON "community_reactions"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "community_reactions_userId_createdAt_idx" ON "community_reactions"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "community_reactions_userId_targetType_targetId_key" ON "community_reactions"("userId", "targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_campaignSlug_key" ON "campaigns"("campaignSlug");

-- CreateIndex
CREATE INDEX "campaigns_athleteId_campaignStatus_idx" ON "campaigns"("athleteId", "campaignStatus");

-- CreateIndex
CREATE INDEX "campaigns_campaignStatus_idx" ON "campaigns"("campaignStatus");

-- CreateIndex
CREATE INDEX "campaigns_campaignStatus_createdAt_idx" ON "campaigns"("campaignStatus", "createdAt");

-- CreateIndex
CREATE INDEX "campaign_cost_lines_campaignId_sortOrder_idx" ON "campaign_cost_lines"("campaignId", "sortOrder");

-- CreateIndex
CREATE INDEX "campaign_updates_campaignId_createdAt_idx" ON "campaign_updates"("campaignId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "donations_paymentProviderRef_key" ON "donations"("paymentProviderRef");

-- CreateIndex
CREATE INDEX "donations_campaignId_donationStatus_idx" ON "donations"("campaignId", "donationStatus");

-- CreateIndex
CREATE INDEX "donations_supporterUserId_idx" ON "donations"("supporterUserId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_brandSlug_key" ON "brands"("brandSlug");

-- CreateIndex
CREATE UNIQUE INDEX "brand_memberships_brandId_userId_key" ON "brand_memberships"("brandId", "userId");

-- CreateIndex
CREATE INDEX "sponsorship_inquiries_brandId_idx" ON "sponsorship_inquiries"("brandId");

-- CreateIndex
CREATE INDEX "sponsorship_inquiries_athleteId_idx" ON "sponsorship_inquiries"("athleteId");

-- CreateIndex
CREATE INDEX "ambassador_programs_brandId_idx" ON "ambassador_programs"("brandId");

-- CreateIndex
CREATE INDEX "ambassador_applications_ambassadorProgramId_ambassadorAppli_idx" ON "ambassador_applications"("ambassadorProgramId", "ambassadorApplicationStatus");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_role_assignments" ADD CONSTRAINT "platform_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_profiles" ADD CONSTRAINT "athlete_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_core_values" ADD CONSTRAINT "athlete_core_values_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_accomplishments" ADD CONSTRAINT "athlete_accomplishments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_media" ADD CONSTRAINT "athlete_media_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_media" ADD CONSTRAINT "athlete_media_relatedAthleteResultId_fkey" FOREIGN KEY ("relatedAthleteResultId") REFERENCES "athlete_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_media" ADD CONSTRAINT "athlete_media_relatedStoryChapterId_fkey" FOREIGN KEY ("relatedStoryChapterId") REFERENCES "athlete_story_chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_events" ADD CONSTRAINT "athlete_events_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_event_source_links" ADD CONSTRAINT "athlete_event_source_links_athleteEventId_fkey" FOREIGN KEY ("athleteEventId") REFERENCES "athlete_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_personal_bests" ADD CONSTRAINT "athlete_personal_bests_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_results" ADD CONSTRAINT "athlete_results_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_result_source_links" ADD CONSTRAINT "athlete_result_source_links_athleteResultId_fkey" FOREIGN KEY ("athleteResultId") REFERENCES "athlete_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_story_chapters" ADD CONSTRAINT "athlete_story_chapters_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_training_snapshots" ADD CONSTRAINT "athlete_training_snapshots_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_power_profiles" ADD CONSTRAINT "athlete_power_profiles_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_power_peaks" ADD CONSTRAINT "athlete_power_peaks_athletePowerProfileId_fkey" FOREIGN KEY ("athletePowerProfileId") REFERENCES "athlete_power_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_profile_milestones" ADD CONSTRAINT "athlete_profile_milestones_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_follows" ADD CONSTRAINT "athlete_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_follows" ADD CONSTRAINT "athlete_follows_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reactions" ADD CONSTRAINT "community_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_athleteEventId_fkey" FOREIGN KEY ("athleteEventId") REFERENCES "athlete_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_cost_lines" ADD CONSTRAINT "campaign_cost_lines_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_supporterUserId_fkey" FOREIGN KEY ("supporterUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_memberships" ADD CONSTRAINT "brand_memberships_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_memberships" ADD CONSTRAINT "brand_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorship_inquiries" ADD CONSTRAINT "sponsorship_inquiries_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorship_inquiries" ADD CONSTRAINT "sponsorship_inquiries_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_programs" ADD CONSTRAINT "ambassador_programs_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_applications" ADD CONSTRAINT "ambassador_applications_ambassadorProgramId_fkey" FOREIGN KEY ("ambassadorProgramId") REFERENCES "ambassador_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
