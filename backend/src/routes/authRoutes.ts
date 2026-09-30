import { Router } from "express";
import { login, refresh, logout, me, loginSchema } from "../controllers/authController.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { authRateLimiter, refreshRateLimiter } from "../middlewares/rateLimiter.js";
import { csrfProtection } from "../middlewares/csrfProtection.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

// Public Authentication Endpoint (Rate limited, input validated)
router.post(
  "/auth/login",
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  login
);

// Session Refresh Endpoint (Rate limited, CSRF protected, HTTP-only cookie based)
router.post(
  "/auth/refresh",
  refreshRateLimiter,
  csrfProtection,
  refresh
);

// Logout Endpoint (CSRF protected, session revoking, cookie clearing)
router.post(
  "/auth/logout",
  csrfProtection,
  logout
);

// Authenticated Identity Profile Endpoint
router.get(
  "/auth/me",
  authenticate,
  me
);

export default router;
