import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { NotFoundError } from "./errors/AppError.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import institutionRoutes from "./routes/institutionRoutes.js";

const app: Express = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Cookie Parser (for secure HTTP-only refresh tokens)
app.use(cookieParser(env.COOKIE_SECRET));

// Body Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request Context & Correlation ID Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const headerReqId = req.headers["x-request-id"];
  const requestId = typeof headerReqId === "string" && headerReqId.trim() !== ""
    ? headerReqId
    : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info(
      {
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: duration,
        requestId,
      },
      "HTTP Request Completed"
    );
  });

  next();
});

// Mount Routes
app.use("/api/v1", healthRoutes);
app.use("/api/v1", institutionRoutes);
app.use("/api/v1", authRoutes);

// Catch 404 for undefined routes
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError("Route", `${req.method} ${req.originalUrl}`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
