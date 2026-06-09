// src/app/dashboard/users/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { UsersTable } from "./_components/members-table";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const user = await getAuthUser();

  if (!user || !hasPermission(user, "read:member")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Manajemen Anggota Organisasi
        </h1>
        <p className="mt-1 text-sm text-slate-500">Kelola anggota organisasi</p>
      </div>
      <UsersTable />
    </div>
  );
}
