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

### 2. `User`
Members associated with an institution. Note: Users belong to an institution tenant.
- `id` (UUID, Primary Key)
- `institutionId` (UUID, Foreign Key referencing `Institution.id` ON DELETE RESTRICT)
- `email` (VarChar, user email address)
- `passwordHash` (VarChar, bcrypt/argon2 hash)
- `firstName`, `lastName` (VarChar)
- `phone` (VarChar, nullable)
- `avatarUrl` (VarChar, nullable)
- `status` (Enum: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION`)
- `departmentId` (UUID, Foreign Key referencing `Department.id` ON DELETE SET NULL)
- `createdAt`, `updatedAt` (Timestamps)
- **Constraints**:
  - `@@unique([institutionId, email])`: An email is unique within the tenant institution.
  - `@@index([institutionId, status])`
  - `@@index([institutionId, departmentId])`

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
- `name` (VarChar, e.g., "Dean of Student Affairs", "Hostel Warden", "Faculty")
- `code` (VarChar, slug identifier)
- `description` (Text, nullable)
- `isSystemRole` (Boolean, default `false`; protects system baseline templates from deletion)
- `createdAt`, `updatedAt` (Timestamps)
- **Constraints**:
  - `@@unique([institutionId, code])`
  - `@@index([institutionId])`

### 5. `Permission`
Canonical, fine-grained permission primitive catalog.
- `id` (UUID, Primary Key)
- `code` (VarChar, globally unique permission string, e.g., `concern:create`, `concern:reassign`, `audit:read`)
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

### 8. `AuditLog`
Immutable operational audit record.
- `id` (UUID, Primary Key)
- `institutionId` (UUID, FK referencing `Institution.id` ON DELETE CASCADE)
- `userId` (UUID, nullable FK referencing `User.id` ON DELETE SET NULL)
- `action` (VarChar, e.g., `USER_REGISTERED`, `ROLE_MODIFIED`, `PERMISSION_REVOKED`)
- `entityType` (VarChar, e.g., `User`, `Role`, `Department`, `Concern`)
- `entityId` (VarChar)
- `oldValues` (JSONB, nullable)
- `newValues` (JSONB, nullable)
- `ipAddress` (VarChar, nullable)
- `userAgent` (VarChar, nullable)
- `createdAt` (Timestamp, immutable)
- **Constraints**:
  - `@@index([institutionId, createdAt])`
  - `@@index([entityType, entityId])`
