// src/app/dashboard/attendance/point-config/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { PointConfigClient } from "./_components/point-config-client";

export const metadata: Metadata = { title: "Konfigurasi Poin Absensi" };

export default async function PointConfigPage() {
  const user = await getAuthUser();

  if (!user || !hasPermission(user, "read:attendancePointConfig")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Konfigurasi Poin Absensi
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Atur poin reward untuk setiap status kehadiran. Poin akan otomatis
          disinkronisasi ke total poin aktivitas anggota.
        </p>
      </div>
      <PointConfigClient />
    </div>
  );
}
