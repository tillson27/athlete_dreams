-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('ATHLETE', 'SUPPORTER', 'BRAND', 'ADMIN');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'MANAGER', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SportCategory" AS ENUM ('RUNNING', 'TRIATHLON', 'CYCLING', 'ROAD_CYCLING', 'SWIMMING', 'CLIMBING', 'SKIING', 'SNOWBOARDING', 'HOCKEY', 'SOCCER', 'BASKETBALL', 'TRACK_AND_FIELD', 'CROSS_COUNTRY_SKIING', 'OTHER');

-- CreateEnum
CREATE TYPE "AthleteLevel" AS ENUM ('ELITE', 'COMPETITIVE', 'EVERYDAY');

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
    "athleteSlug" TEXT NOT NULL,
    "handle" TEXT,
    "fullName" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "primarySport" "SportCategory" NOT NULL,
    "secondarySports" "SportCategory"[],
    "runnerLevel" "AthleteLevel" NOT NULL DEFAULT 'EVERYDAY',
    "disciplineLabel" TEXT,
    "hometown" TEXT,
    "countryCode" VARCHAR(2),
    "values" TEXT[],
    "storyIntro" TEXT,
    "storyBody" TEXT[],
    "coreValues" JSONB,
    "presentation" JSONB,
    "socialInstagramHandle" TEXT,
    "socialTwitterHandle" TEXT,
    "socialStravaUrl" TEXT,
    "heroMediaUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "athlete_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_accomplishments" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "detail" TEXT,
    "resultUrl" TEXT,
    "photoRefs" TEXT[],
    "occurredOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_accomplishments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_race_results" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "resultName" TEXT NOT NULL,
    "displayDate" TEXT NOT NULL,
    "occurredOn" DATE,
    "resultSummary" TEXT NOT NULL,
    "resultUrl" TEXT,
    "links" JSONB,
    "photoRefs" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_race_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_bests" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "resultUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "personal_bests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_media" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaKind" "MediaKind" NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_events" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventLocation" TEXT,
    "eventStartDate" DATE NOT NULL,
    "eventEndDate" DATE,
    "displayDate" TEXT,
    "eventDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" UUID NOT NULL,
    "followerUserId" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "athlete_profiles_handle_key" ON "athlete_profiles"("handle");

-- CreateIndex
CREATE INDEX "athlete_profiles_primarySport_idx" ON "athlete_profiles"("primarySport");

-- CreateIndex
CREATE INDEX "athlete_profiles_runnerLevel_idx" ON "athlete_profiles"("runnerLevel");

-- CreateIndex
CREATE INDEX "athlete_accomplishments_athleteId_idx" ON "athlete_accomplishments"("athleteId");

-- CreateIndex
CREATE INDEX "athlete_race_results_athleteId_idx" ON "athlete_race_results"("athleteId");

-- CreateIndex
CREATE INDEX "personal_bests_athleteId_idx" ON "personal_bests"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "personal_bests_athleteId_label_key" ON "personal_bests"("athleteId", "label");

-- CreateIndex
CREATE INDEX "athlete_media_athleteId_idx" ON "athlete_media"("athleteId");

-- CreateIndex
CREATE INDEX "athlete_events_athleteId_eventStartDate_idx" ON "athlete_events"("athleteId", "eventStartDate");

-- CreateIndex
CREATE INDEX "follows_athleteId_idx" ON "follows"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerUserId_athleteId_key" ON "follows"("followerUserId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_campaignSlug_key" ON "campaigns"("campaignSlug");

-- CreateIndex
CREATE INDEX "campaigns_athleteId_idx" ON "campaigns"("athleteId");

-- CreateIndex
CREATE INDEX "campaigns_campaignStatus_idx" ON "campaigns"("campaignStatus");

-- CreateIndex
CREATE INDEX "campaign_cost_lines_campaignId_idx" ON "campaign_cost_lines"("campaignId");

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
ALTER TABLE "athlete_accomplishments" ADD CONSTRAINT "athlete_accomplishments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_race_results" ADD CONSTRAINT "athlete_race_results_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_bests" ADD CONSTRAINT "personal_bests_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_media" ADD CONSTRAINT "athlete_media_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_events" ADD CONSTRAINT "athlete_events_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerUserId_fkey" FOREIGN KEY ("followerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
