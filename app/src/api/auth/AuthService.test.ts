import { describe, expect, it, vi } from 'vitest';
import type {
  EmailVerificationToken,
  PasswordResetToken,
  User,
} from '@prisma/client';
import { AuthService } from './AuthService';
import { UserRepository } from '../../repositories/UserRepository';
import { TeamRepository } from '../../repositories/TeamRepository';
import { EmailVerificationTokenRepository } from '../../repositories/EmailVerificationTokenRepository';
import { PasswordResetTokenRepository } from '../../repositories/PasswordResetTokenRepository';
import { PasswordHashService } from '../../services/infrastructure/PasswordHashService';
import { JwtService } from '../../services/infrastructure/JwtService';
import { SignupAllowlistService } from '../../services/infrastructure/SignupAllowlistService';
import { TokenHasher } from '../../services/infrastructure/TokenHasher';
import { EmailService } from '../../services/infrastructure/EmailService';
import { Logger } from '../../services/infrastructure/Logger';
import { BadRequestError, UnauthorizedError } from '../../shared/errors';

type EmailVerificationTokenRecord = EmailVerificationToken & { user: User };
type PasswordResetTokenRecord = PasswordResetToken & { user: User };

function userFixture(overrides: Partial<User> = {}): User {
  const now = new Date('2026-07-19T12:00:00.000Z');
  return {
    id: overrides.id ?? 'user-1',
    email: overrides.email ?? 'athlete@example.test',
    passwordHash: overrides.passwordHash ?? 'hashed:Correcthorse1',
    displayName: overrides.displayName ?? 'Maya Runner',
    avatarUrl: overrides.avatarUrl ?? null,
    emailVerifiedAt: overrides.emailVerifiedAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: overrides.deletedAt ?? null,
  };
}

function makeService(seedUsers: User[] = []): {
  service: AuthService;
  users: Map<string, User>;
  emailVerificationTokens: EmailVerificationTokenRecord[];
  passwordResetTokens: PasswordResetTokenRecord[];
  emailService: Pick<EmailService, 'sendVerification' | 'sendWelcome' | 'sendPasswordReset'>;
} {
  const users = new Map(seedUsers.map((user) => [user.id, user]));
  const emailVerificationTokens: EmailVerificationTokenRecord[] = [];
  const passwordResetTokens: PasswordResetTokenRecord[] = [];

  const userRepository = {
    findByEmail: vi.fn(async (email: string) =>
      [...users.values()].find((user) => user.email === email && !user.deletedAt) ?? null
    ),
    create: vi.fn(async (input: { email: string; passwordHash: string; displayName: string }) => {
      const user = userFixture({
        id: `user-${users.size + 1}`,
        email: input.email,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
      });
      users.set(user.id, user);
      return user;
    }),
    updatePasswordHash: vi.fn(async (userId: string, passwordHash: string) => {
      const user = users.get(userId);
      if (!user) {
        throw new Error('Missing user fixture.');
      }
      const updatedUser = { ...user, passwordHash };
      users.set(userId, updatedUser);
      return updatedUser;
    }),
    markEmailVerified: vi.fn(async (userId: string, emailVerifiedAt: Date) => {
      const user = users.get(userId);
      if (!user) {
        throw new Error('Missing user fixture.');
      }
      const updatedUser = { ...user, emailVerifiedAt };
      users.set(userId, updatedUser);
      return updatedUser;
    }),
  };

  const emailVerificationTokenRepository = {
    create: vi.fn(
      async (input: { userId: string; tokenHash: string; expiresAt: Date }) => {
        const user = users.get(input.userId);
        if (!user) {
          throw new Error('Missing verification user fixture.');
        }
        const token: EmailVerificationTokenRecord = {
          id: `verify-${emailVerificationTokens.length + 1}`,
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          usedAt: null,
          createdAt: new Date('2026-07-19T12:00:00.000Z'),
          user,
        };
        emailVerificationTokens.push(token);
        return token;
      }
    ),
    findByHash: vi.fn(async (tokenHash: string) => {
      return emailVerificationTokens.find((token) => token.tokenHash === tokenHash) ?? null;
    }),
    markUsed: vi.fn(async (tokenId: string, usedAt: Date) => {
      const token = emailVerificationTokens.find((candidate) => candidate.id === tokenId);
      if (!token || token.usedAt || token.expiresAt <= usedAt) {
        return false;
      }
      token.usedAt = usedAt;
      return true;
    }),
    invalidateAllForUser: vi.fn(async (userId: string, usedAt: Date) => {
      let count = 0;
      for (const token of emailVerificationTokens) {
        if (token.userId === userId && !token.usedAt) {
          token.usedAt = usedAt;
          count += 1;
        }
      }
      return count;
    }),
  };

  const passwordResetTokenRepository = {
    create: vi.fn(
      async (input: { userId: string; tokenHash: string; expiresAt: Date }) => {
        const user = users.get(input.userId);
        if (!user) {
          throw new Error('Missing reset user fixture.');
        }
        const token: PasswordResetTokenRecord = {
          id: `reset-${passwordResetTokens.length + 1}`,
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          usedAt: null,
          createdAt: new Date('2026-07-19T12:00:00.000Z'),
          user,
        };
        passwordResetTokens.push(token);
        return token;
      }
    ),
    findByHash: vi.fn(async (tokenHash: string) => {
      return passwordResetTokens.find((token) => token.tokenHash === tokenHash) ?? null;
    }),
    markUsed: vi.fn(async (tokenId: string, usedAt: Date) => {
      const token = passwordResetTokens.find((candidate) => candidate.id === tokenId);
      if (!token || token.usedAt || token.expiresAt <= usedAt) {
        return false;
      }
      token.usedAt = usedAt;
      return true;
    }),
    invalidateAllForUser: vi.fn(async (userId: string, usedAt: Date) => {
      let count = 0;
      for (const token of passwordResetTokens) {
        if (token.userId === userId && !token.usedAt) {
          token.usedAt = usedAt;
          count += 1;
        }
      }
      return count;
    }),
  };

  const passwordHashService = {
    hash: vi.fn(async (password: string) => `hashed:${password}`),
    verify: vi.fn(async (passwordHash: string, password: string) => passwordHash === `hashed:${password}`),
  };
  const jwtService = {
    issueAccessToken: vi.fn(() => ({
      accessToken: 'access-token',
      accessTokenExpiresAt: new Date('2026-07-19T13:00:00.000Z'),
    })),
  };
  const signupAllowlistService = { isAllowed: vi.fn(() => true) };
  const tokenHasher = { hashToken: vi.fn((plaintextToken: string) => `hash:${plaintextToken}`) };
  const emailService = {
    sendVerification: vi.fn(async () => 'verification-email-id'),
    sendWelcome: vi.fn(async () => 'welcome-email-id'),
    sendPasswordReset: vi.fn(async () => 'reset-email-id'),
  };
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  return {
    service: new AuthService(
      userRepository as unknown as UserRepository,
      { createWithOwner: vi.fn(async () => ({ memberships: [] })) } as unknown as TeamRepository,
      emailVerificationTokenRepository as unknown as EmailVerificationTokenRepository,
      passwordResetTokenRepository as unknown as PasswordResetTokenRepository,
      passwordHashService as unknown as PasswordHashService,
      jwtService as unknown as JwtService,
      signupAllowlistService as unknown as SignupAllowlistService,
      tokenHasher as unknown as TokenHasher,
      emailService as unknown as EmailService,
      logger as unknown as Logger
    ),
    users,
    emailVerificationTokens,
    passwordResetTokens,
    emailService,
  };
}

