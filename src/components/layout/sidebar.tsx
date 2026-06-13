// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  ChevronRight,
  ChevronDown,
  Activity,
  User,
  Wallet,
  Landmark,
  ArrowLeftRight,
  Tags,
  Heart,
  HandCoins,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Tag,
  Settings2,
  Trophy,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { usePermissions } from "@/hooks/use-permission";
import type { PermissionString } from "@/types/rbac";
import { STT_TGD_LOGO } from "../../../public";
import Image from "next/image";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  permission?: PermissionString;
  adminOnly?: boolean;
  children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "read:dashboard",
  },
  {
    label: "Anggota Organisasi",
    href: "/dashboard/member",
    icon: Users,
    permission: "read:member",
  },
  {
    label: "Keuangan",
    icon: Wallet,
    children: [
      {
        label: "Ringkasan",
        href: "/dashboard/finance/summary",
        icon: BarChart3,
        permission: "read:cashTransaction",
      },
      {
        label: "Akun Kas",
        href: "/dashboard/finance/cash-accounts",
        icon: Landmark,
        permission: "read:cashAccount",
      },
      {
        label: "Kategori Transaksi",
        href: "/dashboard/finance/categories",
        icon: Tags,
        permission: "read:transactionCategory",
      },
      {
        label: "Transaksi",
        href: "/dashboard/finance/transactions",
        icon: ArrowLeftRight,
        permission: "read:cashTransaction",
      },
      {
        label: "Donatur",
        href: "/dashboard/finance/donors",
        icon: Heart,
        permission: "read:donor",
      },
      {
        label: "Donasi",
        href: "/dashboard/finance/donations",
        icon: HandCoins,
        permission: "create:cashTransaction",
      },
    ],
  },
  {
    label: "Absensi",
    icon: CalendarCheck,
    children: [
      {
        label: "Rapat",
        href: "/dashboard/attendance/meetings",
        icon: CalendarDays,
        permission: "read:meeting",
      },
      {
        label: "Tipe Rapat",
        href: "/dashboard/attendance/meeting-types",
        icon: Tag,
        permission: "read:meetingType",
      },
      {
        label: "Poin Absensi",
        href: "/dashboard/attendance/point-config",
        icon: Settings2,
        permission: "read:attendancePointConfig",
      },
      {
        label: "Leaderboard",
        href: "/dashboard/attendance/leaderboard",
        icon: Trophy,
        permission: "read:attendance",
      },
    ],
  },
  {
    label: "Pengguna",
    href: "/dashboard/users",
    icon: Users,
    permission: "read:user",
  },
  {
    label: "Peran & Izin",
    href: "/dashboard/roles",
    icon: Shield,
    permission: "read:role",
  },
  {
    label: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: Activity,
    permission: "read:user",
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Profile", href: "/dashboard/profile", icon: User },
  {
    label: "Pengaturan",
    href: "/dashboard/settings",
    icon: Settings,
    adminOnly: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { can, isSuperAdmin } = usePermissions();

  // Track which parent menus are expanded
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {}
  );

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isChildActive = (item: NavItem): boolean => {
    if (item.children) {
      return item.children.some((child) => child.href && isActive(child.href));
    }
    return false;
  };

  const renderItem = (item: NavItem) => {
    const show =
      (!item.permission || can(item.permission)) &&
      (!item.adminOnly || isSuperAdmin);

    if (!show) return null;

    // Parent menu with children (submenu)
    if (item.children) {
      // Filter visible children based on permissions
      const visibleChildren = item.children.filter(
        (child) =>
          (!child.permission || can(child.permission)) &&
          (!child.adminOnly || isSuperAdmin)
      );
      // Don't render parent if no children are visible
      if (visibleChildren.length === 0) return null;

      const childActive = isChildActive(item);
      const isExpanded = expandedMenus[item.label] ?? childActive;

      return (
        <li key={item.label}>
          <button
            type="button"
            onClick={() => toggleMenu(item.label)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              childActive
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                childActive
                  ? "text-brand-600"
                  : "text-slate-400 group-hover:text-slate-600"
              )}
            />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-transform",
                isExpanded ? "rotate-0" : "-rotate-90",
                childActive ? "text-brand-400" : "text-slate-400"
              )}
            />
          </button>
          {isExpanded && (
            <ul className="mt-0.5 space-y-0.5 pl-7">
              {visibleChildren.map((child) => renderItem(child))}
            </ul>
          )}
        </li>
      );
    }

    // Regular item without children
    if (!item.href) return null;

    return (
      <li key={item.href}>
        <Link
          href={item.href as unknown as URL}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
            isActive(item.href)
              ? "bg-brand-50 text-brand-700"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <item.icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isActive(item.href)
                ? "text-brand-600"
                : "text-slate-400 group-hover:text-slate-600"
            )}
          />
          <span className="flex-1">{item.label}</span>
          {isActive(item.href) && (
            <ChevronRight className="h-3.5 w-3.5 text-brand-400" />
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <Image
              src={STT_TGD_LOGO.src}
              alt="Logo"
              className="object-contain"
              width={40}
              height={40}
            />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-900 line-clamp-1">
              STT Tunas Guna Dharma
            </span>
            <span className="text-xs font-medium text-slate-400 line-clamp-1">
              Dashboard
            </span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Main
        </p>
        <ul className="space-y-0.5">{NAV_ITEMS.map(renderItem)}</ul>
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-slate-200 px-3 py-3">
        <ul className="space-y-0.5">{BOTTOM_ITEMS.map(renderItem)}</ul>
      </div>
    </aside>
  );
}
