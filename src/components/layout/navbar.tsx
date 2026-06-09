// src/components/layout/navbar.tsx
"use client";

import { useState } from "react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/hooks/use-auth";
import { cn } from "@/utils/cn";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "??";

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div />

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-slate-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform",
              dropdownOpen && "rotate-180"
            )}
          />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-xs font-medium text-slate-500">
                  Signed in as
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-slate-900">
                  {user?.email}
                </p>
              </div>
              <div className="px-1 py-1">
                <a
                  href="/dashboard/profile"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="h-4 w-4 text-slate-400" />
                  Profile
                </a>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout.mutate();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
