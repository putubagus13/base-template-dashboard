// src/app/dashboard/finance/summary/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { FinanceSummaryClient } from "./_components/finance-summary-client";

export const metadata: Metadata = { title: "Ringkasan Keuangan" };

export default async function FinanceSummaryPage() {
  const user = await getAuthUser();
  if (!user || !hasPermission(user, "read:cashTransaction")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Ringkasan Keuangan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview keuangan organisasi Anda
        </p>
      </div>
      <FinanceSummaryClient />
    </div>
  );
}
