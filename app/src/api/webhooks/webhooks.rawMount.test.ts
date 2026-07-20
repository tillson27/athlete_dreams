import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type express from 'express';

// Integration smoke test: the Stripe webhook route is mounted with a raw-body
// parser BEFORE the global express.json, so an unsigned/invalid payload reaches
// signature verification (400) rather than being JSON-parsed away. Needs env for
// the singletons (StripeService secret guard; a DATABASE_URL so PrismaService
// constructs quickly — no query runs on the 400 path).
const savedEnv: Record<string, string | undefined> = {};
const testEnv: Record<string, string> = {
  STRIPE_SECRET_KEY: 'sk_test_dummy',
  STRIPE_CONNECT_WEBHOOK_SECRET: 'whsec_dummy',
  DATABASE_URL: 'postgresql://fad:fad@localhost:5432/fad_dev?schema=public',
};

let app: express.Express;

beforeAll(async () => {
  for (const [key, value] of Object.entries(testEnv)) {
    savedEnv[key] = process.env[key];
    process.env[key] = value;
  }
  const { buildApp } = await import('../../app');
  app = buildApp();
});

afterAll(() => {
  for (const key of Object.keys(testEnv)) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe('POST /v1/webhooks/stripe (raw-body mount)', () => {
  it('rejects a payload with a missing signature header (route mounted, raw body reached)', async () => {
    const response = await request(app)
      .post('/v1/webhooks/stripe')
      .set('content-type', 'application/json')
      .send(JSON.stringify({ id: 'evt_x', type: 'checkout.session.completed' }));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('bad_request');
  });

  it('rejects a payload with an invalid signature (raw body verified, not JSON-parsed away)', async () => {
    const response = await request(app)
      .post('/v1/webhooks/stripe')
      .set('content-type', 'application/json')
      .set('stripe-signature', 't=1,v1=deadbeef')
      .send(JSON.stringify({ id: 'evt_x', type: 'checkout.session.completed' }));

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/signature/i);
  });
});
