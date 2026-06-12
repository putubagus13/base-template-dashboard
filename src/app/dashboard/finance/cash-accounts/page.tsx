// src/app/dashboard/finance/cash-accounts/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { CashAccountsTable } from "./_components/cash-accounts-table";

export const metadata: Metadata = { title: "Akun Kas" };

export default async function CashAccountsPage() {
  const user = await getAuthUser();

  if (!user || !hasPermission(user, "read:cashAccount")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Akun Kas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola akun kas organisasi
        </p>
      </div>
      <CashAccountsTable />
    </div>
  );
}
