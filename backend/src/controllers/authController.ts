import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/AppError.js";
import { ApiResponse } from "../utils/response.js";
import {
  verifyPassword,
  generateTokenPair,
  hashToken,
} from "../utils/security.js";
import { recordAuditEvent, AuditActions } from "../services/auditService.js";

const REFRESH_COOKIE_NAME = "aavaaz_refresh";

export const loginSchema = z.object({
  institutionId: z.string().uuid("Invalid institution ID format"),
  email: z.string().email("Invalid email address format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

/**
 * Helper to set the secure HTTP-only refresh cookie
 */
function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    expires: expiresAt,
  });
}

/**
 * Helper to clear the refresh cookie
 */
function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
  });
}

/**
 * POST /api/v1/auth/login
 *
 * Authenticates user credentials within an institution context.
 * Returns an access token (for runtime memory only) and sets an HTTP-only refresh cookie.
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { institutionId, email, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || null;
  const userAgent = (req.headers["user-agent"] as string) || null;

  try {
    // 1. Verify institution operational status
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
      select: { id: true, name: true, code: true, type: true, status: true },
    });

    if (!institution || institution.status !== "ACTIVE") {
      await recordAuditEvent({
        institutionId,
        action: AuditActions.LOGIN_FAILURE,
        entityType: "User",
        entityId: email,
        ipAddress,
        userAgent,
        metadata: { reason: "Institution inactive or non-existent" },
      });
      throw new UnauthorizedError("Invalid credentials or inactive institution");
    }

    // 2. Find user in the specific institution
    const user = await prisma.user.findUnique({
      where: {
        institutionId_email: {
          institutionId,
          email,
        },
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      await recordAuditEvent({
        institutionId,
        action: AuditActions.LOGIN_FAILURE,
        entityType: "User",
        entityId: email,
        ipAddress,
        userAgent,
        metadata: { reason: "User not found in tenant" },
      });
      throw new UnauthorizedError("Invalid credentials");
    }

    // 3. Verify password hash
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await recordAuditEvent({
        institutionId,
        userId: user.id,
        action: AuditActions.LOGIN_FAILURE,
        entityType: "User",
        entityId: user.id,
        ipAddress,
        userAgent,
        metadata: { reason: "Password mismatch" },
      });
      throw new UnauthorizedError("Invalid credentials");
    }

    // 4. Verify user status
    if (user.status !== "ACTIVE") {
      await recordAuditEvent({
        institutionId,
        userId: user.id,
        action: AuditActions.LOGIN_FAILURE,
        entityType: "User",
        entityId: user.id,
        ipAddress,
        userAgent,
        metadata: { reason: `Account status: ${user.status}` },
      });

      if (user.status === "SUSPENDED") {
        throw new UnauthorizedError("Account is suspended. Please contact your institution administrator.");
      }
      if (user.status === "PENDING_VERIFICATION") {
        throw new UnauthorizedError("Account is pending verification.");
      }
      throw new UnauthorizedError("Account is inactive.");
    }

    // 5. Generate Token Pair
    const { accessToken, refreshToken, expiresAt } = generateTokenPair({
      userId: user.id,
      institutionId: user.institutionId,
    });

    // 6. Store SHA-256 hashed refresh token in Session table
    const tokenHash = hashToken(refreshToken);
    await prisma.session.create({
      data: {
        userId: user.id,
        institutionId: user.institutionId,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // 7. Set HTTP-only Cookie
    setRefreshCookie(res, refreshToken, expiresAt);

    // 8. Record LOGIN_SUCCESS audit log
    await recordAuditEvent({
      institutionId: user.institutionId,
      userId: user.id,
      action: AuditActions.LOGIN_SUCCESS,
      entityType: "User",
      entityId: user.id,
      ipAddress,
      userAgent,
      metadata: { sessionExpiresAt: expiresAt.toISOString() },
    });

    // 9. Collect roles and permissions
    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    for (const ur of user.userRoles) {
      roles.push(ur.role.code);
      for (const rp of ur.role.rolePermissions) {
        permissionsSet.add(rp.permission.code);
      }
    }

    const responseData = {
      accessToken,
      user: {
        id: user.id,
        institutionId: user.institutionId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        departmentId: user.departmentId,
        status: user.status,
      },
      institution: {
        id: institution.id,
        name: institution.name,
        code: institution.code,
        type: institution.type,
      },
      roles,
      permissions: Array.from(permissionsSet),
    };

    ApiResponse.success(res, responseData, "Authentication successful");
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/refresh
 *
 * Rotates the refresh token and issues a fresh short-lived access token.
 * Protected by CSRF origin & custom header verification.
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ipAddress = req.ip || req.socket.remoteAddress || null;
  const userAgent = (req.headers["user-agent"] as string) || null;

  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawRefreshToken || typeof rawRefreshToken !== "string") {
      throw new UnauthorizedError("Refresh token missing or invalid");
    }

    const tokenHash = hashToken(rawRefreshToken);

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        institution: {
          select: { id: true, name: true, code: true, type: true, status: true },
        },
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Handle invalid, expired, or already-revoked session
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      if (session && session.revokedAt) {
        // Potential token reuse detection: revoke all sessions for this user for security
        await prisma.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await recordAuditEvent({
          institutionId: session.institutionId,
          userId: session.userId,
          action: AuditActions.SESSION_REVOKED,
          entityType: "Session",
          entityId: session.id,
          ipAddress,
          userAgent,
          metadata: { reason: "Revoked refresh token reuse detected" },
        });
      }
      clearRefreshCookie(res);
      throw new UnauthorizedError("Invalid or expired session. Please log in again.");
    }

    // Verify user and institution active status
    if (session.user.status !== "ACTIVE" || session.institution.status !== "ACTIVE") {
      clearRefreshCookie(res);
      throw new UnauthorizedError("Account or institution is inactive");
    }

    // Refresh Token Rotation: Revoke existing session and create new rotated session
    const { accessToken, refreshToken: newRefreshToken, expiresAt } = generateTokenPair({
      userId: session.user.id,
      institutionId: session.institutionId,
    });

    const newTokenHash = hashToken(newRefreshToken);

    await prisma.$transaction([
      prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      }),
      prisma.session.create({
        data: {
          userId: session.user.id,
          institutionId: session.institutionId,
          tokenHash: newTokenHash,
          expiresAt,
          ipAddress,
          userAgent,
        },
      }),
    ]);

    // Update HTTP-only cookie with rotated token
    setRefreshCookie(res, newRefreshToken, expiresAt);

    // Collect roles and permissions
    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    for (const ur of session.user.userRoles) {
      roles.push(ur.role.code);
      for (const rp of ur.role.rolePermissions) {
        permissionsSet.add(rp.permission.code);
      }
    }

    const responseData = {
      accessToken,
      user: {
        id: session.user.id,
        institutionId: session.user.institutionId,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        departmentId: session.user.departmentId,
        status: session.user.status,
      },
      institution: {
        id: session.institution.id,
        name: session.institution.name,
        code: session.institution.code,
        type: session.institution.type,
      },
      roles,
      permissions: Array.from(permissionsSet),
    };

    ApiResponse.success(res, responseData, "Token refreshed successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/logout
 *
 * Revokes the active session and clears the HTTP-only refresh cookie.
 * Protected by CSRF origin & custom header verification.
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ipAddress = req.ip || req.socket.remoteAddress || null;
  const userAgent = (req.headers["user-agent"] as string) || null;

  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawRefreshToken && typeof rawRefreshToken === "string") {
      const tokenHash = hashToken(rawRefreshToken);
      const session = await prisma.session.findUnique({
        where: { tokenHash },
      });

      if (session && !session.revokedAt) {
        await prisma.session.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });

        await recordAuditEvent({
          institutionId: session.institutionId,
          userId: session.userId,
          action: AuditActions.LOGOUT,
          entityType: "Session",
          entityId: session.id,
          ipAddress,
          userAgent,
        });
      }
    }

    clearRefreshCookie(res);
    ApiResponse.success(res, null, "Logged out successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 *
 * Returns current authenticated user profile, verified tenant, roles, and permissions.
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user || !req.tenant) {
      throw new UnauthorizedError("Unauthenticated");
    }

    ApiResponse.success(
      res,
      {
        user: req.user,
        tenant: req.tenant,
      },
      "Current user profile retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
}
