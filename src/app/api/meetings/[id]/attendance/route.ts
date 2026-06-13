// src/app/api/meetings/[id]/attendance/route.ts
// ============================================================
// GET /api/meetings/:id/attendance  (requires read:attendance)
// PUT /api/meetings/:id/attendance  (requires update:attendance)
//     Bulk upsert attendance + sync member.activityPoint
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import type { AttendanceStatus } from "@prisma/client";

const attendanceItemSchema = z.object({
  memberId: z.string().uuid(),
  status: z.enum(["HADIR", "IZIN", "TIDAK_HADIR", "SAKIT"]),
  notes: z.string().optional().nullable(),
});

const bulkAttendanceSchema = z.object({
  attendances: z.array(attendanceItemSchema),
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:attendance"))
      return ApiResponseBuilder.forbidden();

    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, deletedAt: null },
    });
    if (!meeting) return ApiResponseBuilder.notFound("Meeting");

    const attendances = await prisma.attendance.findMany({
      where: { meetingId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        member: {
          select: { id: true, fullName: true, memberNumber: true },
        },
      },
    });

    return ApiResponseBuilder.success(
      attendances,
      "Attendance fetched successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[GET /api/meetings/:id/attendance]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "update:attendance"))
      return ApiResponseBuilder.forbidden();

    const orgId = authUser.activeOrganization.id;

    // Verify meeting belongs to org
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, organizationId: orgId, deletedAt: null },
    });
    if (!meeting) return ApiResponseBuilder.notFound("Meeting");

    const body: unknown = await request.json();
    const result = bulkAttendanceSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    // Load point config for this org
    const pointConfigs = await prisma.attendancePointConfig.findMany({
      where: { organizationId: orgId, deletedAt: null },
    });
    const pointMap = new Map<AttendanceStatus, number>();
    for (const config of pointConfigs) {
      pointMap.set(config.status, config.points);
    }

    // Bulk upsert attendance records
    const operations = result.data.attendances.map((item) => {
      const points = pointMap.get(item.status as AttendanceStatus) ?? 0;
      return prisma.attendance.upsert({
        where: {
          meetingId_memberId: {
            meetingId,
            memberId: item.memberId,
          },
        },
        update: {
          status: item.status as AttendanceStatus,
          points,
          notes: item.notes ?? null,
          updatedBy: authUser.id,
          deletedAt: null,
        },
        create: {
          meetingId,
          memberId: item.memberId,
          status: item.status as AttendanceStatus,
          points,
          notes: item.notes ?? null,
          createdBy: authUser.id,
        },
      });
    });

    await prisma.$transaction(operations);

    // Sync member.activityPoint: recalculate total from all attendances
    const allAttendances = await prisma.attendance.findMany({
      where: {
        memberId: { in: result.data.attendances.map((a) => a.memberId) },
        deletedAt: null,
      },
    });

    const memberPointsMap = new Map<string, number>();
    for (const att of allAttendances) {
      const current = memberPointsMap.get(att.memberId) ?? 0;
      memberPointsMap.set(att.memberId, current + att.points);
    }

    const memberUpdateOps = Array.from(memberPointsMap.entries()).map(
      ([memberId, totalPoints]) =>
        prisma.member.update({
          where: { id: memberId },
          data: { activityPoint: totalPoints },
        })
    );

    if (memberUpdateOps.length > 0) {
      await prisma.$transaction(memberUpdateOps);
    }

    await writeAuditLog({
      userId: authUser.id,
      action: "bulk_update_attendance",
      subject: "attendance",
      subjectId: meetingId,
      newValues: { count: result.data.attendances.length },
      request,
    });

    // Return updated attendance
    const updatedAttendances = await prisma.attendance.findMany({
      where: { meetingId, deletedAt: null },
      include: {
        member: {
          select: { id: true, fullName: true, memberNumber: true },
        },
      },
    });

    return ApiResponseBuilder.success(
      updatedAttendances,
      "Attendance saved successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[PUT /api/meetings/:id/attendance]", error);
    return ApiResponseBuilder.internalError();
  }
}
