// src/app/dashboard/users/_components/users-table.tsx
"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Users,
  UserCheck,
  UserMinus,
  Download,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permission";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchBar } from "@/components/shared/search-bar";
import { StatusBadgeMember } from "@/components/shared/status-badge";
import { Avatar } from "@/components/shared/avatar";
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
import { useDeleteMember, useMembers } from "@/hooks";
import { formatDate } from "@/utils";
import { Select, StatCard } from "@/components/ui";
import { useGlobalShareStore } from "@/store/global-share.store";
import { MemberProfile } from "@/hooks/use-members";
import { Member } from "@prisma/client";
import { MemberFormDialog } from "./members-form-dialog";
import { ROUTES } from "@/config/routes";
import { exportFileFromApi } from "@/lib/export-file";
import toast from "react-hot-toast";

export function UsersTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { can } = usePermissions();
  const deleteMember = useDeleteMember();

  //global store
  const { memberStatusType } = useGlobalShareStore();
  console.log(memberStatusType);

  const [formOpen, setFormOpen] = useState(false);
  const [editMember, setEditMember] = useState<MemberProfile | undefined>(
    undefined
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportFileFromApi(
        ROUTES.api.memberExport,
        {
          ...(search && { search }),
          ...(selectedPosition && { statusId: selectedPosition }),
          ...(selectedStatus && { isActive: selectedStatus }),
        },
        "daftar-anggota.xlsx"
      );
      toast.success("Data anggota berhasil diekspor.");
    } catch {
      toast.error("Gagal mengekspor data anggota.");
    } finally {
      setIsExporting(false);
    }
  };

  const { data, isLoading, isError } = useMembers({
    page,
    limit: 10,
    search,
    ...(selectedPosition && { statusId: selectedPosition }),
    ...(selectedStatus && { isActive: selectedStatus === "true" }),
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openCreate = () => {
    setEditMember(undefined);
    setFormOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditMember(member);
    setFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMember.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Anggota"
          value={data?.data?.summary?.total || 0}
          icon={Users}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          label="Total Aktif"
          value={data?.data?.summary?.activeTotal || 0}
          icon={UserCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Total Tidak Aktif"
          value={data?.data?.summary?.inactiveTotal || 0}
          icon={UserMinus}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>
      <div className="flex w-full items-center justify-between gap-4 border-b border-slate-200 py-3">
        <div className="flex items-center gap-3 flex-1">
          <SearchBar
            value={search}
            onChange={handleSearch}
            // placeholder="Search by name or email..."
            placeholder="Cari berdasarkan nama atau email..."
            className="max-w-xs w-full"
          />
          <Select
            options={(memberStatusType || []).map((status) => ({
              value: status.id,
              label: status.name,
            }))}
            value={selectedPosition}
            placeholder="Pilih posisi..."
            onChange={(value) => {
              setSelectedPosition(value.target.value);
            }}
          />
          <Select
            options={[
              { id: "true", name: "Active" },
              { id: "false", name: "Inactive" },
            ].map((status) => ({
              value: status.id,
              label: status.name,
            }))}
            value={selectedStatus}
            placeholder="Pilih status..."
            onChange={(value) => {
              setSelectedStatus(value.target.value);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            isLoading={isExporting}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <PermissionGuard permission="create:member">
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Tambah Pengguna
            </Button>
          </PermissionGuard>
        </div>
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
            <TableHead>No.Anggota</TableHead>
            <TableHead>Nama Angota</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Posisi</TableHead>
            <TableHead>Bergabung</TableHead>
            <TableHead>Poin</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Tindakan</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableSkeleton colSpan={8} rows={8} />
          ) : isError ? (
            <TableEmpty
              colSpan={8}
              message="Gagal memuat pengguna. Silakan segarkan halaman."
            />
          ) : !data?.data?.data?.length ? (
            <TableEmpty
              colSpan={8}
              message={
                search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Tidak ada pengguna ditemukan."
              }
              icon={<Users className="h-10 w-10" />}
            />
          ) : (
            data.data.data.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.memberNumber}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={member.fullName}
                      src={member.photoUrl}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-slate-900">
                        {member.fullName}
                      </p>
                      {/* <p className="text-xs text-slate-500">{member.email }</p> */}
                    </div>
                  </div>
                </TableCell>

                <TableCell>{member.gender}</TableCell>
                <TableCell>{member.position}</TableCell>
                <TableCell>{formatDate(member.createdAt)}</TableCell>
                <TableCell>{member.activityPoint}</TableCell>
                <TableCell>
                  <StatusBadgeMember status={member.isActive} />
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {can("update:member") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(member)}
                        aria-label="Edit member"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {can("delete:member") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() =>
                          setDeleteTarget({
                            id: member.id,
                            name: member.fullName,
                          })
                        }
                        aria-label="Delete member"
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

      <MemberFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditMember(undefined);
        }}
        member={editMember}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Anggota"
        description={`Apakah Anda yakin ingin menghapus anggota "${
          deleteTarget?.name ?? ""
        }"?`}
        confirmLabel="Hapus Anggota"
        isLoading={deleteMember.isPending}
      />
    </>
  );
}
