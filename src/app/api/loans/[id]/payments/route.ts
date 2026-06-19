// src/app/api/loans/[id]/payments/route.ts
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import { NextRequest } from "next/server";
import { LoanStatus, Prisma } from "@prisma/client";
import { createLoanPaymentSchema } from "@/lib/validations/loan";

const includeRelations = {
  recorder: { select: { id: true, name: true } },
  verifier: { select: { id: true, name: true } },
};

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id: loanId } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:loanPayment")) {
      return ApiResponseBuilder.forbidden();
    }

    // Verify loan belongs to org
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!loan) return ApiResponseBuilder.notFound("Pinjaman");

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit") ?? "10"))
    );
    const skip = (page - 1) * limit;

    const where = {
      loanId,
      organizationId: authUser.activeOrganization.id,
      deletedAt: null,
      ...(status && { status: status as LoanStatus }),
    };

    const [payments, total] = await prisma.$transaction([
      prisma.loanPayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: "desc" },
        include: includeRelations,
      }),
      prisma.loanPayment.count({ where }),
    ]);

    return ApiResponseBuilder.success(
      { data: payments, total },
      "Loan payments fetched successfully.",
      200,
      { page, limit, total }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("GET /api/loans/:id/payments", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id: loanId } = await context.params;
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "create:loanPayment")) {
      return ApiResponseBuilder.forbidden();
    }

    // Verify loan exists and is APPROVED
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        organizationId: authUser.activeOrganization.id,
        deletedAt: null,
      },
    });
    if (!loan) return ApiResponseBuilder.notFound("Pinjaman");
    if (loan.status !== LoanStatus.APPROVED) {
      return ApiResponseBuilder.error(
        "FORBIDDEN",
        "Pembayaran hanya bisa dibuat untuk pinjaman yang sudah disetujui.",
        403
      );
    }

    const body: unknown = await request.json();
    const result = createLoanPaymentSchema.safeParse(body);
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error));
    }

    const { amount, paymentDate, notes } = result.data;

    // Validate amount does not exceed remaining
    const amountDecimal = new Prisma.Decimal(amount);
    const remaining = loan.remainingAmount as Prisma.Decimal;
    if (amountDecimal.greaterThan(remaining)) {
      return ApiResponseBuilder.error(
        "VALIDATION_ERROR",
        `Nominal pembayaran melebihi sisa pinjaman (${remaining.toString()}).`,
        400
      );
    }

    const payment = await prisma.loanPayment.create({
      data: {
        organizationId: authUser.activeOrganization.id,
        loanId,
        amount: amountDecimal,
        paymentDate: new Date(paymentDate),
        notes: notes ?? null,
        status: LoanStatus.PENDING,
        recordedBy: authUser.id,
        createdBy: authUser.id,
      },
      include: includeRelations,
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "create_loan_payment",
      subject: "loanPayment",
      subjectId: payment.id,
      newValues: { ...result.data, loanId },
      request,
    });

    return ApiResponseBuilder.success(
      payment,
      "Pembayaran berhasil diajukan. Menunggu verifikasi.",
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("POST /api/loans/:id/payments", error);
    return ApiResponseBuilder.internalError();
  }
}
