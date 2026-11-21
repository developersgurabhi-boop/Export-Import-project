/**
 * Idempotent seed: syncs the permission catalogue and system roles, creates one demo
 * organization with two branches, and creates the first head-office admin.
 * Run with: npm run db:seed. Safe to re-run.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { PERMISSION_CODES, describePermission } from '../src/platform/authorization/permissions';
import { SYSTEM_ROLES } from '../src/modules/identity/domain/system-roles';

const prisma = new PrismaClient();

// Placeholder GSTIN in the valid format. It is not a real registration; replace it in the Organization setup.
const DEMO_GSTIN = '29AAAAA0000A1Z5';

async function main(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (password, at least 12 characters) in .env');
  }

  await prisma.$transaction(async (tx) => {
    for (const code of PERMISSION_CODES) {
      const description = describePermission(code);
      await tx.permission.upsert({
        where: { code },
        update: { description },
        create: { code, description },
      });
    }

    let org = await tx.organization.findFirst({ where: { name: 'Demo Transport Co' } });
    org ??= await tx.organization.create({ data: { name: 'Demo Transport Co' } });

    const gst = await tx.gstRegistration.upsert({
      where: { organizationId_gstin: { organizationId: org.id, gstin: DEMO_GSTIN } },
      update: {},
      create: {
        organizationId: org.id,
        gstin: DEMO_GSTIN,
        legalName: 'Demo Transport Co',
        stateCode: '29',
      },
    });

    const headOffice = await tx.branch.upsert({
      where: { organizationId_code: { organizationId: org.id, code: 'HO01' } },
      update: {},
      create: {
        organizationId: org.id,
        gstRegistrationId: gst.id,
        code: 'HO01',
        name: 'Head office',
        stateCode: '29',
      },
    });
    await tx.branch.upsert({
      where: { organizationId_code: { organizationId: org.id, code: 'BR01' } },
      update: {},
      create: {
        organizationId: org.id,
        gstRegistrationId: gst.id,
        code: 'BR01',
        name: 'Branch 01',
        stateCode: '29',
      },
    });

    for (const definition of SYSTEM_ROLES) {
      const role = await tx.role.upsert({
        where: { organizationId_code: { organizationId: org.id, code: definition.code } },
        update: { name: definition.name, isHeadOffice: definition.isHeadOffice },
        create: {
          organizationId: org.id,
          code: definition.code,
          name: definition.name,
          isHeadOffice: definition.isHeadOffice,
        },
      });
      // Sync the role's permission set to the definition in code.
      await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
      await tx.rolePermission.createMany({
        data: definition.permissions.map((permissionCode) => ({ roleId: role.id, permissionCode })),
      });
    }

    const headOfficeAdminRole = await tx.role.findUniqueOrThrow({
      where: { organizationId_code: { organizationId: org.id, code: 'HEAD_OFFICE_ADMIN' } },
    });

    let admin = await tx.appUser.findUnique({
      where: { organizationId_email: { organizationId: org.id, email: adminEmail } },
    });
    if (!admin) {
      admin = await tx.appUser.create({
        data: {
          organizationId: org.id,
          email: adminEmail,
          fullName: 'System Admin',
          passwordHash: await argon2.hash(adminPassword, { type: argon2.argon2id }),
        },
      });
    }
    await tx.userBranchRole.createMany({
      data: [{ organizationId: org.id, userId: admin.id, branchId: headOffice.id, roleId: headOfficeAdminRole.id }],
      skipDuplicates: true,
    });
  });

  console.log(`Seeded ${PERMISSION_CODES.length} permissions and ${SYSTEM_ROLES.length} roles. Admin: ${adminEmail}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
