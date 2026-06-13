// src/app/api/meeting-types/[id]/route.ts
// ============================================================
// GET    /api/meeting-types/:id  (requires read:meetingType)
// PATCH  /api/meeting-types/:id  (requires update:meetingType)
// DELETE /api/meeting-types/:id  (requires delete:meetingType)
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";

const updateMeetingTypeSchema = z.object({
  name: z.string().min(2, "Nama tipe rapat minimal 2 karakter").optional(),
  color: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:meetingType"))
      return ApiResponseBuilder.forbidden();

    const meetingType = await prisma.meetingType.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { meetings: { where: { deletedAt: null } } } },
      },
    });

    if (!meetingType) return ApiResponseBuilder.notFound("Meeting Type");

    return ApiResponseBuilder.success(
      meetingType,
      "Meeting type fetched successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[GET /api/meeting-types/:id]", error);
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
    if (!hasPermission(authUser, "update:meetingType"))
      return ApiResponseBuilder.forbidden();

    const orgId = authUser.activeOrganization.id;
    const existing = await prisma.meetingType.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) return ApiResponseBuilder.notFound("Meeting Type");

    const body: unknown = await request.json();
    const result = updateMeetingTypeSchema.safeParse(body);
    if (!result.success)
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));

    const meetingType = await prisma.meetingType.update({
      where: { id },
      data: {
        ...(result.data.name !== undefined ? { name: result.data.name } : {}),
        ...(result.data.color !== undefined
          ? { color: result.data.color }
          : {}),
        updatedBy: authUser.id,
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "update_meeting_type",
      subject: "meetingType",
      subjectId: id,
      oldValues: existing,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      meetingType,
      "Meeting type updated successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[PATCH /api/meeting-types/:id]", error);
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
    if (!hasPermission(authUser, "delete:meetingType"))
      return ApiResponseBuilder.forbidden();

    const orgId = authUser.activeOrganization.id;
    const existing = await prisma.meetingType.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: {
        _count: { select: { meetings: { where: { deletedAt: null } } } },
      },
    });

    if (!existing) return ApiResponseBuilder.notFound("Meeting Type");

    if (existing._count.meetings > 0) {
      return ApiResponseBuilder.error(
        "CONFLICT",
        `Cannot delete meeting type — it has ${existing._count.meetings} meeting(s).`,
        409
      );
    }

    await prisma.meetingType.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: authUser.id },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "delete_meeting_type",
      subject: "meetingType",
      subjectId: id,
      oldValues: existing,
      request: _request,
    });

    return ApiResponseBuilder.success(
      null,
      "Meeting type deleted successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[DELETE /api/meeting-types/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}
