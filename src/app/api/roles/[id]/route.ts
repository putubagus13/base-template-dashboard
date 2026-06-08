// src/app/api/roles/[id]/route.ts
// ============================================================
// GET    /api/roles/:id  (requires read:role)
// PATCH  /api/roles/:id  (requires update:role)
// DELETE /api/roles/:id  (requires delete:role)
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";

// type RouteParams = { params: { id: string } };

const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[A-Z_]+$/,
      "Role name must be uppercase letters and underscores only"
    )
    .optional(),
  description: z.string().max(200).nullable().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:role"))
      return ApiResponseBuilder.forbidden();

    const role = await prisma.role.findUnique({
      where: { id },
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

    if (!role) return ApiResponseBuilder.notFound("Role");

    return ApiResponseBuilder.success(
      {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        userCount: role._count.users,
        permissions: role.permissions.map((rp) => rp.permission),
        createdAt: role.createdAt,
      },
      "Role fetched successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[GET /api/roles/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "update:role"))
      return ApiResponseBuilder.forbidden();

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) return ApiResponseBuilder.notFound("Role");

    if (existing.isSystem) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "System roles cannot be modified.",
        403
      );
    }

    const body: unknown = await request.json();
    const result = updateRoleSchema.safeParse(body);
    if (!result.success)
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));

    const { permissionIds, ...roleData } = result.data;

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...roleData,
        ...(permissionIds !== undefined
          ? {
              permissions: {
                deleteMany: {},
                create: permissionIds.map((permissionId) => ({ permissionId })),
              },
            }
          : {}),
      } as Prisma.RoleUpdateInput,
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
      action: "update_role",
      subject: "role",
      oldValues: existing,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      { ...role, permissions: role.permissions.map((rp) => rp.permission) },
      "Role updated successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[PATCH /api/roles/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "delete:role"))
      return ApiResponseBuilder.forbidden();

    const existing = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!existing) return ApiResponseBuilder.notFound("Role");

    if (existing.isSystem) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "System roles cannot be deleted.",
        403
      );
    }

    if (existing._count.users > 0) {
      return ApiResponseBuilder.error(
        "CONFLICT",
        `Cannot delete role — it is assigned to ${existing._count.users} user(s). Reassign or remove users first.`,
        409
      );
    }

    await prisma.role.delete({ where: { id } });

    await writeAuditLog({
      userId: authUser.id,
      action: "delete_role",
      subject: "role",
      oldValues: existing,
      request: _request,
    });

    return ApiResponseBuilder.success(null, "Role deleted successfully.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[DELETE /api/roles/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}
