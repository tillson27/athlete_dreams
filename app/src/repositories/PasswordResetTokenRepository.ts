import { injectable } from 'tsyringe';
import type { PasswordResetToken, User } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

export type PasswordResetTokenWithUser = PasswordResetToken & { user: User };

@injectable()
export class PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    return this.prisma.passwordResetToken.create({ data: input });
  }

  findByHash(tokenHash: string): Promise<PasswordResetTokenWithUser | null> {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async markUsed(tokenId: string, usedAt: Date): Promise<boolean> {
    const result = await this.prisma.passwordResetToken.updateMany({
      where: { id: tokenId, usedAt: null, expiresAt: { gt: usedAt } },
      data: { usedAt },
    });
    return result.count === 1;
  }

  async consumeAndUpdatePassword(input: {
    tokenId: string;
    userId: string;
    passwordHash: string;
    usedAt: Date;
  }): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.passwordResetToken.updateMany({
        where: {
          id: input.tokenId,
          userId: input.userId,
          usedAt: null,
          expiresAt: { gt: input.usedAt },
        },
        data: { usedAt: input.usedAt },
      });
      if (result.count !== 1) return false;

      await transaction.user.update({
        where: { id: input.userId },
        data: { passwordHash: input.passwordHash },
      });
      return true;
    });
  }

  async invalidateAllForUser(userId: string, usedAt: Date): Promise<number> {
    const result = await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt },
    });
    return result.count;
  }
}
