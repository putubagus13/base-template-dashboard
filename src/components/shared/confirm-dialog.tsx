// src/components/shared/confirm-dialog.tsx
// ============================================================
// REUSABLE CONFIRM / DANGER ACTION DIALOG
//
// <ConfirmDialog
//   open={open}
//   onClose={() => setOpen(false)}
//   onConfirm={handleDelete}
//   title="Delete User"
//   description="Are you sure? This action cannot be undone."
//   isLoading={deleteUser.isPending}
// />
// ============================================================
"use client";

import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  isLoading?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600">{description}</p>
      <DialogFooter className="mt-4 -mx-6 -mb-5 rounded-b-2xl">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "danger" ? "destructive" : "default"}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
