import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { buildTestApp } from '../../test/buildTestApp';
import { EmailService } from '../../services/infrastructure/EmailService';
import { TokenHasher } from '../../services/infrastructure/TokenHasher';

const shouldRunDatabaseTests = process.env.RUN_DB_TESTS === '1';
const FIXTURE_PREFIX = `auth-flow-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const PASSWORD = 'Validpassword1';

type SentEmail = {
  to: string;
  verifyUrl?: string;
  resetUrl?: string;
};

describe.skipIf(!shouldRunDatabaseTests)('auth verification and password reset endpoints', () => {
  const prisma = new PrismaClient();
  const sentEmails: SentEmail[] = [];
  let app: ReturnType<typeof buildTestApp>;

  beforeAll(() => {
    const emailService = {
      sendVerification: vi.fn(async (input: { to: string; verifyUrl: string }) => {
        sentEmails.push({ to: input.to, verifyUrl: input.verifyUrl });
        return 'verification-email-id';
      }),
      sendWelcome: vi.fn(async (input: { to: string }) => {
        sentEmails.push({ to: input.to });
        return 'welcome-email-id';
      }),
      sendPasswordReset: vi.fn(async (input: { to: string; resetUrl: string }) => {
        sentEmails.push({ to: input.to, resetUrl: input.resetUrl });
        return 'reset-email-id';
      }),
    };
    container.registerInstance(EmailService, emailService as unknown as EmailService);
    app = buildTestApp();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: FIXTURE_PREFIX } } });
    await prisma.$disconnect();
    container.reset();
  });

  it('returns 200 for unknown forgot-password emails without sending mail', async () => {
    const email = `${FIXTURE_PREFIX}-missing@example.test`;

    const response = await request(app)
      .post('/v1/auth/forgot-password')
      .send({ email });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { ok: true } });
    expect(sentEmails.some((sentEmail) => sentEmail.to === email)).toBe(false);
  });

  it('sets emailVerifiedAt from a signup verification token', async () => {
    const email = `${FIXTURE_PREFIX}-verify@example.test`;
    const signupResponse = await request(app)
      .post('/v1/auth/sign-up')
      .send({ email, password: PASSWORD, displayName: 'Verify Fixture' });

    expect(signupResponse.status).toBe(201);
    const verifyUrl = sentEmails.find((sentEmail) => sentEmail.to === email)?.verifyUrl;
    expect(verifyUrl).toBeDefined();
    const token = new URL(verifyUrl ?? '').searchParams.get('token');
    expect(token).toBeTruthy();

    const verifyResponse = await request(app)
      .post('/v1/auth/verify-email')
      .send({ token });

    expect(verifyResponse.status).toBe(200);
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('rejects expired reset tokens', async () => {
    const email = `${FIXTURE_PREFIX}-expired@example.test`;
    const user = await prisma.user.create({
      data: { email, passwordHash: 'old-hash', displayName: 'Expired Fixture' },
    });
    const tokenHasher = new TokenHasher();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: tokenHasher.hashToken('expired-token'),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const response = await request(app)
      .post('/v1/auth/reset-password')
      .send({ token: 'expired-token', password: 'Newpassword1' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('bad_request');
  });
});
