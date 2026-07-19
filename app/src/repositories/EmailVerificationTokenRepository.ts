import { injectable } from 'tsyringe';
import type { EmailVerificationToken, User } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

export type EmailVerificationTokenWithUser = EmailVerificationToken & { user: User };

@injectable()
export class EmailVerificationTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<EmailVerificationToken> {
    return this.prisma.emailVerificationToken.create({ data: input });
  }

  findByHash(tokenHash: string): Promise<EmailVerificationTokenWithUser | null> {
    return this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async markUsed(tokenId: string, usedAt: Date): Promise<boolean> {
    const result = await this.prisma.emailVerificationToken.updateMany({
      where: { id: tokenId, usedAt: null, expiresAt: { gt: usedAt } },
      data: { usedAt },
    });
    return result.count === 1;
  }

  async invalidateAllForUser(userId: string, usedAt: Date): Promise<number> {
    const result = await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt },
    });
    return result.count;
  }
}
