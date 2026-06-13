// src/app/dashboard/attendance/meeting-types/_components/meeting-types-table.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Tag } from "lucide-react";
import { usePermissions } from "@/hooks/use-permission";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui";
import {
  useMeetingTypes,
  useDeleteMeetingType,
} from "@/hooks/use-meeting-types";
import { MeetingTypeFormDialog } from "./meeting-type-form-dialog";
import type { MeetingTypeProfile } from "@/types";

export function MeetingTypesTable() {
  const { can } = usePermissions();
  const deleteType = useDeleteMeetingType();
  const { data, isLoading, isError } = useMeetingTypes();

  const [formOpen, setFormOpen] = useState(false);
  const [editType, setEditType] = useState<MeetingTypeProfile | undefined>(
    undefined
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const openCreate = () => {
    setEditType(undefined);
    setFormOpen(true);
  };

  const openEdit = (mt: MeetingTypeProfile) => {
    setEditType(mt);
    setFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteType.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const types = (data?.data ?? []) as (MeetingTypeProfile & {
    _count?: { meetings: number };
  })[];

  return (
    <>
      {/* Toolbar */}
      <div className="flex w-full items-center justify-end border-b border-slate-200 py-3">
        <PermissionGuard permission="create:meetingType">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Tipe Rapat
          </Button>
        </PermissionGuard>
      </div>

      {/* Table */}
      <TableRoot>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Warna</TableHead>
            <TableHead>Jumlah Rapat</TableHead>
            <TableHead className="text-right">Tindakan</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableSkeleton colSpan={4} rows={5} />
          ) : isError ? (
            <TableEmpty
              colSpan={4}
              message="Gagal memuat data. Silakan segarkan halaman."
            />
          ) : types.length === 0 ? (
            <TableEmpty
              colSpan={4}
              message="Belum ada tipe rapat."
              icon={<Tag className="h-10 w-10" />}
            />
          ) : (
            types.map((mt) => (
              <TableRow key={mt.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded"
                      style={{
                        backgroundColor: mt.color ?? "#94a3b8",
                      }}
                    />
                    <span className="font-medium text-slate-900">
                      {mt.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    style={
                      mt.color
                        ? {
                            borderColor: mt.color,
                            color: mt.color,
                          }
                        : undefined
                    }
                  >
                    {mt.color ?? "-"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">
                    {mt._count?.meetings ?? 0} rapat
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {can("update:meetingType") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(mt)}
                        aria-label="Edit tipe rapat"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {can("delete:meetingType") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() =>
                          setDeleteTarget({ id: mt.id, name: mt.name })
                        }
                        aria-label="Hapus tipe rapat"
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
      <MeetingTypeFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditType(undefined);
        }}
        {...(editType ? { meetingType: editType } : {})}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Tipe Rapat"
        description={`Apakah Anda yakin ingin menghapus tipe rapat "${
          deleteTarget?.name ?? ""
        }"?`}
        confirmLabel="Hapus"
        isLoading={deleteType.isPending}
      />
    </>
  );
}
