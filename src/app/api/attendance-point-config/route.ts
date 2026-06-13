// src/app/api/attendance-point-config/route.ts
// ============================================================
// GET /api/attendance-point-config  (requires read:attendancePointConfig)
// PUT /api/attendance-point-config  (requires update:attendancePointConfig)
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import type { AttendanceStatus } from "@prisma/client";

const configItemSchema = z.object({
  status: z.enum(["HADIR", "IZIN", "TIDAK_HADIR", "SAKIT"]),
  points: z.number().int().min(0, "Poin harus >= 0"),
});

const bulkConfigSchema = z.object({
  configs: z.array(configItemSchema),
});

export async function GET() {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:attendancePointConfig"))
      return ApiResponseBuilder.forbidden();

    const orgId = authUser.activeOrganization.id;

    const configs = await prisma.attendancePointConfig.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { status: "asc" },
    });

    return ApiResponseBuilder.success(
      configs,
      "Point config fetched successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[GET /api/attendance-point-config]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "update:attendancePointConfig"))
      return ApiResponseBuilder.forbidden();

    const orgId = authUser.activeOrganization.id;

    const body: unknown = await request.json();
    const result = bulkConfigSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    // Upsert each config
    const operations = result.data.configs.map((item) =>
      prisma.attendancePointConfig.upsert({
        where: {
          organizationId_status: {
            organizationId: orgId,
            status: item.status as AttendanceStatus,
          },
        },
        update: {
          points: item.points,
          updatedBy: authUser.id,
        },
        create: {
          organizationId: orgId,
          status: item.status as AttendanceStatus,
          points: item.points,
          createdBy: authUser.id,
        },
      })
    );

    await prisma.$transaction(operations);

    await writeAuditLog({
      userId: authUser.id,
      action: "update_attendance_point_config",
      subject: "attendancePointConfig",
      newValues: { configs: result.data.configs },
      request,
    });

    const updatedConfigs = await prisma.attendancePointConfig.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { status: "asc" },
    });

    return ApiResponseBuilder.success(
      updatedConfigs,
      "Point config updated successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[PUT /api/attendance-point-config]", error);
    return ApiResponseBuilder.internalError();
  }
}
