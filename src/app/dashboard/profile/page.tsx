// src/app/dashboard/profile/page.tsx
import type { Metadata } from "next";
import { ProfileClient } from "./_components/profile-client";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account information and security settings.
        </p>
      </div>
      <ProfileClient />
    </div>
  );
}
