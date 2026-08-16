import { injectable } from 'tsyringe';
import type { SignupAllowlistEntry } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

@injectable()
export class SignupAllowlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<SignupAllowlistEntry[]> {
    return this.prisma.signupAllowlistEntry.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(entry: string): Promise<SignupAllowlistEntry> {
    return this.prisma.signupAllowlistEntry.create({ data: { entry } });
  }

  async deleteById(entryId: string): Promise<void> {
    await this.prisma.signupAllowlistEntry.delete({ where: { id: entryId } });
  }
}
