import { singleton } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../shared/errors';

export interface AccessTokenClaims {
  sub: string;
  email: string;
}

@singleton()
export class JwtService {
  private readonly secret = process.env.JWT_SECRET ?? '';
  private readonly accessTokenTtlSeconds = Number(process.env.JWT_ACCESS_TOKEN_TTL_SECONDS ?? 3600);

  constructor() {
    if (!this.secret) {
      throw new Error('JWT_SECRET is required to start the API.');
    }
  }

  issueAccessToken(claims: AccessTokenClaims): { accessToken: string; accessTokenExpiresAt: Date } {
    const accessToken = jwt.sign(claims, this.secret, {
      expiresIn: this.accessTokenTtlSeconds,
      algorithm: 'HS256',
    });
    const accessTokenExpiresAt = new Date(Date.now() + this.accessTokenTtlSeconds * 1000);
    return { accessToken, accessTokenExpiresAt };
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof decoded === 'string') throw new UnauthorizedError('Invalid token');
      const sub = (decoded as jwt.JwtPayload).sub;
      const email = (decoded as jwt.JwtPayload).email as string | undefined;
      if (!sub || typeof sub !== 'string' || !email) {
        throw new UnauthorizedError('Invalid token claims');
      }
      return { sub, email };
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
