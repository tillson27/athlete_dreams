import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createRateLimit, resetRateLimitBucketsForTests } from './rateLimit';

beforeEach(() => {
  resetRateLimitBucketsForTests();
});

describe('createRateLimit', () => {
  it('scopes attempts by client IP and submitted email', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/v1/auth/sign-in',
      createRateLimit({ keyPrefix: 'auth-test', windowMs: 60_000, maxRequests: 2 }),
      (_req, res) => res.json({ data: { ok: true } })
    );

    await request(app)
      .post('/v1/auth/sign-in')
      .set('x-forwarded-for', '203.0.113.1')
      .send({ email: 'one@example.test' })
      .expect(200);
    await request(app)
      .post('/v1/auth/sign-in')
      .set('x-forwarded-for', '203.0.113.1')
      .send({ email: 'one@example.test' })
      .expect(200);
    const limited = await request(app)
      .post('/v1/auth/sign-in')
      .set('x-forwarded-for', '203.0.113.1')
      .send({ email: 'one@example.test' })
      .expect(429);
    expect(limited.body.error.code).toBe('rate_limited');

    await request(app)
      .post('/v1/auth/sign-in')
      .set('x-forwarded-for', '203.0.113.1')
      .send({ email: 'two@example.test' })
      .expect(200);
  });
});
