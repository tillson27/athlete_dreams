import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { buildTestApp } from '../../test/buildTestApp';
import { SignupAllowlistService } from '../../services/infrastructure/SignupAllowlistService';

const runDbTests = process.env.RUN_DB_TESTS === '1';

const FIXTURE_SUFFIX = `allowlist-${Date.now()}`;
const LISTED_EMAIL = `${FIXTURE_SUFFIX}-listed@example.com`;
const UNLISTED_EMAIL = `${FIXTURE_SUFFIX}-unlisted@example.com`;
const DOMAIN_EMAIL = `${FIXTURE_SUFFIX}-member@invited.example`;
const PASSWORD = 'Allowlist!Passw0rd';

const originalAllowlist = process.env.SIGNUP_EMAIL_ALLOWLIST;

function setAllowlist(value: string | undefined): void {
  if (value === undefined) {
    delete process.env.SIGNUP_EMAIL_ALLOWLIST;
  } else {
    process.env.SIGNUP_EMAIL_ALLOWLIST = value;
  }
}

describe('SignupAllowlistService', () => {
  afterEach(() => setAllowlist(originalAllowlist));

  const service = new SignupAllowlistService();

  it('is open when unset or blank', () => {
    setAllowlist(undefined);
    expect(service.isEnforced()).toBe(false);
    expect(service.isAllowed('anyone@anywhere.example')).toBe(true);
    setAllowlist('  ,  ');
    expect(service.isAllowed('anyone@anywhere.example')).toBe(true);
  });

  it('matches exact emails case-insensitively', () => {
    setAllowlist('Listed@Example.com');
    expect(service.isAllowed('listed@example.com')).toBe(true);
    expect(service.isAllowed('LISTED@EXAMPLE.COM')).toBe(true);
    expect(service.isAllowed('other@example.com')).toBe(false);
  });

  it('matches whole-domain entries', () => {
    setAllowlist('@invited.example');
    expect(service.isAllowed('anyone@invited.example')).toBe(true);
    expect(service.isAllowed('anyone@uninvited.example')).toBe(false);
    expect(service.isAllowed('anyone@sub.invited.example')).toBe(false);
  });
});

describe.skipIf(!runDbTests)('auth allowlist gating (integration)', () => {
  const prisma = new PrismaClient();
  const app = buildTestApp();

  afterEach(() => setAllowlist(originalAllowlist));

  beforeAll(async () => {
    // Create the sign-in fixture while the gate is open, so the sign-in test
    // exercises "existing account, later removed from the list".
    setAllowlist(undefined);
    await request(app)
      .post('/v1/auth/sign-up')
      .send({ email: UNLISTED_EMAIL, password: PASSWORD, displayName: 'Allowlist Fixture' })
      .expect(201);
  });

  afterAll(async () => {
    setAllowlist(originalAllowlist);
    await prisma.user.deleteMany({
      where: { email: { in: [LISTED_EMAIL, UNLISTED_EMAIL, DOMAIN_EMAIL] } },
    });
    await prisma.team.deleteMany({
      where: {
        name: {
          in: ["Allowlist Fixture's Team", "Listed Fixture's Team", "Domain Fixture's Team"],
        },
        memberships: { none: {} },
      },
    });
    await prisma.$disconnect();
  });

  it('allows listed emails to sign up', async () => {
    setAllowlist(`${LISTED_EMAIL},@invited.example`);
    await request(app)
      .post('/v1/auth/sign-up')
      .send({ email: LISTED_EMAIL, password: PASSWORD, displayName: 'Listed Fixture' })
      .expect(201);
  });

  it('allows domain-listed emails to sign up', async () => {
    setAllowlist('@invited.example');
    await request(app)
      .post('/v1/auth/sign-up')
      .send({ email: DOMAIN_EMAIL, password: PASSWORD, displayName: 'Domain Fixture' })
      .expect(201);
  });

  it('rejects unlisted sign-ups with 403', async () => {
    setAllowlist('@invited.example');
    const response = await request(app)
      .post('/v1/auth/sign-up')
      .send({
        email: `${FIXTURE_SUFFIX}-blocked@example.com`,
        password: PASSWORD,
        displayName: 'Blocked Fixture',
      })
      .expect(403);
    expect(response.body.error.code).toBe('forbidden');
  });

  it('rejects sign-in for existing accounts no longer on the list', async () => {
    setAllowlist('@invited.example');
    const response = await request(app)
      .post('/v1/auth/sign-in')
      .send({ email: UNLISTED_EMAIL, password: PASSWORD })
      .expect(403);
    expect(response.body.error.code).toBe('forbidden');
  });

  it('signs existing accounts in normally when the gate is open', async () => {
    setAllowlist(undefined);
    await request(app)
      .post('/v1/auth/sign-in')
      .send({ email: UNLISTED_EMAIL, password: PASSWORD })
      .expect(200);
  });
});
