import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { generateMetadataPagination } from "@/utils";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import z from "zod";
import { TransactionStatus, TransactionType } from "@prisma/client";

export type CashTransactionSummary = {
  totalIncome: number;
  totalExpense: number;
  pendingCount: number;
  total: number;
};

const createCashTransactionSchema = z.object({
  accountId: z.string().uuid("Akun kas tidak valid"),
  categoryId: z.string().uuid().optional().nullable(),
  type: z.enum([
    TransactionType.INCOME,
    TransactionType.EXPENSE,
    TransactionType.TRANSFER,
  ]),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  description: z.string().min(2, "Deskripsi minimal 2 karakter"),
  referenceNo: z.string().optional().nullable(),
  donorId: z.string().uuid().optional().nullable(),
  transactionDate: z.string(),
  notes: z.string().optional().nullable(),
});

const includeRelations = {
  account: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, color: true } },
  recorder: { select: { id: true, name: true } },
  verifier: { select: { id: true, name: true } },
  donor: { select: { id: true, name: true } },
};

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:cashTransaction")) {
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
    const type = searchParams.get("type") ?? undefined;
    const accountId = searchParams.get("accountId") ?? undefined;
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const verificationStatus =
      searchParams.get("verificationStatus") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;

    const where = {
      organizationId: orgId,
      deletedAt: null,
      ...(search && {
        OR: [
          { description: { contains: search, mode: "insensitive" as const } },
          { referenceNo: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(type && { type: type as TransactionType }),
      ...(accountId && { accountId }),
      ...(categoryId && { categoryId }),
      ...(verificationStatus && {
        verificationStatus: verificationStatus as TransactionStatus,
      }),
      ...((dateFrom || dateTo) && {
        transactionDate: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
    };

    const [transactions, incomeResult, expenseResult, pendingCount, total] =
      await prisma.$transaction([
        prisma.cashTransaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { transactionDate: "desc" },
          include: includeRelations,
        }),
        prisma.cashTransaction.aggregate({
          where: {
            ...where,
            verificationStatus: TransactionStatus.APPROVED,
            type: TransactionType.INCOME,
          },
          _sum: { amount: true },
        }),
        prisma.cashTransaction.aggregate({
          where: {
            ...where,
            verificationStatus: TransactionStatus.APPROVED,
            type: TransactionType.EXPENSE,
          },
          _sum: { amount: true },
        }),
        prisma.cashTransaction.count({
          where: { ...where, verificationStatus: TransactionStatus.PENDING },
        }),
        prisma.cashTransaction.count({ where }),
      ]);

    const summary: CashTransactionSummary = {
      totalIncome: Number(incomeResult._sum.amount ?? 0),
      totalExpense: Number(expenseResult._sum.amount ?? 0),
      pendingCount,
      total,
    };

    const metadata = generateMetadataPagination(page, limit, total);
    return ApiResponseBuilder.success(
      { summary, data: transactions },
      "Transactions fetched successfully.",
      200,
      metadata
    );
  } catch (error) {
    console.error("GET /api/cash-transactions", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "create:cashTransaction")) {
      return ApiResponseBuilder.forbidden();
    }

    const body: unknown = await request.json();
    const result = createCashTransactionSchema.safeParse(body);
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
      donorId,
      transactionDate,
      notes,
    } = result.data;
    const orgId = authUser.activeOrganization.id;

    // Validate account belongs to org
    const account = await prisma.cashAccount.findFirst({
      where: { id: accountId, organizationId: orgId, deletedAt: null },
    });
    if (!account) return ApiResponseBuilder.notFound("Cash account");

    // Validate category belongs to org if provided
    if (categoryId) {
      const category = await prisma.transactionCategory.findFirst({
        where: { id: categoryId, organizationId: orgId, deletedAt: null },
      });
      if (!category) return ApiResponseBuilder.notFound("Transaction category");
    }

    // Validate donor belongs to org if provided
    if (donorId) {
      const donor = await prisma.donor.findFirst({
        where: { id: donorId, organizationId: orgId, deletedAt: null },
      });
      if (!donor) return ApiResponseBuilder.notFound("Donor");
    }

    const transaction = await prisma.cashTransaction.create({
      data: {
        organizationId: orgId,
        accountId,
        categoryId: categoryId ?? null,
        type,
        amount,
        description,
        referenceNo: referenceNo ?? null,
        donorId: donorId ?? null,
        transactionDate: new Date(transactionDate),
        recordedBy: authUser.id,
        notes: notes ?? null,
        // Always created as PENDING
        verificationStatus: TransactionStatus.PENDING,
        isVerified: false,
        createdBy: authUser.id,
      },
      include: includeRelations,
    });

    await writeAuditLog({
      userId: authUser.id,
      action: "create_cash_transaction",
      subject: "cashTransaction",
      newValues: result.data,
      request,
    });

    return ApiResponseBuilder.success(
      transaction,
      "Transaction created successfully.",
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED")
      return ApiResponseBuilder.unauthorized();
    console.error("POST /api/cash-transactions", error);
    return ApiResponseBuilder.internalError();
  }
}
