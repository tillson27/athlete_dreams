import type { Request } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ValidationError } from './errors';

function flattenZod(error: ZodError): { path: string; message: string }[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export function parseRequestBody<T>(schema: ZodType<T>, req: Request): T {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid request body', flattenZod(result.error));
  }
  return result.data;
}

export function parseRequestQuery<T>(schema: ZodType<T>, req: Request): T {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    throw new ValidationError('Invalid request query', flattenZod(result.error));
  }
  return result.data;
}

export function parseRequestParams<T>(schema: ZodType<T>, req: Request): T {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    throw new ValidationError('Invalid request params', flattenZod(result.error));
  }
  return result.data;
}
