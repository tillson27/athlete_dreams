import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const incoming = req.header('x-request-id');
  const requestId = incoming && incoming.length <= 64 ? incoming : randomUUID();
  res.setHeader('x-request-id', requestId);
  req.requestId = requestId;
  next();
};
