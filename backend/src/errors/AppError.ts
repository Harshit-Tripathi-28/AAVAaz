import { HttpStatus, HttpStatusCode } from "../constants/httpCodes.js";

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: string = "INTERNAL_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Request validation failed", details?: unknown) {
    super(message, HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required or credentials invalid") {
    super(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, HttpStatus.FORBIDDEN, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource", identifier?: string) {
    const msg = identifier
      ? `${resource} with identifier '${identifier}' was not found`
      : `${resource} not found`;
    super(msg, HttpStatus.NOT_FOUND, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "A resource conflict occurred") {
    super(message, HttpStatus.CONFLICT, "CONFLICT");
  }
}

export class TenantContextError extends AppError {
  constructor(message = "Unauthorized or invalid tenant context") {
    super(message, HttpStatus.FORBIDDEN, "TENANT_CONTEXT_INVALID");
  }
}