describe('AuthService', () => {
  it('creates a verification token and sends signup emails without blocking the session', async () => {
    const { service, emailVerificationTokens, emailService } = makeService();

    const session = await service.signUp({
      email: 'new@example.test',
      password: 'Correcthorse1',
      displayName: 'New Athlete',
    });

    expect(session.mustVerifyEmail).toBe(true);
    expect(emailVerificationTokens).toHaveLength(1);
    expect(emailVerificationTokens[0]?.tokenHash.startsWith('hash:')).toBe(true);
    expect(emailService.sendVerification).toHaveBeenCalledTimes(1);
    expect(emailService.sendWelcome).toHaveBeenCalledTimes(1);
  });

  it('returns distinct sign-in errors for unknown email and bad password', async () => {
    const { service } = makeService([userFixture()]);

    await expect(
      service.signIn({ email: 'missing@example.test', password: 'Correcthorse1' })
    ).rejects.toThrow(new UnauthorizedError('No account found for this email'));
    await expect(
      service.signIn({ email: 'athlete@example.test', password: 'Wronghorse1' })
    ).rejects.toThrow(new UnauthorizedError('Invalid email or password'));
  });

  it('does not enumerate unknown emails in forgot-password', async () => {
    const { service, passwordResetTokens, emailService } = makeService();

    await expect(service.forgotPassword({ email: 'missing@example.test' })).resolves.toBeUndefined();

    expect(passwordResetTokens).toHaveLength(0);
    expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('rejects expired reset tokens without changing the password', async () => {
    const user = userFixture();
    const { service, passwordResetTokens, users } = makeService([user]);
    passwordResetTokens.push({
      id: 'reset-1',
      userId: user.id,
      tokenHash: 'hash:expired-token',
      expiresAt: new Date('2026-07-18T12:00:00.000Z'),
      usedAt: null,
      createdAt: new Date('2026-07-17T12:00:00.000Z'),
      user,
    });

    await expect(
      service.resetPassword({ token: 'expired-token', password: 'Newpassword1' })
    ).rejects.toThrow(new BadRequestError('Invalid or expired token'));

    expect(users.get(user.id)?.passwordHash).toBe('hashed:Correcthorse1');
  });

  it('verifies email by consuming the token and timestamping the user', async () => {
    const user = userFixture();
    const { service, emailVerificationTokens, users } = makeService([user]);
    emailVerificationTokens.push({
      id: 'verify-1',
      userId: user.id,
      tokenHash: 'hash:valid-token',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date('2026-07-19T12:00:00.000Z'),
      user,
    });

    await service.verifyEmail({ token: 'valid-token' });

    expect(emailVerificationTokens[0]?.usedAt).toBeInstanceOf(Date);
    expect(users.get(user.id)?.emailVerifiedAt).toBeInstanceOf(Date);
  });
});
