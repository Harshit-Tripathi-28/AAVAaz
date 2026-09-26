/**
 * Canonical Permission Primitives
 *
 * In AAVAaz, permissions are the fundamental authorization primitive.
 * Roles are dynamic, institution-configurable groupings of these permissions.
 * Authorization logic always verifies permissions, never hardcoded role names.
 */

export const Permissions = {
  // Concern Management
  CONCERN_CREATE: "concern:create",
  CONCERN_READ_OWN: "concern:read_own",
  CONCERN_READ_DEPARTMENT: "concern:read_department",
  CONCERN_READ_ALL: "concern:read_all",
  CONCERN_ROUTE: "concern:route",
  CONCERN_ASSIGN: "concern:assign",
  CONCERN_INVESTIGATE: "concern:investigate",
  CONCERN_RESOLVE: "concern:resolve",
  CONCERN_APPEAL: "concern:appeal",
  CONCERN_REOPEN: "concern:reopen",
  CONCERN_CONFIDENTIAL_READ: "concern:confidential_read",

  // Department & Unit Administration
  DEPARTMENT_CREATE: "department:create",
  DEPARTMENT_READ: "department:read",
  DEPARTMENT_UPDATE: "department:update",
  DEPARTMENT_ARCHIVE: "department:archive",

  // User & Membership Administration
  USER_INVITE: "user:invite",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_STATUS_MANAGE: "user:status_manage",

  // Role & Permission Administration
  ROLE_CREATE: "role:create",
  ROLE_READ: "role:read",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",
  ROLE_ASSIGN: "role:assign",

  // Institution Governance & Configuration
  INSTITUTION_SETTINGS_READ: "institution:settings_read",
  INSTITUTION_SETTINGS_UPDATE: "institution:settings_update",

  // Audit Logs
  AUDIT_READ: "audit:read",
} as const;

export type PermissionCode = (typeof Permissions)[keyof typeof Permissions];
