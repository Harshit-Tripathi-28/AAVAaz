# AAVAaz Architecture Overview

Tagline: *"Your concern. Your voice. Your action."*

AAVAaz is an enterprise-grade, multi-tenant institutional concern resolution platform designed to serve diverse institutional ecosystems (universities, colleges, corporate academies, research institutes, residential schools, and affiliated units). It supports all institutional members—students, faculty, administrative staff, teaching and non-teaching personnel, hostel staff, and platform administrators.

---

## 1. Multi-Tenancy Architecture

AAVAaz uses a **Shared-Database, Tenant-Isolated (Row-Level)** multi-tenancy model. Every tenant-scoped entity contains an immutable `institutionId` reference.

### Tenant Resolution & Security Boundary
A core architectural requirement is: **Never trust client-provided tenant identifiers for authorization.**

1. **Authentication Boundary**:
   - The user authenticates using their credentials.
   - The issued cryptographically signed token contains the user's unique identity (`userId`) and authorized tenant membership(s).
2. **Context Derivation**:
   - Server-side middleware extracts and cryptographically verifies the identity from the authenticated session/token.
   - The user's active institution membership, account status, and assigned roles/permissions are loaded or validated against the server-side database.
3. **Requested Context Handling**:
   - If a request supplies a tenant hint (e.g., via `X-Institution-Id` header or route parameter in multi-affiliated scenarios), the server treats this solely as an **untrusted requested context**.
   - The server verifies that the authenticated user explicitly possesses an active membership and valid authorization within that specific institution. If not, the request is immediately rejected (`403 Forbidden`).
4. **Data Isolation Enforcement**:
   - Every database query for tenant-scoped resources (`User`, `Role`, `Department`, `AuditLog`, and future concerns) injects the server-validated `institutionId` into query predicates.
   - Cross-tenant data leakage is prevented through compound unique constraints (e.g., `@@unique([institutionId, email])`, `@@unique([institutionId, code])`) and query-level isolation.

---

## 2. Authorization Primitive: Permission-Centric RBAC

In AAVAaz, **Permissions are the primary authorization primitive**. Roles are flexible, institution-configurable containers of permissions.

### Key Principles
- **No Hardcoded Role Logic**: Business logic must NEVER check `if (user.role === 'STUDENT')` or `if (user.role === 'DEAN')`. All checks evaluate discrete permissions (e.g., `req.hasPermission('concern:create')`, `req.hasPermission('concern:route')`).
- **Configurable Roles**: Each institution can define custom roles suited to its internal hierarchy (e.g., "Hostel Warden", "Disciplinary Committee Member", "Lab Superintendent") and attach any valid combination of permissions.
- **System Roles**: Predefined system templates (e.g., Platform Admin, Institution Admin) exist as immutable or baseline templates, but institutional administrators can adjust role assignments and define custom institutional roles without code alterations.

### Data Model Hierarchy
```
Institution
    │
    ├── Role (scoped to institution or system-wide)
    │     └── RolePermission (composite key)
    │           └── Permission (global canonical catalog of actions)
    │
    └── User
          └── UserRole (composite key, mapping user to institution role)
```

---

## 3. Concern Lifecycle (State Machine)

AAVAaz concerns progress through a state machine ensuring accountability, verifiable evidence, and reporter satisfaction:

```
[Create]
   │
   ▼
[Validate & Classify]
   │
   ▼
[Prioritize & Duplicate Detection]
   │
   ▼
[Route to Unit/Department]
   │
   ▼
[Assign to Handler/Resolver]
   │
   ▼
[Acknowledge] ──(Overdue)──► [Escalate]
   │
   ▼
[Investigate & Take Action]
   │
   ▼
[Resolve + Attach Evidence]
   │
   ▼
[Reporter Verification] ──(Not Resolved)──► [Reopen]
   │
   ▼ (Confirmed)
[Feedback & Close]
```

### Exceptional Paths:
- **Wrong Department**: Re-route with reason logging.
- **Workload / Conflict**: Reassign with transfer audit trail.
- **Rejected**: Subject to structured appeal workflow.
- **Sensitive / Confidential**: Restricted-access workflow strictly bounded by confidential investigation permissions.

---

## 4. Tamper-Evident Audit Logging

Every critical administrative action, membership modification, role assignment, permission grant, status mutation, and concern state transition produces an immutable `AuditLog` entry containing:
- `institutionId`: Tenant scope.
- `userId`: Acting identity (or null for automated system tasks).
- `action`: Specific operation performed.
- `entityType` & `entityId`: Target resource.
- `oldValues` & `newValues`: JSON diff of altered state.
- `ipAddress` & `userAgent`: Client provenance.
- `createdAt`: Immutable timestamp.
