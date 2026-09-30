import rateLimit from "express-rate-limit";
import { HttpStatus } from "../constants/httpCodes.js";
import { ApiResponse } from "../utils/response.js";

/**
 * Rate limiter for sensitive authentication attempts (prevent brute force / credential stuffing)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      "Too many login attempts from this IP. Please try again after 15 minutes.",
      HttpStatus.TOO_MANY_REQUESTS,
      "RATE_LIMIT_EXCEEDED"
    );
  },
});

/**
 * Rate limiter for session refresh requests
 */
export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 refresh requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      "Too many token refresh requests. Please slow down.",
      HttpStatus.TOO_MANY_REQUESTS,
      "RATE_LIMIT_EXCEEDED"
    );
  },
});

/**
 * Rate limiter for public institution discovery
 */
export const discoveryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      "Too many institution discovery requests. Please try again later.",
      HttpStatus.TOO_MANY_REQUESTS,
      "RATE_LIMIT_EXCEEDED"
    );
  },
});
