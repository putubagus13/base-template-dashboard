// src/app/api/audit-logs/route.ts
// ============================================================
// GET /api/audit-logs  (requires read:user - admin only)
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder } from "@/lib/api-response";
import { PaginationMeta } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();

    if (!hasPermission(authUser, "read:user")) {
      return ApiResponseBuilder.forbidden();
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "20"))
    );
    const search = searchParams.get("search") ?? "";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { action: { contains: search, mode: "insensitive" as const } },
            { subject: { contains: search, mode: "insensitive" as const } },
            {
              user: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const metadata: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };

    return ApiResponseBuilder.success(
      logs,
      "Audit logs fetched successfully.",
      200,
      metadata
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[GET /api/audit-logs]", error);
    return ApiResponseBuilder.internalError();
  }
}
