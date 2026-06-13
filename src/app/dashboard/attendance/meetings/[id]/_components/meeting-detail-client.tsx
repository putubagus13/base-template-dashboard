// src/app/dashboard/attendance/meetings/[id]/_components/meeting-detail-client.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Pencil,
  Save,
  Users,
  UserCheck,
  UserX,
  Stethoscope,
} from "lucide-react";
import { PermissionGuard } from "@/components/shared/permission-guard";
import {
  Button,
  Input,
  Select,
  Textarea,
  StatCard,
  Badge,
} from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import { useMeeting, useUpdateMeeting } from "@/hooks/use-meetings";
import {
  useAttendance,
  useSaveAttendance,
  useAttendancePointConfig,
} from "@/hooks/use-attendance";
import { useMembers } from "@/hooks/use-members";
import { formatDate } from "@/utils";
import { ROUTES } from "@/config/routes";
import type { AttendanceStatus } from "@prisma/client";
import type {
  BulkAttendanceInput,
  AttendancePointConfigProfile,
} from "@/types";

type MeetingDetailClientProps = {
  meetingId: string;
};

const statusOptions = [
  { value: "HADIR", label: "Hadir" },
  { value: "IZIN", label: "Izin" },
  { value: "TIDAK_HADIR", label: "Tidak Hadir" },
  { value: "SAKIT", label: "Sakit" },
];

type AttendanceRow = {
  memberId: string;
  fullName: string;
  memberNumber: string;
  status: AttendanceStatus;
  notes: string;
  points: number;
};

