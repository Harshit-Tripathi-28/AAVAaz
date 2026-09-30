import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/AppError.js";

const BCRYPT_SALT_ROUNDS = 12;

export interface TokenPayload {
  userId: string;
  institutionId: string;
}

/**
 * Hashes a plaintext password using bcryptjs with 12 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Computes the SHA-256 hexadecimal hash of a token.
 * Raw refresh tokens are never persisted in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a signed JWT access token and a cryptographically secure random refresh token.
 */
export function generateTokenPair(payload: TokenPayload): {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
} {
  const accessToken = jwt.sign(
    {
      userId: payload.userId,
      institutionId: payload.institutionId,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    }
  );

  // Generate 40 random bytes -> 80 hex characters
  const refreshToken = crypto.randomBytes(40).toString("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_DAYS);

  return {
    accessToken,
    refreshToken,
    expiresAt,
  };
}

/**
 * Verifies a JWT access token signature and returns decoded claims.
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    if (!decoded.userId || !decoded.institutionId) {
      throw new UnauthorizedError("Malformed access token payload");
    }
    return {
      userId: decoded.userId,
      institutionId: decoded.institutionId,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Access token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Invalid access token");
    }
    throw error;
  }
}
