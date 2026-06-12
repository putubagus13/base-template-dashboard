// src/app/dashboard/finance/transactions/_components/transactions-table.tsx
"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { MonthPicker } from "@/components/shared/month-picker";
import { usePermissions } from "@/hooks/use-permission";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  TableEmpty,
} from "@/components/ui/table";
import { PaginationMeta } from "@/types";
import {
  useCashTransactions,
  useDeleteCashTransaction,
} from "@/hooks/use-cash-transactions";
import { CashTransactionWithRelations } from "@/hooks/use-cash-transactions";
import { useCashAccounts } from "@/hooks/use-cash-accounts";
import { useTransactionCategories } from "@/hooks/use-transaction-categories";
import { formatDate } from "@/utils";
import { Select, StatCard } from "@/components/ui";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { TransactionFormDialog } from "./transactions-form-dialog";
import { TransactionVerifyDialog } from "./transaction-verify-dialog";

const statusColors: Record<TransactionStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const typeColors: Record<TransactionType, string> = {
  INCOME: "text-emerald-600",
  EXPENSE: "text-red-600",
  TRANSFER: "text-blue-600",
};

const typeLabels: Record<TransactionType, string> = {
  INCOME: "Pemasukan",
  EXPENSE: "Pengeluaran",
  TRANSFER: "Transfer",
};

const statusLabels: Record<TransactionStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export function TransactionsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { can } = usePermissions();
  const deleteTransaction = useDeleteCashTransaction();

  const [formOpen, setFormOpen] = useState(false);
  const [editTx, setEditTx] = useState<
    CashTransactionWithRelations | undefined
  >(undefined);
  const [verifyTarget, setVerifyTarget] =
    useState<CashTransactionWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    description: string;
  } | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterAccount, setFilterAccount] = useState<string>("");
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);

  // Compute date range from month
  const dateFrom =
    new Date(filterYear, filterMonth - 1, 1).toISOString().split("T")[0] ?? "";
  const dateTo =
    new Date(filterYear, filterMonth, 0).toISOString().split("T")[0] ?? "";

  // Load accounts and categories for filters
  const { data: accountsData } = useCashAccounts({ limit: 100 });
  const { data: categoriesData } = useTransactionCategories({ limit: 100 });
  const accounts = accountsData?.data?.data ?? [];
  const categories = categoriesData?.data?.data ?? [];

  const { data, isLoading, isError } = useCashTransactions({
    page,
    limit: 10,
    search,
    ...(filterType && { type: filterType as TransactionType }),
    ...(filterStatus && {
      verificationStatus: filterStatus as TransactionStatus,
    }),
    ...(filterAccount && { accountId: filterAccount }),
    dateFrom,
    dateTo,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const openCreate = () => {
    setEditTx(undefined);
    setFormOpen(true);
  };
  const openEdit = (tx: CashTransactionWithRelations) => {
    setEditTx(tx);
    setFormOpen(true);
  };
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteTransaction.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <>
      {/* Month Filter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Periode:</p>
        <MonthPicker
          year={filterYear}
          month={filterMonth}
          onChange={(y, m) => {
            setFilterYear(y);
            setFilterMonth(m);
            setPage(1);
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Transaksi"
          value={data?.data?.summary?.total || 0}
          icon={ArrowLeftRight}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          label="Pemasukan"
          value={formatCurrency(data?.data?.summary?.totalIncome || 0)}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Pengeluaran"
          value={formatCurrency(data?.data?.summary?.totalExpense || 0)}
          icon={TrendingDown}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatCard
          label="Menunggu Verifikasi"
          value={data?.data?.summary?.pendingCount || 0}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Toolbar */}
      <div className="flex w-full items-center justify-between gap-4 border-b border-slate-200 py-3">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Cari transaksi..."
            className="max-w-xs w-full"
          />
          <Select
            options={[
              { value: "INCOME", label: "Pemasukan" },
              { value: "EXPENSE", label: "Pengeluaran" },
              { value: "TRANSFER", label: "Transfer" },
            ]}
            value={filterType}
            placeholder="Tipe..."
            onChange={(v) => {
              setFilterType(v.target.value);
              setPage(1);
            }}
          />
          <Select
            options={[
              { value: "PENDING", label: "Menunggu" },
              { value: "APPROVED", label: "Disetujui" },
              { value: "REJECTED", label: "Ditolak" },
            ]}
            value={filterStatus}
            placeholder="Status..."
            onChange={(v) => {
              setFilterStatus(v.target.value);
              setPage(1);
            }}
          />
          <Select
            options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            value={filterAccount}
            placeholder="Akun kas..."
            onChange={(v) => {
              setFilterAccount(v.target.value);
              setPage(1);
            }}
          />
        </div>
        <PermissionGuard permission="create:cashTransaction">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Transaksi
          </Button>
        </PermissionGuard>
      </div>

      {/* Table */}
      <TableRoot
        pagination={
          data?.meta && (
            <div className="border-t border-slate-200">
              <Pagination
                meta={data.meta as PaginationMeta}
                onPageChange={setPage}
              />
            </div>
          )
        }
      >
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Akun Kas</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Tindakan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton colSpan={8} rows={8} />
          ) : isError ? (
            <TableEmpty colSpan={8} message="Gagal memuat data." />
          ) : !data?.data?.data?.length ? (
            <TableEmpty
              colSpan={8}
              message={
                search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Belum ada transaksi."
              }
              icon={<ArrowLeftRight className="h-10 w-10" />}
            />
          ) : (
            data.data.data.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{formatDate(tx.transactionDate)}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-slate-900 line-clamp-1">
                      {tx.description}
                    </p>
                    {tx.referenceNo && (
                      <p className="text-xs text-slate-400">{tx.referenceNo}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`font-medium ${typeColors[tx.type]}`}>
                    {typeLabels[tx.type]}
                  </span>
                </TableCell>
                <TableCell>{tx.account?.name ?? "-"}</TableCell>
                <TableCell>
                  {tx.category ? (
                    <div className="flex items-center gap-2">
                      {tx.category.color && (
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: tx.category.color }}
                        />
                      )}
                      <span>{tx.category.name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell
                  className={`font-mono font-semibold ${typeColors[tx.type]}`}
                >
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[tx.verificationStatus]
                    }`}
                  >
                    {statusLabels[tx.verificationStatus]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {tx.verificationStatus === TransactionStatus.PENDING &&
                      can("verify:cashTransaction") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                          onClick={() => setVerifyTarget(tx)}
                          aria-label="Verifikasi"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}
                    {tx.verificationStatus === TransactionStatus.PENDING &&
                      can("update:cashTransaction") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(tx)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    {tx.verificationStatus !== TransactionStatus.APPROVED &&
                      can("delete:cashTransaction") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() =>
                            setDeleteTarget({
                              id: tx.id,
                              description: tx.description,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableRoot>

      <TransactionFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTx(undefined);
        }}
        transaction={editTx}
        accounts={accounts}
        categories={categories}
      />

      <TransactionVerifyDialog
        open={Boolean(verifyTarget)}
        onClose={() => setVerifyTarget(null)}
        transaction={verifyTarget}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Transaksi"
        description={`Hapus transaksi "${deleteTarget?.description ?? ""}"?`}
        confirmLabel="Hapus"
        isLoading={deleteTransaction.isPending}
      />
    </>
  );
}
