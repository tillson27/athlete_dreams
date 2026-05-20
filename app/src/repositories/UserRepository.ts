import { injectable } from 'tsyringe';
import type { User } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

@injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(userId: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  create(input: {
    email: string;
    passwordHash: string;
    displayName: string;
  }): Promise<User> {
    return this.prisma.user.create({ data: input });
  }

  update(userId: string, input: { displayName?: string; avatarUrl?: string | null }): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: input });
  }
}
