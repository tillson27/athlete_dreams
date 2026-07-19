import { randomBytes } from 'node:crypto';
import { injectable } from 'tsyringe';
import type {
  AuthSession,
  ForgotPasswordRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  SignInRequest,
  SignUpRequest,
  User as UserDto,
  VerifyEmailRequest,
} from 'fad-common';
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
import { BadRequestError, ConflictError, ForbiddenError, UnauthorizedError } from '../../shared/errors';
import type { User } from '@prisma/client';

const INVITE_ONLY_MESSAGE = 'Access is currently invite-only';
const DEFAULT_APP_URL = 'http://localhost:3000';
const DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;
const DEFAULT_EMAIL_VERIFICATION_TOKEN_TTL_HOURS = 48;

@injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly teamRepository: TeamRepository,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly jwtService: JwtService,
    private readonly signupAllowlistService: SignupAllowlistService,
    private readonly tokenHasher: TokenHasher,
    private readonly emailService: EmailService,
    private readonly logger: Logger
  ) {}

  async signUp(input: SignUpRequest): Promise<AuthSession> {
    if (!this.signupAllowlistService.isAllowed(input.email)) {
      throw new ForbiddenError(INVITE_ONLY_MESSAGE);
    }
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account already exists for this email');
    }

    const passwordHash = await this.passwordHashService.hash(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    });

    await this.teamRepository.createWithOwner({
      teamName: `${input.displayName}'s Team`,
      isPersonal: true,
      ownerUserId: user.id,
    });

    await this.sendSignupEmails(user);
    return this.issueSession(user);
  }

  async signIn(input: SignInRequest): Promise<AuthSession> {
    if (!this.signupAllowlistService.isAllowed(input.email)) {
      throw new ForbiddenError(INVITE_ONLY_MESSAGE);
    }
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new UnauthorizedError('No account found for this email');
    const passwordMatches = await this.passwordHashService.verify(user.passwordHash, input.password);
    if (!passwordMatches) throw new UnauthorizedError('Invalid email or password');
    return this.issueSession(user);
  }

  async forgotPassword(input: ForgotPasswordRequest): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      return;
    }

    const now = new Date();
    await this.passwordResetTokenRepository.invalidateAllForUser(user.id, now);
    const issuedToken = this.issueToken(tokenTtlMs(passwordResetTtlMinutes(), 60_000), now);
    await this.passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash: issuedToken.tokenHash,
      expiresAt: issuedToken.expiresAt,
    });

    await this.sendEmailSafely(
      'auth.password_reset.email_failed',
      'auth.password_reset.email_sent',
      () =>
        this.emailService.sendPasswordReset({
          to: user.email,
          displayName: user.displayName,
          resetUrl: `${appUrl()}/reset-password?token=${encodeURIComponent(issuedToken.plaintextToken)}`,
          expiresInMinutes: passwordResetTtlMinutes(),
        }),
      { userId: user.id }
    );
    this.logger.info({ userId: user.id }, 'auth.password_reset.requested');
  }

  async resetPassword(input: ResetPasswordRequest): Promise<void> {
    const tokenHash = this.tokenHasher.hashToken(input.token);
    const passwordResetToken = await this.passwordResetTokenRepository.findByHash(tokenHash);
    const now = new Date();
    if (!isUsableToken(passwordResetToken, now)) {
      throw new BadRequestError('Invalid or expired token');
    }

    const consumed = await this.passwordResetTokenRepository.markUsed(passwordResetToken.id, now);
    if (!consumed) {
      throw new BadRequestError('Invalid or expired token');
    }

    const passwordHash = await this.passwordHashService.hash(input.password);
    await this.userRepository.updatePasswordHash(passwordResetToken.userId, passwordHash);
    this.logger.info(
      { userId: passwordResetToken.userId, tokenId: passwordResetToken.id },
      'auth.password_reset.completed'
    );
  }

  async verifyEmail(input: VerifyEmailRequest): Promise<void> {
    const tokenHash = this.tokenHasher.hashToken(input.token);
    const emailVerificationToken = await this.emailVerificationTokenRepository.findByHash(tokenHash);
    const now = new Date();
    if (!isUsableToken(emailVerificationToken, now)) {
      throw new BadRequestError('Invalid or expired token');
    }

    const consumed = await this.emailVerificationTokenRepository.markUsed(
      emailVerificationToken.id,
      now
    );
    if (!consumed) {
      throw new BadRequestError('Invalid or expired token');
    }

    await this.userRepository.markEmailVerified(emailVerificationToken.userId, now);
    this.logger.info(
      { userId: emailVerificationToken.userId, tokenId: emailVerificationToken.id },
      'auth.verification.completed'
    );
  }

  async resendVerification(input: ResendVerificationRequest): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user || user.emailVerifiedAt) {
      return;
    }

    await this.issueAndSendVerificationEmail(user, new Date());
  }

  private issueSession(user: User): AuthSession {
    const { accessToken, accessTokenExpiresAt } = this.jwtService.issueAccessToken({
      sub: user.id,
      email: user.email,
    });
    return {
      user: toUserDto(user),
      accessToken,
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      mustVerifyEmail: !user.emailVerifiedAt,
    };
  }

  private async sendSignupEmails(user: User): Promise<void> {
    await this.issueAndSendVerificationEmail(user, new Date());
    await this.sendEmailSafely(
      'auth.welcome.email_failed',
      'auth.welcome.email_sent',
      () =>
        this.emailService.sendWelcome({
          to: user.email,
          displayName: user.displayName,
          profileUrl: appUrl(),
        }),
      { userId: user.id }
    );
  }

  private async issueAndSendVerificationEmail(user: User, issuedAt: Date): Promise<void> {
    await this.emailVerificationTokenRepository.invalidateAllForUser(user.id, issuedAt);
    const issuedToken = this.issueToken(
      tokenTtlMs(emailVerificationTokenTtlHours(), 3_600_000),
      issuedAt
    );
    const token = await this.emailVerificationTokenRepository.create({
      userId: user.id,
      tokenHash: issuedToken.tokenHash,
      expiresAt: issuedToken.expiresAt,
    });

    await this.sendEmailSafely(
      'auth.verification.email_failed',
      'auth.verification.email_sent',
      () =>
        this.emailService.sendVerification({
          to: user.email,
          displayName: user.displayName,
          verifyUrl: `${appUrl()}/verify-email?token=${issuedToken.plaintextToken}`,
        }),
      { userId: user.id, tokenId: token.id }
    );
  }

  private issueToken(ttlMs: number, issuedAt: Date): IssuedToken {
    const plaintextToken = randomBytes(32).toString('base64url');
    return {
      plaintextToken,
      tokenHash: this.tokenHasher.hashToken(plaintextToken),
      expiresAt: new Date(issuedAt.getTime() + ttlMs),
    };
  }

  private async sendEmailSafely(
    failureEvent: string,
    successEvent: string,
    sendEmail: () => Promise<string>,
    logContext: Record<string, string>
  ): Promise<void> {
    try {
      const resendEmailId = await sendEmail();
      this.logger.info({ ...logContext, resendEmailId }, successEvent);
    } catch (error) {
      this.logger.warn({ ...logContext, err: error }, failureEvent);
    }
  }
}

type IssuedToken = {
  plaintextToken: string;
  tokenHash: string;
  expiresAt: Date;
};

type TokenState = {
  expiresAt: Date;
  usedAt: Date | null;
} | null;

function isUsableToken(token: TokenState, now: Date): token is Exclude<TokenState, null> {
  return Boolean(token && !token.usedAt && token.expiresAt > now);
}

function appUrl(): string {
  return (process.env.APP_URL ?? DEFAULT_APP_URL).replace(/\/$/, '');
}

function passwordResetTtlMinutes(): number {
  return positiveEnvNumber(
    process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES,
    DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES
  );
}

function emailVerificationTokenTtlHours(): number {
  return positiveEnvNumber(
    process.env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS,
    DEFAULT_EMAIL_VERIFICATION_TOKEN_TTL_HOURS
  );
}

function tokenTtlMs(amount: number, unitMs: number): number {
  return amount * unitMs;
}

function positiveEnvNumber(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function toUserDto(user: User): UserDto {
  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
