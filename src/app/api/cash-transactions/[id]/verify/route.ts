import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import {
  TransactionStatus,
  TransactionType,
  Prisma,
  DonorVerificationStatus,
} from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

const verifyTransactionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "verify:cashTransaction")) {
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

    // Cannot re-verify approved transactions
    if (existing.verificationStatus === TransactionStatus.APPROVED) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "Cannot re-verify an already approved transaction.",
        403
      );
    }

    const body: unknown = await request.json();
    const result = verifyTransactionSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { action, notes } = result.data;
    const now = new Date();

    if (action === "approve") {
      // Calculate balance change
      const amount = existing.amount as Prisma.Decimal;
      const balanceChange =
        existing.type === TransactionType.INCOME
          ? amount
          : existing.type === TransactionType.EXPENSE
          ? amount.negated()
          : new Prisma.Decimal(0); // TRANSFER doesn't change overall balance

      // Use $transaction to atomically update transaction + balance
      const ops = [
        prisma.cashTransaction.update({
          where: { id },
          data: {
            isVerified: true,
            verificationStatus: TransactionStatus.APPROVED,
            verifiedBy: authUser.id,
            verifiedAt: now,
            ...(notes !== undefined && { notes: notes ?? null }),
            updatedBy: authUser.id,
          },
          include: {
            account: { select: { id: true, name: true } },
            category: { select: { id: true, name: true, color: true } },
            recorder: { select: { id: true, name: true } },
            verifier: { select: { id: true, name: true } },
            donor: { select: { id: true, name: true } },
          },
        }),
        // Update cash account balance
        prisma.cashAccount.update({
          where: { id: existing.accountId },
          data: {
            balance: { increment: balanceChange },
            updatedBy: authUser.id,
          },
        }),
      ];

      // If INCOME with donorId, increment donor's totalDonated
      if (existing.type === TransactionType.INCOME && existing.donorId) {
        ops.push(
          prisma.donor.update({
            where: { id: existing.donorId },
            data: {
              totalDonated: { increment: amount },
              verificationStatus: DonorVerificationStatus.APPROVED,
              updatedBy: authUser.id,
            },
          }) as never
        );
      }

      const [transaction] = await prisma.$transaction(ops);

      await writeAuditLog({
        userId: authUser.id,
        action: "approve_cash_transaction",
        subject: "cashTransaction",
        subjectId: id,
        oldValues: { verificationStatus: existing.verificationStatus },
        newValues: { verificationStatus: TransactionStatus.APPROVED, notes },
        request,
      });

      return ApiResponseBuilder.success(
        transaction,
        "Transaction approved successfully."
      );
    } else {
      // Reject
      const ops = [
        prisma.cashTransaction.update({
          where: { id },
          data: {
            isVerified: false,
            verificationStatus: TransactionStatus.REJECTED,
            verifiedBy: authUser.id,
            verifiedAt: now,
            ...(notes !== undefined && { notes: notes ?? null }),
            updatedBy: authUser.id,
          },
          include: {
            account: { select: { id: true, name: true } },
            category: { select: { id: true, name: true, color: true } },
            recorder: { select: { id: true, name: true } },
            verifier: { select: { id: true, name: true } },
            donor: { select: { id: true, name: true } },
          },
        }),
      ];
      // If INCOME with donorId, increment donor's totalDonated
      if (existing.type === TransactionType.INCOME && existing.donorId) {
        ops.push(
          prisma.donor.update({
            where: { id: existing.donorId },
            data: {
              verificationStatus: DonorVerificationStatus.REJECTED,
              updatedBy: authUser.id,
            },
          }) as never
        );
      }

      const [transaction] = await prisma.$transaction(ops);

      await writeAuditLog({
        userId: authUser.id,
        action: "reject_cash_transaction",
        subject: "cashTransaction",
        subjectId: id,
        oldValues: { verificationStatus: existing.verificationStatus },
        newValues: { verificationStatus: TransactionStatus.REJECTED, notes },
        request,
      });

      return ApiResponseBuilder.success(transaction, "Transaction rejected.");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("[POST /api/cash-transactions/:id/verify]", error);
    return ApiResponseBuilder.internalError();
  }
}
