// src/app/dashboard/finance/dues/_components/dues-agenda-list.tsx
"use client";

import { useState } from "react";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  Heart,
} from "lucide-react";
import { useDuesAgendas, useDeleteDuesAgenda } from "@/hooks/use-dues";
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
import { DuesAgendaFormDialog } from "./dues-agenda-form-dialog";
import type { DuesAgendaProfile } from "@/types";

const MONTH_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  MANDATORY: {
    label: "Wajib",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  VOLUNTARY: {
    label: "Sukarela",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export function DuesAgendaList() {
  const { can } = usePermissions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editAgenda, setEditAgenda] = useState<DuesAgendaProfile | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useDuesAgendas({
    page,
    limit: 10,
    search,
    ...(typeFilter ? { type: typeFilter as "MANDATORY" | "VOLUNTARY" } : {}),
  });

  const deleteAgenda = useDeleteDuesAgenda();

  const agendas = (data?.data ?? []) as DuesAgendaProfile[];
  const meta = data?.meta as
    | { page: number; limit: number; total: number; totalPages: number }
    | undefined;

  // Compute stat card counts
  const totalAgendas = agendas.length;
  const activeCount = agendas.filter((a) => a.isActive).length;
  const mandatoryCount = agendas.filter((a) => a.type === "MANDATORY").length;
  const voluntaryCount = agendas.filter((a) => a.type === "VOLUNTARY").length;

  const handleEdit = (agenda: DuesAgendaProfile) => {
    setEditAgenda(agenda);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteAgenda.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  const handleNavigate = (id: string) => {
    window.location.href = `/dashboard/finance/dues/${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Agenda" value={totalAgendas} icon={FileText} />
        <StatCard
          label="Aktif"
          value={activeCount}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Iuran Wajib"
          value={mandatoryCount}
          icon={AlertCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatCard
          label="Iuran Sukarela"
          value={voluntaryCount}
          icon={Heart}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari agenda iuran..."
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
            { value: "", label: "Semua Tipe" },
            { value: "MANDATORY", label: "Iuran Wajib" },
            { value: "VOLUNTARY", label: "Iuran Sukarela" },
          ]}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-48"
        />
        <PermissionGuard permission="create:duesAgenda">
          <Button
            onClick={() => {
              setEditAgenda(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Tambah Agenda
          </Button>
        </PermissionGuard>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <TableRoot>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                <SkeletonTableRow cols={7} />
                <SkeletonTableRow cols={7} />
                <SkeletonTableRow cols={7} />
                <SkeletonTableRow cols={7} />
                <SkeletonTableRow cols={7} />
              </>
            ) : agendas.length === 0 ? (
              <TableEmpty colSpan={7} message="Belum ada agenda iuran." />
            ) : (
              agendas.map((agenda) => {
                const summary = agenda._summary;
                const paid = summary?.paid ?? 0;
                const total = summary?.totalMembers ?? 0;
                const badge = TYPE_BADGE[agenda.type] ?? {
                  label: agenda.type,
                  className: "",
                };
                const period =
                  agenda.periodMonth && agenda.periodYear
                    ? `${MONTH_NAMES[agenda.periodMonth]} ${agenda.periodYear}`
                    : agenda.periodMonth
                    ? MONTH_NAMES[agenda.periodMonth]
                    : "-";

                return (
                  <TableRow key={agenda.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {agenda.title}
                      </div>
                      {agenda.description && (
                        <div className="text-xs text-slate-500 line-clamp-1">
                          {agenda.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.className}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{period}</TableCell>
                    <TableCell className="text-slate-600">
                      {agenda.dueDate
                        ? new Date(agenda.dueDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-semibold text-slate-800">
                          {paid}
                        </span>
                        <span className="text-slate-400"> / {total}</span>
                      </div>
                      {total > 0 && (
                        <div className="mt-1 h-1.5 w-20 rounded-full bg-slate-100">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500 transition-all"
                            style={{
                              width: `${Math.min(100, (paid / total) * 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={agenda.isActive ? "default" : "secondary"}
                      >
                        {agenda.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleNavigate(agenda.id)}
                          title="Lihat detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {can("update:duesAgenda") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(agenda)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {can("delete:duesAgenda") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(agenda.id)}
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
      <DuesAgendaFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditAgenda(null);
        }}
        agenda={editAgenda}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title="Hapus Agenda Iuran"
        description="Apakah Anda yakin ingin menghapus agenda iuran ini? Data pembayaran terkait tidak akan terhapus."
        confirmLabel="Hapus"
        isLoading={deleteAgenda.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
