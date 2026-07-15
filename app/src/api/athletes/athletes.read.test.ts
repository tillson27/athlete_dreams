import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { container } from 'tsyringe';
import { athleteDirectoryResponseSchema, athleteProfileSchema } from 'fad-common';
import { AthleteLevel, MediaKind, SportCategory } from '@prisma/client';
import { buildTestApp } from '../../test/buildTestApp';
import { PrismaService } from '../../services/infrastructure/PrismaService';
import { JwtService } from '../../services/infrastructure/JwtService';
import { encodeKeysetCursor } from '../../shared/keysetCursor';

const shouldRunDatabaseTests = process.env.RUN_DB_TESTS === '1';

const SEEDED_SLUGS = [
  'cassandra-de-winter',
  'emma-chen',
  'felix-tremblay',
  'jordan-blackhorse',
  'maya-okafor',
  'naomi-osei',
  'priya-shah',
];

const FIXTURE_PREFIX = `step7-${Date.now()}`;

interface FixtureAthlete {
  userId: string;
  athleteId: string;
  athleteSlug: string;
}

describe.skipIf(!shouldRunDatabaseTests)('Athlete read path (database)', () => {
  let prisma: PrismaService;
  let app: ReturnType<typeof buildTestApp>;
  const createdUserIds: string[] = [];
  let fixtureCounter = 0;

  beforeAll(() => {
    prisma = container.resolve(PrismaService);
    app = buildTestApp();
  });

  async function createFixtureAthlete(overrides: {
    suffix: string;
    primarySport?: SportCategory;
    runnerLevel?: AthleteLevel;
    countryCode?: string;
    fullName?: string;
    disciplineLabel?: string;
    publishedAt?: Date | null;
    createdAt?: Date;
    withRichRelations?: boolean;
  }): Promise<FixtureAthlete> {
    fixtureCounter += 1;
    const slug = `${FIXTURE_PREFIX}-${overrides.suffix}`;
    const handle = `f7.${Date.now()}.${fixtureCounter}`.slice(0, 30);
    const user = await prisma.user.create({
      data: {
        email: `${slug}@fixture.test`,
        passwordHash: 'fixture-not-a-real-hash',
        displayName: overrides.fullName ?? 'Fixture Athlete',
      },
    });
    createdUserIds.push(user.id);

    const athlete = await prisma.athleteProfile.create({
      data: {
        userId: user.id,
        athleteSlug: slug,
        handle,
        fullName: overrides.fullName ?? 'Fixture Athlete',
        headline: 'Fixture headline',
        bio: 'Fixture bio',
        primarySport: overrides.primarySport ?? SportCategory.RUNNING,
        runnerLevel: overrides.runnerLevel ?? AthleteLevel.EVERYDAY,
        disciplineLabel: overrides.disciplineLabel ?? null,
        hometown: 'Fixtureville',
        countryCode: overrides.countryCode ?? 'CA',
        values: ['Fixture value'],
        storyIntro: overrides.withRichRelations ? 'Fixture story intro' : null,
        storyBody: overrides.withRichRelations ? ['Chapter one', 'Chapter two'] : [],
        coreValues: overrides.withRichRelations
          ? [{ title: 'Grit', body: 'Keep going.' }]
          : undefined,
        presentation: overrides.withRichRelations ? { subtitle: 'Fixture subtitle' } : undefined,
        publishedAt: overrides.publishedAt === undefined ? new Date() : overrides.publishedAt,
        ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
      },
    });

    if (overrides.withRichRelations) {
      await prisma.personalBest.create({
        data: { athleteId: athlete.id, label: 'Marathon', value: '2:40:00', sortOrder: 0 },
      });
      await prisma.athleteRaceResult.create({
        data: {
          athleteId: athlete.id,
          resultName: 'Fixture Marathon',
          displayDate: 'April 2026',
          resultSummary: '1st place',
          resultUrl: 'https://results.example.com/fixture',
          links: [{ label: 'Official', href: 'https://results.example.com/fixture' }],
          photoRefs: ['fixture-photo-1'],
          sortOrder: 0,
        },
      });
      await prisma.athleteMedia.create({
        data: {
          athleteId: athlete.id,
          mediaUrl: 'https://cdn.example.com/fixture-gallery-1.jpg',
          mediaKind: MediaKind.IMAGE,
        },
      });
      await prisma.athleteEvent.create({
        data: {
          athleteId: athlete.id,
          eventName: 'Fixture Fall Classic',
          eventStartDate: new Date('2026-10-01'),
          displayDate: 'October 2026',
        },
      });
    }

    return { userId: user.id, athleteId: athlete.id, athleteSlug: slug };
  }

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
    container.reset();
  });

  describe('GET /v1/athletes (directory)', () => {
    it('returns the paginated wrapper and includes only published athletes', async () => {
      await createFixtureAthlete({ suffix: 'unpublished-dir', publishedAt: null });

      const response = await request(app).get('/v1/athletes').query({ limit: 100 });

      expect(response.status).toBe(200);
      const parsed = athleteDirectoryResponseSchema.parse(response.body.data);
      const returnedSlugs = parsed.items.map((item) => item.athleteSlug);

      for (const seededSlug of SEEDED_SLUGS) {
        expect(returnedSlugs).toContain(seededSlug);
      }
      expect(returnedSlugs).not.toContain(`${FIXTURE_PREFIX}-unpublished-dir`);
    });

    it('filters by sport', async () => {
      const response = await request(app)
        .get('/v1/athletes')
        .query({ sport: SportCategory.ROAD_CYCLING, limit: 100 });

      expect(response.status).toBe(200);
      const parsed = athleteDirectoryResponseSchema.parse(response.body.data);
      expect(parsed.items.every((item) => item.primarySport === SportCategory.ROAD_CYCLING)).toBe(
        true
      );
      expect(parsed.items.map((item) => item.athleteSlug)).toContain('naomi-osei');
      expect(parsed.items.map((item) => item.athleteSlug)).not.toContain('maya-okafor');
    });

    it('filters by runnerLevel', async () => {
      const response = await request(app)
        .get('/v1/athletes')
        .query({ runnerLevel: AthleteLevel.ELITE, limit: 100 });

      expect(response.status).toBe(200);
      const parsed = athleteDirectoryResponseSchema.parse(response.body.data);
      expect(parsed.items.every((item) => item.runnerLevel === AthleteLevel.ELITE)).toBe(true);
      const eliteSlugs = parsed.items.map((item) => item.athleteSlug);
      expect(eliteSlugs).toContain('maya-okafor');
      expect(eliteSlugs).not.toContain('felix-tremblay');
    });

    it('filters by countryCode', async () => {
      const response = await request(app)
        .get('/v1/athletes')
        .query({ countryCode: 'US', limit: 100 });

      expect(response.status).toBe(200);
      const parsed = athleteDirectoryResponseSchema.parse(response.body.data);
      expect(parsed.items.every((item) => item.countryCode === 'US')).toBe(true);
      expect(parsed.items.map((item) => item.athleteSlug)).toContain('jordan-blackhorse');
    });

    it('filters by search across name and headline', async () => {
      const response = await request(app)
        .get('/v1/athletes')
        .query({ search: 'Okafor', limit: 100 });

      expect(response.status).toBe(200);
      const parsed = athleteDirectoryResponseSchema.parse(response.body.data);
      expect(parsed.items.map((item) => item.athleteSlug)).toContain('maya-okafor');
      expect(parsed.items.map((item) => item.athleteSlug)).not.toContain('jordan-blackhorse');
    });

    it('paginates deterministically across pages with keyset cursors', async () => {
      const baseTime = Date.UTC(2999, 0, 1);
      const pagedFixtures: FixtureAthlete[] = [];
      for (let index = 0; index < 5; index += 1) {
        pagedFixtures.push(
          await createFixtureAthlete({
            suffix: `page-${index}`,
            countryCode: 'AQ',
            createdAt: new Date(baseTime + index * 1000),
          })
        );
      }

      const collectedSlugs: string[] = [];
      let cursor: string | null = null;
      let guard = 0;
      do {
        const query: Record<string, string | number> = { countryCode: 'AQ', limit: 2 };
        if (cursor) query.cursor = cursor;
        const page = await request(app).get('/v1/athletes').query(query);
        expect(page.status).toBe(200);
        const parsed = athleteDirectoryResponseSchema.parse(page.body.data);
        collectedSlugs.push(...parsed.items.map((item) => item.athleteSlug));
        cursor = parsed.nextCursor;
        guard += 1;
      } while (cursor && guard < 10);

      expect(cursor).toBeNull();
      expect(collectedSlugs).toHaveLength(pagedFixtures.length);
      expect(new Set(collectedSlugs).size).toBe(pagedFixtures.length);

      const expectedDescending = [...pagedFixtures]
        .map((fixture) => fixture.athleteSlug)
        .reverse();
      expect(collectedSlugs).toEqual(expectedDescending);
    });

    it('keeps the search filter applied while paginating with a cursor', async () => {
      const searchToken = `Zephyrion${FIXTURE_PREFIX.replace(/[^a-z]/gi, '')}`;
      const baseTime = Date.UTC(2998, 0, 1);
      const searchableFixtures: FixtureAthlete[] = [];
      for (let index = 0; index < 3; index += 1) {
        searchableFixtures.push(
          await createFixtureAthlete({
            suffix: `search-page-${index}`,
            fullName: `${searchToken} Runner ${index}`,
            createdAt: new Date(baseTime + index * 1000),
          })
        );
      }
      await createFixtureAthlete({
        suffix: 'search-noise',
        fullName: 'Unrelated Athlete',
        createdAt: new Date(baseTime + 10_000),
      });

      const collectedSlugs: string[] = [];
      let cursor: string | null = null;
      let guard = 0;
      do {
        const query: Record<string, string | number> = { search: searchToken, limit: 2 };
        if (cursor) query.cursor = cursor;
        const page = await request(app).get('/v1/athletes').query(query);
        expect(page.status).toBe(200);
        const parsed = athleteDirectoryResponseSchema.parse(page.body.data);
        collectedSlugs.push(...parsed.items.map((item) => item.athleteSlug));
        cursor = parsed.nextCursor;
        guard += 1;
      } while (cursor && guard < 10);

      expect(collectedSlugs).toHaveLength(searchableFixtures.length);
      expect(new Set(collectedSlugs).size).toBe(searchableFixtures.length);
      expect(collectedSlugs).not.toContain(`${FIXTURE_PREFIX}-search-noise`);
    });

    it('returns an empty page with a null cursor when the cursor is past the end', async () => {
      const outOfRangeCursor = encodeKeysetCursor({
        createdAt: new Date('1970-01-01T00:00:00.000Z'),
        id: '00000000-0000-0000-0000-000000000000',
      });

      const response = await request(app)
        .get('/v1/athletes')
        .query({ cursor: outOfRangeCursor, limit: 5 });

      expect(response.status).toBe(200);
      const parsed = athleteDirectoryResponseSchema.parse(response.body.data);
      expect(parsed.items).toHaveLength(0);
      expect(parsed.nextCursor).toBeNull();
    });

    it('rejects a malformed cursor with 422', async () => {
      const response = await request(app)
        .get('/v1/athletes')
        .query({ cursor: 'not-a-valid-cursor', limit: 5 });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('reports batched campaign stats that match a direct groupBy for a seeded athlete', async () => {
      const response = await request(app).get('/v1/athletes').query({ limit: 100 });
      expect(response.status).toBe(200);
      const parsed = athleteDirectoryResponseSchema.parse(response.body.data);
      const felix = parsed.items.find((item) => item.athleteSlug === 'felix-tremblay');
      expect(felix).toBeDefined();

      const felixProfile = await prisma.athleteProfile.findFirstOrThrow({
        where: { athleteSlug: 'felix-tremblay' },
      });
      const grouped = await prisma.campaign.groupBy({
        by: ['campaignStatus'],
        where: { athleteId: felixProfile.id, deletedAt: null },
        _sum: { raisedAmountCents: true },
        _count: { _all: true },
      });
      const expectedTotalRaised = grouped.reduce(
        (sum, row) => sum + (row._sum.raisedAmountCents ?? 0),
        0
      );
      const expectedActive = grouped
        .filter((row) => row.campaignStatus === 'ACTIVE')
        .reduce((sum, row) => sum + row._count._all, 0);

      expect(felix?.totalRaisedCents).toBe(expectedTotalRaised);
      expect(felix?.activeCampaignCount).toBe(expectedActive);
    });
  });

  describe('GET /v1/athletes/:athleteSlug (profile)', () => {
    it('round-trips a seeded athlete with rich profile fields populated', async () => {
      const response = await request(app).get('/v1/athletes/maya-okafor');

      expect(response.status).toBe(200);
      const profile = response.body.data;
      expect(profile.athleteSlug).toBe('maya-okafor');
      expect(profile.handle).toBe('maya.runs.far');
      expect(profile.runnerLevel).toBe(AthleteLevel.ELITE);
      expect(profile.disciplineLabel).toBe('Road Marathon');
      expect(typeof profile.storyIntro).toBe('string');
      expect(Array.isArray(profile.storyBody)).toBe(true);
      expect(profile.storyBody.length).toBeGreaterThan(0);
      expect(profile.personalBests.length).toBeGreaterThan(0);
      expect(profile.personalBests[0]).toHaveProperty('personalBestId');
      expect(profile.personalBests[0]).toHaveProperty('label');
      expect(profile.raceResults.length).toBeGreaterThan(0);
      expect(profile.raceResults[0]).toHaveProperty('displayDate');
      expect(profile.roadmap.length).toBeGreaterThan(0);
      expect(profile.roadmap[0]).toHaveProperty('displayDate');
      expect(profile.coreValues.length).toBeGreaterThan(0);
      expect(profile.presentation).not.toBeNull();
      expect(profile.publishedAt).not.toBeNull();
    });

    it('produces a fully contract-valid DTO for a controlled fixture profile', async () => {
      const fixture = await createFixtureAthlete({
        suffix: 'contract-valid',
        withRichRelations: true,
        disciplineLabel: 'Road Marathon',
      });

      const response = await request(app).get(`/v1/athletes/${fixture.athleteSlug}`);

      expect(response.status).toBe(200);
      const parsed = athleteProfileSchema.parse(response.body.data);
      expect(parsed.personalBests?.length).toBe(1);
      expect(parsed.raceResults?.[0]?.links.length).toBe(1);
      expect(parsed.gallery).toEqual(['https://cdn.example.com/fixture-gallery-1.jpg']);
      expect(parsed.roadmap?.[0]?.displayDate).toBe('October 2026');
    });

    it('returns 404 for an unpublished profile when unauthenticated', async () => {
      const fixture = await createFixtureAthlete({
        suffix: 'unpublished-profile',
        publishedAt: null,
      });

      const response = await request(app).get(`/v1/athletes/${fixture.athleteSlug}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('not_found');
    });

    it('returns the unpublished profile to its owner via a bearer token', async () => {
      const fixture = await createFixtureAthlete({
        suffix: 'owner-only',
        publishedAt: null,
      });
      const { accessToken } = container
        .resolve(JwtService)
        .issueAccessToken({ sub: fixture.userId, email: `${fixture.athleteSlug}@fixture.test` });

      const response = await request(app)
        .get(`/v1/athletes/${fixture.athleteSlug}`)
        .set('authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.athleteSlug).toBe(fixture.athleteSlug);
      expect(response.body.data.publishedAt).toBeNull();
    });

    it('does not expose an unpublished profile to a non-owner authenticated user', async () => {
      const owner = await createFixtureAthlete({
        suffix: 'owner-guard',
        publishedAt: null,
      });
      const intruder = await createFixtureAthlete({ suffix: 'intruder' });
      const { accessToken } = container
        .resolve(JwtService)
        .issueAccessToken({ sub: intruder.userId, email: `${intruder.athleteSlug}@fixture.test` });

      const response = await request(app)
        .get(`/v1/athletes/${owner.athleteSlug}`)
        .set('authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it('returns 404 for a slug that does not exist', async () => {
      const response = await request(app).get(`/v1/athletes/${FIXTURE_PREFIX}-missing-slug`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('not_found');
    });
  });
});
