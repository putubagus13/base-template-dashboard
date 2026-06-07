// src/app/api/auth/reset-password/route.ts
// ============================================================
// POST /api/auth/reset-password
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/helpers";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { token, password } = result.data;

    // Find and validate token
    const resetToken = await prisma.token.findUnique({
      where: { token },
      include: { user: { select: { id: true, status: true } } },
    });

    if (!resetToken || resetToken.type !== "PASSWORD_RESET") {
      return ApiResponseBuilder.error(
        "TOKEN_INVALID",
        "This password reset link is invalid.",
        400
      );
    }

    if (resetToken.usedAt) {
      return ApiResponseBuilder.error(
        "TOKEN_INVALID",
        "This password reset link has already been used.",
        400
      );
    }

    if (resetToken.expiresAt < new Date()) {
      return ApiResponseBuilder.error(
        "TOKEN_EXPIRED",
        "This password reset link has expired. Please request a new one.",
        400
      );
    }

    if (
      resetToken.user.status === "INACTIVE" ||
      resetToken.user.status === "SUSPENDED"
    ) {
      return ApiResponseBuilder.error(
        "ACCOUNT_INACTIVE",
        "Your account has been deactivated. Please contact support.",
        403
      );
    }

    const hashedPassword = await hashPassword(password);

    // Update password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.token.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all refresh tokens (force re-login on all devices)
      prisma.token.deleteMany({
        where: { userId: resetToken.userId, type: "REFRESH_TOKEN" },
      }),
    ]);

    return ApiResponseBuilder.success(
      null,
      "Your password has been reset successfully. Please log in with your new password."
    );
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return ApiResponseBuilder.internalError();
  }
}
