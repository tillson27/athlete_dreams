import type { ErrorRequestHandler } from 'express';
import { DomainError } from '../shared/errors';
import { Logger } from '../services/infrastructure/Logger';
import { container } from 'tsyringe';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const logger = container.resolve(Logger);

  if (err instanceof DomainError) {
    logger.warn(
      {
        requestId: req.requestId,
        authenticatedUserId: req.authenticatedUserId,
        errorCode: err.errorCode,
        path: req.path,
        method: req.method,
        details: err.details,
      },
      err.message
    );
    res.status(err.httpStatus).json({
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  logger.error(
    {
      requestId: req.requestId,
      authenticatedUserId: req.authenticatedUserId,
      err: toSafeErrorLog(err),
      path: req.path,
      method: req.method,
    },
    'Unhandled error'
  );
  res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Something went wrong',
    },
  });
};

function toSafeErrorLog(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) {
    return { message: 'Non-error thrown' };
  }

  const errorWithMetadata = err as Error & {
    status?: unknown;
    statusCode?: unknown;
    type?: unknown;
    code?: unknown;
  };

  return {
    name: err.name,
    message: err.message,
    stack: err.stack,
    status: numberMetadata(errorWithMetadata.status),
    statusCode: numberMetadata(errorWithMetadata.statusCode),
    type: stringMetadata(errorWithMetadata.type),
    code: stringMetadata(errorWithMetadata.code),
  };
}

function numberMetadata(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function stringMetadata(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
