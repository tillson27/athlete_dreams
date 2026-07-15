import 'dotenv/config';
import { AthleteLevel, CampaignStatus, MediaKind, PlatformRole, PrismaClient, TeamRole, type SportCategory } from '@prisma/client';
import argon2 from 'argon2';
import { mockAthletes, type MockAthlete } from '../../client/lib/mockAthletes';
import { athleteProfiles, type RichAthleteProfile } from '../../client/lib/athleteProfiles';
import { parseEventStartDate } from '../src/shared/displayDate';

// Seeds the nate launch roster from the client's data modules (single source of
// truth) so API responses render identically to today's mock mode. Idempotent:
// users/teams/profiles/campaigns upsert by unique keys; keyless child rows
// (results, PBs, highlights, media, events, cost lines) are replaced per athlete.

const prisma = new PrismaClient();

const SEED_PUBLISHED_AT = new Date('2026-07-01T00:00:00.000Z');
const SEED_PASSWORD = 'ArcSeed!Passw0rd';

function toHandle(rich: RichAthleteProfile | undefined): string | null {
  if (!rich?.handle) return null;
  return rich.handle.replace(/^@/, '').toLowerCase();
}

function buildPresentation(rich: RichAthleteProfile) {
  return {
    arcSubtitle: rich.arcSubtitle,
    followersLabel: rich.followers,
    highlightsHeading: rich.highlightsHeading ?? null,
    racesHeading: rich.racesHeading ?? null,
    moreResultsLabel: rich.moreResultsLabel,
    moreRacesLabel: rich.moreRacesLabel,
    roadmapTitle: rich.roadmapTitle,
    arcChapters: rich.arcChapters,
    instagramPosts: rich.instagramPosts,
    training: rich.training,
    powerProfile: rich.powerProfile ?? null,
    featuredVideo: rich.featuredVideo ?? null,
    supportEnabled: rich.supportEnabled,
    backCtaBlurb: rich.backCtaBlurb ?? null,
    recentBackers: rich.recentBackers ?? null,
    supporterCount: rich.supporterCount ?? null,
    highlightTones: [...rich.careerHighlights].map((entry) => ({ title: entry.title, tone: entry.tone })),
    raceTones: rich.previousRaces.map((race) => ({ name: race.name, tone: race.tone })),
  };
}

