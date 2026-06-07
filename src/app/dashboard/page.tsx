// src/app/dashboard/page.tsx
import type { Metadata } from "next";
import { Users, Shield, Activity, CheckCircle2 } from "lucide-react";
import { getAuthUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { StatCard } from "@/components/ui/stat-card";
import { formatDateTime } from "@/utils/format";

export const metadata: Metadata = { title: "Overview" };

async function getDashboardStats() {
  const [totalUsers, activeUsers, totalRoles, recentLogs] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.role.count(),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return { totalUsers, activeUsers, totalRoles, recentLogs };
}

export default async function DashboardPage() {
  const [user, stats] = await Promise.all([
    getAuthUser(),
    getDashboardStats(),
  ]);

  const activeRate =
    stats.totalUsers > 0
      ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {getGreeting()}, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s an overview of your system.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Active Users"
          value={stats.activeUsers}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          trend={{ value: activeRate, direction: "up", label: "of total" }}
        />
        <StatCard
          label="Total Roles"
          value={stats.totalRoles}
          icon={Shield}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <StatCard
          label="Audit Logs"
          value="Live"
          icon={Activity}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-700">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recentLogs.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-400">
                No activity recorded yet.
              </div>
            ) : (
              stats.recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-6 py-3.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                    {log.user?.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-700">
                      <span className="font-medium">{log.user?.name ?? "System"}</span>
                      {" — "}
                      <span className="capitalize">{log.action}</span>
                      {" "}
                      <span className="text-slate-500">{log.subject}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-700">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {[
              { label: "Manage Users", href: "/dashboard/users", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Manage Roles", href: "/dashboard/roles", icon: Shield, color: "text-violet-600", bg: "bg-violet-50" },
              { label: "View Audit Logs", href: "/dashboard/audit-logs", icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "My Profile", href: "/dashboard/profile", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm"
              >
                <div className={`rounded-lg p-2 ${action.bg} transition-colors group-hover:bg-white`}>
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  {action.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
