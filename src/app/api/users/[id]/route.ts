// src/app/api/users/[id]/route.ts
// ============================================================
// GET    /api/users/:id  (requires read:user)
// PATCH  /api/users/:id  (requires update:user)
// DELETE /api/users/:id  (requires delete:user)
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { z } from "zod";
import { Prisma } from "@prisma/client";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  roleIds: z.array(z.string()).min(1).optional(),
});

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:user")) {
      return ApiResponseBuilder.forbidden();
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        avatar: true,
        lastLoginAt: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                permissions: {
                  select: {
                    permission: {
                      select: { id: true, action: true, subject: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return ApiResponseBuilder.notFound("User");

    return ApiResponseBuilder.success(
      {
        ...user,
        roles: user.roles.map((ur) => ({
          ...ur.role,
          permissions: ur.role.permissions.map((rp) => rp.permission),
        })),
      },
      "User fetched successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[GET /api/users/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "update:user")) {
      return ApiResponseBuilder.forbidden();
    }

    const body: unknown = await request.json();
    const result = updateUserSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return ApiResponseBuilder.notFound("User");

    const { roleIds, ...userData } = result.data;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...userData,
        ...(roleIds
          ? {
              roles: {
                deleteMany: {},
                create: roleIds.map((roleId) => ({ roleId })),
              },
            }
          : {}),
      } as Prisma.UserUpdateInput,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        updatedAt: true,
        roles: { select: { role: { select: { id: true, name: true } } } },
      },
    });

    return ApiResponseBuilder.success(
      { ...user, roles: user.roles.map((ur) => ur.role) },
      "User updated successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[PATCH /api/users/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "delete:user")) {
      return ApiResponseBuilder.forbidden();
    }

    // Prevent self-deletion
    if (authUser.id === id) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "You cannot delete your own account.",
        403
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return ApiResponseBuilder.notFound("User");

    await prisma.user.delete({ where: { id } });

    return ApiResponseBuilder.success(null, "User deleted successfully.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[DELETE /api/users/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}
