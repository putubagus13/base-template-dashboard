// src/app/api/auth/validate-invitation/route.ts
// ============================================================
// GET /api/auth/validate-invitation?token=xxx
// Validates an invitation token without consuming it
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ApiResponseBuilder } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return ApiResponseBuilder.error(
        "VALIDATION_ERROR",
        "Invitation token is required.",
        400
      );
    }

    const tokenRecord = await prisma.token.findUnique({
      where: { token, type: "INVITATION" },
      select: {
        id: true,
        email: true,
        roleIds: true,
        organizationId: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!tokenRecord) {
      return ApiResponseBuilder.error(
        "TOKEN_INVALID",
        "This invitation link is invalid.",
        400
      );
    }

    if (tokenRecord.usedAt) {
      return ApiResponseBuilder.error(
        "TOKEN_INVALID",
        "This invitation has already been used.",
        400
      );
    }

    if (tokenRecord.expiresAt < new Date()) {
      return ApiResponseBuilder.error(
        "TOKEN_EXPIRED",
        "This invitation link has expired.",
        400
      );
    }

    return ApiResponseBuilder.success(
      {
        email: tokenRecord.email,
        roleIds: tokenRecord.roleIds,
        organizationId: tokenRecord.organizationId,
      },
      "Invitation is valid."
    );
  } catch (error) {
    console.error("[GET /api/auth/validate-invitation]", error);
    return ApiResponseBuilder.internalError();
  }
}
