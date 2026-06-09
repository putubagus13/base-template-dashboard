// src/app/dashboard/users/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { UsersTable } from "./_components/users-table";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const user = await getAuthUser();

  if (!user || !hasPermission(user, "read:user")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengguna</h1>
        <p className="mt-1 text-sm text-slate-500">
          {/* Manage user accounts and their role assignments. */}
          Kelola akun pengguna dan penugasan peran mereka.
        </p>
      </div>
      <UsersTable />
    </div>
  );
}
