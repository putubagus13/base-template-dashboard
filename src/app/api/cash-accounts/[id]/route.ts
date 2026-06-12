import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateCashAccountSchema = z.object({
  name: z.string().min(2, "Nama akun kas minimal 2 karakter").optional(),
  description: z.string().optional().nullable(),
  balance: z.number().min(0, "Saldo tidak boleh negatif").optional(),
  isActive: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "delete:cashAccount")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.cashAccount.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Cash account");

    await prisma.cashAccount.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: authUser.id,
      },
    });

    return ApiResponseBuilder.success(
      null,
      "Cash account deleted successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[DELETE /api/cash-accounts/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();

    if (!hasPermission(authUser, "update:cashAccount")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.cashAccount.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Cash account");

    const body: unknown = await request.json();
    const result = updateCashAccountSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { name, description, balance, isActive } = result.data;

    if (name) {
      const duplicate = await prisma.cashAccount.findFirst({
        where: {
          id: { not: id },
          organizationId: authUser.activeOrganization.id,
          deletedAt: null,
          name: { contains: name, mode: "insensitive" as const },
        },
      });
      if (duplicate) {
        return ApiResponseBuilder.conflict(
          "Cash account with the same name already exists."
        );
      }
    }

    const account = await prisma.cashAccount.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description ?? null }),
        ...(balance !== undefined && { balance }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: authUser.id,
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "update_cash_account",
      subject: "cashAccount",
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      account,
      "Cash account updated successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized();
    }
    console.error("[PATCH /api/cash-accounts/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}
