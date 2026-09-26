import http from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

const server = http.createServer(app);

async function startServer(): Promise<void> {
  logger.info(`Starting AAVAaz backend server in ${env.NODE_ENV} mode...`);

  // Attempt database connection (logs status; server still starts so health status reports connectivity)
  await connectDatabase();

  server.listen(env.PORT, () => {
    logger.info(`🚀 AAVAaz Backend running on http://${env.HOST}:${env.PORT}`);
    logger.info(`👉 Health Check: http://${env.HOST}:${env.PORT}/api/v1/health`);
  });
}

// Graceful shutdown handling
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    logger.info("HTTP server closed.");
    try {
      await disconnectDatabase();
      logger.info("AAVAaz backend shut down successfully.");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during database disconnection");
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds if hanging
  setTimeout(() => {
    logger.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason: unknown) => {
  logger.error({ reason }, "Unhandled Promise Rejection");
});

process.on("uncaughtException", (error: Error) => {
  logger.fatal({ error }, "Uncaught Exception. Exiting...");
  process.exit(1);
});

startServer();
