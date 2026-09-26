import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";
import { env } from "./env.js";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
          ]
        : [{ emit: "event", level: "error" }],
  });

if (env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// Log queries in debug level during development
if (env.NODE_ENV === "development") {
  (prisma as any).$on("query", (e: any) => {
    logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, "Prisma Query");
  });
}

(prisma as any).$on("error", (e: any) => {
  logger.error(e, "Prisma Database Error");
});

export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    logger.info("Database connection established successfully");
    return true;
  } catch (error) {
    logger.error({ error }, "Failed to connect to PostgreSQL database");
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info("Database disconnected gracefully");
}
