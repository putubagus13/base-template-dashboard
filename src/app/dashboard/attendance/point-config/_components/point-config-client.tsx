// src/app/dashboard/attendance/point-config/_components/point-config-client.tsx
"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, Star, Save, X, Check } from "lucide-react";
import {
  useAttendancePointConfig,
  useUpdateAttendancePointConfig,
} from "@/hooks/use-attendance";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui";
import type { AttendanceStatus } from "@prisma/client";
import type { AttendancePointConfigProfile } from "@/types";

// ─── Item definitions ────────────────────────────────────────

type PointItem = {
  key: AttendanceStatus | string;
  title: string;
  description: string;
  icon: "star" | "clock" | "hand" | "heart" | "stethoscope";
  status?: AttendanceStatus;
};

const POINT_ITEMS: PointItem[] = [
  {
    key: "HADIR",
    title: "Hadir Rapat",
    description: "Poin untuk kehadiran rapat",
    icon: "star",
    status: "HADIR",
  },
  // {
  //   key: "IURAN",
  //   title: "Iuran Tepat Waktu",
  //   description: "Poin untuk pembayaran iuran tepat waktu",
  //   icon: "clock",
  // },
  {
    key: "IZIN",
    title: "Izin Rapat",
    description: "Poin untuk ketidakhadiran dengan izin",
    icon: "hand",
    status: "IZIN",
  },
  // {
  //   key: "SUKARELA",
  //   title: "Kegiatan Sukarela",
  //   description: "Poin untuk partisipasi kegiatan sukarela",
  //   icon: "heart",
  // },
  {
    key: "SAKIT",
    title: "Sakit",
    description: "Poin untuk ketidakhadiran karena sakit",
    icon: "stethoscope",
    status: "SAKIT",
  },
];

const DEFAULT_POINTS: Record<string, number> = {
  HADIR: 15,
  IURAN: 5,
  IZIN: 5,
  SUKARELA: 15,
  SAKIT: 5,
};

// ─── Icon renderers ──────────────────────────────────────────

const ICON_MAP: Record<
  PointItem["icon"],
  { icon: React.ElementType; bg: string; text: string }
> = {
  star: { icon: Star, bg: "bg-blue-50", text: "text-blue-600" },
  clock: { icon: Star, bg: "bg-emerald-50", text: "text-emerald-600" },
  hand: { icon: Star, bg: "bg-amber-50", text: "text-amber-600" },
  heart: { icon: Star, bg: "bg-rose-50", text: "text-rose-600" },
  stethoscope: { icon: Star, bg: "bg-violet-50", text: "text-violet-600" },
};

// ─── Component ───────────────────────────────────────────────

export function PointConfigClient() {
  const { data, isLoading } = useAttendancePointConfig();
  const updateConfig = useUpdateAttendancePointConfig();

  const [editing, setEditing] = useState(false);
  const [points, setPoints] = useState<Record<string, number>>(DEFAULT_POINTS);

  // Load from backend
  useEffect(() => {
    const items = data?.data as AttendancePointConfigProfile[] | undefined;
    if (items && items.length > 0) {
      setPoints((prev) => {
        const next = { ...prev };
        for (const item of items) {
          if (item.status in next) {
            next[item.status] = item.points;
          }
        }
        return next;
      });
    }
  }, [data]);

  const handleSave = () => {
    // Only send statuses that exist in the backend enum
    const payload = POINT_ITEMS.filter((item) => item.status).map((item) => ({
      status: item.status as AttendanceStatus,
      points: points[item.key] ?? 0,
    }));
    updateConfig.mutate(payload, {
      onSuccess: () => setEditing(false),
    });
  };

  const handleCancel = () => {
    // Revert to saved values
    const items = data?.data as AttendancePointConfigProfile[] | undefined;
    if (items) {
      setPoints((prev) => {
        const next = { ...prev };
        for (const item of items) {
          if (item.status in next) {
            next[item.status] = item.points;
          }
        }
        return next;
      });
    }
    setEditing(false);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-100" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-slate-50"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Konfigurasi Poin Keaktifan
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Atur poin reward untuk setiap aktivitas anggota
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!editing ? (
            <PermissionGuard permission="update:attendancePointConfig">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setEditing(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Edit Poin
              </Button>
            </PermissionGuard>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
                Batal
              </Button>
              <Button
                size="sm"
                className="rounded-lg"
                onClick={handleSave}
                isLoading={updateConfig.isPending}
              >
                <Save className="h-4 w-4" />
                Simpan
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── List ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 p-6 sm:p-8">
        {POINT_ITEMS.map((item) => {
          const iconConfig = ICON_MAP[item.icon];
          const IconComponent = iconConfig.icon;
          const value = points[item.key] ?? 0;

          return (
            <div
              key={item.key}
              className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 transition-colors hover:border-slate-200 hover:bg-slate-50/50"
            >
              {/* Icon */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconConfig.bg}`}
              >
                <IconComponent className={`h-5 w-5 ${iconConfig.text}`} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>

              {/* Value */}
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) =>
                      setPoints((prev) => ({
                        ...prev,
                        [item.key]: Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-lg font-bold text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                  <span className="text-sm text-slate-400">poin</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-800">
                    {value}
                  </span>
                  <span className="text-sm text-slate-400">poin</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer info ───────────────────────────────────── */}
      <div className="border-t border-slate-100 px-6 py-4 sm:px-8">
        <div className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <p className="text-xs text-slate-500">
            Poin akan otomatis disinkronisasi ke{" "}
            <span className="font-medium text-slate-700">
              total poin aktivitas
            </span>{" "}
            anggota setiap kali absensi disimpan.
          </p>
        </div>
      </div>
    </div>
  );
}
