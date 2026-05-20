export class DomainError extends Error {
  readonly httpStatus: number;
  readonly errorCode: string;
  readonly details?: unknown;

  constructor(httpStatus: number, errorCode: string, message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.httpStatus = httpStatus;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export class BadRequestError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(400, 'bad_request', message, details);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(422, 'validation_error', message, details);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized') {
    super(401, 'unauthorized', message);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden') {
    super(403, 'forbidden', message);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super(404, 'not_found', `${resource} not found`);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(409, 'conflict', message, details);
  }
}
