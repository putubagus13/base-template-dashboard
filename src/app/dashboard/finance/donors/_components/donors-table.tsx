// src/app/dashboard/finance/donors/_components/donors-table.tsx
"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  // Pencil,
  Heart,
  Users,
  UserX,
  Banknote,
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
import { useDeleteDonor, useDonors, DonorWithMember } from "@/hooks/use-donors";
import { formatDate } from "@/utils";
import { Badge, Select, StatCard } from "@/components/ui";
import { DonorsFormDialog } from "./donors-form-dialog";
import { useRouter } from "next/navigation";
import { DonorVerificationStatus } from "@prisma/client";

const statusColors: Record<DonorVerificationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const statusLabels: Record<DonorVerificationStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export function DonorsTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { can } = usePermissions();
  const deleteDonor = useDeleteDonor();

  const [formOpen, setFormOpen] = useState(false);
  const [editDonor, setEditDonor] = useState<DonorWithMember | undefined>(
    undefined
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>("");
  const nowDate = new Date();
  const [filterYear, setFilterYear] = useState(nowDate.getFullYear());
  const [filterMonth, setFilterMonth] = useState(nowDate.getMonth() + 1);

  // Compute date range from month
  const dateFrom =
    new Date(filterYear, filterMonth - 1, 1).toISOString().split("T")[0] ?? "";
  const dateTo =
    new Date(filterYear, filterMonth, 0).toISOString().split("T")[0] ?? "";

  const { data, isLoading, isError } = useDonors({
    page,
    limit: 10,
    search,
    ...(selectedMemberFilter && { isMember: selectedMemberFilter === "true" }),
    dateFrom,
    dateTo,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openCreate = () => {
    // setEditDonor(undefined);
    // setFormOpen(true);
    router.push("/dashboard/finance/donations");
  };

  // const openEdit = (donor: DonorWithMember) => {
  //   setEditDonor(donor);
  //   setFormOpen(true);
  // };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteDonor.mutate(deleteTarget.id, {
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
          label="Total Donatur"
          value={data?.data?.summary?.total || 0}
          icon={Heart}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <StatCard
          label="Donatur Anggota"
          value={data?.data?.summary?.memberTotal || 0}
          icon={Users}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          label="Donatur Non-Anggota"
          value={data?.data?.summary?.nonMemberTotal || 0}
          icon={UserX}
          iconColor="text-slate-600"
          iconBg="bg-slate-50"
        />
        <StatCard
          label="Total Donasi"
          value={formatCurrency(data?.data?.summary?.totalDonated || 0)}
          icon={Banknote}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Toolbar */}
      <div className="flex w-full items-center justify-between gap-4 border-b border-slate-200 py-3">
        <div className="flex items-center gap-3 flex-1">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Cari nama, email, atau telepon..."
            className="max-w-xs w-full"
          />
          <Select
            options={[
              { value: "true", label: "Anggota" },
              { value: "false", label: "Non-Anggota" },
            ]}
            value={selectedMemberFilter}
            placeholder="Semua Tipe"
            onChange={(value) => {
              setSelectedMemberFilter(value.target.value);
              setPage(1);
            }}
          />
        </div>
        <PermissionGuard permission="create:donor">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Donatur
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
            <TableHead>Nama</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Total Donasi</TableHead>
            <TableHead>Dibuat</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Tindakan</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableSkeleton colSpan={7} rows={8} />
          ) : isError ? (
            <TableEmpty
              colSpan={7}
              message="Gagal memuat data. Silakan segarkan halaman."
            />
          ) : !data?.data?.data?.length ? (
            <TableEmpty
              colSpan={7}
              message={
                search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Belum ada data donatur."
              }
              icon={<Heart className="h-10 w-10" />}
            />
          ) : (
            data.data.data.map((donor) => (
              <TableRow key={donor.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
                      <Heart className="h-4 w-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{donor.name}</p>
                      {donor.isMember && donor.member && (
                        <p className="text-xs text-slate-500">
                          {donor.member.fullName}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {donor.phone ?? <span className="text-slate-400">-</span>}
                </TableCell>
                <TableCell>
                  {donor.email ?? <span className="text-slate-400">-</span>}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={donor.isMember ? "default" : "outline"}
                    className={
                      donor.isMember
                        ? "bg-brand-50 text-brand-700 border-brand-200"
                        : "text-slate-500 border-slate-200"
                    }
                  >
                    {donor.isMember ? "Anggota" : "Non-Anggota"}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-slate-700">
                  {formatCurrency(donor.totalDonated)}
                </TableCell>
                <TableCell>{formatDate(donor.createdAt)}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[donor.verificationStatus]
                    }`}
                  >
                    {statusLabels[donor.verificationStatus]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {/* {can("update:donor") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(donor)}
                        aria-label="Edit donatur"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )} */}
                    {can("delete:donor") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() =>
                          setDeleteTarget({ id: donor.id, name: donor.name })
                        }
                        aria-label="Hapus donatur"
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
      <DonorsFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditDonor(undefined);
        }}
        donor={editDonor}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Donatur"
        description={`Apakah Anda yakin ingin menghapus donatur "${
          deleteTarget?.name ?? ""
        }"?`}
        confirmLabel="Hapus Donatur"
        isLoading={deleteDonor.isPending}
      />
    </>
  );
}
