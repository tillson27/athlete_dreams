import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { container } from 'tsyringe';
import { buildTestApp } from './buildTestApp';
import { HealthRepository } from '../repositories/HealthRepository';
import { PrismaService } from '../services/infrastructure/PrismaService';

describe('GET /v1/health/live', () => {
  it('returns 200 with a live status without touching the database', async () => {
    const app = buildTestApp();

    const response = await request(app).get('/v1/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'live' } });
  });
});

describe('GET /v1/health/ready (database unreachable)', () => {
  afterEach(() => {
    container.reset();
  });

  it('returns 503 with the service_unavailable envelope when the DB probe fails', async () => {
    const failingHealthRepository: Pick<HealthRepository, 'ping'> = {
      ping: async () => {
        throw new Error('P1001: database server unreachable (broken DATABASE_URL)');
      },
    };
    container.registerInstance(HealthRepository, failingHealthRepository as HealthRepository);

    const app = buildTestApp();

    const response = await request(app).get('/v1/health/ready');

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('service_unavailable');
    expect(typeof response.body.error.message).toBe('string');
  });
});

const shouldRunDatabaseTests = process.env.RUN_DB_TESTS === '1';

describe.skipIf(!shouldRunDatabaseTests)('GET /v1/health/ready (database reachable)', () => {
  afterEach(async () => {
    await container.resolve(PrismaService).$disconnect();
    container.reset();
  });

  it('returns 200 with a ready status when SELECT 1 succeeds', async () => {
    const app = buildTestApp();

    const response = await request(app).get('/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'ready' } });
  });
});