async function seedAthlete(mockAthlete: MockAthlete, passwordHash: string): Promise<void> {
  const rich = athleteProfiles[mockAthlete.athleteSlug];
  const seedEmail = `${mockAthlete.athleteSlug}@seed.athletearc.ca`;

  const user = await prisma.user.upsert({
    where: { email: seedEmail },
    update: { displayName: mockAthlete.fullName },
    create: {
      email: seedEmail,
      passwordHash,
      displayName: mockAthlete.fullName,
      emailVerifiedAt: SEED_PUBLISHED_AT,
    },
  });

  await prisma.platformRoleAssignment.upsert({
    where: { userId_role: { userId: user.id, role: PlatformRole.ATHLETE } },
    update: {},
    create: { userId: user.id, role: PlatformRole.ATHLETE },
  });

  const existingPersonalMembership = await prisma.teamMembership.findFirst({
    where: { userId: user.id, team: { isPersonal: true, deletedAt: null } },
  });
  if (!existingPersonalMembership) {
    await prisma.team.create({
      data: {
        name: `${mockAthlete.fullName}'s Team`,
        isPersonal: true,
        memberships: { create: { userId: user.id, teamRole: TeamRole.OWNER } },
      },
    });
  }

  const athlete = await prisma.athleteProfile.upsert({
    where: { athleteSlug: mockAthlete.athleteSlug },
    update: {},
    create: {
      userId: user.id,
      athleteSlug: mockAthlete.athleteSlug,
      fullName: mockAthlete.fullName,
      primarySport: mockAthlete.primarySport as SportCategory,
    },
  });

  await prisma.athleteProfile.update({
    where: { id: athlete.id },
    data: {
      fullName: mockAthlete.fullName,
      handle: toHandle(rich),
      headline: mockAthlete.headline,
      bio: mockAthlete.bio,
      primarySport: mockAthlete.primarySport as SportCategory,
      runnerLevel: mockAthlete.runnerLevel as AthleteLevel,
      disciplineLabel: rich?.disciplineLabel ?? null,
      hometown: mockAthlete.hometown,
      countryCode: mockAthlete.countryCode,
      values: mockAthlete.values,
      storyIntro: rich?.storyIntro ?? null,
      storyBody: rich?.storyBody ?? [],
      coreValues: rich ? rich.coreValues : undefined,
      presentation: rich ? buildPresentation(rich) : undefined,
      heroMediaUrl: mockAthlete.heroMediaUrl,
      publishedAt: SEED_PUBLISHED_AT,
    },
  });

  await prisma.personalBest.deleteMany({ where: { athleteId: athlete.id } });
  await prisma.athleteRaceResult.deleteMany({ where: { athleteId: athlete.id } });
  await prisma.athleteAccomplishment.deleteMany({ where: { athleteId: athlete.id } });
  await prisma.athleteMedia.deleteMany({ where: { athleteId: athlete.id } });
  await prisma.athleteEvent.deleteMany({ where: { athleteId: athlete.id } });

  if (rich) {
    await prisma.personalBest.createMany({
      data: rich.personalBests.map((personalBest, index) => ({
        athleteId: athlete.id,
        label: personalBest.label,
        value: personalBest.value,
        sortOrder: index,
      })),
    });

    const raceResults = [
      ...rich.previousRaces.map((race) => ({
        resultName: race.name,
        displayDate: race.date,
        resultSummary: race.result,
        resultUrl: race.links?.[0]?.href ?? null,
        links: race.links ?? undefined,
        photoRefs: race.images,
      })),
      ...rich.morePreviousRaces.map((race) => ({
        resultName: race.name,
        displayDate: race.date,
        resultSummary: race.result,
        resultUrl: null,
        links: undefined,
        photoRefs: race.images,
      })),
    ];
    await prisma.athleteRaceResult.createMany({
      data: raceResults.map((result, index) => ({ athleteId: athlete.id, sortOrder: index, ...result })),
    });

    await prisma.athleteAccomplishment.createMany({
      data: [...rich.careerHighlights, ...rich.moreResults].map((highlight) => ({
        athleteId: athlete.id,
        title: highlight.title,
        detail: highlight.detail,
        photoRefs: highlight.images,
      })),
    });

    await prisma.athleteMedia.createMany({
      data: rich.galleryPhotos.map((photoRef) => ({
        athleteId: athlete.id,
        mediaUrl: photoRef,
        mediaKind: MediaKind.IMAGE,
      })),
    });

    await prisma.athleteEvent.createMany({
      data: rich.roadmap.map((roadmapItem) => ({
        athleteId: athlete.id,
        eventName: roadmapItem.name,
        displayDate: roadmapItem.date,
        eventStartDate: parseEventStartDate(roadmapItem.date),
      })),
    });
  } else {
    await prisma.athleteAccomplishment.createMany({
      data: mockAthlete.accomplishments.map((accomplishment) => ({
        athleteId: athlete.id,
        title: accomplishment.title,
        occurredOn: new Date(Date.UTC(accomplishment.year, 0, 1)),
      })),
    });
  }

  for (const campaign of mockAthlete.campaigns) {
    const persistedCampaign = await prisma.campaign.upsert({
      where: { campaignSlug: campaign.campaignSlug },
      update: {
        campaignTitle: campaign.campaignTitle,
        campaignStory: campaign.campaignStory,
        targetAmountCents: campaign.targetAmountCents,
        raisedAmountCents: campaign.raisedAmountCents,
        supporterCount: campaign.supporterCount,
        closesAt: campaign.closesAt ? new Date(campaign.closesAt) : null,
      },
      create: {
        athleteId: athlete.id,
        campaignSlug: campaign.campaignSlug,
        campaignTitle: campaign.campaignTitle,
        campaignType: campaign.campaignType,
        campaignStatus: CampaignStatus.ACTIVE,
        campaignStory: campaign.campaignStory,
        targetAmountCents: campaign.targetAmountCents,
        raisedAmountCents: campaign.raisedAmountCents,
        supporterCount: campaign.supporterCount,
        closesAt: campaign.closesAt ? new Date(campaign.closesAt) : null,
      },
    });

    await prisma.campaignCostLine.deleteMany({ where: { campaignId: persistedCampaign.id } });
    await prisma.campaignCostLine.createMany({
      data: campaign.costLines.map((costLine) => ({
        campaignId: persistedCampaign.id,
        label: costLine.label,
        amountCents: costLine.amountCents,
      })),
    });
  }
}

async function main(): Promise<void> {
  const passwordHash = await argon2.hash(SEED_PASSWORD, { type: argon2.argon2id });

  for (const mockAthlete of mockAthletes) {
    await seedAthlete(mockAthlete, passwordHash);
  }

  const [userCount, athleteCount, campaignCount, raceResultCount, personalBestCount] = await Promise.all([
    prisma.user.count(),
    prisma.athleteProfile.count(),
    prisma.campaign.count(),
    prisma.athleteRaceResult.count(),
    prisma.personalBest.count(),
  ]);
  console.log(
    `Seed complete: ${athleteCount} athletes (${userCount} users), ${campaignCount} campaigns, ` +
      `${raceResultCount} race results, ${personalBestCount} personal bests.`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
