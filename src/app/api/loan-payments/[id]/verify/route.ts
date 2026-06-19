// src/app/api/loan-payments/[id]/verify/route.ts
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import {
  LoanStatus,
  TransactionStatus,
  TransactionType,
  Prisma,
} from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

const verifyPaymentSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "verify:loanPayment")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.loanPayment.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
      include: {
        loan: {
          include: {
            borrower: { select: { id: true, name: true } },
            account: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Pembayaran");

    if (existing.status !== LoanStatus.PENDING) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "Pembayaran ini sudah diverifikasi.",
        403
      );
    }

    const body: unknown = await request.json();
    const result = verifyPaymentSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { action, notes } = result.data;
    const now = new Date();
    const amount = existing.amount as Prisma.Decimal;

    if (action === "approve") {
      // Calculate new loan totals
      const currentPaid = existing.loan.paidAmount as Prisma.Decimal;
      const currentRemaining = existing.loan.remainingAmount as Prisma.Decimal;
      const newPaidAmount = currentPaid.plus(amount);
      const newRemainingAmount = currentRemaining.minus(amount);
      const isPaidOff = newRemainingAmount.lessThanOrEqualTo(0);

      // Atomically: update payment + update loan + create transaction + update account + update borrower
      const [payment, cashTx] = await prisma.$transaction([
        // 1. Update payment status
        prisma.loanPayment.update({
          where: { id },
          data: {
            status: LoanStatus.APPROVED,
            verifiedBy: authUser.id,
            verifiedAt: now,
            updatedBy: authUser.id,
          },
          include: {
            recorder: { select: { id: true, name: true } },
            verifier: { select: { id: true, name: true } },
          },
        }),
        // 2. Create INCOME cash transaction (auto-APPROVED)
        prisma.cashTransaction.create({
          data: {
            organizationId: existing.organizationId,
            accountId: existing.loan.accountId,
            type: TransactionType.INCOME,
            amount,
            description: `Pembayaran Pinjaman ${existing.loan.loanNumber} - ${existing.loan.borrower.name}`,
            transactionDate: existing.paymentDate,
            recordedBy: authUser.id,
            isVerified: true,
            verificationStatus: TransactionStatus.APPROVED,
            verifiedBy: authUser.id,
            verifiedAt: now,
            createdBy: authUser.id,
          },
        }),
        // 3. Update loan paid/remaining amounts
        prisma.loan.update({
          where: { id: existing.loanId },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            ...(isPaidOff && { status: LoanStatus.PAID_OFF }),
            updatedBy: authUser.id,
          },
        }),
        // 4. Increment cash account balance
        prisma.cashAccount.update({
          where: { id: existing.loan.accountId },
          data: {
            balance: { increment: amount },
            updatedBy: authUser.id,
          },
        }),
        // 5. Increment borrower totalPaid
        prisma.borrower.update({
          where: { id: existing.loan.borrowerId },
          data: {
            totalPaid: { increment: amount },
            updatedBy: authUser.id,
          },
        }),
      ]);

      // Link cash transaction to payment
      await prisma.loanPayment.update({
        where: { id },
        data: { cashTransactionId: cashTx.id },
      });

      await writeAuditLog({
        userId: authUser.id,
        action: "approve_loan_payment",
        subject: "loanPayment",
        subjectId: id,
        oldValues: { status: LoanStatus.PENDING },
        newValues: { status: LoanStatus.APPROVED, notes },
        request,
      });

      return ApiResponseBuilder.success(
        payment,
        "Pembayaran berhasil disetujui."
      );
    } else {
      // Reject
      const payment = await prisma.loanPayment.update({
        where: { id },
        data: {
          status: LoanStatus.REJECTED,
          verifiedBy: authUser.id,
          verifiedAt: now,
          updatedBy: authUser.id,
        },
        include: {
          recorder: { select: { id: true, name: true } },
          verifier: { select: { id: true, name: true } },
        },
      });

      await writeAuditLog({
        userId: authUser.id,
        action: "reject_loan_payment",
        subject: "loanPayment",
        subjectId: id,
        oldValues: { status: LoanStatus.PENDING },
        newValues: { status: LoanStatus.REJECTED, notes },
        request,
      });

      return ApiResponseBuilder.success(payment, "Pembayaran ditolak.");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("POST /api/loan-payments/:id/verify", error);
    return ApiResponseBuilder.internalError();
  }
}
