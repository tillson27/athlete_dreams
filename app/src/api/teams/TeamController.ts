import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { TeamService } from './TeamService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { UnauthorizedError } from '../../shared/errors';

@injectable()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  listMine = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const teams = await this.teamService.listForCurrentUser(req.authenticatedUserId);
    ResponseHandler.success(res, 200, teams);
  };
}
