// src/app/dashboard/finance/categories/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { CategoriesTable } from "./_components/categories-table";

export const metadata: Metadata = { title: "Kategori Transaksi" };

export default async function CategoriesPage() {
  const user = await getAuthUser();
  if (!user || !hasPermission(user, "read:transactionCategory")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Kategori Transaksi
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola kategori transaksi keuangan
        </p>
      </div>
      <CategoriesTable />
    </div>
  );
}
