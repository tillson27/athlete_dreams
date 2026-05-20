import type { ErrorRequestHandler } from 'express';
import { DomainError } from '../shared/errors';
import { Logger } from '../services/infrastructure/Logger';
import { container } from 'tsyringe';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const logger = container.resolve(Logger);

  if (err instanceof DomainError) {
    logger.warn(
      { errorCode: err.errorCode, path: req.path, method: req.method, details: err.details },
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

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Something went wrong',
    },
  });
};
