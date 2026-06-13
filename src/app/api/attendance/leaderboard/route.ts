// src/app/api/attendance/leaderboard/route.ts
// ============================================================
// GET /api/attendance/leaderboard  (requires read:attendance)
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { ApiResponseBuilder } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:attendance"))
      return ApiResponseBuilder.forbidden();

    const orgId = authUser.activeOrganization.id;
    const { searchParams } = request.nextUrl;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "20"))
    );

    // Get active members
    const members = await prisma.member.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true, fullName: true, memberNumber: true },
    });

    if (members.length === 0) {
      return ApiResponseBuilder.success(
        [],
        "Leaderboard fetched successfully."
      );
    }

    // Build date filter for meetings
    const meetingDateFilter = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo + "T23:59:59.999") }),
    };

    // Get attendance stats per member
    const memberIds = members.map((m) => m.id);

    const attendances = await prisma.attendance.findMany({
      where: {
        memberId: { in: memberIds },
        deletedAt: null,
        meeting: {
          deletedAt: null,
          ...(Object.keys(meetingDateFilter).length > 0
            ? { scheduledAt: meetingDateFilter }
            : {}),
        },
      },
      select: {
        memberId: true,
        status: true,
        points: true,
      },
    });

    // Aggregate per member
    const statsMap = new Map<
      string,
      { totalHadir: number; totalPoints: number }
    >();

    for (const att of attendances) {
      const current = statsMap.get(att.memberId) ?? {
        totalHadir: 0,
        totalPoints: 0,
      };
      if (att.status === "HADIR") current.totalHadir += 1;
      current.totalPoints += att.points;
      statsMap.set(att.memberId, current);
    }

    // Build leaderboard
    const leaderboard = members
      .map((m) => {
        const stats = statsMap.get(m.id) ?? { totalHadir: 0, totalPoints: 0 };
        return {
          memberId: m.id,
          fullName: m.fullName,
          memberNumber: m.memberNumber,
          totalHadir: stats.totalHadir,
          totalPoints: stats.totalPoints,
        };
      })
      .sort(
        (a, b) => b.totalPoints - a.totalPoints || b.totalHadir - a.totalHadir
      )
      .slice(0, limit);

    return ApiResponseBuilder.success(
      leaderboard,
      "Leaderboard fetched successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[GET /api/attendance/leaderboard]", error);
    return ApiResponseBuilder.internalError();
  }
}
