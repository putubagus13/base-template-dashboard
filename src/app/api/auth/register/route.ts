// src/app/api/auth/register/route.ts
// ============================================================
// POST /api/auth/register
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/helpers";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { name, email, password } = result.data;

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return ApiResponseBuilder.conflict(
        "An account with this email address already exists."
      );
    }

    const hashedPassword = await hashPassword(password);

    // Get default USER role
    const userRole = await prisma.role.findUnique({ where: { name: "USER" } });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        status: "PENDING_VERIFICATION",
        ...(userRole
          ? { roles: { create: { roleId: userRole.id } } }
          : {}),
      },
      select: { id: true, name: true, email: true, status: true },
    });

    // TODO: Send verification email here
    // await sendVerificationEmail(user.email, verificationToken)

    return ApiResponseBuilder.success(
      { id: user.id, name: user.name, email: user.email },
      "Registration successful. Please check your email to verify your account.",
      201
    );
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return ApiResponseBuilder.internalError();
  }
}
