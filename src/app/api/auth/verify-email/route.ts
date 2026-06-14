// src/app/api/auth/verify-email/route.ts
// ============================================================
// GET /api/auth/verify-email?token=xxx  — Verify email & activate account
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
        "Verification token is required.",
        400
      );
    }

    const tokenRecord = await prisma.token.findUnique({
      where: { token, type: "EMAIL_VERIFICATION" },
      include: {
        user: { select: { id: true, status: true, emailVerifiedAt: true } },
      },
    });

    if (!tokenRecord) {
      return ApiResponseBuilder.error(
        "TOKEN_INVALID",
        "This verification link is invalid.",
        400
      );
    }

    if (tokenRecord.usedAt) {
      return ApiResponseBuilder.error(
        "TOKEN_INVALID",
        "This verification link has already been used.",
        400
      );
    }

    if (tokenRecord.expiresAt < new Date()) {
      return ApiResponseBuilder.error(
        "TOKEN_EXPIRED",
        "This verification link has expired. Please request a new one.",
        400
      );
    }

    // Activate the user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
        },
      }),
      prisma.token.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return ApiResponseBuilder.success(
      null,
      "Email verified successfully! You can now log in."
    );
  } catch (error) {
    console.error("[GET /api/auth/verify-email]", error);
    return ApiResponseBuilder.internalError();
  }
}
