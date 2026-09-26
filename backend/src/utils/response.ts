import { Response } from "express";
import { HttpStatus, HttpStatusCode } from "../constants/httpCodes.js";

export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: HttpStatusCode;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: HttpStatusCode;
  errorCode: string;
  message: string;
  details?: unknown;
  meta?: Record<string, unknown>;
}

export class ApiResponse {
  public static success<T>(
    res: Response,
    data: T,
    message = "Operation completed successfully",
    statusCode: HttpStatusCode = HttpStatus.OK,
    meta?: Record<string, unknown>
  ): Response {
    const payload: ApiSuccessResponse<T> = {
      success: true,
      statusCode,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...(meta || {}),
      },
    };
    return res.status(statusCode).json(payload);
  }

  public static error(
    res: Response,
    message: string,
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode = "INTERNAL_ERROR",
    details?: unknown,
    meta?: Record<string, unknown>
  ): Response {
    const payload: ApiErrorResponse = {
      success: false,
      statusCode,
      errorCode,
      message,
      ...(details !== undefined ? { details } : {}),
      meta: {
        timestamp: new Date().toISOString(),
        ...(meta || {}),
      },
    };
    return res.status(statusCode).json(payload);
  }
}
