// src/app/api/loans/route.ts
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import { generateMetadataPagination } from "@/utils";
import { NextRequest } from "next/server";
import { LoanStatus, Prisma } from "@prisma/client";
import { createLoanSchema } from "@/lib/validations/loan";

export type LoanListSummary = {
  totalActive: number;
  totalOutstanding: number;
  totalDisbursedThisMonth: number;
  pendingCount: number;
};

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

function generateLoanNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LN-${y}${m}${d}-${rand}`;
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:loan")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id: orgId } = authUser.activeOrganization;
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? "10"))
    );
    const search = searchParams.get("search") ?? "";
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") ?? undefined;
    const borrowerId = searchParams.get("borrowerId") ?? undefined;
    const accountId = searchParams.get("accountId") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;

    const where = {
      organizationId: orgId,
      deletedAt: null,
      ...(search && {
        OR: [
          { loanNumber: { contains: search, mode: "insensitive" as const } },
          { purpose: { contains: search, mode: "insensitive" as const } },
          {
            borrower: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      }),
      ...(status && { status: status as LoanStatus }),
      ...(borrowerId && { borrowerId }),
      ...(accountId && { accountId }),
      ...((dateFrom || dateTo) && {
        loanDate: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
    };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const [
      loans,
      activeResult,
      outstandingResult,
      monthResult,
      pendingCount,
      total,
    ] = await prisma.$transaction([
      prisma.loan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: includeRelations,
      }),
      prisma.loan.count({
        where: { ...where, status: LoanStatus.APPROVED },
      }),
      prisma.loan.aggregate({
        where: { ...where, status: LoanStatus.APPROVED },
        _sum: { remainingAmount: true },
      }),
      prisma.loan.aggregate({
        where: {
          organizationId: orgId,
          deletedAt: null,
          status: LoanStatus.APPROVED,
          loanDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { principal: true },
      }),
      prisma.loan.count({
        where: { ...where, status: LoanStatus.PENDING },
      }),
      prisma.loan.count({ where }),
    ]);

    const summary: LoanListSummary = {
      totalActive: activeResult,
      totalOutstanding: Number(outstandingResult._sum.remainingAmount ?? 0),
      totalDisbursedThisMonth: Number(monthResult._sum.principal ?? 0),
      pendingCount,
    };

    const metadata = generateMetadataPagination(page, limit, total);
    return ApiResponseBuilder.success(
      { summary, data: loans },
      "Loans fetched successfully.",
      200,
      metadata
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("GET /api/loans", error);
    return ApiResponseBuilder.internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "create:loan")) {
      return ApiResponseBuilder.forbidden();
    }

    const body: unknown = await request.json();
    const result = createLoanSchema.safeParse(body);
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

    // Validate borrower
    const borrower = await prisma.borrower.findFirst({
      where: { id: borrowerId, organizationId: orgId, deletedAt: null },
    });
    if (!borrower) return ApiResponseBuilder.notFound("Peminjam");

    // Validate account
    const account = await prisma.cashAccount.findFirst({
      where: { id: accountId, organizationId: orgId, deletedAt: null },
    });
    if (!account) return ApiResponseBuilder.notFound("Akun kas");

    // Compute interest (declining balance: totalInterest = principal * rate * durationMonths)
    const principalDecimal = new Prisma.Decimal(principal);
    const rateDecimal = new Prisma.Decimal(interestRate);
    const totalInterest = principalDecimal
      .times(rateDecimal)
      .times(durationMonths);
    const totalOwed = principalDecimal.plus(totalInterest);
    const remainingAmount = totalOwed;

    // Calculate due date
    const loanDateObj = new Date(loanDate);
    const dueDate = new Date(loanDateObj);
    dueDate.setMonth(dueDate.getMonth() + durationMonths);

    const loan = await prisma.loan.create({
      data: {
        organizationId: orgId,
        borrowerId,
        accountId,
        loanNumber: generateLoanNumber(),
        principal: principalDecimal,
        interestRate: rateDecimal,
        durationMonths,
        totalInterest,
        totalOwed,
        paidAmount: new Prisma.Decimal(0),
        remainingAmount,
        loanDate: loanDateObj,
        dueDate,
        status: LoanStatus.PENDING,
        purpose: purpose ?? null,
        notes: notes ?? null,
        recordedBy: authUser.id,
        createdBy: authUser.id,
      },
      include: includeRelations,
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "create_loan",
      subject: "loan",
      subjectId: loan.id,
      newValues: {
        ...result.data,
        loanNumber: loan.loanNumber,
        totalInterest: totalInterest.toString(),
        totalOwed: totalOwed.toString(),
      },
      request,
    });

    return ApiResponseBuilder.success(
      loan,
      "Pinjaman berhasil diajukan. Menunggu verifikasi.",
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("POST /api/loans", error);
    return ApiResponseBuilder.internalError();
  }
}
