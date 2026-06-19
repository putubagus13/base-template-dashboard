// src/app/api/loans/[id]/route.ts
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { LoanStatus, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { updateLoanSchema } from "@/lib/validations/loan";

const includeRelations = {
  borrower: {
    select: {
      id: true,
      name: true,
      phone: true,
      isMember: true,
      memberId: true,
    },
  },
  account: { select: { id: true, name: true } },
  recorder: { select: { id: true, name: true } },
  verifier: { select: { id: true, name: true } },
  _count: { select: { payments: true } },
};

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:loan")) {
      return ApiResponseBuilder.forbidden();
    }

    const loan = await prisma.loan.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
      include: {
        ...includeRelations,
        payments: {
          orderBy: { paymentDate: "desc" },
          include: {
            recorder: { select: { id: true, name: true } },
            verifier: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!loan) return ApiResponseBuilder.notFound("Pinjaman");

    return ApiResponseBuilder.success(loan, "Loan fetched successfully.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("GET /api/loans/:id", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "update:loan")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.loan.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Pinjaman");

    // Only PENDING loans can be edited
    if (existing.status !== LoanStatus.PENDING) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "Hanya pinjaman yang belum diverifikasi yang bisa diubah.",
        403
      );
    }

    const body: unknown = await request.json();
    const result = updateLoanSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const {
      borrowerId,
      accountId,
      principal,
      interestRate,
      durationMonths,
      loanDate,
      purpose,
      notes,
    } = result.data;
    const orgId = authUser.activeOrganization.id;

    if (borrowerId) {
      const borrower = await prisma.borrower.findFirst({
        where: { id: borrowerId, organizationId: orgId, deletedAt: null },
      });
      if (!borrower) return ApiResponseBuilder.notFound("Peminjam");
    }

    if (accountId) {
      const account = await prisma.cashAccount.findFirst({
        where: { id: accountId, organizationId: orgId, deletedAt: null },
      });
      if (!account) return ApiResponseBuilder.notFound("Akun kas");
    }

    // Recalculate totals if any loan terms changed
    const newPrincipal =
      principal !== undefined
        ? new Prisma.Decimal(principal)
        : existing.principal;
    const newRate =
      interestRate !== undefined
        ? new Prisma.Decimal(interestRate)
        : existing.interestRate;
    const newDuration = durationMonths ?? existing.durationMonths;
    const newTotalInterest = newPrincipal.times(newRate).times(newDuration);
    const newTotalOwed = newPrincipal.plus(newTotalInterest);
    const newRemainingAmount = newTotalOwed.minus(existing.paidAmount);

    let newLoanDate = existing.loanDate;
    let newDueDate = existing.dueDate;
    if (loanDate) {
      newLoanDate = new Date(loanDate);
      newDueDate = new Date(newLoanDate);
      newDueDate.setMonth(newDueDate.getMonth() + newDuration);
    } else if (durationMonths !== undefined) {
      newDueDate = new Date(existing.loanDate);
      newDueDate.setMonth(newDueDate.getMonth() + newDuration);
    }

    const loan = await prisma.loan.update({
      where: { id },
      data: {
        ...(borrowerId !== undefined && { borrowerId }),
        ...(accountId !== undefined && { accountId }),
        principal: newPrincipal,
        interestRate: newRate,
        durationMonths: newDuration,
        totalInterest: newTotalInterest,
        totalOwed: newTotalOwed,
        remainingAmount: newRemainingAmount,
        loanDate: newLoanDate,
        dueDate: newDueDate,
        ...(purpose !== undefined && { purpose: purpose ?? null }),
        ...(notes !== undefined && { notes: notes ?? null }),
        updatedBy: authUser.id,
      },
      include: includeRelations,
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "update_loan",
      subject: "loan",
      subjectId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(loan, "Pinjaman berhasil diperbarui.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("PATCH /api/loans/:id", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "delete:loan")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.loan.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Pinjaman");

    // Only PENDING loans can be deleted
    if (existing.status !== LoanStatus.PENDING) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "Hanya pinjaman yang belum diverifikasi yang bisa dihapus.",
        403
      );
    }

    await prisma.loan.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: authUser.id },
    });

    return ApiResponseBuilder.success(null, "Pinjaman berhasil dihapus.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("DELETE /api/loans/:id", error);
    return ApiResponseBuilder.internalError();
  }
}
