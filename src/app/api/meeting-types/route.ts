// src/app/api/meeting-types/route.ts
// ============================================================
// GET  /api/meeting-types     (requires read:meetingType)
// POST /api/meeting-types     (requires create:meetingType)
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";

const createMeetingTypeSchema = z.object({
  name: z.string().min(2, "Nama tipe rapat minimal 2 karakter"),
  color: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:meetingType")) {
      return ApiResponseBuilder.forbidden();
    }
    const orgId = authUser.activeOrganization.id;

    const meetingTypes = await prisma.meetingType.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { meetings: { where: { deletedAt: null } } } },
      },
    });

    return ApiResponseBuilder.success(
      meetingTypes,
      "Meeting types fetched successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[GET /api/meeting-types]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "create:meetingType")) {
      return ApiResponseBuilder.forbidden();
    }

    const body: unknown = await request.json();
    const result = createMeetingTypeSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { name, color } = result.data;
    const orgId = authUser.activeOrganization.id;

    const meetingType = await prisma.meetingType.create({
      data: {
        name,
        color: color ?? null,
        organizationId: orgId,
        createdBy: authUser.id,
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "create_meeting_type",
      subject: "meetingType",
      subjectId: meetingType.id,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      meetingType,
      "Meeting type created successfully.",
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[POST /api/meeting-types]", error);
    return ApiResponseBuilder.internalError();
  }
}
