import 'reflect-metadata';
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { container } from 'tsyringe';
import { CampaignStatus, CampaignType, PrismaClient, SportCategory } from '@prisma/client';
import { activeCampaignFeedResponseSchema, campaignSummarySchema } from 'fad-common';
import { buildTestApp } from './buildTestApp';
import { PrismaService } from '../services/infrastructure/PrismaService';

const shouldRunDatabaseTests = process.env.RUN_DB_TESTS === '1';

const RUN_ID = `step10-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const FIXTURE_USER_EMAILS: string[] = [];
const FIXTURE_TEAM_IDS: string[] = [];
const SEEDED_MULTI_CAMPAIGN_SLUG = 'felix-tremblay';

const prisma = new PrismaClient();

async function createFixtureAthlete(params: {
  slugSuffix: string;
  published: boolean;
}): Promise<{ athleteId: string; athleteSlug: string; userId: string }> {
  const email = `${RUN_ID}-${params.slugSuffix}@fixture.athletearc.ca`;
  const athleteSlug = `${RUN_ID}-${params.slugSuffix}`;
  const user = await prisma.user.create({
    data: { email, passwordHash: 'x', displayName: `Fixture ${params.slugSuffix}` },
  });
  FIXTURE_USER_EMAILS.push(email);
  const athlete = await prisma.athleteProfile.create({
    data: {
      userId: user.id,
      athleteSlug,
      fullName: `Fixture ${params.slugSuffix}`,
      primarySport: SportCategory.RUNNING,
      heroMediaUrl: 'https://example.com/hero.jpg',
      publishedAt: params.published ? new Date() : null,
    },
  });
  return { athleteId: athlete.id, athleteSlug, userId: user.id };
}

async function createFixtureActiveCampaign(params: {
  athleteId: string;
  slugSuffix: string;
  createdAt: Date;
}): Promise<string> {
  const campaign = await prisma.campaign.create({
    data: {
      athleteId: params.athleteId,
      campaignSlug: `${RUN_ID}-${params.slugSuffix}`,
      campaignTitle: `Fixture Campaign ${params.slugSuffix}`,
      campaignType: CampaignType.EVENT,
      campaignStatus: CampaignStatus.ACTIVE,
      campaignStory: 'Fixture story',
      targetAmountCents: 100_000,
      createdAt: params.createdAt,
      costLines: { create: [{ label: 'Entry', amountCents: 100_000 }] },
    },
  });
  return campaign.campaignSlug;
}

afterAll(async () => {
  if (!shouldRunDatabaseTests) return;
  if (FIXTURE_TEAM_IDS.length > 0) {
    await prisma.team.deleteMany({ where: { id: { in: FIXTURE_TEAM_IDS } } });
  }
  if (FIXTURE_USER_EMAILS.length > 0) {
    await prisma.user.deleteMany({ where: { email: { in: FIXTURE_USER_EMAILS } } });
  }
  await prisma.$disconnect();
  await container.resolve(PrismaService).$disconnect();
  container.reset();
});

describe.skipIf(!shouldRunDatabaseTests)('GET /v1/campaigns (active feed)', () => {
  it('walks fixture campaigns across keyset pages and stops with a null cursor', async () => {
    const app = buildTestApp();
    const athlete = await createFixtureAthlete({ slugSuffix: 'feed-athlete', published: true });
    const baseCreatedAt = new Date('2999-01-01T00:00:00.000Z');
    const expectedSlugsNewestFirst: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      const slug = await createFixtureActiveCampaign({
        athleteId: athlete.athleteId,
        slugSuffix: `feed-${index}`,
        createdAt: new Date(baseCreatedAt.getTime() + index * 1_000),
      });
      expectedSlugsNewestFirst.unshift(slug);
    }

    const collected: string[] = [];
    let cursor: string | null = null;
    let guard = 0;
    do {
      const query: Record<string, string> = { status: 'active', limit: '2' };
      if (cursor) query.cursor = cursor;
      const response = await request(app).get('/v1/campaigns').query(query);
      expect(response.status).toBe(200);
      const parsed = activeCampaignFeedResponseSchema.parse(response.body.data);
      for (const item of parsed.items) {
        if (item.campaignSlug.startsWith(RUN_ID)) collected.push(item.campaignSlug);
      }
      cursor = parsed.nextCursor;
      guard += 1;
    } while (cursor && guard < 20);

    const collectedFixtureOnly = collected.filter((slug) => expectedSlugsNewestFirst.includes(slug));
    expect(collectedFixtureOnly).toEqual(expectedSlugsNewestFirst);
    expect(new Set(collected).size).toBe(collected.length);
  });

  it('rejects a malformed cursor with 422', async () => {
    const app = buildTestApp();
    const response = await request(app)
      .get('/v1/campaigns')
      .query({ status: 'active', cursor: 'not-a-valid-cursor!!' });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('validation_error');
  });
});

describe.skipIf(!shouldRunDatabaseTests)('GET /v1/athletes/:athleteSlug/campaigns', () => {
  it('returns the seeded athlete active campaign list', async () => {
    const app = buildTestApp();
    const response = await request(app).get(`/v1/athletes/${SEEDED_MULTI_CAMPAIGN_SLUG}/campaigns`);
    expect(response.status).toBe(200);
    const campaigns = z_arrayParse(response.body.data);
    expect(campaigns.length).toBeGreaterThanOrEqual(2);
    for (const campaign of campaigns) {
      expect(campaign.athleteSlug).toBe(SEEDED_MULTI_CAMPAIGN_SLUG);
      expect(campaign.campaignStatus).toBe(CampaignStatus.ACTIVE);
    }
  });

  it('returns 404 for an unknown athlete', async () => {
    const app = buildTestApp();
    const response = await request(app).get(`/v1/athletes/${RUN_ID}-does-not-exist/campaigns`);
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('not_found');
  });
});

describe.skipIf(!shouldRunDatabaseTests)('POST /v1/campaigns (transparency rule)', () => {
  it('accepts a create where cost lines sum to the target and rejects when they do not', async () => {
    const app = buildTestApp();

    const email = `${RUN_ID}-creator@fixture.athletearc.ca`;
    const signUp = await request(app)
      .post('/v1/auth/sign-up')
      .send({ email, password: 'Passw0rd!123', displayName: 'Campaign Creator' });
    expect(signUp.status).toBe(201);
    FIXTURE_USER_EMAILS.push(email);
    const accessToken: string = signUp.body.data.accessToken;
    const userId: string = signUp.body.data.user.userId;
    const personalTeam = await prisma.teamMembership.findFirst({
      where: { userId, team: { isPersonal: true } },
      select: { teamId: true },
    });
    if (personalTeam) FIXTURE_TEAM_IDS.push(personalTeam.teamId);

    await prisma.athleteProfile.create({
      data: {
        userId,
        athleteSlug: `${RUN_ID}-creator`,
        fullName: 'Campaign Creator',
        primarySport: SportCategory.RUNNING,
        publishedAt: new Date(),
      },
    });

    const accepted = await request(app)
      .post('/v1/campaigns')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        campaignSlug: `${RUN_ID}-accepted`,
        campaignTitle: 'Balanced budget',
        campaignType: CampaignType.EVENT,
        campaignStory: 'Every dollar accounted for.',
        targetAmountCents: 90_000,
        costLines: [
          { label: 'Flights', amountCents: 50_000 },
          { label: 'Lodging', amountCents: 40_000 },
        ],
      });
    expect(accepted.status).toBe(201);
    expect(accepted.body.data.targetAmountCents).toBe(90_000);

    const rejected = await request(app)
      .post('/v1/campaigns')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        campaignSlug: `${RUN_ID}-rejected`,
        campaignTitle: 'Unbalanced budget',
        campaignType: CampaignType.EVENT,
        campaignStory: 'Numbers do not reconcile.',
        targetAmountCents: 90_000,
        costLines: [
          { label: 'Flights', amountCents: 50_000 },
          { label: 'Lodging', amountCents: 30_000 },
        ],
      });
    expect(rejected.status).toBe(422);
    expect(rejected.body.error.code).toBe('validation_error');
    expect(rejected.body.error.details.targetAmountCents).toBe(90_000);
    expect(rejected.body.error.details.costLinesTotalCents).toBe(80_000);
    expect(Array.isArray(rejected.body.error.details.costLines)).toBe(true);
  });

  it('rejects a create with no cost lines against a non-zero target', async () => {
    const app = buildTestApp();
    const email = `${RUN_ID}-creator2@fixture.athletearc.ca`;
    const signUp = await request(app)
      .post('/v1/auth/sign-up')
      .send({ email, password: 'Passw0rd!123', displayName: 'Creator Two' });
    expect(signUp.status).toBe(201);
    FIXTURE_USER_EMAILS.push(email);
    const accessToken: string = signUp.body.data.accessToken;
    const userId: string = signUp.body.data.user.userId;
    const personalTeam = await prisma.teamMembership.findFirst({
      where: { userId, team: { isPersonal: true } },
      select: { teamId: true },
    });
    if (personalTeam) FIXTURE_TEAM_IDS.push(personalTeam.teamId);
    await prisma.athleteProfile.create({
      data: {
        userId,
        athleteSlug: `${RUN_ID}-creator2`,
        fullName: 'Creator Two',
        primarySport: SportCategory.RUNNING,
        publishedAt: new Date(),
      },
    });

    const rejected = await request(app)
      .post('/v1/campaigns')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        campaignSlug: `${RUN_ID}-nolines`,
        campaignTitle: 'No breakdown',
        campaignType: CampaignType.EVENT,
        campaignStory: 'Missing the cost breakdown entirely.',
        targetAmountCents: 50_000,
      });
    expect(rejected.status).toBe(422);
    expect(rejected.body.error.code).toBe('validation_error');
    expect(rejected.body.error.details.costLinesTotalCents).toBe(0);
  });
});

describe.skipIf(!shouldRunDatabaseTests)('PATCH /v1/campaigns/:campaignSlug/status', () => {
  it('activates an owned draft campaign when the profile and Stripe account are donation-ready', async () => {
    const app = buildTestApp();

    const email = `${RUN_ID}-activator@fixture.athletearc.ca`;
    const signUp = await request(app)
      .post('/v1/auth/sign-up')
      .send({ email, password: 'Passw0rd!123', displayName: 'Campaign Activator' });
    expect(signUp.status).toBe(201);
    FIXTURE_USER_EMAILS.push(email);
    const accessToken: string = signUp.body.data.accessToken;
    const userId: string = signUp.body.data.user.userId;
    const personalTeam = await prisma.teamMembership.findFirst({
      where: { userId, team: { isPersonal: true } },
      select: { teamId: true },
    });
    if (personalTeam) FIXTURE_TEAM_IDS.push(personalTeam.teamId);

    const athlete = await prisma.athleteProfile.create({
      data: {
        userId,
        athleteSlug: `${RUN_ID}-activator`,
        fullName: 'Campaign Activator',
        primarySport: SportCategory.RUNNING,
        publishedAt: new Date(),
        stripeAccountId: `acct_${RUN_ID.replace(/[^a-zA-Z0-9]/g, '_')}_ready`,
        stripeChargesEnabledAt: new Date(),
      },
    });
    const campaign = await prisma.campaign.create({
      data: {
        athleteId: athlete.id,
        campaignSlug: `${RUN_ID}-activate`,
        campaignTitle: 'Ready campaign',
        campaignType: CampaignType.EVENT,
        campaignStory: 'Ready for donations.',
        targetAmountCents: 50_000,
        costLines: { create: [{ label: 'Entry', amountCents: 50_000 }] },
      },
    });

    const response = await request(app)
      .patch(`/v1/campaigns/${campaign.campaignSlug}/status`)
      .set('authorization', `Bearer ${accessToken}`)
      .send({ campaignStatus: CampaignStatus.ACTIVE });
    expect(response.status).toBe(200);
    expect(response.body.data.campaignStatus).toBe(CampaignStatus.ACTIVE);

    const persisted = await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(persisted.campaignStatus).toBe(CampaignStatus.ACTIVE);
  });

  it('rejects activation when the owned campaign is missing Stripe readiness', async () => {
    const app = buildTestApp();

    const email = `${RUN_ID}-stripe-missing@fixture.athletearc.ca`;
    const signUp = await request(app)
      .post('/v1/auth/sign-up')
      .send({ email, password: 'Passw0rd!123', displayName: 'Stripe Missing' });
    expect(signUp.status).toBe(201);
    FIXTURE_USER_EMAILS.push(email);
    const accessToken: string = signUp.body.data.accessToken;
    const userId: string = signUp.body.data.user.userId;
    const personalTeam = await prisma.teamMembership.findFirst({
      where: { userId, team: { isPersonal: true } },
      select: { teamId: true },
    });
    if (personalTeam) FIXTURE_TEAM_IDS.push(personalTeam.teamId);

    const athlete = await prisma.athleteProfile.create({
      data: {
        userId,
        athleteSlug: `${RUN_ID}-stripe-missing`,
        fullName: 'Stripe Missing',
        primarySport: SportCategory.RUNNING,
        publishedAt: new Date(),
      },
    });
    const campaign = await prisma.campaign.create({
      data: {
        athleteId: athlete.id,
        campaignSlug: `${RUN_ID}-stripe-blocked`,
        campaignTitle: 'Blocked campaign',
        campaignType: CampaignType.EVENT,
        campaignStory: 'Not ready for donations.',
        targetAmountCents: 50_000,
        costLines: { create: [{ label: 'Entry', amountCents: 50_000 }] },
      },
    });

    const response = await request(app)
      .patch(`/v1/campaigns/${campaign.campaignSlug}/status`)
      .set('authorization', `Bearer ${accessToken}`)
      .send({ campaignStatus: CampaignStatus.ACTIVE });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('validation_error');
    expect(response.body.error.details.missing).toContain('stripeAccount');
  });
});

function z_arrayParse(data: unknown): ReturnType<typeof campaignSummarySchema.parse>[] {
  if (!Array.isArray(data)) throw new Error('Expected an array response');
  return data.map((item) => campaignSummarySchema.parse(item));
}
