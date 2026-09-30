import { z } from "zod";
import { prisma } from "../config/database.js";
import { hashPassword } from "../utils/security.js";
import { Permissions } from "../constants/permissions.js";
import { recordAuditEvent, AuditActions } from "../services/auditService.js";
import { logger } from "../utils/logger.js";

/**
 * Platform Administrative Institution Provisioning Script
 *
 * Securely provisions a new institution along with its system roles,
 * canonical permissions, initial administrator, and audit record.
 *
 * This provides a protected administrative onboarding mechanism without
 * exposing unrestricted public registration or relying on fake/demo seed data.
 */

const provisionSchema = z.object({
  name: z.string().min(2, "Institution name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Institution code must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Institution code must be lowercase alphanumeric with hyphens"),
  type: z
    .enum([
      "COLLEGE",
      "UNIVERSITY",
      "SCHOOL",
      "POLYTECHNIC",
      "RESEARCH_INSTITUTE",
      "CORPORATE_ACADEMY",
      "OTHER",
    ])
    .default("COLLEGE"),
  domain: z.string().optional(),
  adminEmail: z.string().email("Invalid admin email format").toLowerCase(),
  adminPassword: z.string().min(8, "Admin password must be at least 8 characters"),
  adminFirstName: z.string().min(1, "Admin first name is required"),
  adminLastName: z.string().min(1, "Admin last name is required"),
});

// Helper to parse CLI flags: --name "IIT Delhi" --code iit-delhi ...
function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].substring(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        result[key] = next;
        i++;
      } else {
        result[key] = "true";
      }
    }
  }

  return result;
}

export async function provisionInstitution(): Promise<void> {
  const cliArgs = parseArgs();

  // Read either from CLI flags or environment variables
  const rawInput = {
    name: cliArgs.name || process.env.PROVISION_NAME,
    code: cliArgs.code || process.env.PROVISION_CODE,
    type: cliArgs.type || process.env.PROVISION_TYPE || "COLLEGE",
    domain: cliArgs.domain || process.env.PROVISION_DOMAIN,
    adminEmail: cliArgs.adminEmail || process.env.PROVISION_ADMIN_EMAIL,
    adminPassword: cliArgs.adminPassword || process.env.PROVISION_ADMIN_PASSWORD,
    adminFirstName: cliArgs.adminFirstName || process.env.PROVISION_ADMIN_FIRST_NAME,
    adminLastName: cliArgs.adminLastName || process.env.PROVISION_ADMIN_LAST_NAME,
  };

  const parsed = provisionSchema.safeParse(rawInput);
  if (!parsed.success) {
    console.error("❌ Invalid provisioning parameters:");
    parsed.error.issues.forEach((issue) => {
      console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
    });
    console.log(`
Usage example:
  npx tsx src/scripts/provisionInstitution.ts \\
    --name "Apex Institute of Technology" \\
    --code "apex-tech" \\
    --domain "apex.edu" \\
    --adminEmail "admin@apex.edu" \\
    --adminPassword "SecurePassword123!" \\
    --adminFirstName "System" \\
    --adminLastName "Administrator"
    `);
    process.exit(1);
  }

  const data = parsed.data;

  try {
    console.log(`\nStarting secure provisioning for institution '${data.name}' (${data.code})...`);

    // 1. Check if institution code already exists
    const existing = await prisma.institution.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      console.error(`❌ Error: An institution with code '${data.code}' already exists (ID: ${existing.id}).`);
      process.exit(1);
    }

    // 2. Ensure canonical permissions exist in database
    const canonicalPermissions = Object.entries(Permissions).map(([key, code]) => {
      const module = code.split(":")[0].toUpperCase();
      return {
        code,
        name: key.replace(/_/g, " ").toLowerCase(),
        module,
        description: `Permission to ${code}`,
      };
    });

    for (const perm of canonicalPermissions) {
      await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: perm,
      });
    }

    // 3. Create Institution
    const institution = await prisma.institution.create({
      data: {
        name: data.name,
        code: data.code,
        domain: data.domain || null,
        type: data.type as any,
        status: "ACTIVE",
      },
    });

    // 4. Create Baseline Configurable Roles
    const allPermissions = await prisma.permission.findMany();

    // Role A: Institution Admin (all institutional permissions)
    const adminRole = await prisma.role.create({
      data: {
        institutionId: institution.id,
        name: "Institution Administrator",
        code: "INSTITUTION_ADMIN",
        description: "Full administrative access within the institution",
        isSystemRole: true,
        rolePermissions: {
          create: allPermissions.map((p) => ({
            permissionId: p.id,
          })),
        },
      },
    });

    // Role B: Member (basic concern creation and viewing own concerns)
    const memberPermissions = allPermissions.filter((p) =>
      [Permissions.CONCERN_CREATE, Permissions.CONCERN_READ_OWN, Permissions.DEPARTMENT_READ].includes(
        p.code as any
      )
    );
    await prisma.role.create({
      data: {
        institutionId: institution.id,
        name: "Institution Member",
        code: "INSTITUTION_MEMBER",
        description: "Standard member role for submitting and tracking personal concerns",
        isSystemRole: true,
        rolePermissions: {
          create: memberPermissions.map((p) => ({
            permissionId: p.id,
          })),
        },
      },
    });

    // 5. Hash Admin Password & Create Initial Administrator
    const passwordHash = await hashPassword(data.adminPassword);

    const adminUser = await prisma.user.create({
      data: {
        institutionId: institution.id,
        email: data.adminEmail,
        passwordHash,
        firstName: data.adminFirstName,
        lastName: data.adminLastName,
        status: "ACTIVE",
        userRoles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    });

    // 6. Record Audit Log
    await recordAuditEvent({
      institutionId: institution.id,
      userId: adminUser.id,
      action: AuditActions.INSTITUTION_PROVISIONED,
      entityType: "Institution",
      entityId: institution.id,
      metadata: {
        institutionCode: institution.code,
        adminEmail: adminUser.email,
      },
    });

    console.log("✅ Institution successfully provisioned!");
    console.log(`   - Institution ID:   ${institution.id}`);
    console.log(`   - Institution Name: ${institution.name}`);
    console.log(`   - Institution Code: ${institution.code}`);
    console.log(`   - Admin Email:      ${adminUser.email}`);
    console.log(`   - Admin User ID:    ${adminUser.id}`);
    console.log("   - Initial Role:     Institution Administrator (INSTITUTION_ADMIN)");
    console.log("\nReady for production login via /api/v1/auth/login.\n");
  } catch (error) {
    logger.error({ error }, "Failed to provision institution");
    console.error("❌ Provisioning failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly from CLI
if (process.argv[1]?.includes("provisionInstitution")) {
  provisionInstitution();
}
