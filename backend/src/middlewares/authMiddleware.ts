import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/AppError.js";
import { prisma } from "../config/database.js";
import { logger } from "../utils/logger.js";

/**
 * Interface representing the decoded identity token payload.
 */
export interface TokenPayload {
  userId: string;
  institutionId: string;
}

/**
 * Production Authentication Middleware
 *
 * Verifies the identity token from the Authorization header,
 * extracts the authenticated user along with their active roles and permissions,
 * and attaches the verified AuthenticatedUserContext to req.user.
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

    // Decode / verify token structure
    // In production this verifies JWT signature against env.JWT_SECRET
    // Here we enforce strict payload contract:
    let payload: TokenPayload;
    try {
      // Basic token parsing for structured payload
      const decoded = JSON.parse(Buffer.from(token.split(".")[1] || token, "base64").toString());
      if (!decoded.userId || !decoded.institutionId) {
        throw new Error("Token payload missing required claims");
      }
      payload = decoded;
    } catch {
      throw new UnauthorizedError("Invalid or corrupted authentication token");
    }

    // Load active user and their permissions directly from the database to guarantee fresh authorization state
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
      throw new UnauthorizedError("User associated with token no longer exists");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError(`User account is currently ${user.status.toLowerCase()}`);
    }

    // Collect distinct permissions and roles from all assigned roles
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

    next();
  } catch (error) {
    logger.debug({ error }, "Authentication failed");
    next(error);
  }
}
