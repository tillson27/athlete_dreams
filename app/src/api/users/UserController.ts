import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { updateUserRequestSchema } from 'fad-common';
import { UserService } from './UserService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { parseRequestBody } from '../../shared/requestParsers';
import { UnauthorizedError } from '../../shared/errors';

@injectable()
export class UserController {
  constructor(private readonly userService: UserService) {}

  getMe = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const user = await this.userService.getCurrentUser(req.authenticatedUserId);
    ResponseHandler.success(res, 200, user);
  };

  updateMe = async (req: Request, res: Response): Promise<void> => {
    if (!req.authenticatedUserId) throw new UnauthorizedError();
    const body = parseRequestBody(updateUserRequestSchema, req);
    const user = await this.userService.updateCurrentUser(req.authenticatedUserId, body);
    ResponseHandler.success(res, 200, user);
  };
}
