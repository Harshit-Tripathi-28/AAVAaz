import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors/AppError.js";
import { env } from "../config/env.js";

/**
 * CSRF & Origin Verification Middleware
 *
 * Implements defense-in-depth protection for state-changing, cookie-authenticated endpoints:
 * 1. Verifies Origin / Referer against configured trusted CORS_ORIGIN.
 * 2. Requires a custom request header (X-AAVAaz-CSRF: 1 or X-Requested-With) which cross-origin
 *    simple requests (e.g. form submissions, img/script tags) cannot supply without CORS preflight.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  // Only inspect state-changing requests
  const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // 1. Origin / Referer verification
  const allowedOrigins = [
    env.CORS_ORIGIN,
    // In development mode, allow standard localhost variations
    ...(env.NODE_ENV === "development"
      ? ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4000", "http://127.0.0.1:4000"]
      : []),
  ];

  if (origin) {
    if (!allowedOrigins.includes(origin)) {
      return next(new ForbiddenError("CSRF verification failed: Origin not permitted"));
    }
  } else if (referer) {
    const isRefererAllowed = allowedOrigins.some((allowed) => referer.startsWith(allowed));
    if (!isRefererAllowed) {
      return next(new ForbiddenError("CSRF verification failed: Referer not permitted"));
    }
  } else if (env.NODE_ENV === "production") {
    // In production, require Origin or Referer for state-changing cookie requests
    return next(new ForbiddenError("CSRF verification failed: Missing origin or referer"));
  }

  // 2. Custom Anti-CSRF Header verification
  const csrfHeader = req.headers["x-aavaaz-csrf"] || req.headers["x-requested-with"];
  if (!csrfHeader) {
    return next(
      new ForbiddenError("CSRF verification failed: Missing required anti-CSRF request header")
    );
  }

  next();
}
