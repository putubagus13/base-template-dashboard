// src/app/dashboard/attendance/leaderboard/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { LeaderboardClient } from "./_components/leaderboard-client";

export const metadata: Metadata = { title: "Leaderboard Absensi" };

export default async function LeaderboardPage() {
  const user = await getAuthUser();

  if (!user || !hasPermission(user, "read:attendance")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Leaderboard Keaktifan Anggota
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Peringkat anggota berdasarkan total kehadiran dan poin absensi
        </p>
      </div>
      <LeaderboardClient />
    </div>
  );
}
