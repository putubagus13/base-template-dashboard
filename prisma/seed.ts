// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Seeding database...");

  // ─── Permissions ───────────────────────────────────────────
  const permissions = [
    // User management
    { action: "create", subject: "user", description: "Create new users" },
    { action: "read", subject: "user", description: "View user data" },
    { action: "update", subject: "user", description: "Update user data" },
    { action: "delete", subject: "user", description: "Delete users" },
    // Role management
    { action: "create", subject: "role", description: "Create new roles" },
    { action: "read", subject: "role", description: "View role data" },
    { action: "update", subject: "role", description: "Update roles" },
    { action: "delete", subject: "role", description: "Delete roles" },
    // Dashboard
    { action: "read", subject: "dashboard", description: "Access dashboard" },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((p) =>
      prisma.permission.upsert({
        where: { action_subject: { action: p.action, subject: p.subject } },
        update: {},
        create: p,
      })
    )
  );

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  const organization = await prisma.organization.upsert({
    where: {
      id: uuidv4(),
      name: "Example Organization",
      description: "An example organization for seeding purposes",
    },
    update: {},
    create: {
      name: "Example Organization" + uuidv4(),
      description: "An example organization for seeding purposes",
    },
  });

  // ─── Roles ─────────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: {
      id: uuidv4(),
      name: "SUPER_ADMIN",
      organizationId: organization.id,
    },
    update: {},
    create: {
      name: "SUPER_ADMIN",
      description: "Full system access",
      organizationId: organization.id,
      isSystem: true,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { id: uuidv4(), name: "USER", organizationId: organization.id },
    update: {},
    create: {
      name: "USER",
      description: "Standard user access",
      organizationId: organization.id,
      isSystem: true,
    },
  });

  // Assign all permissions to SUPER_ADMIN
  await Promise.all(
    createdPermissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: { roleId: adminRole.id, permissionId: permission.id },
      })
    )
  );

  // Assign only dashboard read to USER role
  const dashboardPermission = createdPermissions.find(
    (p) => p.action === "read" && p.subject === "dashboard"
  );
  if (dashboardPermission) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: dashboardPermission.id,
        },
      },
      update: {},
      create: { roleId: userRole.id, permissionId: dashboardPermission.id },
    });
  }

  console.log(`✅ Created roles: SUPER_ADMIN, USER`);

  // ─── Admin User ────────────────────────────────────────────
  // const hashedPassword = await bcrypt.hash("Admin@123456", 12);
  const hashedPassword = await bcrypt.hash("Qwerty123@", 12);

  const adminUser = await prisma.user.upsert({
    // where: { email: "admin@example.com" },
    where: { email: "admin-org2@example.com" },
    update: {},
    create: {
      email: "admin-org2@example.com",
      name: "Super Admin",
      password: hashedPassword,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: adminUser.id, roleId: adminRole.id },
    },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  await prisma.userOrganization.upsert({
    where: {
      id: uuidv4(),
      userId: adminUser.id,
      organizationId: organization.id,
    },
    update: {},
    create: {
      userId: adminUser.id,
      organizationId: organization.id,
    },
  });

  console.log(`✅ Created admin user: admin@example.com`);

  // ─── Member Status Types ─────────────────────────────────────
  const memberStatusTypes = [
    {
      name: "Anggota Biasa",
      description: "Anggota reguler organisasi",
      color: "#16a34a",
    },
    {
      name: "Pengurus",
      description: "Pengurus inti organisasi",
      color: "#dc2626",
    },
    {
      name: "Calon Anggota",
      description: "Anggota yang sedang dalam masa uji",
      color: "#6b7280",
    },
    {
      name: "Anggota Kehormatan",
      description: "Anggota dengan kontribusi istimewa",
      color: "#d97706",
    },
    {
      name: "Anggota Aktif",
      description: "Anggota dengan keaktifan tinggi",
      color: "#2563eb",
    },
  ];

  await Promise.all(
    memberStatusTypes.map((status) =>
      prisma.memberStatusType.upsert({
        where: {
          id: uuidv4(),
          name: status.name,
        },
        update: {
          description: status.description,
          color: status.color,
        },
        create: {
          name: status.name,
          organizationId: organization.id,
          description: status.description,
          color: status.color,
        },
      })
    )
  );

  console.log(`✅ Created ${memberStatusTypes.length} member status types`);
  console.log("✨ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
