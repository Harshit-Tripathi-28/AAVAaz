import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, TenantContextError } from "../errors/AppError.js";
import { prisma } from "../config/database.js";

/**
 * Tenant Context Resolution & Validation Middleware
 *
 * Enforces strict tenant isolation:
 * 1. Must be preceded by `authenticate` middleware so req.user is guaranteed.
 * 2. Does NOT trust client-supplied headers (like X-Institution-Id) as authorization sources.
 * 3. If a client sends X-Institution-Id (requested tenant), it verifies the authenticated user
 *    is an authorized member of that institution.
 * 4. Resolves the validated institution from the database and attaches it to `req.tenant`.
 */
export async function resolveTenantContext(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required before resolving tenant context");
    }

    const requestedTenantId = req.headers["x-institution-id"];
    const targetInstitutionId = typeof requestedTenantId === "string" && requestedTenantId.trim() !== ""
      ? requestedTenantId.trim()
      : req.user.institutionId;

    // Reject immediately if requested tenant does not match user's authorized institution
    if (targetInstitutionId !== req.user.institutionId) {
      throw new TenantContextError(
        "Access denied: You do not possess authorized membership in the requested institution"
      );
    }

    // Load institution to confirm active operational status
    const institution = await prisma.institution.findUnique({
      where: { id: targetInstitutionId },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
      },
    });

    if (!institution) {
      throw new TenantContextError("The targeted institution does not exist");
    }

    if (institution.status !== "ACTIVE") {
      throw new TenantContextError(`Institution is currently ${institution.status.toLowerCase()}`);
    }

    // Attach validated tenant context to request
    req.tenant = institution;

    next();
  } catch (error) {
    next(error);
  }
}
