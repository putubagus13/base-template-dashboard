// src/app/api/roles/route.ts
// ============================================================
// GET  /api/roles  (requires read:role)
// POST /api/roles  (requires create:role)
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";

const createRoleSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[A-Z_]+$/,
      "Role name must be uppercase letters and underscores only"
    ),
  description: z.string().max(200).optional(),
  permissionIds: z.array(z.string()).default([]),
});

export async function GET(_request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:role")) {
      return ApiResponseBuilder.forbidden();
    }

    const { id: orgId } = authUser.activeOrganization;

    const roles = await prisma.role.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                action: true,
                subject: true,
                description: true,
              },
            },
          },
        },
        _count: { select: { users: true } },
      },
    });

    const formatted = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      userCount: r._count.users,
      permissions: r.permissions.map((rp) => rp.permission),
      createdAt: r.createdAt,
    }));

    return ApiResponseBuilder.success(formatted, "Roles fetched successfully.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[GET /api/roles]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "create:role")) {
      return ApiResponseBuilder.forbidden();
    }

    const { id: orgId } = authUser.activeOrganization;

    const body: unknown = await request.json();
    const result = createRoleSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { name, description, permissionIds } = result.data;

    const existing = await prisma.role.findFirst({
      where: { name, organizationId: orgId },
    });
    if (existing)
      return ApiResponseBuilder.conflict(`Role "${name}" already exists.`);

    const role = await prisma.role.create({
      data: {
        organizationId: orgId,
        name,
        description,
        permissions: {
          create: permissionIds.map((permissionId) => ({ permissionId })),
        },
        createdBy: authUser.id,
      } as Prisma.RoleCreateInput,
      include: {
        permissions: {
          include: {
            permission: { select: { id: true, action: true, subject: true } },
          },
        },
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "create_role",
      subject: "role",
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      { ...role, permissions: role.permissions.map((rp) => rp.permission) },
      "Role created successfully.",
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[POST /api/roles]", error);
    return ApiResponseBuilder.internalError();
  }
}
