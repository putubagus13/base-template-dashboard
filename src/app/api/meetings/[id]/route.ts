// src/app/api/meetings/[id]/route.ts
// ============================================================
// GET    /api/meetings/:id  (requires read:meeting)
// PATCH  /api/meetings/:id  (requires update:meeting)
// DELETE /api/meetings/:id  (requires delete:meeting)
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";

const updateMeetingSchema = z.object({
  title: z.string().min(2).optional(),
  meetingTypeId: z.string().uuid().optional(),
  scheduledAt: z.string().optional(),
  status: z.enum(["INCOMING", "LIVE", "DONE"]).optional(),
  description: z.string().optional().nullable(),
  discussionNotes: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:meeting"))
      return ApiResponseBuilder.forbidden();

    const meeting = await prisma.meeting.findFirst({
      where: { id, deletedAt: null },
      include: {
        meetingType: { select: { id: true, name: true, color: true } },
        _count: { select: { attendances: true } },
      },
    });

    if (!meeting) return ApiResponseBuilder.notFound("Meeting");

    // Compute attendance summary
    const attendances = await prisma.attendance.findMany({
      where: { meetingId: id, deletedAt: null },
    });

    const totalMembers = await prisma.member.count({
      where: {
        organizationId: meeting.organizationId,
        deletedAt: null,
        isActive: true,
      },
    });

    const summaryByStatus = {
      HADIR: attendances.filter((a) => a.status === "HADIR").length,
      IZIN: attendances.filter((a) => a.status === "IZIN").length,
      TIDAK_HADIR: attendances.filter((a) => a.status === "TIDAK_HADIR").length,
      SAKIT: attendances.filter((a) => a.status === "SAKIT").length,
    };

    return ApiResponseBuilder.success(
      {
        ...meeting,
        attendanceSummary: {
          totalMembers,
          totalRecorded: attendances.length,
          ...summaryByStatus,
        },
      },
      "Meeting fetched successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[GET /api/meetings/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "update:meeting"))
      return ApiResponseBuilder.forbidden();

    const orgId = authUser.activeOrganization.id;
    const existing = await prisma.meeting.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return ApiResponseBuilder.notFound("Meeting");

    const body: unknown = await request.json();
    const result = updateMeetingSchema.safeParse(body);
    if (!result.success)
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));

    const { scheduledAt, ...rest } = result.data;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        ...(rest.title !== undefined ? { title: rest.title } : {}),
        ...(rest.meetingTypeId !== undefined
          ? { meetingTypeId: rest.meetingTypeId }
          : {}),
        ...(scheduledAt !== undefined
          ? { scheduledAt: new Date(scheduledAt) }
          : {}),
        ...(rest.status !== undefined ? { status: rest.status } : {}),
        ...(rest.description !== undefined
          ? { description: rest.description }
          : {}),
        ...(rest.discussionNotes !== undefined
          ? { discussionNotes: rest.discussionNotes }
          : {}),
        updatedBy: authUser.id,
      },
      include: {
        meetingType: { select: { id: true, name: true, color: true } },
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "update_meeting",
      subject: "meeting",
      subjectId: id,
      oldValues: existing,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(meeting, "Meeting updated successfully.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[PATCH /api/meetings/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "delete:meeting"))
      return ApiResponseBuilder.forbidden();

    const orgId = authUser.activeOrganization.id;
    const existing = await prisma.meeting.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });

    if (!existing) return ApiResponseBuilder.notFound("Meeting");

    await prisma.meeting.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: authUser.id },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "delete_meeting",
      subject: "meeting",
      subjectId: id,
      oldValues: existing,
      request: _request,
    });

    return ApiResponseBuilder.success(null, "Meeting deleted successfully.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[DELETE /api/meetings/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}
