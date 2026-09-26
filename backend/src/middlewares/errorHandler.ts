import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";
import { ApiResponse } from "../utils/response.js";
import { HttpStatus } from "../constants/httpCodes.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // If headers are already sent, delegate to Express default handler
  if (res.headersSent) {
    return;
  }

  // 1. Handled Domain AppError
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(
        {
          err,
          path: req.path,
          method: req.method,
          requestId: req.requestId,
        },
        "Operational server error"
      );
    } else {
      logger.warn(
        {
          errorCode: err.errorCode,
          message: err.message,
          path: req.path,
          method: req.method,
          requestId: req.requestId,
        },
        "Operational client error"
      );
    }

    ApiResponse.error(
      res,
      err.message,
      err.statusCode,
      err.errorCode,
      err.details,
      req.requestId ? { requestId: req.requestId } : undefined
    );
    return;
  }

  // 2. Zod Validation Error (if escaped validateRequest)
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    ApiResponse.error(
      res,
      "Validation failed",
      HttpStatus.BAD_REQUEST,
      "VALIDATION_FAILED",
      formattedErrors,
      req.requestId ? { requestId: req.requestId } : undefined
    );
    return;
  }

  // 3. Prisma Known Request Error
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaError = err as any;
    if (prismaError.code === "P2002") {
      const target = Array.isArray(prismaError.meta?.target)
        ? prismaError.meta.target.join(", ")
        : "unique constraint";
      ApiResponse.error(
        res,
        `A record with this ${target} already exists.`,
        HttpStatus.CONFLICT,
        "CONFLICT",
        { constraint: target },
        req.requestId ? { requestId: req.requestId } : undefined
      );
      return;
    }
  }

  // 4. Unexpected / Programmer Error (500)
  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
      requestId: req.requestId,
      stack: err.stack,
    },
    "Unhandled internal server error"
  );

  const message =
    env.NODE_ENV === "production"
      ? "An unexpected internal error occurred"
      : err.message || "An unexpected error occurred";

  ApiResponse.error(
    res,
    message,
    HttpStatus.INTERNAL_SERVER_ERROR,
    "INTERNAL_ERROR",
    env.NODE_ENV === "development" ? { stack: err.stack } : undefined,
    req.requestId ? { requestId: req.requestId } : undefined
  );
};
