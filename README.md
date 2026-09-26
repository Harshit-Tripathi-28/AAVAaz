# AAVAaz (आवाज़)

> **"Your concern. Your voice. Your action."**

AAVAaz is an enterprise-grade, multi-tenant institutional concern resolution platform. It is engineered to handle complaints, grievances, official requests, and feedback across entire institutional ecosystems—encompassing students, faculty, teaching and non-teaching personnel, administrative staff, support teams, hostel administration, and executive leadership.

---

## Architecture Principles

- **Multi-Tenancy by Design**: Strict row-level tenant boundary isolation anchored to `institutionId` across all institutional entities.
- **Server-Side Authorization**: Client-provided identifiers are never trusted. Tenant context and permission scopes are authenticated and authorized strictly on the server.
- **Permission-Centric RBAC**: Granular permissions act as the primary access control primitive. Roles are configurable containers assigned at the institutional level, avoiding hardcoded role assumptions in business logic.
- **Auditability & Evidence**: Tamper-evident audit logging of system state changes, lifecycle events, and resolution proofs.
- **Production Standard**: No mock APIs, no fake demo accounts, typed contracts with TypeScript, and schema enforcement with Prisma & Zod.

---

## Repository Structure

```
AAVAaz/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Multi-tenant PostgreSQL database models & relations
│   ├── src/
│   │   ├── config/               # Zod-validated environment config and database client
│   │   ├── constants/            # Canonical HTTP codes and permission identifiers
│   │   ├── controllers/          # HTTP request handlers (e.g., health controller)
│   │   ├── errors/               # Domain-specific AppError hierarchy
│   │   ├── middlewares/          # Centralized error handler, Zod validator, tenant, auth, RBAC
│   │   ├── routes/               # API route definitions (/api/v1)
│   │   ├── types/                # Express request augmentation and type contracts
│   │   ├── utils/                # Structured logger (pino) and standard API envelopes
│   │   ├── app.ts                # Express application configuration
│   │   └── server.ts             # Server entry point and graceful shutdown
│   ├── .env.example              # Backend environment variables template
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── assets/               # Visual assets and icons
│   │   ├── components/           # Reusable UI primitives and layout components
│   │   ├── features/             # Modular domain feature components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # HTTP client and API integration
│   │   ├── types/                # Frontend data models and contracts
│   │   ├── App.tsx               # Production foundation entry view
│   │   ├── index.css             # Tailwind CSS directives
│   │   └── main.tsx              # React DOM bootstrap
│   ├── .env.example              # Frontend environment variables template
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── docs/
│   ├── architecture.md           # Multi-tenancy, lifecycle state machine, and security model
│   ├── database-schema.md        # Relational models, constraints, and indexes
│   └── api-conventions.md        # REST JSON envelope, status codes, and error formats
├── docker-compose.yml            # PostgreSQL service definition for local development
├── .env.example                  # Root environment template
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js**: `v20.x` or higher (tested with `v24.x`)
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v15` or higher (or Docker)

---

## Getting Started

### 1. Clone & Setup Environment

Copy the environment templates in both root and sub-packages:

```bash
# Backend environment setup
cp backend/.env.example backend/.env

# Frontend environment setup
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` to configure your PostgreSQL credentials:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/aavaaz_dev?schema=public
JWT_SECRET=generate_a_secure_random_string_at_least_32_chars
CORS_ORIGIN=http://localhost:5173
```

### 2. Start PostgreSQL (Optional via Docker)

If you have Docker installed and running:
```bash
docker compose up -d
```

Or connect to an existing local PostgreSQL server and create the database:
```sql
CREATE DATABASE aavaaz_dev;
```

### 3. Database Migration & Prisma Generation

From the `backend/` directory:
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Start the Backend

```bash
cd backend
npm run dev
```
The API server will listen on `http://localhost:4000`. You can verify operational status at `http://localhost:4000/api/v1/health`.

### 5. Start the Frontend

In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.

---

## Documentation

Detailed architectural and design specifications are available in the [docs/](file:///c:/Users/Harshit/OneDrive/Desktop/AAVAaz/docs/) directory:
- [Architecture & Multi-Tenancy](file:///c:/Users/Harshit/OneDrive/Desktop/AAVAaz/docs/architecture.md)
- [Database Schema & Constraints](file:///c:/Users/Harshit/OneDrive/Desktop/AAVAaz/docs/database-schema.md)
- [REST API Conventions](file:///c:/Users/Harshit/OneDrive/Desktop/AAVAaz/docs/api-conventions.md)
