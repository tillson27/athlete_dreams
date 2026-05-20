import { injectable } from 'tsyringe';
import type { Team as TeamDto } from 'fad-common';
import { TeamRepository } from '../../repositories/TeamRepository';
import type { Team } from '@prisma/client';

@injectable()
export class TeamService {
  constructor(private readonly teamRepository: TeamRepository) {}

  async listForCurrentUser(userId: string): Promise<TeamDto[]> {
    const teams = await this.teamRepository.listForUser(userId);
    return teams.map(toTeamDto);
  }
}

function toTeamDto(team: Team): TeamDto {
  return {
    teamId: team.id,
    name: team.name,
    isPersonal: team.isPersonal,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}
