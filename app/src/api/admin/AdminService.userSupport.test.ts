import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignupAllowlistStatus } from 'fad-common';
import { AdminService } from './AdminService';
import type { AdminRepository } from '../../repositories/AdminRepository';
import type { SignupAllowlistRepository } from '../../repositories/SignupAllowlistRepository';
import type { SignupAllowlistService } from '../../services/infrastructure/SignupAllowlistService';
import type { AuthService } from '../auth/AuthService';
import type { AthleteStripeService } from '../athleteStripe/AthleteStripeService';
import type { Logger } from '../../services/infrastructure/Logger';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors';

const adminRepository = {
  findUserDetail: vi.fn(),
  markUserEmailVerified: vi.fn(),
  listDonationsBySupporter: vi.fn(),
};
const signupAllowlistRepository = { findAll: vi.fn(), create: vi.fn(), deleteById: vi.fn() };
const signupAllowlistService = { isAllowed: vi.fn(), isEnforced: vi.fn(), getEnvEntries: vi.fn() };
const authService = { resendVerification: vi.fn(), forgotPassword: vi.fn() };
const athleteStripeService = { getStatus: vi.fn() };
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

function makeService(): AdminService {
  return new AdminService(
    adminRepository as unknown as AdminRepository,
    signupAllowlistRepository as unknown as SignupAllowlistRepository,
    signupAllowlistService as unknown as SignupAllowlistService,
    authService as unknown as AuthService,
    athleteStripeService as unknown as AthleteStripeService,
    logger as unknown as Logger
  );
}

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    email: 'athlete@example.com',
    displayName: 'Sam Runner',
    avatarUrl: null,
    emailVerifiedAt: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-02T00:00:00.000Z'),
    platformRoleAssignments: [],
    athleteProfile: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  signupAllowlistService.isAllowed.mockResolvedValue(true);
  signupAllowlistService.isEnforced.mockResolvedValue(true);
  signupAllowlistService.getEnvEntries.mockReturnValue([]);
});

