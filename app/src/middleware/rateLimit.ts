import type { RequestHandler } from 'express';

export type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
};

type Bucket = {
  count: number;
  resetsAt: number;
};

const buckets = new Map<string, Bucket>();

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${options.keyPrefix}:${clientIp(req)}:${emailScope(req)}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetsAt <= now) {
      buckets.set(key, { count: 1, resetsAt: now + options.windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count <= options.maxRequests) {
      next();
      return;
    }

    res.setHeader('Retry-After', Math.ceil((bucket.resetsAt - now) / 1000));
    res.status(429).json({
      error: {
        code: 'rate_limited',
        message: 'Too many attempts. Try again soon.',
      },
    });
  };
}

export function resetRateLimitBucketsForTests(): void {
  buckets.clear();
}

function clientIp(req: Parameters<RequestHandler>[0]): string {
  const forwardedFor = req.header('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || req.ip || req.socket.remoteAddress || 'unknown';
}

function emailScope(req: Parameters<RequestHandler>[0]): string {
  const body = req.body as { email?: unknown } | undefined;
  return typeof body?.email === 'string' ? body.email.trim().toLowerCase() : 'no-email';
}
