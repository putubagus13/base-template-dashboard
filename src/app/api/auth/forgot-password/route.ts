// src/app/api/auth/forgot-password/route.ts
import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { passwordResetLimiter } from "@/lib/rate-limit";

const GENERIC_MESSAGE =
  "If an account exists with this email, you will receive a password reset link shortly.";

export async function POST(request: NextRequest) {
  const { success: rateLimitOk } = passwordResetLimiter.check(request);
  if (!rateLimitOk) {
    return ApiResponseBuilder.error(
      "RATE_LIMIT_EXCEEDED",
      "Too many requests. Please wait before requesting another reset link.",
      429
    );
  }

  try {
    const body: unknown = await request.json();
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { email } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, status: true },
    });

    if (!user || user.status === "INACTIVE" || user.status === "SUSPENDED") {
      return ApiResponseBuilder.success(null, GENERIC_MESSAGE);
    }

    await prisma.token.deleteMany({
      where: { userId: user.id, type: "PASSWORD_RESET" },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.token.create({
      data: { userId: user.id, token, type: "PASSWORD_RESET", expiresAt },
    });

    // TODO: Send reset email
    // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`
    // await sendPasswordResetEmail(user.email, user.name, resetUrl)
    console.info(`[ForgotPassword] Reset token for ${email}: ${token}`);

    return ApiResponseBuilder.success(null, GENERIC_MESSAGE);
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return ApiResponseBuilder.internalError();
  }
}
