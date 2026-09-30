import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/AppError.js";
import { prisma } from "../config/database.js";
import { verifyAccessToken } from "../utils/security.js";
import { logger } from "../utils/logger.js";

/**
 * Production Authentication Middleware
 *
 * Verifies JWT access token signature and expiration,
 * loads the active user from the database to guarantee fresh authorization state,
 * and attaches AuthenticatedUserContext to req.user.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is missing or malformed");
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError("Authentication token is empty");
    }

    // Cryptographically verify token signature and claims
    const payload = verifyAccessToken(token);

    // Load active user and their permissions directly from the database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        institution: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
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
      throw new UnauthorizedError("User associated with token no longer exists");
    }

    if (user.institutionId !== payload.institutionId) {
      throw new UnauthorizedError("Token institution claim mismatch");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError(`User account is currently ${user.status.toLowerCase()}`);
    }

    if (user.institution.status !== "ACTIVE") {
      throw new UnauthorizedError(`Institution is currently ${user.institution.status.toLowerCase()}`);
    }

    // Collect distinct roles and canonical permissions
    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    for (const ur of user.userRoles) {
      roles.push(ur.role.code);
      for (const rp of ur.role.rolePermissions) {
        permissionsSet.add(rp.permission.code);
      }
    }

    req.user = {
      id: user.id,
      institutionId: user.institutionId,
      email: user.email,
      status: user.status,
      departmentId: user.departmentId,
      roles,
      permissions: Array.from(permissionsSet),
    };

    req.tenant = user.institution;

    next();
  } catch (error) {
    logger.debug({ error }, "Authentication verification failed");
    next(error);
  }
}
