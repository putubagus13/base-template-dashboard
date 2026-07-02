// src/app/dashboard/finance/loans/_components/loans-table.tsx
"use client";

import { useState } from "react";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Search,
  HandCoins,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useLoans, useDeleteLoan } from "@/hooks/use-loans";
import { usePermissions } from "@/hooks/use-permission";
import { PermissionGuard } from "@/components/shared/permission-guard";
import {
  Button,
  Input,
  Select,
  Badge,
  StatCard,
  SkeletonTableRow,
} from "@/components/ui";
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoanFormDialog } from "./loan-form-dialog";
import { formatDate } from "@/utils/format";
import type { LoanProfile } from "@/types";
import { LoanStatus } from "@prisma/client";

const STATUS_BADGE: Record<
  LoanStatus,
  {
    label: string;
    variant: "default" | "success" | "warning" | "destructive" | "secondary";
  }
> = {
  PENDING: { label: "Menunggu", variant: "warning" },
  APPROVED: { label: "Disetujui", variant: "success" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
  PAID_OFF: { label: "Lunas", variant: "default" },
};

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function isLoanOverdue(loan: LoanProfile): boolean {
  return (
    loan.status === "APPROVED" &&
    new Date() > new Date(loan.dueDate) &&
    parseFloat(loan.remainingAmount) > 0
  );
}

export function LoansTable() {
  const { can } = usePermissions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editLoan, setEditLoan] = useState<LoanProfile | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useLoans({
    page,
    limit: 10,
    search,
    ...(statusFilter === "OVERDUE"
      ? { overdue: true }
      : statusFilter
      ? { status: statusFilter as LoanStatus }
      : {}),
  });

  const deleteLoan = useDeleteLoan();

  const loans = (data?.data?.data ?? []) as LoanProfile[];
  const summary = data?.data?.summary;
  const meta = data?.meta as
    | { page: number; limit: number; total: number; totalPages: number }
    | undefined;

  const handleEdit = (loan: LoanProfile) => {
    setEditLoan(loan);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteLoan.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard
          label="Pinjaman Aktif"
          value={summary?.totalActive ?? 0}
          icon={HandCoins}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          label="Total Outstanding"
          value={formatCurrency(summary?.totalOutstanding ?? 0)}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Dicairkan Bulan Ini"
          value={formatCurrency(summary?.totalDisbursedThisMonth ?? 0)}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Menunggu Verifikasi"
          value={summary?.pendingCount ?? 0}
          icon={AlertCircle}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <StatCard
          label="Terlambat"
          value={summary?.overdueCount ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari pinjaman (nomor, peminjam, tujuan)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: "", label: "Semua Status" },
            { value: "PENDING", label: "Menunggu" },
            { value: "APPROVED", label: "Disetujui" },
            { value: "REJECTED", label: "Ditolak" },
            { value: "PAID_OFF", label: "Lunas" },
            { value: "OVERDUE", label: "Terlambat" },
          ]}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-48"
        />
        <PermissionGuard permission="create:loan">
          <Button
            onClick={() => {
              setEditLoan(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Ajukan Pinjaman
          </Button>
        </PermissionGuard>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <TableRoot>
          <TableHeader>
            <TableRow>
              <TableHead>No. Pinjaman</TableHead>
              <TableHead>Peminjam</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Bunga</TableHead>
              <TableHead>Total Bayar</TableHead>
              <TableHead>Sisa</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                <SkeletonTableRow cols={9} />
                <SkeletonTableRow cols={9} />
                <SkeletonTableRow cols={9} />
              </>
            ) : loans.length === 0 ? (
              <TableEmpty colSpan={9} message="Belum ada data pinjaman." />
            ) : (
              loans.map((loan) => {
                const badge = STATUS_BADGE[loan.status];
                const overdue = isLoanOverdue(loan);
                return (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {loan.loanNumber}
                      </div>
                      {loan.purpose && (
                        <div className="text-xs text-slate-500 line-clamp-1">
                          {loan.purpose}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-slate-700">{loan.borrower.name}</div>
                      <div className="text-xs text-slate-400">
                        {loan.borrower.isMember ? "Anggota" : "Eksternal"}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(loan.principal)}
                    </TableCell>
                    <TableCell>
                      {(parseFloat(loan.interestRate) * 100).toFixed(1)}%/bln
                    </TableCell>
                    <TableCell>{formatCurrency(loan.totalOwed)}</TableCell>
                    <TableCell className="font-medium text-amber-700">
                      {formatCurrency(loan.remainingAmount)}
                    </TableCell>
                    <TableCell>{formatDate(loan.dueDate)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        {overdue && (
                          <Badge variant="destructive">Terlambat</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            (window.location.href = `/dashboard/finance/loans/${loan.id}`)
                          }
                          title="Lihat detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {can("update:loan") && loan.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(loan)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {can("delete:loan") && loan.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(loan.id)}
                            title="Hapus"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </TableRoot>
        {meta && meta.totalPages > 1 && (
          <div className="border-t border-slate-100">
            <Pagination
              meta={meta as unknown as import("@/types/api").PaginationMeta}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <LoanFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditLoan(null);
        }}
        loan={editLoan}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title="Hapus Pinjaman"
        description="Apakah Anda yakin ingin menghapus pinjaman ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        isLoading={deleteLoan.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
