import { injectable } from 'tsyringe';
import type { UpdateUserRequest, User as UserDto } from 'fad-common';
import { UserRepository } from '../../repositories/UserRepository';
import { NotFoundError } from '../../shared/errors';
import type { User } from '@prisma/client';

@injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getCurrentUser(userId: string): Promise<UserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    return toUserDto(user);
  }

  async updateCurrentUser(userId: string, input: UpdateUserRequest): Promise<UserDto> {
    const user = await this.userRepository.update(userId, input);
    return toUserDto(user);
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
