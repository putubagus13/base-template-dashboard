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
    //Member
    { action: "create", subject: "member", description: "Create new members" },
    { action: "read", subject: "member", description: "View member data" },
    { action: "update", subject: "member", description: "Update member data" },
    { action: "delete", subject: "member", description: "Delete members" },
    // Cash Account
    {
      action: "create",
      subject: "cashAccount",
      description: "Create new cash accounts",
    },
    {
      action: "read",
      subject: "cashAccount",
      description: "View cash account data",
    },
    {
      action: "update",
      subject: "cashAccount",
      description: "Update cash account data",
    },
    {
      action: "delete",
      subject: "cashAccount",
      description: "Delete cash accounts",
    },
    // Transaction
    {
      action: "read",
      subject: "cashTransaction",
      description: "View transaction data",
    },
    {
      action: "update",
      subject: "cashTransaction",
      description: "Update transaction data",
    },
    {
      action: "delete",
      subject: "cashTransaction",
      description: "Delete transactions",
    },
    {
      action: "create",
      subject: "cashTransaction",
      description: "Create new transactions",
    },
    {
      action: "verify",
      subject: "cashTransaction",
      description: "Verify transaction data",
    },
    // Transaction category
    {
      action: "create",
      subject: "cashTransactionCategory",
      description: "Create new transaction categories",
    },
    {
      action: "read",
      subject: "cashTransactionCategory",
      description: "View transaction category data",
    },
    {
      action: "update",
      subject: "cashTransactionCategory",
      description: "Update transaction category data",
    },
    {
      action: "delete",
      subject: "cashTransactionCategory",
      description: "Delete transaction category data",
    },
    // Donor
    { action: "create", subject: "donor", description: "Create new donors" },
    { action: "read", subject: "donor", description: "View donor data" },
    { action: "update", subject: "donor", description: "Update donor data" },
    { action: "delete", subject: "donor", description: "Delete donors" },
    // Meeting
    {
      action: "create",
      subject: "meeting",
      description: "Create new meetings",
    },
    { action: "read", subject: "meeting", description: "View meeting data" },
    {
      action: "update",
      subject: "meeting",
      description: "Update meeting data",
    },
    { action: "delete", subject: "meeting", description: "Delete meetings" },
    // Meeting Type
    {
      action: "create",
      subject: "meetingType",
      description: "Create meeting types",
    },
    {
      action: "read",
      subject: "meetingType",
      description: "View meeting types",
    },
    {
      action: "update",
      subject: "meetingType",
      description: "Update meeting types",
    },
    {
      action: "delete",
      subject: "meetingType",
      description: "Delete meeting types",
    },
    // Attendance
    {
      action: "create",
      subject: "attendance",
      description: "Create attendance records",
    },
    {
      action: "read",
      subject: "attendance",
      description: "View attendance data",
    },
    {
      action: "update",
      subject: "attendance",
      description: "Update attendance records",
    },
    {
      action: "delete",
      subject: "attendance",
      description: "Delete attendance records",
    },
    // Attendance Point Config
    {
      action: "read",
      subject: "attendancePointConfig",
      description: "View point config",
    },
    {
      action: "update",
      subject: "attendancePointConfig",
      description: "Update point config",
    },
    // Dues Agenda (Iuran Anggota)
    {
      action: "create",
      subject: "duesAgenda",
      description: "Create dues agenda",
    },
    {
      action: "read",
      subject: "duesAgenda",
      description: "View dues agenda",
    },
    {
      action: "update",
      subject: "duesAgenda",
      description: "Update dues agenda",
    },
    {
      action: "delete",
      subject: "duesAgenda",
      description: "Delete dues agenda",
    },
    // Member Dues Payment
    {
      action: "read",
      subject: "memberDuesPayment",
      description: "View member dues payment",
    },
    {
      action: "update",
      subject: "memberDuesPayment",
      description: "Update member dues payment",
    },
    // Loan (Pinjaman)
    { action: "create", subject: "loan", description: "Create new loans" },
    { action: "read", subject: "loan", description: "View loan data" },
    { action: "update", subject: "loan", description: "Update loan data" },
    { action: "delete", subject: "loan", description: "Delete loans" },
    { action: "verify", subject: "loan", description: "Verify loan data" },
    // Loan Payment
    {
      action: "create",
      subject: "loanPayment",
      description: "Create loan payments",
    },
    {
      action: "read",
      subject: "loanPayment",
      description: "View loan payment data",
    },
    {
      action: "update",
      subject: "loanPayment",
      description: "Update loan payment data",
    },
    {
      action: "delete",
      subject: "loanPayment",
      description: "Delete loan payments",
    },
    {
      action: "verify",
      subject: "loanPayment",
      description: "Verify loan payment data",
    },
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

  // ─── Default Attendance Point Config ────────────────────────
  const defaultPointConfigs = [
    { status: "HADIR" as const, points: 10 },
    { status: "IZIN" as const, points: 5 },
    { status: "SAKIT" as const, points: 5 },
    { status: "TIDAK_HADIR" as const, points: 0 },
  ];

  await Promise.all(
    defaultPointConfigs.map((config) =>
      prisma.attendancePointConfig.upsert({
        where: {
          organizationId_status: {
            organizationId: organization.id,
            status: config.status,
          },
        },
        update: {},
        create: {
          organizationId: organization.id,
          status: config.status,
          points: config.points,
        },
      })
    )
  );

  console.log(
    `✅ Created ${defaultPointConfigs.length} attendance point configs`
  );
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
