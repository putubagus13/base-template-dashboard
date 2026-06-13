// src/app/api/meetings/route.ts
// ============================================================
// GET  /api/meetings  (requires read:meeting)
// POST /api/meetings  (requires create:meeting)
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { generateMetadataPagination } from "@/utils";
import { writeAuditLog } from "@/lib/audit";
import type { MeetingSummary } from "@/types";

const createMeetingSchema = z.object({
  title: z.string().min(2, "Judul rapat minimal 2 karakter"),
  meetingTypeId: z.string().uuid("Tipe rapat tidak valid"),
  scheduledAt: z.string().min(1, "Jadwal rapat wajib diisi"),
  status: z.enum(["INCOMING", "LIVE", "DONE"]).optional(),
  description: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:meeting")) {
      return ApiResponseBuilder.forbidden();
    }
    const orgId = authUser.activeOrganization.id;

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "10"))
    );
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? undefined;
    const meetingTypeId = searchParams.get("meetingTypeId") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const skip = (page - 1) * limit;

    const where = {
      organizationId: orgId,
      deletedAt: null,
      ...(search && {
        title: { contains: search, mode: "insensitive" as const },
      }),
      ...(status && { status: status as "INCOMING" | "LIVE" | "DONE" }),
      ...(meetingTypeId && { meetingTypeId }),
      ...((dateFrom || dateTo) && {
        scheduledAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo + "T23:59:59.999") }),
        },
      }),
    };

    const [meetings, total, incomingTotal, liveTotal, doneTotal] =
      await prisma.$transaction([
        prisma.meeting.findMany({
          where,
          skip,
          take: limit,
          orderBy: { scheduledAt: "desc" },
          include: {
            meetingType: { select: { id: true, name: true, color: true } },
            _count: { select: { attendances: true } },
          },
        }),
        prisma.meeting.count({ where }),
        prisma.meeting.count({ where: { ...where, status: "INCOMING" } }),
        prisma.meeting.count({ where: { ...where, status: "LIVE" } }),
        prisma.meeting.count({ where: { ...where, status: "DONE" } }),
      ]);

    const summary: MeetingSummary = {
      total,
      incomingTotal,
      liveTotal,
      doneTotal,
    };

    const metadata = generateMetadataPagination(page, limit, total);

    return ApiResponseBuilder.success(
      { summary, data: meetings },
      "Meetings fetched successfully.",
      200,
      metadata
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[GET /api/meetings]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "create:meeting")) {
      return ApiResponseBuilder.forbidden();
    }

    const body: unknown = await request.json();
    const result = createMeetingSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const orgId = authUser.activeOrganization.id;

    // Validate meeting type belongs to org
    const meetingType = await prisma.meetingType.findFirst({
      where: {
        id: result.data.meetingTypeId,
        organizationId: orgId,
        deletedAt: null,
      },
    });
    if (!meetingType) {
      return ApiResponseBuilder.notFound("Meeting Type");
    }

    const meeting = await prisma.meeting.create({
      data: {
        title: result.data.title,
        meetingTypeId: result.data.meetingTypeId,
        scheduledAt: new Date(result.data.scheduledAt),
        status: result.data.status ?? "INCOMING",
        description: result.data.description ?? null,
        organizationId: orgId,
        createdBy: authUser.id,
      },
      include: {
        meetingType: { select: { id: true, name: true, color: true } },
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "create_meeting",
      subject: "meeting",
      subjectId: meeting.id,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      meeting,
      "Meeting created successfully.",
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[POST /api/meetings]", error);
    return ApiResponseBuilder.internalError();
  }
}
