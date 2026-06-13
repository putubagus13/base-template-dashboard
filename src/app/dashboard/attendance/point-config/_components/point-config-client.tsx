// src/app/dashboard/attendance/point-config/_components/point-config-client.tsx
"use client";

import { useState, useEffect } from "react";
import { Save, Settings2 } from "lucide-react";
import {
  useAttendancePointConfig,
  useUpdateAttendancePointConfig,
} from "@/hooks/use-attendance";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button, Input, FormField } from "@/components/ui";
import type { AttendanceStatus } from "@prisma/client";
import type { AttendancePointConfigProfile } from "@/types";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  HADIR: "Hadir",
  IZIN: "Izin",
  TIDAK_HADIR: "Tidak Hadir",
  SAKIT: "Sakit",
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  HADIR: "bg-emerald-50 text-emerald-700 border-emerald-200",
  IZIN: "bg-amber-50 text-amber-700 border-amber-200",
  TIDAK_HADIR: "bg-red-50 text-red-700 border-red-200",
  SAKIT: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_ORDER: AttendanceStatus[] = [
  "HADIR",
  "IZIN",
  "SAKIT",
  "TIDAK_HADIR",
];

export function PointConfigClient() {
  const { data, isLoading } = useAttendancePointConfig();
  const updateConfig = useUpdateAttendancePointConfig();

  const [configs, setConfigs] = useState<Record<AttendanceStatus, number>>({
    HADIR: 10,
    IZIN: 5,
    SAKIT: 5,
    TIDAK_HADIR: 0,
  });

  useEffect(() => {
    const items = data?.data as AttendancePointConfigProfile[] | undefined;
    if (items && items.length > 0) {
      const map: Record<string, number> = {};
      for (const item of items) {
        map[item.status] = item.points;
      }
      setConfigs(map as Record<AttendanceStatus, number>);
    }
  }, [data]);

  const handleSave = () => {
    const payload = STATUS_ORDER.map((status) => ({
      status,
      points: configs[status] ?? 0,
    }));
    updateConfig.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          Poin yang diatur di sini akan otomatis ditambahkan ke{" "}
          <strong>total poin aktivitas</strong> anggota setiap kali absensi
          disimpan.
        </p>
      </div>

      {/* Config Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className={`rounded-xl border p-5 ${STATUS_COLORS[status]}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                <span className="font-semibold">{STATUS_LABELS[status]}</span>
              </div>
            </div>
            <FormField htmlFor={`points-${status}`} label="Poin">
              <Input
                id={`points-${status}`}
                type="number"
                min={0}
                value={configs[status] ?? 0}
                onChange={(e) =>
                  setConfigs((prev) => ({
                    ...prev,
                    [status]: Math.max(0, Number(e.target.value)),
                  }))
                }
                className="w-24"
              />
            </FormField>
          </div>
        ))}
      </div>

      {/* Save */}
      <PermissionGuard permission="update:attendancePointConfig">
        <div className="flex justify-end">
          <Button onClick={handleSave} isLoading={updateConfig.isPending}>
            <Save className="h-4 w-4" />
            Simpan Konfigurasi
          </Button>
        </div>
      </PermissionGuard>
    </div>
  );
}
