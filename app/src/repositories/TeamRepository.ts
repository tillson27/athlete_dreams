import { injectable } from 'tsyringe';
import { type Team, type TeamMembership, TeamRole } from '@prisma/client';
import { PrismaService } from '../services/infrastructure/PrismaService';

@injectable()
export class TeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWithOwner(input: {
    teamName: string;
    isPersonal: boolean;
    ownerUserId: string;
  }): Promise<Team & { memberships: TeamMembership[] }> {
    return this.prisma.team.create({
      data: {
        name: input.teamName,
        isPersonal: input.isPersonal,
        memberships: {
          create: {
            userId: input.ownerUserId,
            teamRole: TeamRole.OWNER,
          },
        },
      },
      include: { memberships: true },
    });
  }

  listForUser(userId: string): Promise<Array<Team & { memberships: TeamMembership[] }>> {
    return this.prisma.team.findMany({
      where: {
        deletedAt: null,
        memberships: { some: { userId, leftAt: null } },
      },
      include: { memberships: { where: { leftAt: null } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(teamId: string): Promise<(Team & { memberships: TeamMembership[] }) | null> {
    return this.prisma.team.findFirst({
      where: { id: teamId, deletedAt: null },
      include: { memberships: { where: { leftAt: null } } },
    });
  }
}
