// src/app/api/users/route.ts
// ============================================================
// GET  /api/users  - List users (requires read:user)
// POST /api/users  - Create user (requires create:user)
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser, hashPassword } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { z } from "zod";
import { PaginationMeta } from "@/types";
import { writeAuditLog } from "@/lib/audit";

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  roleIds: z.array(z.string()).min(1, "At least one role is required"),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();

    if (!hasPermission(authUser, "read:user")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id: orgId } = authUser.activeOrganization;

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "10"))
    );
    const search = searchParams.get("search") ?? "";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: {
          organizations: { some: { organizationId: orgId } },
          ...where,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          avatar: true,
          lastLoginAt: true,
          createdAt: true,
          roles: {
            select: {
              role: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const formattedUsers = users.map((u) => ({
      ...u,
      roles: u.roles.map((ur) => ur.role),
    }));

    const metadata: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };

    return ApiResponseBuilder.success(
      formattedUsers,
      "Users fetched successfully.",
      200,
      metadata
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[GET /api/users]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();

    if (!hasPermission(authUser, "create:user")) {
      return ApiResponseBuilder.forbidden();
    }

    const body: unknown = await request.json();
    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { name, email, password, roleIds } = result.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return ApiResponseBuilder.conflict(
        "An account with this email already exists."
      );
    }

    // Validate role IDs exist
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });
    if (roles.length !== roleIds.length) {
      return ApiResponseBuilder.error(
        "VALIDATION_ERROR",
        "One or more roles are invalid.",
        400
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        roles: {
          create: roleIds.map((roleId) => ({ roleId })),
        },
        organizations: {
          create: { organizationId: authUser.activeOrganization.id },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        roles: { select: { role: { select: { id: true, name: true } } } },
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "create_user",
      subject: "user",
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      { ...user, roles: user.roles.map((ur) => ur.role) },
      "User created successfully.",
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[POST /api/users]", error);
    return ApiResponseBuilder.internalError();
  }
}
