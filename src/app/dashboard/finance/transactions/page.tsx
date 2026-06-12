// src/app/dashboard/finance/transactions/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { TransactionsTable } from "./_components/transactions-table";

export const metadata: Metadata = { title: "Transaksi" };

export default async function TransactionsPage() {
  const user = await getAuthUser();
  if (!user || !hasPermission(user, "read:cashTransaction")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transaksi Kas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola transaksi keuangan organisasi
        </p>
      </div>
      <TransactionsTable />
    </div>
  );
}
