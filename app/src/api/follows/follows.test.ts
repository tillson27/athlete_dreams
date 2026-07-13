import 'reflect-metadata';
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { container } from 'tsyringe';
import { PrismaClient, SportCategory } from '@prisma/client';
import { followListResponseSchema } from 'fad-common';
import { buildTestApp } from '../../test/buildTestApp';
import { PrismaService } from '../../services/infrastructure/PrismaService';

const shouldRunDatabaseTests = process.env.RUN_DB_TESTS === '1';

const RUN_ID = `step9-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const SEEDED_PUBLISHED_SLUG = 'felix-tremblay';
const SEEDED_OTHER_PUBLISHED_SLUG = 'emma-chen';

const FIXTURE_USER_EMAILS: string[] = [];
const FIXTURE_TEAM_IDS: string[] = [];

const prisma = new PrismaClient();

async function createFollowerUser(
  app: ReturnType<typeof buildTestApp>,
  suffix: string
): Promise<{ accessToken: string; userId: string }> {
  const email = `${RUN_ID}-${suffix}@fixture.athletearc.ca`;
  const signUp = await request(app)
    .post('/v1/auth/sign-up')
    .send({ email, password: 'Passw0rd!123', displayName: `Follower ${suffix}` });
  expect(signUp.status).toBe(201);
  FIXTURE_USER_EMAILS.push(email);
  const userId: string = signUp.body.data.user.userId;
  const personalTeam = await prisma.teamMembership.findFirst({
    where: { userId, team: { isPersonal: true } },
    select: { teamId: true },
  });
  if (personalTeam) FIXTURE_TEAM_IDS.push(personalTeam.teamId);
  return { accessToken: signUp.body.data.accessToken, userId };
}

async function createUnpublishedAthlete(suffix: string): Promise<string> {
  const email = `${RUN_ID}-${suffix}@fixture.athletearc.ca`;
  const user = await prisma.user.create({
    data: { email, passwordHash: 'x', displayName: `Unpublished ${suffix}` },
  });
  FIXTURE_USER_EMAILS.push(email);
  const athleteSlug = `${RUN_ID}-${suffix}`;
  await prisma.athleteProfile.create({
    data: {
      userId: user.id,
      athleteSlug,
      fullName: `Unpublished ${suffix}`,
      primarySport: SportCategory.RUNNING,
      publishedAt: null,
    },
  });
  return athleteSlug;
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

describe('follow routes (authentication)', () => {
  it('returns 401 for follow, unfollow, and list when unauthenticated', async () => {
    const app = buildTestApp();

    const follow = await request(app).post(`/v1/athletes/${SEEDED_PUBLISHED_SLUG}/follow`);
    expect(follow.status).toBe(401);
    expect(follow.body.error.code).toBe('unauthorized');

    const unfollow = await request(app).delete(`/v1/athletes/${SEEDED_PUBLISHED_SLUG}/follow`);
    expect(unfollow.status).toBe(401);
    expect(unfollow.body.error.code).toBe('unauthorized');

    const list = await request(app).get('/v1/users/me/follows');
    expect(list.status).toBe(401);
    expect(list.body.error.code).toBe('unauthorized');
  });
});

describe.skipIf(!shouldRunDatabaseTests)('POST/DELETE /v1/athletes/:athleteSlug/follow', () => {
  it('follows an athlete, lists it, then unfollows and it is gone', async () => {
    const app = buildTestApp();
    const follower = await createFollowerUser(app, 'roundtrip');

    const followResponse = await request(app)
      .post(`/v1/athletes/${SEEDED_PUBLISHED_SLUG}/follow`)
      .set('authorization', `Bearer ${follower.accessToken}`);
    expect(followResponse.status).toBe(200);
    const afterFollow = followListResponseSchema.parse(followResponse.body.data);
    const followed = afterFollow.items.find((item) => item.athleteSlug === SEEDED_PUBLISHED_SLUG);
    expect(followed).toBeDefined();
    expect(followed?.athleteName.length).toBeGreaterThan(0);

    const listResponse = await request(app)
      .get('/v1/users/me/follows')
      .set('authorization', `Bearer ${follower.accessToken}`);
    expect(listResponse.status).toBe(200);
    const listed = followListResponseSchema.parse(listResponse.body.data);
    expect(listed.items.some((item) => item.athleteSlug === SEEDED_PUBLISHED_SLUG)).toBe(true);

    const unfollowResponse = await request(app)
      .delete(`/v1/athletes/${SEEDED_PUBLISHED_SLUG}/follow`)
      .set('authorization', `Bearer ${follower.accessToken}`);
    expect(unfollowResponse.status).toBe(200);
    const afterUnfollow = followListResponseSchema.parse(unfollowResponse.body.data);
    expect(afterUnfollow.items.some((item) => item.athleteSlug === SEEDED_PUBLISHED_SLUG)).toBe(
      false
    );

    const remaining = await prisma.follow.count({ where: { followerUserId: follower.userId } });
    expect(remaining).toBe(0);
  });

  it('is idempotent: a double-follow yields a single row', async () => {
    const app = buildTestApp();
    const follower = await createFollowerUser(app, 'double-follow');

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await request(app)
        .post(`/v1/athletes/${SEEDED_PUBLISHED_SLUG}/follow`)
        .set('authorization', `Bearer ${follower.accessToken}`);
      expect(response.status).toBe(200);
    }

    const rows = await prisma.follow.count({
      where: { followerUserId: follower.userId, athlete: { athleteSlug: SEEDED_PUBLISHED_SLUG } },
    });
    expect(rows).toBe(1);
  });

  it('is idempotent: unfollowing an athlete that is not followed is a no-op success', async () => {
    const app = buildTestApp();
    const follower = await createFollowerUser(app, 'unfollow-missing');

    const response = await request(app)
      .delete(`/v1/athletes/${SEEDED_OTHER_PUBLISHED_SLUG}/follow`)
      .set('authorization', `Bearer ${follower.accessToken}`);
    expect(response.status).toBe(200);
    const parsed = followListResponseSchema.parse(response.body.data);
    expect(parsed.items).toHaveLength(0);
  });

  it('returns 404 when following an unknown athlete slug', async () => {
    const app = buildTestApp();
    const follower = await createFollowerUser(app, 'unknown-slug');

    const response = await request(app)
      .post(`/v1/athletes/${RUN_ID}-does-not-exist/follow`)
      .set('authorization', `Bearer ${follower.accessToken}`);
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('not_found');
  });

  it('returns 404 when following an unpublished athlete', async () => {
    const app = buildTestApp();
    const follower = await createFollowerUser(app, 'unpublished-follower');
    const unpublishedSlug = await createUnpublishedAthlete('unpublished-target');

    const response = await request(app)
      .post(`/v1/athletes/${unpublishedSlug}/follow`)
      .set('authorization', `Bearer ${follower.accessToken}`);
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('not_found');
  });
});
