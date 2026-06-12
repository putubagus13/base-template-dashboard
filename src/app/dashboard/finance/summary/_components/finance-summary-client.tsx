// src/app/dashboard/finance/summary/_components/finance-summary-client.tsx
"use client";

import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Landmark,
  ArrowLeftRight,
  Trophy,
  Heart,
} from "lucide-react";
import { MonthPicker } from "@/components/shared/month-picker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatCard,
  Skeleton,
} from "@/components/ui";
import { Badge } from "@/components/ui";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { formatDate } from "@/utils";

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

const typeColors: Record<string, string> = {
  INCOME: "text-emerald-600",
  EXPENSE: "text-red-600",
  TRANSFER: "text-blue-600",
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

export function FinanceSummaryClient() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useFinanceSummary(year, month);
  const summary = data?.data;

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  return (
    <div className="space-y-6">
      {/* Month Filter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Periode:</p>
        <MonthPicker year={year} month={month} onChange={handleMonthChange} />
      </div>

      {/* Section 1: Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Kas"
          value={
            isLoading ? "..." : formatCurrency(summary?.overview.totalCash ?? 0)
          }
          icon={Wallet}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          label="Pemasukan Bulan Ini"
          value={
            isLoading
              ? "..."
              : formatCurrency(summary?.overview.monthlyIncome ?? 0)
          }
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Pengeluaran Bulan Ini"
          value={
            isLoading
              ? "..."
              : formatCurrency(summary?.overview.monthlyExpense ?? 0)
          }
          icon={TrendingDown}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
      </div>

      {/* Section 2: Cash Account Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Landmark className="h-5 w-5 text-brand-600" />
          Saldo Akun Kas
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : !summary?.accounts.length ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-slate-500">
              Belum ada akun kas.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.accounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                        <Landmark className="h-4 w-4 text-brand-600" />
                      </div>
                      <p className="font-medium text-slate-900 text-sm">
                        {account.name}
                      </p>
                    </div>
                    <Badge
                      variant={account.isActive ? "success" : "secondary"}
                      className="text-[10px]"
                    >
                      {account.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(account.balance)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Recent Transactions + Top Donors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowLeftRight className="h-5 w-5 text-brand-600" />
                Transaksi Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !summary?.recentTransactions.length ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Belum ada transaksi.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {summary.recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            tx.type === "INCOME"
                              ? "bg-emerald-50"
                              : tx.type === "EXPENSE"
                              ? "bg-red-50"
                              : "bg-blue-50"
                          }`}
                        >
                          <TrendingUp
                            className={`h-4 w-4 ${
                              tx.type === "INCOME"
                                ? "text-emerald-600"
                                : tx.type === "EXPENSE"
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {tx.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            {tx.account.name} · {formatDate(tx.transactionDate)}
                            {tx.donor && ` · ${tx.donor.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            statusColors[tx.verificationStatus] ?? ""
                          }`}
                        >
                          {statusLabels[tx.verificationStatus] ??
                            tx.verificationStatus}
                        </span>
                        <span
                          className={`text-sm font-semibold font-mono ${
                            typeColors[tx.type] ?? ""
                          }`}
                        >
                          {tx.type === "EXPENSE" ? "-" : "+"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Donors */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-5 w-5 text-amber-500" />
                Top Donatur
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : !summary?.topDonors.length ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  <Heart className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  Belum ada donatur.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.topDonors.map((donor, index) => {
                    const rankColors = [
                      "bg-amber-100 text-amber-700",
                      "bg-slate-100 text-slate-700",
                      "bg-orange-100 text-orange-700",
                    ];
                    const rankColor =
                      rankColors[index] ?? "bg-slate-100 text-slate-600";

                    return (
                      <div
                        key={donor.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${rankColor}`}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {donor.name}
                          </p>
                          {donor.isMember && (
                            <p className="text-[10px] text-brand-600">
                              Anggota
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-slate-900 font-mono shrink-0">
                          {formatCurrency(donor.totalDonated)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
