import { ApiResponseBuilder } from "@/lib/api-response";
import { requireAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { NextRequest } from "next/server";

export type FinanceSummaryData = {
  overview: {
    totalCash: number;
    monthlyIncome: number;
    monthlyExpense: number;
  };
  accounts: {
    id: string;
    name: string;
    balance: number;
    isActive: boolean;
  }[];
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    description: string;
    transactionDate: string;
    verificationStatus: string;
    account: { name: string };
    donor: { name: string } | null;
  }[];
  topDonors: {
    id: string;
    name: string;
    totalDonated: number;
    isMember: boolean;
  }[];
};

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    if (!hasPermission(authUser, "read:cashTransaction")) {
      return ApiResponseBuilder.forbidden();
    }
    const { id: orgId } = authUser.activeOrganization;

    const { searchParams } = request.nextUrl;
    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);

    const { start, end } = getMonthRange(year, month);

    const monthWhere = {
      organizationId: orgId,
      deletedAt: null,
      transactionDate: { gte: start, lte: end },
      verificationStatus: TransactionStatus.APPROVED,
    };

    const [
      accounts,
      incomeResult,
      expenseResult,
      recentTransactions,
      topDonors,
    ] = await prisma.$transaction([
      // All active cash accounts
      prisma.cashAccount.findMany({
        where: { organizationId: orgId, deletedAt: null, isActive: true },
        select: { id: true, name: true, balance: true, isActive: true },
        orderBy: { name: "asc" },
      }),
      // Monthly income
      prisma.cashTransaction.aggregate({
        where: { ...monthWhere, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      // Monthly expense
      prisma.cashTransaction.aggregate({
        where: { ...monthWhere, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      // Recent transactions (last 10)
      prisma.cashTransaction.findMany({
        where: { organizationId: orgId, deletedAt: null },
        orderBy: { transactionDate: "desc" },
        take: 10,
        include: {
          account: { select: { name: true } },
          donor: { select: { name: true } },
        },
      }),
      // Top 5 donors
      prisma.donor.findMany({
        where: {
          organizationId: orgId,
          deletedAt: null,
          totalDonated: { gt: 0 },
        },
        orderBy: { totalDonated: "desc" },
        take: 5,
        select: { id: true, name: true, totalDonated: true, isMember: true },
      }),
    ]);

    const totalCash = accounts.reduce(
      (sum, acc) => sum + Number(acc.balance),
      0
    );

    const summary: FinanceSummaryData = {
      overview: {
        totalCash,
        monthlyIncome: Number(incomeResult._sum.amount ?? 0),
        monthlyExpense: Number(expenseResult._sum.amount ?? 0),
      },
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        balance: Number(a.balance),
        isActive: a.isActive,
      })),
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        description: tx.description,
        transactionDate: tx.transactionDate.toISOString(),
        verificationStatus: tx.verificationStatus,
        account: { name: tx.account.name },
        donor: tx.donor ? { name: tx.donor.name } : null,
      })),
      topDonors: topDonors.map((d) => ({
        id: d.id,
        name: d.name,
        totalDonated: Number(d.totalDonated),
        isMember: d.isMember,
      })),
    };

    return ApiResponseBuilder.success(
      summary,
      "Finance summary fetched successfully."
    );
  } catch (error) {
    console.error("GET /api/finance/summary", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
