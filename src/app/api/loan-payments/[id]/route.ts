// src/app/api/loan-payments/[id]/route.ts
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { LoanStatus, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { updateLoanPaymentSchema } from "@/lib/validations/loan";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "update:loanPayment")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.loanPayment.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Pembayaran");

    if (existing.status !== LoanStatus.PENDING) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "Hanya pembayaran yang belum diverifikasi yang bisa diubah.",
        403
      );
    }

    const body: unknown = await request.json();
    const result = updateLoanPaymentSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { amount, paymentDate, notes } = result.data;

    // Validate amount if changed
    if (amount !== undefined) {
      const loan = await prisma.loan.findUnique({
        where: { id: existing.loanId },
      });
      if (loan) {
        const amountDecimal = new Prisma.Decimal(amount);
        const remaining = loan.remainingAmount as Prisma.Decimal;
        if (amountDecimal.greaterThan(remaining)) {
          return ApiResponseBuilder.error(
            "VALIDATION_ERROR",
            `Nominal pembayaran melebihi sisa pinjaman (${remaining.toString()}).`,
            400
          );
        }
      }
    }

    const payment = await prisma.loanPayment.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount }),
        ...(paymentDate !== undefined && {
          paymentDate: new Date(paymentDate),
        }),
        ...(notes !== undefined && { notes: notes ?? null }),
        updatedBy: authUser.id,
      },
      include: {
        recorder: { select: { id: true, name: true } },
        verifier: { select: { id: true, name: true } },
      },
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "update_loan_payment",
      subject: "loanPayment",
      subjectId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      payment,
      "Pembayaran berhasil diperbarui."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("PATCH /api/loan-payments/:id", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "delete:loanPayment")) {
      return ApiResponseBuilder.forbidden();
    }

    const existing = await prisma.loanPayment.findFirst({
      where: {
        id,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!existing) return ApiResponseBuilder.notFound("Pembayaran");

    if (existing.status !== LoanStatus.PENDING) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "Hanya pembayaran yang belum diverifikasi yang bisa dihapus.",
        403
      );
    }

    await prisma.loanPayment.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: authUser.id },
    });

    return ApiResponseBuilder.success(null, "Pembayaran berhasil dihapus.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("DELETE /api/loan-payments/:id", error);
    return ApiResponseBuilder.internalError();
  }
}
