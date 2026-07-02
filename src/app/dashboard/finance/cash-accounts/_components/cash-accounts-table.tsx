// src/app/dashboard/finance/cash-accounts/_components/cash-accounts-table.tsx
"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Landmark,
  Wallet,
  BadgeCheck,
  CircleOff,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permission";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchBar } from "@/components/shared/search-bar";
import { StatusBadgeMember } from "@/components/shared/status-badge";
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
  useDeleteCashAccount,
  useCashAccounts,
} from "@/hooks/use-cash-accounts";
import { formatDate } from "@/utils";
import { Select, StatCard } from "@/components/ui";
import { CashAccount } from "@prisma/client";
import { CashAccountFormDialog } from "./cash-accounts-form-dialog";

export function CashAccountsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { can } = usePermissions();
  const deleteCashAccount = useDeleteCashAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<CashAccount | undefined>(
    undefined
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const { data, isLoading, isError } = useCashAccounts({
    page,
    limit: 10,
    search,
    ...(selectedStatus && { isActive: selectedStatus === "true" }),
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openCreate = () => {
    setEditAccount(undefined);
    setFormOpen(true);
  };

  const openEdit = (account: CashAccount) => {
    setEditAccount(account);
    setFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteCashAccount.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const formatCurrency = (val: number | string | { toString(): string }) => {
    const num =
      typeof val === "object" && "toString" in val
        ? Number(val.toString())
        : typeof val === "string"
        ? parseFloat(val)
        : val;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Akun Kas"
          value={data?.data?.summary?.total || 0}
          icon={Landmark}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          label="Akun Aktif"
          value={data?.data?.summary?.activeTotal || 0}
          icon={BadgeCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Akun Tidak Aktif"
          value={data?.data?.summary?.inactiveTotal || 0}
          icon={CircleOff}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap-reverse w-full items-center justify-between gap-4 border-b border-slate-200 py-3">
        <div className="flex flex-wrap-reverse items-center gap-3 md:flex-1">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Cari berdasarkan nama akun..."
            className="max-w-xs w-full"
          />
          <Select
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            value={selectedStatus}
            placeholder="Pilih status..."
            onChange={(value) => {
              setSelectedStatus(value.target.value);
            }}
          />
        </div>
        <PermissionGuard permission="create:cashAccount">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Akun Kas
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
            <TableHead>Nama Akun</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dibuat</TableHead>
            <TableHead className="text-right">Tindakan</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableSkeleton colSpan={6} rows={8} />
          ) : isError ? (
            <TableEmpty
              colSpan={6}
              message="Gagal memuat data. Silakan segarkan halaman."
            />
          ) : !data?.data?.data?.length ? (
            <TableEmpty
              colSpan={6}
              message={
                search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Belum ada akun kas."
              }
              icon={<Wallet className="h-10 w-10" />}
            />
          ) : (
            data.data.data.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                      <Landmark className="h-4 w-4 text-brand-600" />
                    </div>
                    <p className="font-medium text-slate-900">{account.name}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {account.description ?? (
                    <span className="text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-slate-700">
                  {formatCurrency(account.balance)}
                </TableCell>
                <TableCell>
                  <StatusBadgeMember status={account.isActive} />
                </TableCell>
                <TableCell>{formatDate(account.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {can("update:cashAccount") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(account)}
                        aria-label="Edit akun kas"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {can("delete:cashAccount") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() =>
                          setDeleteTarget({
                            id: account.id,
                            name: account.name,
                          })
                        }
                        aria-label="Hapus akun kas"
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

      {/* Form Dialog */}
      <CashAccountFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditAccount(undefined);
        }}
        account={editAccount}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Akun Kas"
        description={`Apakah Anda yakin ingin menghapus akun kas "${
          deleteTarget?.name ?? ""
        }"?`}
        confirmLabel="Hapus Akun Kas"
        isLoading={deleteCashAccount.isPending}
      />
    </>
  );
}
