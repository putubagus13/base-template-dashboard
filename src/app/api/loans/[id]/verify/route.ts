// src/app/api/loans/[id]/verify/route.ts
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

const verifyLoanSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "verify:loan")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.loan.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
      include: {
        borrower: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Pinjaman");

    if (existing.status !== LoanStatus.PENDING) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "Pinjaman ini sudah diverifikasi.",
        403
      );
    }

    const body: unknown = await request.json();
    const result = verifyLoanSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { action, notes } = result.data;
    const now = new Date();

    if (action === "approve") {
      const principal = existing.principal as Prisma.Decimal;

      // Atomically: update loan status + create cash transaction + decrement account balance + increment borrower totalBorrowed
      const [loan, cashTx] = await prisma.$transaction([
        prisma.loan.update({
          where: { id },
          data: {
            status: LoanStatus.APPROVED,
            verifiedBy: authUser.id,
            verifiedAt: now,
            updatedBy: authUser.id,
          },
          include: {
            borrower: { select: { id: true, name: true } },
            account: { select: { id: true, name: true } },
            recorder: { select: { id: true, name: true } },
            verifier: { select: { id: true, name: true } },
          },
        }),
        // Create EXPENSE cash transaction (auto-APPROVED)
        prisma.cashTransaction.create({
          data: {
            organizationId: existing.organizationId,
            accountId: existing.accountId,
            type: TransactionType.EXPENSE,
            amount: principal,
            description: `Pencairan Pinjaman ${existing.loanNumber} - ${existing.borrower.name}`,
            transactionDate: existing.loanDate,
            recordedBy: authUser.id,
            isVerified: true,
            verificationStatus: TransactionStatus.APPROVED,
            verifiedBy: authUser.id,
            verifiedAt: now,
            createdBy: authUser.id,
          },
        }),
        // Decrement cash account balance
        prisma.cashAccount.update({
          where: { id: existing.accountId },
          data: {
            balance: { decrement: principal },
            updatedBy: authUser.id,
          },
        }),
        // Increment borrower totalBorrowed
        prisma.borrower.update({
          where: { id: existing.borrowerId },
          data: {
            totalBorrowed: { increment: principal },
            updatedBy: authUser.id,
          },
        }),
      ]);

      // Link the cash transaction to the loan
      await prisma.loan.update({
        where: { id },
        data: { cashTransactionId: cashTx.id },
      });

      await writeAuditLog({
        userId: authUser.id,
        action: "approve_loan",
        subject: "loan",
        subjectId: id,
        oldValues: { status: LoanStatus.PENDING },
        newValues: { status: LoanStatus.APPROVED, notes },
        request,
      });

      return ApiResponseBuilder.success(loan, "Pinjaman berhasil disetujui.");
    } else {
      // Reject
      const [loan] = await prisma.$transaction([
        prisma.loan.update({
          where: { id },
          data: {
            status: LoanStatus.REJECTED,
            verifiedBy: authUser.id,
            verifiedAt: now,
            updatedBy: authUser.id,
          },
          include: {
            borrower: { select: { id: true, name: true } },
            account: { select: { id: true, name: true } },
            recorder: { select: { id: true, name: true } },
            verifier: { select: { id: true, name: true } },
          },
        }),
      ]);

      await writeAuditLog({
        userId: authUser.id,
        action: "reject_loan",
        subject: "loan",
        subjectId: id,
        oldValues: { status: LoanStatus.PENDING },
        newValues: { status: LoanStatus.REJECTED, notes },
        request,
      });

      return ApiResponseBuilder.success(loan, "Pinjaman ditolak.");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("POST /api/loans/:id/verify", error);
    return ApiResponseBuilder.internalError();
  }
}
