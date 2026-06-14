// src/app/api/auth/register/route.ts
// ============================================================
// POST /api/auth/register  — Register via invitation token
// ============================================================

import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/helpers";
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { registerSchema } from "@/lib/validations/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { name, email, password, token: invitationToken } = result.data;

    // ─── Validate invitation token ────────────────────────────
    const inviteRecord = await prisma.token.findUnique({
      where: { token: invitationToken, type: "INVITATION" },
      select: {
        id: true,
        email: true,
        roleIds: true,
        organizationId: true,
        expiresAt: true,
        usedAt: true,
        userId: true,
      },
    });

    if (!inviteRecord) {
      return ApiResponseBuilder.error(
        "TOKEN_INVALID",
        "This invitation link is invalid.",
        400
      );
    }

    if (inviteRecord.usedAt) {
      return ApiResponseBuilder.error(
        "TOKEN_INVALID",
        "This invitation has already been used.",
        400
      );
    }

    if (inviteRecord.expiresAt < new Date()) {
      return ApiResponseBuilder.error(
        "TOKEN_EXPIRED",
        "This invitation link has expired. Please contact an administrator.",
        400
      );
    }

    // Ensure the email matches the invitation
    if (
      inviteRecord.email &&
      inviteRecord.email.toLowerCase() !== email.toLowerCase()
    ) {
      return ApiResponseBuilder.error(
        "VALIDATION_ERROR",
        "The email address does not match the invitation.",
        400
      );
    }

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.status === "ACTIVE") {
      return ApiResponseBuilder.conflict(
        "An account with this email address already exists."
      );
    }

    const hashedPassword = await hashPassword(password);

    // Create user with roles from invitation
    const roleIds = inviteRecord.roleIds ?? [];
    const orgId = inviteRecord.organizationId;

    if (!orgId) {
      return ApiResponseBuilder.error(
        "INVALID_ORGANIZATION",
        "The organization for this invitation does not exist.",
        400
      );
    }

    const user = await prisma.user.upsert({
      where: {
        email,
        id: inviteRecord.userId,
        organizations: { some: { organizationId: orgId } },
      },
      update: {
        name,
        email,
        password: hashedPassword,
      },
      create: {
        name,
        email,
        password: hashedPassword,
        status: "PENDING_VERIFICATION",
        roles: { create: roleIds.map((roleId) => ({ roleId })) },
        organizations: { create: { organizationId: orgId } },
      },
      select: { id: true, name: true, email: true, status: true },
    });

    // Mark invitation as used
    await prisma.token.update({
      where: { id: inviteRecord.id },
      data: { usedAt: new Date() },
    });

    // Create email verification token
    const verificationToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.token.create({
      data: {
        userId: user.id,
        token: verificationToken,
        type: "EMAIL_VERIFICATION",
        expiresAt,
      },
    });

    // Send verification email
    await sendVerificationEmail(user.email, user.name, verificationToken);

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
