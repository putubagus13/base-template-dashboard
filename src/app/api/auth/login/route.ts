// src/app/api/auth/login/route.ts
// ============================================================
// POST /api/auth/login
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  comparePassword,
  buildAuthUser,
  setAuthCookies,
} from "@/lib/auth/helpers";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { loginSchema } from "@/lib/validations/auth";
import { authRateLimiter } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import type { LoginResponse } from "@/types/auth";
import { Organization } from "@/types";

export async function POST(request: NextRequest) {
  // Rate limiting
  const { success: rateLimitOk } = authRateLimiter.check(request);
  if (!rateLimitOk) {
    return ApiResponseBuilder.error(
      "RATE_LIMIT_EXCEEDED",
      "Too many login attempts. Please wait 15 minutes before trying again.",
      429
    );
  }

  try {
    const body: unknown = await request.json();

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { email, password, rememberMe } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organizations: {
          include: { organization: true },
        },
      },
    });

    if (!user) {
      return ApiResponseBuilder.error(
        "UNAUTHORIZED",
        "Invalid email or password.",
        401
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      await writeAuditLog({
        userId: user.id,
        action: "login_failed",
        subject: "auth",
        request,
      });
      return ApiResponseBuilder.error(
        "UNAUTHORIZED",
        "Invalid email or password.",
        401
      );
    }

    // const foundUserOrg = await prisma.userOrganization.findMany({
    //   where: { userId: user.id, status: true },
    //   include: { organization: true },
    // });

    if (user.organizations && user.organizations.length === 0) {
      return ApiResponseBuilder.error(
        "INVALID_ORGANIZATION",
        "You are not a member of any organization.",
        403
      );
    }

    if (user.status === "INACTIVE" || user.status === "SUSPENDED") {
      return ApiResponseBuilder.error(
        "ACCOUNT_INACTIVE",
        "Your account has been deactivated. Please contact support.",
        403
      );
    }

    if (user.status === "PENDING_VERIFICATION") {
      return ApiResponseBuilder.error(
        "EMAIL_NOT_VERIFIED",
        "Please verify your email address before logging in.",
        403
      );
    }

    const authUser = await buildAuthUser(user.id);
    if (!authUser) return ApiResponseBuilder.internalError();

    const accessToken = await generateAccessToken({
      sub: authUser.id,
      email: authUser.email,
      name: authUser.name,
      roles: authUser.roles,
      permissions: authUser.permissions,
      activeOrganization: user.organizations[0]?.organization as Organization,
    });
    const refreshToken = await generateRefreshToken(user.id);

    await prisma.$transaction([
      prisma.token.create({
        data: {
          userId: user.id,
          token: refreshToken,
          type: "REFRESH_TOKEN",
          expiresAt: new Date(
            Date.now() + (rememberMe ? 7 : 1) * 24 * 60 * 60 * 1000
          ),
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    setAuthCookies(accessToken, refreshToken, rememberMe);

    await writeAuditLog({
      userId: user.id,
      action: "login",
      subject: "auth",
      request,
    });

    const response: LoginResponse = { user: authUser, accessToken };
    return ApiResponseBuilder.success(response, "Login successful.");
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return ApiResponseBuilder.internalError();
  }
}
