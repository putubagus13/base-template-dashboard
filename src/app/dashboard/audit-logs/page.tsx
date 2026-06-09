// src/app/dashboard/audit-logs/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { AuditLogsTable } from "./_components/audit-logs-table";

export const metadata: Metadata = { title: "Audit Logs" };

export default async function AuditLogsPage() {
  const user = await getAuthUser();
  if (!user || !hasPermission(user, "read:user")) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lacak semua aktivitas sistem dan tindakan pengguna.
        </p>
      </div>
      <AuditLogsTable />
    </div>
  );
}
