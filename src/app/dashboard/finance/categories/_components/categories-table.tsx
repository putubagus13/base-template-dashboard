// src/app/dashboard/finance/categories/_components/categories-table.tsx
"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Tags,
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
  useDeleteTransactionCategory,
  useTransactionCategories,
} from "@/hooks";
import { formatDate } from "@/utils";
import { Select, StatCard } from "@/components/ui";
import { TransactionCategory } from "@prisma/client";
import { CategoryFormDialog } from "./categories-form-dialog";

export function CategoriesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { can } = usePermissions();
  const deleteCategory = useDeleteTransactionCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<
    TransactionCategory | undefined
  >(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const { data, isLoading, isError } = useTransactionCategories({
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
    setEditCategory(undefined);
    setFormOpen(true);
  };
  const openEdit = (cat: TransactionCategory) => {
    setEditCategory(cat);
    setFormOpen(true);
  };
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Kategori"
          value={data?.data?.summary?.total || 0}
          icon={Tags}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          label="Kategori Aktif"
          value={data?.data?.summary?.activeTotal || 0}
          icon={BadgeCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Kategori Tidak Aktif"
          value={data?.data?.summary?.inactiveTotal || 0}
          icon={CircleOff}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>

      <div className="flex w-full items-center justify-between gap-4 border-b border-slate-200 py-3">
        <div className="flex items-center gap-3 flex-1">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Cari kategori..."
            className="max-w-xs w-full"
          />
          <Select
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            value={selectedStatus}
            placeholder="Pilih status..."
            onChange={(v) => setSelectedStatus(v.target.value)}
          />
        </div>
        <PermissionGuard permission="create:transactionCategory">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Kategori
          </Button>
        </PermissionGuard>
      </div>

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
            <TableHead>Nama</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead>Warna</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dibuat</TableHead>
            <TableHead className="text-right">Tindakan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton colSpan={6} rows={8} />
          ) : isError ? (
            <TableEmpty colSpan={6} message="Gagal memuat data." />
          ) : !data?.data?.data?.length ? (
            <TableEmpty
              colSpan={6}
              message={
                search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Belum ada kategori."
              }
              icon={<Tags className="h-10 w-10" />}
            />
          ) : (
            data.data.data.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {cat.color && (
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                    )}
                    <p className="font-medium text-slate-900">{cat.name}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {cat.description ?? <span className="text-slate-400">-</span>}
                </TableCell>
                <TableCell>
                  {cat.color ?? <span className="text-slate-400">-</span>}
                </TableCell>
                <TableCell>
                  <StatusBadgeMember status={cat.isActive} />
                </TableCell>
                <TableCell>{formatDate(cat.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {can("update:transactionCategory") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {can("delete:transactionCategory") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() =>
                          setDeleteTarget({ id: cat.id, name: cat.name })
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

      <CategoryFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditCategory(undefined);
        }}
        category={editCategory}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Kategori"
        description={`Hapus kategori "${deleteTarget?.name ?? ""}"?`}
        confirmLabel="Hapus"
        isLoading={deleteCategory.isPending}
      />
    </>
  );
}
