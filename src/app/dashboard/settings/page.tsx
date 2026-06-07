// src/app/dashboard/settings/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { isSuperAdmin } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { SettingsClient } from "./_components/settings-client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getAuthUser();

  // Only super admin can access full settings
  if (!user || !isSuperAdmin(user)) {
    redirect("/dashboard/profile");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage application configuration. Changes affect all users.
        </p>
      </div>
      <SettingsClient />
    </div>
  );
}
