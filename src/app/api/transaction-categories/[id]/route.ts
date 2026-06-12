import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateTransactionCategorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter").optional(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "update:transactionCategory")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.transactionCategory.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Category");

    const body: unknown = await request.json();
    const result = updateTransactionCategorySchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { name, description, color, isActive } = result.data;

    if (name) {
      const duplicate = await prisma.transactionCategory.findFirst({
        where: {
          id: { not: id },
          organizationId: authUser.activeOrganization.id,
          deletedAt: null,
          name: { contains: name, mode: "insensitive" as const },
        },
      });
      if (duplicate)
        return ApiResponseBuilder.conflict(
          "Category with the same name already exists."
        );
    }

    const category = await prisma.transactionCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description ?? null }),
        ...(color !== undefined && { color: color ?? null }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: authUser.id,
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "update_transaction_category",
      subject: "transactionCategory",
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      category,
      "Category updated successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[PATCH /api/transaction-categories/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "delete:transactionCategory")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.transactionCategory.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Category");

    await prisma.transactionCategory.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: authUser.id },
    });

    return ApiResponseBuilder.success(null, "Category deleted successfully.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[DELETE /api/transaction-categories/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}
