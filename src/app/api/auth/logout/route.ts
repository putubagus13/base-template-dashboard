// src/app/api/auth/logout/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { clearAuthCookies, requireAuthUser } from "@/lib/auth/helpers";
import { ApiResponseBuilder } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (refreshToken) {
      await prisma.token
        .delete({ where: { token: refreshToken } })
        .catch(() => null); // Ignore error if token not found
    }

    await clearAuthCookies();

    await writeAuditLog({
      userId: authUser.id,
      action: "logout",
      subject: "auth",
      request,
    });

    return ApiResponseBuilder.success(null, "Logged out successfully.");
  } catch (error) {
    console.error("[POST /api/auth/logout]", error);
    return ApiResponseBuilder.internalError();
  }
}
