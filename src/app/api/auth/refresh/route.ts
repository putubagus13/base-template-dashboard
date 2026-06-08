// src/app/api/auth/refresh/route.ts
// ============================================================
// POST /api/auth/refresh
// Silent token refresh - dipanggil oleh middleware
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { buildAuthUser, setAuthCookies } from "@/lib/auth/helpers";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/auth/jwt";
import { ApiResponseBuilder } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return ApiResponseBuilder.unauthorized("No refresh token provided.");
    }

    // Verify JWT signature
    const userId = await verifyRefreshToken(refreshToken).catch(() => null);
    if (!userId) {
      return ApiResponseBuilder.error(
        "TOKEN_INVALID",
        "Invalid refresh token.",
        401
      );
    }

    // Check token exists in DB and is not used/expired
    const storedToken = await prisma.token.findUnique({
      where: { token: refreshToken },
    });

    if (
      !storedToken ||
      storedToken.type !== "REFRESH_TOKEN" ||
      storedToken.usedAt ||
      storedToken.expiresAt < new Date()
    ) {
      return ApiResponseBuilder.error(
        "TOKEN_EXPIRED",
        "Session expired. Please log in again.",
        401
      );
    }

    // Rotate refresh token (invalidate old, create new)
    const authUser = await buildAuthUser(userId);
    if (!authUser) {
      return ApiResponseBuilder.unauthorized();
    }

    const newAccessToken = await generateAccessToken({
      sub: authUser.id,
      email: authUser.email,
      name: authUser.name,
      roles: authUser.roles,
      permissions: authUser.permissions,
      activeOrganization: authUser.activeOrganization,
    });
    const newRefreshToken = await generateRefreshToken(userId);

    await prisma.$transaction([
      prisma.token.delete({ where: { id: storedToken.id } }),
      prisma.token.create({
        data: {
          userId,
          token: newRefreshToken,
          type: "REFRESH_TOKEN",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    setAuthCookies(newAccessToken, newRefreshToken);

    return ApiResponseBuilder.success({ user: authUser }, "Token refreshed.");
  } catch (error) {
    console.error("[POST /api/auth/refresh]", error);
    return ApiResponseBuilder.internalError();
  }
}
