// src/app/dashboard/attendance/meeting-types/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { MeetingTypesTable } from "./_components/meeting-types-table";

export const metadata: Metadata = { title: "Tipe Rapat" };

export default async function MeetingTypesPage() {
  const user = await getAuthUser();

  if (!user || !hasPermission(user, "read:meetingType")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tipe Rapat</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola tipe-tipe rapat organisasi
        </p>
      </div>
      <MeetingTypesTable />
    </div>
  );
}
