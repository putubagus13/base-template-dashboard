// src/app/dashboard/layout.tsx
import type { Metadata } from "next";
import UserProvider from "@/provider/user-provider";
import { DashboardShell } from "./_components/dashboard-shell";

export const metadata: Metadata = {
  title: { template: "%s | Dashboard", default: "Dashboard" },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}
