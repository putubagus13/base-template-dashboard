// src/app/api/roles/permissions/route.ts
// ============================================================
// GET /api/roles/permissions  - List all permissions
// ============================================================

import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder } from "@/lib/api-response";

export async function GET() {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:role")) {
      return ApiResponseBuilder.forbidden();
    }

    const permissions = await prisma.permission.findMany({
      orderBy: [{ subject: "asc" }, { action: "asc" }],
    });

    // Group by subject for easier frontend consumption
    const grouped = permissions.reduce<Record<string, typeof permissions>>(
      (acc, perm) => {
        const key = perm.subject;
        if (!acc[key]) acc[key] = [];
        acc[key]!.push(perm);
        return acc;
      },
      {}
    );

    return ApiResponseBuilder.success(
      { list: permissions, grouped },
      "Permissions fetched successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[GET /api/roles/permissions]", error);
    return ApiResponseBuilder.internalError();
  }
}
