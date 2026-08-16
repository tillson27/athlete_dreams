import type { NextFunction, Request, Response } from 'express';
import { PlatformRole } from '@prisma/client';
import { injectable } from 'tsyringe';
import { PlatformRoleRepository } from '../repositories/PlatformRoleRepository';
import { ForbiddenError, UnauthorizedError } from '../shared/errors';

@injectable()
export class AdminAuthorizationMiddleware {
  constructor(private readonly platformRoleRepository: PlatformRoleRepository) {}

  required = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.authenticatedUserId) {
        throw new UnauthorizedError();
      }
      const isAdmin = await this.platformRoleRepository.hasRole(
        req.authenticatedUserId,
        PlatformRole.ADMIN
      );
      if (!isAdmin) {
        throw new ForbiddenError('Admin access required');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
