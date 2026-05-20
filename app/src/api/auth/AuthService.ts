import { injectable } from 'tsyringe';
import type { AuthSession, SignInRequest, SignUpRequest, User as UserDto } from 'fad-common';
import { UserRepository } from '../../repositories/UserRepository';
import { TeamRepository } from '../../repositories/TeamRepository';
import { PasswordHashService } from '../../services/infrastructure/PasswordHashService';
import { JwtService } from '../../services/infrastructure/JwtService';
import { ConflictError, UnauthorizedError } from '../../shared/errors';
import type { User } from '@prisma/client';

@injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly teamRepository: TeamRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly jwtService: JwtService
  ) {}

  async signUp(input: SignUpRequest): Promise<AuthSession> {
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

    return this.issueSession(user);
  }

  async signIn(input: SignInRequest): Promise<AuthSession> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new UnauthorizedError('Invalid email or password');
    const ok = await this.passwordHashService.verify(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedError('Invalid email or password');
    return this.issueSession(user);
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
    };
  }
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
