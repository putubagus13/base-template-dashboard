// src/components/ui/dialog.tsx
// ============================================================
// DIALOG / MODAL COMPONENT
// Accessible modal menggunakan native <dialog> + Tailwind.
// ============================================================
"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

type DialogSize = "sm" | "md" | "lg" | "xl";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: DialogSize;
  children: React.ReactNode;
  className?: string;
};

const SIZE_MAP: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Sync open state dengan native dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Close on backdrop click
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) handleClose();
  };

  // Close on Escape (native dialog handles this, sync state)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      handleClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [handleClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className={cn(
        "w-full rounded-2xl p-0 shadow-xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm",
        "mx-4 open:animate-fade-in",
        SIZE_MAP[size],
        className
      )}
    >
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </dialog>
  );
}

// ─── Dialog Footer helper ──────────────────────────────────────

type DialogFooterProps = {
  children: React.ReactNode;
  className?: string;
};

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}