export function MeetingDetailClient({ meetingId }: MeetingDetailClientProps) {
  const { data: meetingData, isLoading: meetingLoading } =
    useMeeting(meetingId);
  const { data: attendanceData, isLoading: attendanceLoading } =
    useAttendance(meetingId);
  const { data: pointConfigData } = useAttendancePointConfig();
  const { data: membersData } = useMembers({ limit: 500 });
  const saveAttendance = useSaveAttendance(meetingId);
  const updateMeeting = useUpdateMeeting(meetingId);

  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>("HADIR");
  const [discussionNotes, setDiscussionNotes] = useState("");
  const [notesEditing, setNotesEditing] = useState(false);

  // Build point map
  const pointMap = useMemo(() => {
    const map = new Map<AttendanceStatus, number>();
    const configs = pointConfigData?.data as
      | AttendancePointConfigProfile[]
      | undefined;
    if (configs) {
      for (const c of configs) {
        map.set(c.status, c.points);
      }
    }
    return map;
  }, [pointConfigData]);

  // Initialize rows from members + existing attendance
  useEffect(() => {
    const members = membersData?.data?.data;
    const attendances = attendanceData?.data;
    if (!members) return;

    const attendanceMap = new Map<
      string,
      { status: AttendanceStatus; notes: string | null; points: number }
    >();
    if (attendances) {
      for (const att of attendances as Array<{
        memberId: string;
        status: AttendanceStatus;
        notes: string | null;
        points: number;
      }>) {
        attendanceMap.set(att.memberId, {
          status: att.status,
          notes: att.notes,
          points: att.points,
        });
      }
    }

    const newRows: AttendanceRow[] = members.map((m) => {
      const existing = attendanceMap.get(m.id) as
        | { status: AttendanceStatus; notes: string | null; points: number }
        | undefined;
      const defaultStatus: AttendanceStatus = "TIDAK_HADIR";
      const status = existing?.status ?? defaultStatus;
      return {
        memberId: m.id,
        fullName: m.fullName,
        memberNumber: m.memberNumber,
        status,
        notes: existing?.notes ?? "",
        points: existing ? existing.points : pointMap.get(status) ?? 0,
      };
    });

    setRows(newRows);
  }, [membersData, attendanceData, pointMap]);

  // Set discussion notes from meeting data
  useEffect(() => {
    const meeting = meetingData?.data as
      | { discussionNotes?: string | null }
      | undefined;
    if (meeting?.discussionNotes) {
      setDiscussionNotes(meeting.discussionNotes);
    }
  }, [meetingData]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(rows.map((r) => r.memberId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(memberId);
      else next.delete(memberId);
      return next;
    });
  };

  const handleBulkApply = () => {
    const pts = pointMap.get(bulkStatus) ?? 0;
    setRows((prev) =>
      prev.map((r) =>
        selectedIds.has(r.memberId)
          ? { ...r, status: bulkStatus, points: pts }
          : r
      )
    );
  };

  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    const pts = pointMap.get(status) ?? 0;
    setRows((prev) =>
      prev.map((r) =>
        r.memberId === memberId ? { ...r, status, points: pts } : r
      )
    );
  };

  const handleNotesChange = (memberId: string, notes: string) => {
    setRows((prev) =>
      prev.map((r) => (r.memberId === memberId ? { ...r, notes } : r))
    );
  };

  const handleSaveAttendance = () => {
    const payload: BulkAttendanceInput[] = rows.map((r) => ({
      memberId: r.memberId,
      status: r.status,
      notes: r.notes || null,
    }));
    saveAttendance.mutate(payload);
  };

  const handleSaveNotes = () => {
    updateMeeting.mutate(
      { discussionNotes },
      { onSuccess: () => setNotesEditing(false) }
    );
  };

  const meeting = meetingData?.data as
    | {
        title: string;
        scheduledAt: string;
        status: string;
        description?: string | null;
        meetingType?: { name: string; color?: string | null };
        attendanceSummary?: {
          totalMembers: number;
          totalRecorded: number;
          HADIR: number;
          IZIN: number;
          TIDAK_HADIR: number;
          SAKIT: number;
        };
      }
    | undefined;

  const isLoading = meetingLoading || attendanceLoading;

  // Compute summary percentages
  const summary = meeting?.attendanceSummary;
  const totalForPercent = summary?.totalRecorded ?? 0;
  const pctHadir = totalForPercent
    ? Math.round(((summary?.HADIR ?? 0) / totalForPercent) * 100)
    : 0;
  const pctIzin = totalForPercent
    ? Math.round(((summary?.IZIN ?? 0) / totalForPercent) * 100)
    : 0;
  const pctTidakHadir = totalForPercent
    ? Math.round(((summary?.TIDAK_HADIR ?? 0) / totalForPercent) * 100)
    : 0;
  const pctSakit = totalForPercent
    ? Math.round(((summary?.SAKIT ?? 0) / totalForPercent) * 100)
    : 0;

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              window.location.href = ROUTES.dashboard.meetings;
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {meeting?.title ?? "Detail Rapat"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {meeting?.meetingType?.name} &middot;{" "}
              {meeting?.scheduledAt ? formatDate(meeting.scheduledAt) : ""}
            </p>
          </div>
        </div>
        {meeting && (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              meeting.status === "INCOMING"
                ? "bg-blue-100 text-blue-700"
                : meeting.status === "LIVE"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {meeting.status === "INCOMING"
              ? "Akan Datang"
              : meeting.status === "LIVE"
              ? "Berlangsung"
              : "Selesai"}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
        </div>
      ) : (
        <>
          {/* Attendance Summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label={`Hadir (${pctHadir}%)`}
              value={summary?.HADIR ?? 0}
              icon={UserCheck}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <StatCard
              label={`Izin (${pctIzin}%)`}
              value={summary?.IZIN ?? 0}
              icon={Users}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
            <StatCard
              label={`Tidak Hadir (${pctTidakHadir}%)`}
              value={summary?.TIDAK_HADIR ?? 0}
              icon={UserX}
              iconColor="text-red-600"
              iconBg="bg-red-50"
            />
            <StatCard
              label={`Sakit (${pctSakit}%)`}
              value={summary?.SAKIT ?? 0}
              icon={Stethoscope}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
          </div>

          {/* Bulk Actions */}
          <PermissionGuard permission="update:attendance">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <span className="text-sm font-medium text-slate-700">
                Aksi Massal:
              </span>
              <Select
                options={statusOptions}
                value={bulkStatus}
                onChange={(e) =>
                  setBulkStatus(e.target.value as AttendanceStatus)
                }
                className="w-40"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkApply}
                disabled={selectedIds.size === 0}
              >
                Terapkan ke {selectedIds.size} Terpilih
              </Button>
              <div className="ml-auto">
                <Button
                  size="sm"
                  onClick={handleSaveAttendance}
                  isLoading={saveAttendance.isPending}
                >
                  <Save className="h-4 w-4" />
                  Simpan Absensi
                </Button>
              </div>
            </div>
          </PermissionGuard>

          {/* Attendance Table */}
          <TableRoot>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead>Nama Anggota</TableHead>
                <TableHead>No. Anggota</TableHead>
                <TableHead>Status Kehadiran</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Poin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  message="Belum ada anggota untuk diabsen."
                />
              ) : (
                rows.map((row) => (
                  <TableRow key={row.memberId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(row.memberId)}
                        onChange={(e) =>
                          handleSelectMember(row.memberId, e.target.checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900">
                        {row.fullName}
                      </p>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {row.memberNumber}
                    </TableCell>
                    <TableCell>
                      <Select
                        options={statusOptions}
                        value={row.status}
                        onChange={(e) =>
                          handleStatusChange(
                            row.memberId,
                            e.target.value as AttendanceStatus
                          )
                        }
                        className="w-36"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.notes}
                        onChange={(e) =>
                          handleNotesChange(row.memberId, e.target.value)
                        }
                        placeholder="Keterangan..."
                        className="max-w-[200px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.points} pts</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableRoot>

          {/* Discussion Notes */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Hasil Pembahasan Rapat
              </h2>
              <PermissionGuard permission="update:meeting">
                {!notesEditing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotesEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    isLoading={updateMeeting.isPending}
                  >
                    <Save className="h-4 w-4" />
                    Simpan
                  </Button>
                )}
              </PermissionGuard>
            </div>
            {notesEditing ? (
              <Textarea
                value={discussionNotes}
                onChange={(e) => setDiscussionNotes(e.target.value)}
                placeholder="Tulis hasil pembahasan rapat..."
                rows={6}
              />
            ) : (
              <div className="prose prose-sm max-w-none text-slate-600">
                {discussionNotes || (
                  <p className="text-slate-400 italic">
                    Belum ada catatan pembahasan.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
