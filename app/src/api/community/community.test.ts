import 'reflect-metadata';
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { container } from 'tsyringe';
import { PrismaClient, SportCategory } from '@prisma/client';
import { communityFeedResponseSchema } from 'fad-common';
import { buildTestApp } from '../../test/buildTestApp';
import { PrismaService } from '../../services/infrastructure/PrismaService';
import type { AthleteFeedSourceRow } from '../../repositories/AthleteRepository';
import { buildOrderedFeedItems, sortFeedItems } from './CommunityFeedService';

const shouldRunDatabaseTests = process.env.RUN_DB_TESTS === '1';

const RUN_ID = `step11-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const SEEDED_PUBLISHED_SLUG = 'felix-tremblay';
const SEEDED_CYCLIST_SLUG = 'naomi-osei';

const FIXTURE_USER_EMAILS: string[] = [];
const FIXTURE_TEAM_IDS: string[] = [];

const prisma = new PrismaClient();

// ── Pure mapping unit tests (no database) ───────────────────────────────────

function makeSource(overrides: Partial<AthleteFeedSourceRow> = {}): AthleteFeedSourceRow {
  const base: AthleteFeedSourceRow = {
    id: 'athlete-1',
    athleteSlug: 'alex-runner',
    fullName: 'Alex Runner',
    primarySport: SportCategory.RUNNING,
    presentation: {
      training: { latestTitle: 'Tempo intervals', latestMeta: 'Yesterday • 12 km' },
    },
    raceResults: [
      {
        id: 'race-1',
        athleteId: 'athlete-1',
        resultName: 'Boston Marathon',
        displayDate: 'April 21, 2025',
        occurredOn: null,
        resultSummary: '2:31:04 — 12th',
        resultUrl: 'https://results.example.com/boston',
        links: null,
        photoRefs: ['https://images.example.com/race.jpg'],
        sortOrder: 0,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ],
    accomplishments: [
      {
        id: 'highlight-1',
        athleteId: 'athlete-1',
        title: 'National Champion 2024',
        description: null,
        detail: 'Won the national 10k title.',
        resultUrl: null,
        photoRefs: ['bare-unsplash-ref'],
        occurredOn: null,
        createdAt: new Date('2026-02-01T00:00:00Z'),
      },
    ],
    events: [
      {
        id: 'event-1',
        athleteId: 'athlete-1',
        eventName: 'Berlin Marathon',
        eventLocation: null,
        eventStartDate: new Date('2026-09-27T00:00:00Z'),
        eventEndDate: null,
        displayDate: 'September 27, 2026',
        eventDescription: null,
        createdAt: new Date('2026-03-01T00:00:00Z'),
      },
    ],
  };
  return { ...base, ...overrides };
}

describe('community feed derivation (pure)', () => {
  it('derives every category from a full source (race yields a result and a roadmap card)', () => {
    const items = buildOrderedFeedItems([makeSource()]).map((entry) => entry.item);
    const byId = new Map(items.map((item) => [item.feedItemId, item]));

    expect(items).toHaveLength(4);
    const milestone = byId.get('alex-runner-milestone-highlight-1');
    expect(milestone?.kind).toBe('result');
    expect(milestone?.category).toBe('milestone');
    expect(milestone?.headline).toBe('Hit a milestone — National Champion 2024');

    const race = byId.get('alex-runner-race-race-1');
    expect(race?.kind).toBe('result');
    expect(race?.category).toBe('race');
    expect(race?.headline).toBe('Raced Boston Marathon');

    const roadmap = byId.get('alex-runner-race-event-1');
    expect(roadmap?.kind).toBe('roadmap');
    expect(roadmap?.category).toBe('race');
    expect(roadmap?.headline).toBe('Is racing Berlin Marathon');

    const training = byId.get('alex-runner-training-training');
    expect(training?.kind).toBe('roadmap');
    expect(training?.category).toBe('training');
    expect(training?.headline).toBe('Logged a training run — Tempo intervals');
  });

  it('derives isVerified from the source resultUrl only', () => {
    const items = buildOrderedFeedItems([makeSource()]).map((entry) => entry.item);
    const byId = new Map(items.map((item) => [item.feedItemId, item]));

    expect(byId.get('alex-runner-race-race-1')?.isVerified).toBe(true);
    expect(byId.get('alex-runner-milestone-highlight-1')?.isVerified).toBe(false);
    expect(byId.get('alex-runner-race-event-1')?.isVerified).toBe(false);
    expect(byId.get('alex-runner-training-training')?.isVerified).toBe(false);
  });

  it('passes through absolute photo URLs but nulls bare refs', () => {
    const items = buildOrderedFeedItems([makeSource()]).map((entry) => entry.item);
    const byId = new Map(items.map((item) => [item.feedItemId, item]));

    expect(byId.get('alex-runner-race-race-1')?.photoUrl).toBe(
      'https://images.example.com/race.jpg'
    );
    expect(byId.get('alex-runner-milestone-highlight-1')?.photoUrl).toBeNull();
  });

  it('skips categories whose source is absent', () => {
    const items = buildOrderedFeedItems([
      makeSource({ raceResults: [], accomplishments: [], events: [], presentation: {} }),
    ]);
    expect(items).toHaveLength(0);
  });

  it('orders newest source date first with feedItemId as a stable tiebreaker', () => {
    const dated = makeSource({
      raceResults: [
        {
          ...makeSource().raceResults[0],
          id: 'race-new',
          displayDate: 'March 1, 2026',
          resultUrl: null,
        },
      ],
      accomplishments: [],
      events: [],
      presentation: {},
    });
    const older = makeSource({
      id: 'athlete-2',
      athleteSlug: 'blair-swift',
      raceResults: [
        {
          ...makeSource().raceResults[0],
          id: 'race-old',
          displayDate: 'January 1, 2020',
          resultUrl: null,
        },
      ],
      accomplishments: [],
      events: [],
      presentation: {},
    });
    const ordered = buildOrderedFeedItems([older, dated]);
    sortFeedItems(ordered);
    expect(ordered.map((entry) => entry.item.feedItemId)).toEqual([
      'alex-runner-race-race-new',
      'blair-swift-race-race-old',
    ]);
  });

  it('is stable across identical inputs', () => {
    const first = buildOrderedFeedItems([makeSource()]);
    const second = buildOrderedFeedItems([makeSource()]);
    sortFeedItems(first);
    sortFeedItems(second);
    expect(first.map((entry) => entry.item.feedItemId)).toEqual(
      second.map((entry) => entry.item.feedItemId)
    );
  });
});

// ── HTTP integration (auth gate, no database required) ──────────────────────

describe('GET /v1/community/feed (authentication gate)', () => {
  it('returns 401 when followedOnly is set while anonymous', async () => {
    const app = buildTestApp();
    const response = await request(app).get('/v1/community/feed?followedOnly=true');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('unauthorized');
  });
});

// ── HTTP integration against the seeded database ────────────────────────────

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

describe.skipIf(!shouldRunDatabaseTests)('GET /v1/community/feed (seeded data)', () => {
  it('derives feed items from the published roster for anonymous callers', async () => {
    const app = buildTestApp();
    const response = await request(app).get('/v1/community/feed?limit=100');
    expect(response.status).toBe(200);
    const feed = communityFeedResponseSchema.parse(response.body.data);

    expect(feed.items.length).toBeGreaterThan(0);
    const felixItems = feed.items.filter((item) => item.athleteSlug === SEEDED_PUBLISHED_SLUG);
    expect(felixItems.length).toBeGreaterThan(0);

    const categories = new Set(felixItems.map((item) => item.category));
    expect(categories.has('race')).toBe(true);
    expect(categories.has('milestone')).toBe(true);
    expect(categories.has('training')).toBe(true);

    for (const item of felixItems) {
      expect(item.feedItemId.startsWith(`${SEEDED_PUBLISHED_SLUG}-${item.category}-`)).toBe(true);
    }

    const raceItem = felixItems.find(
      (item) => item.category === 'race' && item.kind === 'result'
    );
    expect(raceItem?.isVerified).toBe(true);
    expect(raceItem?.headline.startsWith('Raced ')).toBe(true);
  });

  it('filters by category', async () => {
    const app = buildTestApp();
    const response = await request(app).get('/v1/community/feed?category=milestone&limit=100');
    expect(response.status).toBe(200);
    const feed = communityFeedResponseSchema.parse(response.body.data);
    expect(feed.items.length).toBeGreaterThan(0);
    expect(feed.items.every((item) => item.category === 'milestone')).toBe(true);
  });

  it('filters by sport', async () => {
    const app = buildTestApp();
    const response = await request(app).get(
      '/v1/community/feed?sport=ROAD_CYCLING&limit=100'
    );
    expect(response.status).toBe(200);
    const feed = communityFeedResponseSchema.parse(response.body.data);
    expect(feed.items.length).toBeGreaterThan(0);
    expect(feed.items.every((item) => item.primarySport === 'ROAD_CYCLING')).toBe(true);
    expect(feed.items.some((item) => item.athleteSlug === SEEDED_CYCLIST_SLUG)).toBe(true);
  });

  it('restricts followedOnly to the athletes the caller follows', async () => {
    const app = buildTestApp();
    const follower = await createFollowerUser(app, 'followed-feed');

    const followResponse = await request(app)
      .post(`/v1/athletes/${SEEDED_PUBLISHED_SLUG}/follow`)
      .set('authorization', `Bearer ${follower.accessToken}`);
    expect(followResponse.status).toBe(200);

    const response = await request(app)
      .get('/v1/community/feed?followedOnly=true&limit=100')
      .set('authorization', `Bearer ${follower.accessToken}`);
    expect(response.status).toBe(200);
    const feed = communityFeedResponseSchema.parse(response.body.data);

    expect(feed.items.length).toBeGreaterThan(0);
    expect(feed.items.every((item) => item.athleteSlug === SEEDED_PUBLISHED_SLUG)).toBe(true);
  });

  it('returns an empty feed for a follower with no follows', async () => {
    const app = buildTestApp();
    const follower = await createFollowerUser(app, 'no-follows');

    const response = await request(app)
      .get('/v1/community/feed?followedOnly=true&limit=100')
      .set('authorization', `Bearer ${follower.accessToken}`);
    expect(response.status).toBe(200);
    const feed = communityFeedResponseSchema.parse(response.body.data);
    expect(feed.items).toHaveLength(0);
    expect(feed.nextCursor).toBeNull();
  });

  it('is deterministic: two calls return an identical ordering', async () => {
    const app = buildTestApp();
    const first = await request(app).get('/v1/community/feed?limit=100');
    const second = await request(app).get('/v1/community/feed?limit=100');
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const firstFeed = communityFeedResponseSchema.parse(first.body.data);
    const secondFeed = communityFeedResponseSchema.parse(second.body.data);
    expect(firstFeed.items.map((item) => item.feedItemId)).toEqual(
      secondFeed.items.map((item) => item.feedItemId)
    );
  });
});
