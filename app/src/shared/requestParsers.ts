import type { Request } from 'express';
import { z, ZodError, type ZodTypeAny } from 'zod';
import { ValidationError } from './errors';

function flattenZod(error: ZodError): { path: string; message: string }[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

export function parseRequestBody<TSchema extends ZodTypeAny>(
  schema: TSchema,
  req: Request
): z.output<TSchema> {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid request body', flattenZod(result.error));
  }
  return result.data;
}

export function parseRequestQuery<TSchema extends ZodTypeAny>(
  schema: TSchema,
  req: Request
): z.output<TSchema> {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    throw new ValidationError('Invalid request query', flattenZod(result.error));
  }
  return result.data;
}

export function parseRequestParams<TSchema extends ZodTypeAny>(
  schema: TSchema,
  req: Request
): z.output<TSchema> {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    throw new ValidationError('Invalid request params', flattenZod(result.error));
  }
  return result.data;
}