describe('AdminService.getUserDetail', () => {
  it('reports allowlist state so an admin can see why sign-in is refused', async () => {
    adminRepository.findUserDetail.mockResolvedValue(userRow());
    signupAllowlistService.isAllowed.mockResolvedValue(false);

    const detail = await makeService().getUserDetail('u1');

    expect(detail.signupAllowlistStatus).toBe(SignupAllowlistStatus.Blocked);
    expect(detail.signupAllowlistIsEnforced).toBe(true);
  });

  it('marks an unenforced allowlist as allowed', async () => {
    adminRepository.findUserDetail.mockResolvedValue(userRow());
    signupAllowlistService.isEnforced.mockResolvedValue(false);

    const detail = await makeService().getUserDetail('u1');

    expect(detail.signupAllowlistStatus).toBe(SignupAllowlistStatus.Allowed);
    expect(detail.signupAllowlistIsEnforced).toBe(false);
  });

  it('throws NotFoundError for an unknown user', async () => {
    adminRepository.findUserDetail.mockResolvedValue(null);

    await expect(makeService().getUserDetail('missing')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('AdminService.resendUserVerification', () => {
  it('resends against the stored email', async () => {
    adminRepository.findUserDetail.mockResolvedValue(userRow());

    await makeService().resendUserVerification('u1');

    expect(authService.resendVerification).toHaveBeenCalledWith({
      email: 'athlete@example.com',
    });
  });

  it('refuses when the email is already verified', async () => {
    adminRepository.findUserDetail.mockResolvedValue(
      userRow({ emailVerifiedAt: new Date('2026-08-03T00:00:00.000Z') })
    );

    await expect(makeService().resendUserVerification('u1')).rejects.toBeInstanceOf(
      BadRequestError
    );
    expect(authService.resendVerification).not.toHaveBeenCalled();
  });
});

describe('AdminService.markUserEmailVerified', () => {
  it('records the override and returns refreshed detail', async () => {
    adminRepository.findUserDetail
      .mockResolvedValueOnce(userRow())
      .mockResolvedValueOnce(userRow({ emailVerifiedAt: new Date('2026-08-04T00:00:00.000Z') }));
    adminRepository.markUserEmailVerified.mockResolvedValue(true);

    const detail = await makeService().markUserEmailVerified('u1');

    expect(adminRepository.markUserEmailVerified).toHaveBeenCalledWith('u1', expect.any(Date));
    expect(logger.warn).toHaveBeenCalled();
    expect(detail.emailVerifiedAt).toBe('2026-08-04T00:00:00.000Z');
  });

  it('refuses when already verified', async () => {
    adminRepository.findUserDetail.mockResolvedValue(
      userRow({ emailVerifiedAt: new Date('2026-08-03T00:00:00.000Z') })
    );

    await expect(makeService().markUserEmailVerified('u1')).rejects.toBeInstanceOf(
      BadRequestError
    );
    expect(adminRepository.markUserEmailVerified).not.toHaveBeenCalled();
  });

  it('does not record an override that a concurrent verification already won', async () => {
    adminRepository.findUserDetail
      .mockResolvedValueOnce(userRow())
      .mockResolvedValueOnce(userRow({ emailVerifiedAt: new Date('2026-08-04T00:00:00.000Z') }));
    adminRepository.markUserEmailVerified.mockResolvedValue(false);

    await makeService().markUserEmailVerified('u1');

    expect(logger.warn).not.toHaveBeenCalled();
  });
});

describe('AdminService.sendUserPasswordReset', () => {
  it('sends against the stored email', async () => {
    adminRepository.findUserDetail.mockResolvedValue(userRow());

    await makeService().sendUserPasswordReset('u1');

    expect(authService.forgotPassword).toHaveBeenCalledWith({ email: 'athlete@example.com' });
  });
});

describe('AdminService.addUserToAllowlist', () => {
  it('adds the blocked email and returns refreshed detail', async () => {
    adminRepository.findUserDetail.mockResolvedValue(userRow());
    signupAllowlistService.isAllowed.mockResolvedValueOnce(false).mockResolvedValue(true);
    signupAllowlistRepository.create.mockResolvedValue({
      id: 'e1',
      entry: 'athlete@example.com',
      createdAt: new Date('2026-08-05T00:00:00.000Z'),
    });

    const detail = await makeService().addUserToAllowlist('u1');

    expect(signupAllowlistRepository.create).toHaveBeenCalledWith('athlete@example.com');
    expect(detail.signupAllowlistStatus).toBe(SignupAllowlistStatus.Allowed);
  });

  it('refuses when the user can already sign in', async () => {
    adminRepository.findUserDetail.mockResolvedValue(userRow());

    await expect(makeService().addUserToAllowlist('u1')).rejects.toBeInstanceOf(ConflictError);
    expect(signupAllowlistRepository.create).not.toHaveBeenCalled();
  });
});

describe('AdminService.getUserStripeStatus', () => {
  it('returns the connected account id alongside live Stripe readiness', async () => {
    adminRepository.findUserDetail.mockResolvedValue(
      userRow({
        athleteProfile: {
          id: 'a1',
          athleteSlug: 'sam-runner',
          publishedAt: null,
          stripeAccountId: 'acct_123',
        },
      })
    );
    athleteStripeService.getStatus.mockResolvedValue({
      stripeConnected: true,
      chargesEnabled: true,
      payoutsEnabled: false,
      recentPayouts: [],
    });

    const status = await makeService().getUserStripeStatus('u1');

    expect(status.stripeAccountId).toBe('acct_123');
    expect(status.payoutsEnabled).toBe(false);
  });

  it('refuses for a user with no athlete profile', async () => {
    adminRepository.findUserDetail.mockResolvedValue(userRow());

    await expect(makeService().getUserStripeStatus('u1')).rejects.toBeInstanceOf(BadRequestError);
    expect(athleteStripeService.getStatus).not.toHaveBeenCalled();
  });
});

describe('AdminService.listUserDonations', () => {
  it('scopes donations to the user as supporter', async () => {
    adminRepository.findUserDetail.mockResolvedValue(userRow());
    adminRepository.listDonationsBySupporter.mockResolvedValue({ donations: [], hasMore: false });

    const page = await makeService().listUserDonations('u1', {});

    expect(adminRepository.listDonationsBySupporter).toHaveBeenCalledWith(
      expect.objectContaining({ supporterUserId: 'u1' })
    );
    expect(page.nextCursor).toBeNull();
  });
});
