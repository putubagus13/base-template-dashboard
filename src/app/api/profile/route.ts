// src/app/api/profile/route.ts
// ============================================================
// GET   /api/profile  - Get current user's full profile
// PATCH /api/profile  - Update current user's profile
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().nullable().optional(),
});

export async function GET() {
  try {
    const authUser = await requireAuthUser();

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
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
      "Profile fetched successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[GET /api/profile]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();

    const body: unknown = await request.json();
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: result.data as Prisma.UserUpdateInput,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return ApiResponseBuilder.success(user, "Profile updated successfully.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[PATCH /api/profile]", error);
    return ApiResponseBuilder.internalError();
  }
}
