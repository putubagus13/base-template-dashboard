import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateCashTransactionSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  type: z
    .enum([
      TransactionType.INCOME,
      TransactionType.EXPENSE,
      TransactionType.TRANSFER,
    ])
    .optional(),
  amount: z.number().positive().optional(),
  description: z.string().min(2).optional(),
  referenceNo: z.string().optional().nullable(),
  transactionDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "update:cashTransaction")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.cashTransaction.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Transaction");

    // Cannot edit approved/rejected transactions
    if (existing.verificationStatus !== TransactionStatus.PENDING) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "Cannot edit a transaction that has been approved or rejected.",
        403
      );
    }

    const body: unknown = await request.json();
    const result = updateCashTransactionSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const {
      accountId,
      categoryId,
      type,
      amount,
      description,
      referenceNo,
      transactionDate,
      notes,
    } = result.data;
    const orgId = authUser.activeOrganization.id;

    if (accountId) {
      const account = await prisma.cashAccount.findFirst({
        where: { id: accountId, organizationId: orgId, deletedAt: null },
      });
      if (!account) return ApiResponseBuilder.notFound("Cash account");
    }

    if (categoryId) {
      const category = await prisma.transactionCategory.findFirst({
        where: { id: categoryId, organizationId: orgId, deletedAt: null },
      });
      if (!category) return ApiResponseBuilder.notFound("Transaction category");
    }

    const transaction = await prisma.cashTransaction.update({
      where: { id },
      data: {
        ...(accountId !== undefined && { accountId }),
        ...(categoryId !== undefined && { categoryId: categoryId ?? null }),
        ...(type !== undefined && { type }),
        ...(amount !== undefined && { amount }),
        ...(description !== undefined && { description }),
        ...(referenceNo !== undefined && { referenceNo: referenceNo ?? null }),
        ...(transactionDate !== undefined && {
          transactionDate: new Date(transactionDate),
        }),
        ...(notes !== undefined && { notes: notes ?? null }),
        updatedBy: authUser.id,
      },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true } },
        recorder: { select: { id: true, name: true } },
        verifier: { select: { id: true, name: true } },
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "update_cash_transaction",
      subject: "cashTransaction",
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      transaction,
      "Transaction updated successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[PATCH /api/cash-transactions/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "delete:cashTransaction")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.cashTransaction.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Transaction");

    // Cannot delete approved transactions
    if (existing.verificationStatus === TransactionStatus.APPROVED) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "Cannot delete an approved transaction.",
        403
      );
    }

    await prisma.cashTransaction.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: authUser.id },
    });

    return ApiResponseBuilder.success(
      null,
      "Transaction deleted successfully."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[DELETE /api/cash-transactions/:id]", error);
    return ApiResponseBuilder.internalError();
  }
}
