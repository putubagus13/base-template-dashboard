// src/app/dashboard/attendance/meetings/_components/meetings-table.tsx
"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Eye,
  CalendarDays,
  Clock,
  CheckCircle2,
  Radio,
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
import { useMeetings, useDeleteMeeting } from "@/hooks/use-meetings";
import { formatDate, toLocalDateString } from "@/utils";
import { Badge, StatCard, Select } from "@/components/ui";
import { MeetingFormDialog } from "./meeting-form-dialog";
import { ROUTES } from "@/config/routes";
import type { MeetingProfile, MeetingSummary } from "@/types";
import type { MeetingStatus } from "@prisma/client";

const statusColors: Record<MeetingStatus, string> = {
  INCOMING: "bg-blue-100 text-blue-700",
  LIVE: "bg-emerald-100 text-emerald-700",
  DONE: "bg-slate-100 text-slate-600",
};

const statusLabels: Record<MeetingStatus, string> = {
  INCOMING: "Akan Datang",
  LIVE: "Berlangsung",
  DONE: "Selesai",
};

export function MeetingsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { can } = usePermissions();
  const deleteMeeting = useDeleteMeeting();

  const [formOpen, setFormOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<MeetingProfile | undefined>(
    undefined
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const nowDate = new Date();
  const [filterYear, setFilterYear] = useState(nowDate.getFullYear());
  const [filterMonth, setFilterMonth] = useState(nowDate.getMonth() + 1);

  const dateFrom = toLocalDateString(new Date(filterYear, filterMonth - 1, 1));
  const dateTo = toLocalDateString(new Date(filterYear, filterMonth, 0));

  const { data, isLoading, isError } = useMeetings({
    page,
    limit: 10,
    search,
    ...(statusFilter && { status: statusFilter as MeetingStatus }),
    dateFrom,
    dateTo,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openCreate = () => {
    setEditMeeting(undefined);
    setFormOpen(true);
  };

  const openEdit = (meeting: MeetingProfile) => {
    setEditMeeting(meeting);
    setFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMeeting.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const summary: MeetingSummary | undefined = data?.data?.summary;

  return (
    <>
      {/* Month filter */}
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
          label="Total Rapat"
          value={summary?.total ?? 0}
          icon={CalendarDays}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          label="Akan Datang"
          value={summary?.incomingTotal ?? 0}
          icon={Clock}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Berlangsung"
          value={summary?.liveTotal ?? 0}
          icon={Radio}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Selesai"
          value={summary?.doneTotal ?? 0}
          icon={CheckCircle2}
          iconColor="text-slate-600"
          iconBg="bg-slate-50"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap-reverse w-full items-center justify-between gap-4 border-b border-slate-200 py-3">
        <div className="flex flex-wrap-reverse items-center gap-3 md:flex-1">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Cari judul rapat..."
            className="max-w-xs w-full"
          />
          <Select
            options={[
              { value: "INCOMING", label: "Akan Datang" },
              { value: "LIVE", label: "Berlangsung" },
              { value: "DONE", label: "Selesai" },
            ]}
            value={statusFilter}
            placeholder="Semua Status"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <PermissionGuard permission="create:meeting">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Rapat
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
            <TableHead>Judul</TableHead>
            <TableHead>Tipe Rapat</TableHead>
            <TableHead>Jadwal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Absensi</TableHead>
            <TableHead>Dibuat</TableHead>
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
                  : "Belum ada data rapat."
              }
              icon={<CalendarDays className="h-10 w-10" />}
            />
          ) : (
            data.data.data.map((meeting) => (
              <TableRow key={meeting.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-slate-900">
                      {meeting.title}
                    </p>
                    {meeting.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {meeting.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    style={
                      meeting.meetingType.color
                        ? {
                            borderColor: meeting.meetingType.color,
                            color: meeting.meetingType.color,
                          }
                        : undefined
                    }
                  >
                    {meeting.meetingType.name}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(meeting.scheduledAt)}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[meeting.status]
                    }`}
                  >
                    {statusLabels[meeting.status]}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">
                    {meeting._count?.attendances ?? 0} tercatat
                  </span>
                </TableCell>
                <TableCell>{formatDate(meeting.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        window.location.href = ROUTES.dashboard.meetingDetail(
                          meeting.id
                        );
                      }}
                      aria-label="Lihat absensi"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {can("update:meeting") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(meeting)}
                        aria-label="Edit rapat"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {can("delete:meeting") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() =>
                          setDeleteTarget({
                            id: meeting.id,
                            title: meeting.title,
                          })
                        }
                        aria-label="Hapus rapat"
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
      <MeetingFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditMeeting(undefined);
        }}
        {...(editMeeting ? { meeting: editMeeting } : {})}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Rapat"
        description={`Apakah Anda yakin ingin menghapus rapat "${
          deleteTarget?.title ?? ""
        }"?`}
        confirmLabel="Hapus Rapat"
        isLoading={deleteMeeting.isPending}
      />
    </>
  );
}
