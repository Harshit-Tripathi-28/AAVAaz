import { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { ApiResponse } from "../utils/response.js";
import { env } from "../config/env.js";
import { HttpStatus } from "../constants/httpCodes.js";

export async function getHealthStatus(_req: Request, res: Response): Promise<Response> {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  let dbStatus = "unknown";
  let dbHealthy = false;

  try {
    // Perform light database ping
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
    dbHealthy = true;
  } catch (error) {
    dbStatus = "disconnected";
    dbHealthy = false;
  }

  const payload = {
    service: "aavaaz-backend",
    status: dbHealthy ? "healthy" : "degraded",
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(uptime),
    memory: {
      heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
    },
    database: {
      status: dbStatus,
      healthy: dbHealthy,
    },
  };

  const statusCode = dbHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
  return ApiResponse.success(res, payload, "Service health status", statusCode);
}
