import { injectable } from 'tsyringe';
import type { PlatformRole, PlatformRoleAssignment } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

@injectable()
export class PlatformRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  assignRole(userId: string, role: PlatformRole): Promise<PlatformRoleAssignment> {
    return this.prisma.platformRoleAssignment.upsert({
      where: { userId_role: { userId, role } },
      update: {},
      create: { userId, role },
    });
  }
}
