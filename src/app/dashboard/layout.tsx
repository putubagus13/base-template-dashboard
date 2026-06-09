// src/app/dashboard/layout.tsx
import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import UserProvider from "@/provider/user-provider";

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
      <div className="flex h-full">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
