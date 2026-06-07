// src/app/dashboard/settings/_components/settings-client.tsx
"use client";

import { Bell, Globe, Lock, Database, Users } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Settings adalah placeholder — implementasi sesuai kebutuhan bisnis.
// Pola yang sama bisa dipakai untuk: app config, email templates, dsb.

type SettingSection = {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  items: SettingItem[];
};

type SettingItem = {
  label: string;
  description: string;
  type: "toggle" | "info" | "action";
  value?: string | boolean;
  actionLabel?: string;
  disabled?: boolean;
};

const SETTING_SECTIONS: SettingSection[] = [
  {
    id: "general",
    icon: Globe,
    title: "General",
    description: "Basic application settings",
    items: [
      {
        label: "Application Name",
        description: "The name shown in browser tab and emails",
        type: "info",
        value: "Dashboard Template",
      },
      {
        label: "Default Language",
        description: "Default language for new users",
        type: "info",
        value: "English (en)",
      },
    ],
  },
  {
    id: "security",
    icon: Lock,
    title: "Security",
    description: "Authentication and security configuration",
    items: [
      {
        label: "Session Timeout",
        description: "Access token expiry (requires code change)",
        type: "info",
        value: "15 minutes",
      },
      {
        label: "Refresh Token Duration",
        description: "How long users stay logged in with 'Remember me'",
        type: "info",
        value: "7 days",
      },
      {
        label: "Password Reset Expiry",
        description: "How long password reset links are valid",
        type: "info",
        value: "1 hour",
      },
    ],
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    description: "Email notification settings",
    badge: "Coming Soon",
    items: [
      {
        label: "Welcome Email",
        description: "Send welcome email to new users after registration",
        type: "toggle",
        value: true,
        disabled: true,
      },
      {
        label: "Password Reset Email",
        description: "Send password reset instructions via email",
        type: "toggle",
        value: true,
        disabled: true,
      },
    ],
  },
  {
    id: "database",
    icon: Database,
    title: "Database",
    description: "Database connection and maintenance",
    items: [
      {
        label: "Connection",
        description: "Supabase PostgreSQL via Prisma ORM",
        type: "info",
        value: "Connected",
      },
      {
        label: "Audit Logs Retention",
        description: "How long audit logs are kept (configure in cron job)",
        type: "info",
        value: "90 days",
      },
    ],
  },
  {
    id: "users",
    icon: Users,
    title: "User Management",
    description: "Default settings for user accounts",
    items: [
      {
        label: "Email Verification",
        description: "New users must verify their email before logging in",
        type: "toggle",
        value: true,
        disabled: true,
      },
      {
        label: "Default Role",
        description: "Role automatically assigned to new registrations",
        type: "info",
        value: "USER",
      },
    ],
  },
];

export function SettingsClient() {
  return (
    <div className="max-w-2xl space-y-6">
      <Alert variant="info">
        Settings values marked as <strong>Coming Soon</strong> are static placeholders.
        Connect them to your database or environment variables to make them dynamic.
      </Alert>

      {SETTING_SECTIONS.map((section) => (
        <div key={section.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <section.icon className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
                {section.badge && (
                  <Badge variant="warning" className="text-[10px]">{section.badge}</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">{section.description}</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {section.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>

                {item.type === "toggle" && (
                  <button
                    role="switch"
                    aria-checked={Boolean(item.value)}
                    disabled={item.disabled}
                    className={`relative h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors
                      ${item.value ? "bg-indigo-600" : "bg-slate-200"}
                      disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform
                        ${item.value ? "translate-x-4" : "translate-x-0.5"}`}
                    />
                  </button>
                )}

                {item.type === "info" && (
                  <span className="shrink-0 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {item.value as string}
                  </span>
                )}

                {item.type === "action" && (
                  <Button variant="outline" size="sm" disabled={item.disabled}>
                    {item.actionLabel}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
