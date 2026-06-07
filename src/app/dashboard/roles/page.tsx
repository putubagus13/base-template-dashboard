// src/app/dashboard/roles/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { RolesGrid } from "./_components/roles-grid";

export const metadata: Metadata = { title: "Roles & Permissions" };

export default async function RolesPage() {
  const user = await getAuthUser();

  if (!user || !hasPermission(user, "read:role")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage system roles and assign permissions dynamically.
        </p>
      </div>
      <RolesGrid />
    </div>
  );
}
