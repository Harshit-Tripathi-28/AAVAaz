import { prisma } from "../config/database.js";
import { logger } from "../utils/logger.js";

export const AuditActions = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  SESSION_REVOKED: "SESSION_REVOKED",
  INSTITUTION_PROVISIONED: "INSTITUTION_PROVISIONED",
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

export interface RecordAuditParams {
  institutionId: string;
  userId?: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Audit Logging Service
 *
 * Records structured authentication and system events to the PostgreSQL AuditLog table.
 * Payloads are formatted with an event schema version and clean metadata to facilitate
 * future integration with cryptographic hash-chains or external append-only audit sinks.
 *
 * SENSITIVITY RULE: Never record plaintext passwords, raw tokens, cookie values, or private keys.
 */
export async function recordAuditEvent(params: RecordAuditParams): Promise<void> {
  try {
    const structuredNewValues = params.newValues || params.metadata ? {
      _schemaVersion: "1.0",
      ...(params.metadata || {}),
      ...(params.newValues || {}),
    } : null;

    await prisma.auditLog.create({
      data: {
        institutionId: params.institutionId,
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues as any,
        newValues: structuredNewValues as any,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    // Non-blocking: Audit failure is logged with high priority without breaking transaction
    logger.error({ error, action: params.action, entityId: params.entityId }, "Failed to persist audit log record");
  }
}
