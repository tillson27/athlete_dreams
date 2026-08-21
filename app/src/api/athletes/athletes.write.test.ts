import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { container } from 'tsyringe';
import { athleteProfileSchema, publishAthleteProfileResponseSchema } from 'fad-common';
import { AthleteLevel, PlatformRole, SportCategory } from '@prisma/client';
import { buildTestApp } from '../../test/buildTestApp';
import { PrismaService } from '../../services/infrastructure/PrismaService';
import { JwtService } from '../../services/infrastructure/JwtService';

const shouldRunDatabaseTests = process.env.RUN_DB_TESTS === '1';

const FIXTURE_PREFIX = `step8-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

interface FixtureAthlete {
  userId: string;
  athleteId: string;
  athleteSlug: string;
  accessToken: string;
}

describe.skipIf(!shouldRunDatabaseTests)('Athlete write path (database)', () => {
  let prisma: PrismaService;
  let jwtService: JwtService;
  let app: ReturnType<typeof buildTestApp>;
  const createdUserIds: string[] = [];
  let fixtureCounter = 0;

  beforeAll(() => {
    prisma = container.resolve(PrismaService);
    jwtService = container.resolve(JwtService);
    app = buildTestApp();
  });

  function tokenFor(userId: string, email: string): string {
    return jwtService.issueAccessToken({ sub: userId, email }).accessToken;
  }

  async function createFixtureUser(suffix: string): Promise<{ userId: string; email: string }> {
    fixtureCounter += 1;
    const email = `${FIXTURE_PREFIX}-${suffix}@fixture.test`;
    const user = await prisma.user.create({
      data: { email, passwordHash: 'fixture-not-a-real-hash', displayName: 'Fixture User' },
    });
    createdUserIds.push(user.id);
    return { userId: user.id, email };
  }

  async function createFixtureAthlete(overrides: {
    suffix: string;
    disciplineLabel?: string | null;
    storyIntro?: string | null;
    withPersonalBest?: boolean;
    publishedAt?: Date | null;
  }): Promise<FixtureAthlete> {
    const { userId, email } = await createFixtureUser(overrides.suffix);
    const slug = `${FIXTURE_PREFIX}-${overrides.suffix}`;
    const athlete = await prisma.athleteProfile.create({
      data: {
        userId,
        athleteSlug: slug,
        fullName: 'Fixture Athlete',
        headline: 'Fixture headline',
        primarySport: SportCategory.RUNNING,
        runnerLevel: AthleteLevel.EVERYDAY,
        disciplineLabel: overrides.disciplineLabel ?? null,
        countryCode: 'CA',
        values: ['Grit'],
        storyIntro: overrides.storyIntro ?? null,
        publishedAt: overrides.publishedAt ?? null,
      },
    });
    if (overrides.withPersonalBest) {
      await prisma.personalBest.create({
        data: { athleteId: athlete.id, label: 'Marathon', value: '2:40:00', sortOrder: 0 },
      });
    }
    return { userId, athleteId: athlete.id, athleteSlug: slug, accessToken: tokenFor(userId, email) };
  }

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
    container.reset();
  });

  describe('profile creation assigns the ATHLETE role', () => {
    it('creates a PlatformRoleAssignment(ATHLETE) via POST /v1/athletes', async () => {
      const { userId, email } = await createFixtureUser('role-on-create');
      const slug = `${FIXTURE_PREFIX}-role-on-create`;

      const response = await request(app)
        .post('/v1/athletes')
        .set('authorization', `Bearer ${tokenFor(userId, email)}`)
        .send({ athleteSlug: slug, fullName: 'New Athlete', primarySport: SportCategory.RUNNING });

      expect(response.status).toBe(201);
      const assignment = await prisma.platformRoleAssignment.findUnique({
        where: { userId_role: { userId, role: PlatformRole.ATHLETE } },
      });
      expect(assignment).not.toBeNull();
    });
  });

  describe('authentication is required', () => {
    it('rejects PATCH /v1/athletes/me without a bearer token', async () => {
      const response = await request(app).patch('/v1/athletes/me').send({ fullName: 'Anon' });
      expect(response.status).toBe(401);
    });

    it('rejects POST /v1/athletes/me/publish without a bearer token', async () => {
      const response = await request(app).post('/v1/athletes/me/publish');
      expect(response.status).toBe(401);
    });

    it('rejects PUT /v1/athletes/me/highlights without a bearer token', async () => {
      const response = await request(app)
        .put('/v1/athletes/me/highlights')
        .send({ highlights: [] });
      expect(response.status).toBe(401);
    });

    it('returns 404 when an authenticated user has no athlete profile', async () => {
      const { userId, email } = await createFixtureUser('no-profile');
      const response = await request(app)
        .patch('/v1/athletes/me')
        .set('authorization', `Bearer ${tokenFor(userId, email)}`)
        .send({ fullName: 'Ghost' });
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('not_found');
    });
  });

  describe('PATCH /v1/athletes/me', () => {
    it('updates profile fields and reflects them on the profile read', async () => {
      const fixture = await createFixtureAthlete({ suffix: 'patch-basic', publishedAt: new Date() });

      const patch = await request(app)
        .patch('/v1/athletes/me')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({
          fullName: 'Updated Name',
          disciplineLabel: 'Road Marathon',
          storyIntro: 'A new chapter.',
          storyBody: ['Paragraph one', 'Paragraph two'],
          coreValues: [{ title: 'Discipline', body: 'Show up daily.' }],
          presentation: { subtitle: 'Chasing the line' },
          secondarySports: [SportCategory.TRACK_AND_FIELD],
        });

      expect(patch.status).toBe(200);
      const parsed = athleteProfileSchema.parse(patch.body.data);
      expect(parsed.fullName).toBe('Updated Name');
      expect(parsed.disciplineLabel).toBe('Road Marathon');
      expect(parsed.storyIntro).toBe('A new chapter.');
      expect(parsed.storyBody).toEqual(['Paragraph one', 'Paragraph two']);
      expect(parsed.coreValues?.[0]?.title).toBe('Discipline');
      expect(parsed.presentation).toEqual({ subtitle: 'Chasing the line' });
      expect(parsed.secondarySports).toEqual([SportCategory.TRACK_AND_FIELD]);

      const read = await request(app).get(`/v1/athletes/${fixture.athleteSlug}`);
      expect(read.status).toBe(200);
      expect(read.body.data.fullName).toBe('Updated Name');
      expect(read.body.data.disciplineLabel).toBe('Road Marathon');
    });

    it('only affects the caller profile, never another athlete', async () => {
      const owner = await createFixtureAthlete({ suffix: 'patch-owner', publishedAt: new Date() });
      const other = await createFixtureAthlete({ suffix: 'patch-other', publishedAt: new Date() });

      const patch = await request(app)
        .patch('/v1/athletes/me')
        .set('authorization', `Bearer ${owner.accessToken}`)
        .send({ fullName: 'Owner Was Here' });
      expect(patch.status).toBe(200);

      const otherRead = await request(app).get(`/v1/athletes/${other.athleteSlug}`);
      expect(otherRead.status).toBe(200);
      expect(otherRead.body.data.fullName).toBe('Fixture Athlete');
    });
  });

  describe('POST /v1/athletes/me/publish', () => {
    it('lists exactly the missing content when the guard fails', async () => {
      const fixture = await createFixtureAthlete({
        suffix: 'publish-missing-all',
        disciplineLabel: null,
        storyIntro: null,
        withPersonalBest: false,
      });

      const response = await request(app)
        .post('/v1/athletes/me/publish')
        .set('authorization', `Bearer ${fixture.accessToken}`);

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('validation_error');
      const missing = response.body.error.details.missing as string[];
      expect(missing).toEqual(expect.arrayContaining(['storyIntro', 'personalBests']));
      expect(missing).toHaveLength(2);

      const stillUnpublished = await prisma.athleteProfile.findUniqueOrThrow({
        where: { id: fixture.athleteId },
      });
      expect(stillUnpublished.publishedAt).toBeNull();
    });

    it('publishes without a discipline when required story and results exist', async () => {
      const fixture = await createFixtureAthlete({
        suffix: 'publish-no-discipline',
        disciplineLabel: null,
        storyIntro: 'Ready to race.',
        withPersonalBest: true,
      });

      const response = await request(app)
        .post('/v1/athletes/me/publish')
        .set('authorization', `Bearer ${fixture.accessToken}`);

      expect(response.status).toBe(200);
      const parsed = publishAthleteProfileResponseSchema.parse(response.body.data);
      expect(parsed.athleteSlug).toBe(fixture.athleteSlug);
    });

    it('publishes once and is idempotent on repeat calls', async () => {
      const fixture = await createFixtureAthlete({
        suffix: 'publish-ok',
        disciplineLabel: 'Trail Ultra',
        storyIntro: 'Born to climb.',
        withPersonalBest: true,
      });

      const first = await request(app)
        .post('/v1/athletes/me/publish')
        .set('authorization', `Bearer ${fixture.accessToken}`);
      expect(first.status).toBe(200);
      const firstParsed = publishAthleteProfileResponseSchema.parse(first.body.data);
      expect(firstParsed.athleteSlug).toBe(fixture.athleteSlug);

      const second = await request(app)
        .post('/v1/athletes/me/publish')
        .set('authorization', `Bearer ${fixture.accessToken}`);
      expect(second.status).toBe(200);
      const secondParsed = publishAthleteProfileResponseSchema.parse(second.body.data);
      expect(secondParsed.publishedAt).toBe(firstParsed.publishedAt);
    });

    it('publishes for an athlete who has not verified their email', async () => {
      const fixture = await createFixtureAthlete({
        suffix: 'publish-unverified',
        disciplineLabel: 'Track',
        storyIntro: 'First season back.',
        withPersonalBest: true,
      });

      const user = await prisma.user.findUniqueOrThrow({ where: { id: fixture.userId } });
      expect(user.emailVerifiedAt).toBeNull();

      const response = await request(app)
        .post('/v1/athletes/me/publish')
        .set('authorization', `Bearer ${fixture.accessToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('PUT set-replace endpoints round-trip via the profile read', () => {
    it('replaces highlights and preserves submitted order', async () => {
      const fixture = await createFixtureAthlete({
        suffix: 'set-highlights',
        publishedAt: new Date(),
      });

      const put = await request(app)
        .put('/v1/athletes/me/highlights')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({
          highlights: [
            { title: 'Won Nationals', detail: 'Gold medal', photoRefs: ['a'] },
            { title: 'Set a course record', resultUrl: 'https://results.example.com/cr' },
            { title: 'Podium at Worlds' },
          ],
        });
      expect(put.status).toBe(200);

      const read = await request(app).get(`/v1/athletes/${fixture.athleteSlug}`);
      const parsed = athleteProfileSchema.parse(read.body.data);
      expect(parsed.accomplishments.map((entry) => entry.title)).toEqual([
        'Won Nationals',
        'Set a course record',
        'Podium at Worlds',
      ]);
      expect(parsed.accomplishments[1]?.resultUrl).toBe('https://results.example.com/cr');

      const replaced = await request(app)
        .put('/v1/athletes/me/highlights')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({ highlights: [{ title: 'Only one now' }] });
      expect(replaced.status).toBe(200);
      const reread = athleteProfileSchema.parse(
        (await request(app).get(`/v1/athletes/${fixture.athleteSlug}`)).body.data
      );
      expect(reread.accomplishments.map((entry) => entry.title)).toEqual(['Only one now']);
    });

    it('replaces race results and preserves submitted order via sortOrder', async () => {
      const fixture = await createFixtureAthlete({ suffix: 'set-races', publishedAt: new Date() });

      const put = await request(app)
        .put('/v1/athletes/me/races')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({
          races: [
            {
              resultName: 'Spring Half',
              displayDate: 'March 2026',
              resultSummary: '1:05:00',
              resultUrl: 'https://results.example.com/half',
              links: [{ label: 'Official', href: 'https://results.example.com/half' }],
            },
            { resultName: 'Summer 10k', displayDate: 'July 2026', resultSummary: '29:10' },
            { resultName: 'Fall Marathon', displayDate: 'October 2026', resultSummary: '2:18:00' },
          ],
        });
      expect(put.status).toBe(200);

      const parsed = athleteProfileSchema.parse(
        (await request(app).get(`/v1/athletes/${fixture.athleteSlug}`)).body.data
      );
      expect(parsed.raceResults?.map((race) => race.resultName)).toEqual([
        'Spring Half',
        'Summer 10k',
        'Fall Marathon',
      ]);
      expect(parsed.raceResults?.map((race) => race.sortOrder)).toEqual([0, 1, 2]);
      expect(parsed.raceResults?.[0]?.links[0]?.href).toBe('https://results.example.com/half');
    });

    it('replaces roadmap events in chronological (submitted) order', async () => {
      const fixture = await createFixtureAthlete({ suffix: 'set-roadmap', publishedAt: new Date() });

      const put = await request(app)
        .put('/v1/athletes/me/roadmap')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({
          roadmap: [
            { eventName: 'Spring Buildup', displayDate: 'March 2026' },
            { eventName: 'Goal Race', displayDate: 'June 2026' },
            { eventName: 'Off-season', displayDate: 'November 2026' },
          ],
        });
      expect(put.status).toBe(200);

      const parsed = athleteProfileSchema.parse(
        (await request(app).get(`/v1/athletes/${fixture.athleteSlug}`)).body.data
      );
      expect(parsed.roadmap?.map((event) => event.eventName)).toEqual([
        'Spring Buildup',
        'Goal Race',
        'Off-season',
      ]);
      expect(parsed.roadmap?.map((event) => event.displayDate)).toEqual([
        'March 2026',
        'June 2026',
        'November 2026',
      ]);
    });

    it('replaces the gallery and preserves submitted order', async () => {
      const fixture = await createFixtureAthlete({ suffix: 'set-gallery', publishedAt: new Date() });

      const put = await request(app)
        .put('/v1/athletes/me/gallery')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({
          gallery: [
            'https://cdn.example.com/one.jpg',
            'https://cdn.example.com/two.jpg',
            'https://cdn.example.com/three.jpg',
          ],
        });
      expect(put.status).toBe(200);

      const parsed = athleteProfileSchema.parse(
        (await request(app).get(`/v1/athletes/${fixture.athleteSlug}`)).body.data
      );
      expect(parsed.gallery).toEqual([
        'https://cdn.example.com/one.jpg',
        'https://cdn.example.com/two.jpg',
        'https://cdn.example.com/three.jpg',
      ]);

      const emptied = await request(app)
        .put('/v1/athletes/me/gallery')
        .set('authorization', `Bearer ${fixture.accessToken}`)
        .send({ gallery: [] });
      expect(emptied.status).toBe(200);
      const reread = athleteProfileSchema.parse(
        (await request(app).get(`/v1/athletes/${fixture.athleteSlug}`)).body.data
      );
      expect(reread.gallery).toEqual([]);
    });
  });
});
