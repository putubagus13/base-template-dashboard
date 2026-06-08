// src/app/api/profile/change-password/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  requireAuthUser,
  hashPassword,
  comparePassword,
} from "@/lib/auth/helpers";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[a-z]/, "Must contain lowercase")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();

    const body: unknown = await request.json();
    const result = changePasswordSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { currentPassword, newPassword } = result.data;

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, password: true },
    });

    if (!user) return ApiResponseBuilder.notFound("User");

    const isCurrentValid = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isCurrentValid) {
      return ApiResponseBuilder.error(
        "VALIDATION_ERROR",
        "Current password is incorrect.",
        400,
        [{ field: "currentPassword", message: "Current password is incorrect" }]
      );
    }

    const hashedNew = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: authUser.id },
        data: { password: hashedNew },
      }),
      // Invalidate all refresh tokens (logout from all devices)
      prisma.token.deleteMany({
        where: { userId: authUser.id, type: "REFRESH_TOKEN" },
      }),
    ]);

    await writeAuditLog({
      userId: authUser.id,
      action: "change_password",
      subject: "auth",
      request,
    });

    return ApiResponseBuilder.success(
      null,
      "Password changed successfully. Please log in again."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[POST /api/profile/change-password]", error);
    return ApiResponseBuilder.internalError();
  }
}
