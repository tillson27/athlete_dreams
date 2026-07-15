import { injectable } from 'tsyringe';
import { PrismaService } from '../services/infrastructure/PrismaService';

@injectable()
export class HealthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
