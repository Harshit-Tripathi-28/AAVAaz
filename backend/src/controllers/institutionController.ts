import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database.js";
import { ApiResponse } from "../utils/response.js";

/**
 * Public Institution Discovery Controller
 *
 * Exposes only safe fields of actively operating institutions.
 * Suspended or decommissioned institutions are strictly excluded.
 * Internal settings, secrets, and private operational data are never exposed.
 */
export async function getPublicInstitutions(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const institutions = await prisma.institution.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        domain: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    ApiResponse.success(res, institutions, "Active institutions retrieved successfully");
  } catch (error) {
    next(error);
  }
}
