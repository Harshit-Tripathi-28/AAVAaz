# AAVAaz Database Schema Design

The AAVAaz relational schema is managed using Prisma ORM with PostgreSQL. All models enforce primary keys (UUIDv4), foreign key constraints with explicit cascading policies, unique multi-tenant compounds, and indexed query vectors.

---

## Entity Relationship Overview

### 1. `Institution`
The root tenant entity representing a discrete educational or organizational establishment.
- `id` (UUID, Primary Key)
- `name` (VarChar, display name)
- `code` (VarChar, unique institutional identifier/slug, e.g., `iit-delhi`)
- `domain` (VarChar, optional unique email domain for tenant routing)
- `type` (Enum: `COLLEGE`, `UNIVERSITY`, `SCHOOL`, `POLYTECHNIC`, `RESEARCH_INSTITUTE`, `CORPORATE_ACADEMY`, `OTHER`)
- `status` (Enum: `ACTIVE`, `SUSPENDED`, `ONBOARDING`, `DECOMMISSIONED`)
- `settings` (JSONB, tenant-level customizations such as escalation windows, SLAs, custom labels)
- `createdAt`, `updatedAt` (Timestamps)
- **Relations**: `users`, `roles`, `departments`, `auditLogs`, `sessions`

### 2. `User`
Members associated with an institution.
- `id` (UUID, Primary Key)
- `institutionId` (UUID, Foreign Key referencing `Institution.id` ON DELETE RESTRICT)
- `email` (VarChar, user email address)
- `passwordHash` (VarChar, bcrypt salt + hash)
- `firstName`, `lastName` (VarChar)
- `phone` (VarChar, nullable)
- `avatarUrl` (VarChar, nullable)
- `status` (Enum: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION`)
- `departmentId` (UUID, Foreign Key referencing `Department.id` ON DELETE SET NULL)
- `createdAt`, `updatedAt` (Timestamps)
- **Constraints**:
  - `@@unique([institutionId, email])`: Unique email within tenant.
  - `@@index([institutionId, status])`
  - `@@index([institutionId, departmentId])`
- **Relations**: `userRoles`, `auditLogs`, `assignedUserRoles`, `sessions`

### 3. `Department`
Organizational units, academic departments, hostels, laboratories, or administrative branches.
- `id` (UUID, Primary Key)
- `institutionId` (UUID, Foreign Key referencing `Institution.id` ON DELETE CASCADE)
- `name` (VarChar)
- `code` (VarChar, unique unit code within institution, e.g., `DEPT_CSE`, `HOSTEL_A`)
- `description` (Text, nullable)
- `parentDepartmentId` (UUID, nullable self-referencing FK for sub-units)
- `status` (Enum: `ACTIVE`, `ARCHIVED`)
- `createdAt`, `updatedAt` (Timestamps)
- **Constraints**:
  - `@@unique([institutionId, code])`
  - `@@index([institutionId, parentDepartmentId])`

### 4. `Role`
Configurable role containers for grouping permissions within an institution.
- `id` (UUID, Primary Key)
- `institutionId` (UUID, nullable Foreign Key referencing `Institution.id`; NULL indicates a platform-level role)
- `name` (VarChar, e.g., "Institution Administrator", "Concern Resolver", "Faculty", "Student")
- `code` (VarChar, slug identifier)
- `description` (Text, nullable)
- `isSystemRole` (Boolean, default `false`; protects baseline templates from deletion)
- `createdAt`, `updatedAt` (Timestamps)
- **Constraints**:
  - `@@unique([institutionId, code])`
  - `@@index([institutionId])`

### 5. `Permission`
Canonical, fine-grained permission primitive catalog.
- `id` (UUID, Primary Key)
- `code` (VarChar, globally unique permission string, e.g., `concern:create`, `concern:resolve`, `user:manage`, `audit:read`)
- `name` (VarChar)
- `module` (VarChar, grouping module e.g., `CONCERN`, `USER`, `DEPARTMENT`, `SETTINGS`, `AUDIT`)
- `description` (Text, nullable)
- `createdAt`, `updatedAt` (Timestamps)
- **Constraints**:
  - `@@unique([code])`
  - `@@index([module])`

### 6. `RolePermission`
Join table mapping permissions to roles.
- `roleId` (UUID, FK referencing `Role.id` ON DELETE CASCADE)
- `permissionId` (UUID, FK referencing `Permission.id` ON DELETE CASCADE)
- **Constraints**:
  - `@@id([roleId, permissionId])`
  - `@@index([permissionId])`

### 7. `UserRole`
Join table mapping users to assigned roles within their institution.
- `userId` (UUID, FK referencing `User.id` ON DELETE CASCADE)
- `roleId` (UUID, FK referencing `Role.id` ON DELETE CASCADE)
- `assignedAt` (Timestamp)
- `assignedBy` (UUID, nullable FK referencing `User.id` for audit tracking)
- **Constraints**:
  - `@@id([userId, roleId])`
  - `@@index([roleId])`
  - `@@index([assignedBy])`

### 8. `Session`
Stateful session model for secure refresh token rotation and session revocation.
- `id` (UUID, Primary Key)
- `userId` (UUID, FK referencing `User.id` ON DELETE CASCADE)
- `institutionId` (UUID, FK referencing `Institution.id` ON DELETE CASCADE)
- `tokenHash` (VarChar, unique SHA-256 hash of refresh token; raw token is never stored)
- `userAgent` (Text, nullable client user agent string)
- `ipAddress` (VarChar, nullable client IP address)
- `expiresAt` (Timestamp)
- `revokedAt` (Timestamp, nullable; set upon logout, rotation, or reuse detection)
- `createdAt`, `updatedAt` (Timestamps)
- **Constraints**:
  - `@@unique([tokenHash])`
  - `@@index([userId, revokedAt])`
  - `@@index([institutionId])`

### 9. `AuditLog`
Structured operational audit records.
- `id` (UUID, Primary Key)
- `institutionId` (UUID, FK referencing `Institution.id` ON DELETE CASCADE)
- `userId` (UUID, nullable FK referencing `User.id` ON DELETE SET NULL)
- `action` (VarChar, e.g., `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `SESSION_REVOKED`, `INSTITUTION_PROVISIONED`)
- `entityType` (VarChar, e.g., `User`, `Role`, `Department`, `Session`, `Institution`)
- `entityId` (VarChar)
- `oldValues` (JSONB, nullable)
- `newValues` (JSONB, nullable; structured with `_schemaVersion: "1.0"`)
- `ipAddress` (VarChar, nullable)
- `userAgent` (VarChar, nullable)
- `createdAt` (Timestamp)
- **Constraints**:
  - `@@index([institutionId, createdAt])`
  - `@@index([entityType, entityId])`
