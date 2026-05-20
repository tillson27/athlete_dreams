import type { NextFunction, Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { JwtService } from '../services/infrastructure/JwtService';
import { UnauthorizedError } from '../shared/errors';

declare global {
  // Augment Express Request with authentication context.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authenticatedUserId?: string;
      authenticatedUserEmail?: string;
    }
  }
}

@injectable()
export class AuthenticationMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  required = (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const header = req.header('authorization');
      if (!header?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing bearer token');
      }
      const token = header.slice('Bearer '.length).trim();
      const claims = this.jwtService.verifyAccessToken(token);
      req.authenticatedUserId = claims.sub;
      req.authenticatedUserEmail = claims.email;
      next();
    } catch (err) {
      next(err);
    }
  };

  optional = (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      next();
      return;
    }
    try {
      const claims = this.jwtService.verifyAccessToken(header.slice('Bearer '.length).trim());
      req.authenticatedUserId = claims.sub;
      req.authenticatedUserEmail = claims.email;
    } catch {
      // ignore — endpoint is optional auth.
    }
    next();
  };
}
