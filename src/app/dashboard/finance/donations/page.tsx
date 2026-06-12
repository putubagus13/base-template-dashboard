// src/app/dashboard/finance/donations/page.tsx
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { DonationForm } from "./_components/donation-form";
import { DonorLeaderboard } from "./_components/donor-leaderboard";

export const metadata: Metadata = { title: "Donasi" };

export default async function DonationsPage() {
  const user = await getAuthUser();

  if (!user || !hasPermission(user, "create:cashTransaction")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Donasi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Catat donasi masuk dan lihat peringkat donatur teratas
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DonationForm />
        </div>
        <div>
          <DonorLeaderboard />
        </div>
      </div>
    </div>
  );
}
