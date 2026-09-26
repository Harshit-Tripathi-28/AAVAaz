import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";
import { PermissionCode } from "../constants/permissions.js";

/**
 * RBAC / PBAC Authorization Middlewares
 *
 * In AAVAaz, Permissions are the primary authorization primitive.
 * Business logic guards verify fine-grained permissions, leaving roles
 * entirely configurable per institution.
 */

/**
 * Require one or more specific permissions.
 * All specified permissions must be present in the user's active context.
 */
export function requirePermissions(...requiredPermissions: (PermissionCode | string)[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const userPermissions = new Set(req.user.permissions);
    const missingPermissions = requiredPermissions.filter(
      (permission) => !userPermissions.has(permission)
    );

    if (missingPermissions.length > 0) {
      return next(
        new ForbiddenError(
          `Access denied: Missing required permission(s): ${missingPermissions.join(", ")}`
        )
      );
    }

    next();
  };
}

/**
 * Require at least one of the specified permissions.
 */
export function requireAnyPermission(...permissions: (PermissionCode | string)[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const userPermissions = new Set(req.user.permissions);
    const hasAny = permissions.some((permission) => userPermissions.has(permission));

    if (!hasAny) {
      return next(
        new ForbiddenError(
          `Access denied: Requires at least one of: ${permissions.join(", ")}`
        )
      );
    }

    next();
  };
}

/**
 * Require a specific role code.
 * Note: Use permissions as the primary primitive whenever possible.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const userRoles = new Set(req.user.roles);
    const hasRole = roles.some((role) => userRoles.has(role));

    if (!hasRole) {
      return next(
        new ForbiddenError(
          `Access denied: Role requirement not met. Required one of: ${roles.join(", ")}`
        )
      );
    }

    next();
  };
}
