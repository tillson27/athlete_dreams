import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { PrismaClient, SportCategory } from '@prisma/client';
import { athleteProfileSchema, publishAthleteProfileResponseSchema } from 'fad-common';
import { buildTestApp } from '../../test/buildTestApp';

const shouldRunDatabaseTests = process.env.RUN_DB_TESTS === '1';

const FIXTURE_PREFIX = `m6s1-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const PASSWORD = 'M6Step1!Passw0rd';

const originalAllowlist = process.env.SIGNUP_EMAIL_ALLOWLIST;

interface SignedUpUser {
  userId: string;
  email: string;
  accessToken: string;
  teamName: string;
}

describe.skipIf(!shouldRunDatabaseTests)('Athlete own-profile and personal-bests (database)', () => {
  const prisma = new PrismaClient();
  const app = buildTestApp();
  const createdUserIds: string[] = [];
  const createdTeamNames: string[] = [];
  let signUpCounter = 0;

  beforeAll(() => {
    // The full loop starts with a real HTTP sign-up, which is allowlist-gated;
    // force the gate open for these fixtures regardless of the local .env.
    delete process.env.SIGNUP_EMAIL_ALLOWLIST;
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    if (createdTeamNames.length > 0) {
      // Sign-up creates a personal team; deleting the owner cascades away the
      // membership, leaving the team orphaned (no memberships) to clean up here.
      await prisma.team.deleteMany({
        where: { name: { in: createdTeamNames }, memberships: { none: {} } },
      });
    }
    if (originalAllowlist === undefined) {
      delete process.env.SIGNUP_EMAIL_ALLOWLIST;
    } else {
      process.env.SIGNUP_EMAIL_ALLOWLIST = originalAllowlist;
    }
    await prisma.$disconnect();
  });

  async function signUpFixtureUser(suffix: string): Promise<SignedUpUser> {
    signUpCounter += 1;
    const email = `${FIXTURE_PREFIX}-${suffix}@fixture.test`;
    const displayName = `${FIXTURE_PREFIX} ${suffix}`;
    const teamName = `${displayName}'s Team`;
    const response = await request(app)
      .post('/v1/auth/sign-up')
      .send({ email, password: PASSWORD, displayName });
    expect(response.status).toBe(201);
    const accessToken = response.body.data.accessToken as string;
    const userId = response.body.data.user.userId as string;
    createdUserIds.push(userId);
    createdTeamNames.push(teamName);
    return { userId, email, accessToken, teamName };
  }

  describe('GET /v1/athletes/me', () => {
    it('requires authentication', async () => {
      const response = await request(app).get('/v1/athletes/me');
      expect(response.status).toBe(401);
    });

    it('returns 404 when the authenticated user has no profile', async () => {
      const fixture = await signUpFixtureUser('me-no-profile');
      const response = await request(app)
        .get('/v1/athletes/me')
        .set('authorization', `Bearer ${fixture.accessToken}`);
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('not_found');
    });

    it('returns the caller draft profile including the unpublished state', async () => {
      const fixture = await signUpFixtureUser('me-draft');
      const slug = `${FIXTURE_PREFIX}-me-draft`;

      const created = await request(app)
        .post('/v1/athletes')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({ athleteSlug: slug, fullName: 'Draft Athlete', primarySport: SportCategory.RUNNING });
      expect(created.status).toBe(201);

      const me = await request(app)
        .get('/v1/athletes/me')
        .set('authorization', `Bearer ${fixture.accessToken}`);
      expect(me.status).toBe(200);
      const parsed = athleteProfileSchema.parse(me.body.data);
      expect(parsed.athleteSlug).toBe(slug);
      expect(parsed.userId).toBe(fixture.userId);
      expect(parsed.publishedAt).toBeNull();

      // A draft is invisible on the public slug read but visible via /me.
      const publicRead = await request(app).get(`/v1/athletes/${slug}`);
      expect(publicRead.status).toBe(404);
    });
  });

  describe('PUT /v1/athletes/me/personal-bests', () => {
    it('requires authentication', async () => {
      const response = await request(app)
        .put('/v1/athletes/me/personal-bests')
        .send({ personalBests: [] });
      expect(response.status).toBe(401);
    });

    it('set-replaces personal bests and preserves submitted order via sortOrder', async () => {
      const fixture = await signUpFixtureUser('pb-order');
      const slug = `${FIXTURE_PREFIX}-pb-order`;
      const created = await request(app)
        .post('/v1/athletes')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({ athleteSlug: slug, fullName: 'PB Athlete', primarySport: SportCategory.RUNNING });
      expect(created.status).toBe(201);

      const put = await request(app)
        .put('/v1/athletes/me/personal-bests')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({
          personalBests: [
            { label: 'Marathon', value: '2:58:41', resultUrl: 'https://results.example.com/m' },
            { label: 'Half', value: '1:24:10' },
            { label: '10k', value: '38:20' },
          ],
        });
      expect(put.status).toBe(200);
      const putParsed = athleteProfileSchema.parse(put.body.data);
      expect(putParsed.personalBests?.map((entry) => entry.label)).toEqual([
        'Marathon',
        'Half',
        '10k',
      ]);
      expect(putParsed.personalBests?.map((entry) => entry.sortOrder)).toEqual([0, 1, 2]);
      expect(putParsed.personalBests?.[0]?.resultUrl).toBe('https://results.example.com/m');

      // Round-trip the order through GET /v1/athletes/me as the client would.
      const me = await request(app)
        .get('/v1/athletes/me')
        .set('authorization', `Bearer ${fixture.accessToken}`);
      const meParsed = athleteProfileSchema.parse(me.body.data);
      expect(meParsed.personalBests?.map((entry) => entry.label)).toEqual([
        'Marathon',
        'Half',
        '10k',
      ]);

      // A second set-replace fully swaps the previous rows (delete + recreate).
      const replaced = await request(app)
        .put('/v1/athletes/me/personal-bests')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({ personalBests: [{ label: '5k', value: '18:05' }] });
      expect(replaced.status).toBe(200);
      const rereadParsed = athleteProfileSchema.parse(
        (
          await request(app)
            .get('/v1/athletes/me')
            .set('authorization', `Bearer ${fixture.accessToken}`)
        ).body.data
      );
      expect(rereadParsed.personalBests?.map((entry) => entry.label)).toEqual(['5k']);
      expect(rereadParsed.personalBests?.[0]?.sortOrder).toBe(0);
    });

    it('rejects more than eight personal bests', async () => {
      const fixture = await signUpFixtureUser('pb-max');
      const slug = `${FIXTURE_PREFIX}-pb-max`;
      await request(app)
        .post('/v1/athletes')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({ athleteSlug: slug, fullName: 'PB Max', primarySport: SportCategory.RUNNING })
        .expect(201);

      const tooMany = Array.from({ length: 9 }, (_, index) => ({
        label: `Distance ${index}`,
        value: `${index}:00:00`,
      }));
      const response = await request(app)
        .put('/v1/athletes/me/personal-bests')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({ personalBests: tooMany });
      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('validation_error');
    });
  });

  describe('POST /v1/athletes slug collisions', () => {
    it('returns 409 with a field discriminator when the slug is taken by another athlete', async () => {
      const holder = await signUpFixtureUser('slug-holder');
      const challenger = await signUpFixtureUser('slug-challenger');
      const contestedSlug = `${FIXTURE_PREFIX}-contested-slug`;

      const first = await request(app)
        .post('/v1/athletes')
        .set('authorization', `Bearer ${holder.accessToken}`)
        .send({ athleteSlug: contestedSlug, fullName: 'Slug Holder', primarySport: SportCategory.RUNNING });
      expect(first.status).toBe(201);

      const collision = await request(app)
        .post('/v1/athletes')
        .set('authorization', `Bearer ${challenger.accessToken}`)
        .send({ athleteSlug: contestedSlug, fullName: 'Slug Challenger', primarySport: SportCategory.RUNNING });
      expect(collision.status).toBe(409);
      expect(collision.body.error.code).toBe('conflict');
      expect(collision.body.error.details).toEqual({ field: 'athleteSlug' });

      const duplicateProfile = await request(app)
        .post('/v1/athletes')
        .set('authorization', `Bearer ${holder.accessToken}`)
        .send({ athleteSlug: `${contestedSlug}-2`, fullName: 'Slug Holder', primarySport: SportCategory.RUNNING });
      expect(duplicateProfile.status).toBe(409);
      expect(duplicateProfile.body.error.details ?? null).not.toEqual({ field: 'athleteSlug' });
    });
  });

  describe('the full HTTP-only onboarding-to-publish loop', () => {
    it('signs up, creates, patches, sets PBs, publishes, and appears in the directory', async () => {
      const fixture = await signUpFixtureUser('publish-loop');
      const slug = `${FIXTURE_PREFIX}-publish-loop`;
      const fullName = `${FIXTURE_PREFIX} Publish Loop`;

      const created = await request(app)
        .post('/v1/athletes')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({ athleteSlug: slug, fullName, primarySport: SportCategory.RUNNING });
      expect(created.status).toBe(201);

      const patched = await request(app)
        .patch('/v1/athletes/me')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({ storyIntro: 'Chasing a sub-3 marathon.', disciplineLabel: 'Road Marathon' });
      expect(patched.status).toBe(200);

      const pbs = await request(app)
        .put('/v1/athletes/me/personal-bests')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({ personalBests: [{ label: 'Marathon', value: '3:01:12' }] });
      expect(pbs.status).toBe(200);

      const published = await request(app)
        .post('/v1/athletes/me/publish')
        .set('authorization', `Bearer ${fixture.accessToken}`);
      expect(published.status).toBe(200);
      const publishParsed = publishAthleteProfileResponseSchema.parse(published.body.data);
      expect(publishParsed.athleteSlug).toBe(slug);

      // The published fixture is now discoverable in the public directory; scope
      // the lookup to the unique fixture name to avoid any global-count coupling.
      const directory = await request(app)
        .get('/v1/athletes')
        .query({ search: fullName });
      expect(directory.status).toBe(200);
      const matchingSlugs = (directory.body.data.items as { athleteSlug: string }[]).map(
        (item) => item.athleteSlug
      );
      expect(matchingSlugs).toContain(slug);

      // /me now reflects the published state for the same caller.
      const me = await request(app)
        .get('/v1/athletes/me')
        .set('authorization', `Bearer ${fixture.accessToken}`);
      const meParsed = athleteProfileSchema.parse(me.body.data);
      expect(meParsed.publishedAt).not.toBeNull();
    });
  });
});
