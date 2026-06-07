// src/components/ui/tabs.tsx
"use client";

import { createContext, useContext, useState } from "react";
import { cn } from "@/utils/cn";

type TabsContextValue = {
  activeTab: string;
  setActiveTab: (id: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tab components must be used inside <Tabs>");
  return ctx;
}

// ─── Tabs Root ────────────────────────────────────────────────

type TabsProps = {
  defaultTab: string;
  children: React.ReactNode;
  className?: string;
};

export function Tabs({ defaultTab, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// ─── Tab List ─────────────────────────────────────────────────

export function TabList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 rounded-xl border border-slate-200 bg-slate-100/60 p-1",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Tab Trigger ──────────────────────────────────────────────

type TabTriggerProps = {
  id: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  disabled?: boolean;
};

export function TabTrigger({ id, children, icon: Icon, disabled }: TabTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tab-panel-${id}`}
      id={`tab-${id}`}
      onClick={() => setActiveTab(id)}
      disabled={disabled}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

// ─── Tab Panel ────────────────────────────────────────────────

type TabPanelProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

export function TabPanel({ id, children, className }: TabPanelProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`tab-panel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={className}
    >
      {children}
    </div>
  );
}
