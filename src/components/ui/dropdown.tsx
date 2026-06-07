// src/components/ui/dropdown.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/utils/cn";

type DropdownItem = {
  label: string;
  icon?: React.ElementType;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "danger";
  disabled?: boolean;
  separator?: never;
} | {
  separator: true;
  label?: never;
  icon?: never;
  onClick?: never;
  href?: never;
  variant?: never;
  disabled?: never;
};

type DropdownProps = {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
};

export function Dropdown({ trigger, items, align = "right", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen((v) => !v)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 min-w-[160px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg",
            "animate-fade-in",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) => {
            if ("separator" in item && item.separator) {
              return <div key={i} className="my-1 border-t border-slate-100" />;
            }

            const Icon = item.icon;

            const content = (
              <span className="flex items-center gap-2.5">
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      item.variant === "danger" ? "text-red-400" : "text-slate-400"
                    )}
                  />
                )}
                {item.label}
              </span>
            );

            if (item.href) {
              return (
                <a
                  key={i}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-sm transition-colors",
                    item.variant === "danger"
                      ? "text-red-600 hover:bg-red-50"
                      : "text-slate-700 hover:bg-slate-50",
                    item.disabled && "pointer-events-none opacity-50"
                  )}
                >
                  {content}
                </a>
              );
            }

            return (
              <button
                key={i}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                disabled={item.disabled}
                className={cn(
                  "flex w-full items-center px-3 py-2 text-sm transition-colors",
                  item.variant === "danger"
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-700 hover:bg-slate-50",
                  item.disabled && "pointer-events-none opacity-50"
                )}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
