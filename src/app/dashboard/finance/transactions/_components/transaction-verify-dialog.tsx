// src/app/dashboard/finance/transactions/_components/transaction-verify-dialog.tsx
"use client";

import { useState } from "react";
import { ShieldCheck, XCircle, CheckCircle } from "lucide-react";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import {
  useVerifyCashTransaction,
  CashTransactionWithRelations,
} from "@/hooks/use-cash-transactions";
import { TransactionType } from "@prisma/client";

const typeLabels: Record<TransactionType, string> = {
  INCOME: "Pemasukan",
  EXPENSE: "Pengeluaran",
  TRANSFER: "Transfer",
};

type Props = {
  open: boolean;
  onClose: () => void;
  transaction: CashTransactionWithRelations | null;
};

export function TransactionVerifyDialog({ open, onClose, transaction }: Props) {
  const [notes, setNotes] = useState("");
  const [selectedAction, setSelectedAction] = useState<
    "approve" | "reject" | null
  >(null);

  const verify = useVerifyCashTransaction(transaction?.id ?? "");

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleConfirm = () => {
    if (!selectedAction || !transaction) return;
    verify.mutate(
      { action: selectedAction, notes: notes || null },
      {
        onSuccess: () => {
          setNotes("");
          setSelectedAction(null);
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    setNotes("");
    setSelectedAction(null);
    onClose();
  };

  if (!transaction) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Verifikasi Transaksi"
      description="Tinjau dan verifikasi transaksi berikut."
      size="md"
    >
      <div className="space-y-4">
        {/* Transaction details */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Deskripsi</span>
            <span className="text-sm font-medium text-slate-900">
              {transaction.description}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Tipe</span>
            <span className="text-sm font-medium">
              {typeLabels[transaction.type]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Jumlah</span>
            <span className="text-sm font-bold">
              {formatCurrency(transaction.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Akun Kas</span>
            <span className="text-sm font-medium">
              {transaction.account?.name ?? "-"}
            </span>
          </div>
          {transaction.category && (
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Kategori</span>
              <span className="text-sm font-medium">
                {transaction.category.name}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Dicatat oleh</span>
            <span className="text-sm font-medium">
              {transaction.recorder?.name ?? "-"}
            </span>
          </div>
          {transaction.referenceNo && (
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">No. Referensi</span>
              <span className="text-sm font-medium">
                {transaction.referenceNo}
              </span>
            </div>
          )}
        </div>

        {/* Action selection */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSelectedAction("approve")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
              selectedAction === "approve"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <CheckCircle className="h-5 w-5" />
            Setujui
          </button>
          <button
            type="button"
            onClick={() => setSelectedAction("reject")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
              selectedAction === "reject"
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <XCircle className="h-5 w-5" />
            Tolak
          </button>
        </div>

        {/* Notes */}
        {selectedAction && (
          <FormField label="Catatan Verifikasi" htmlFor="verify-notes">
            <Textarea
              id="verify-notes"
              placeholder={
                selectedAction === "approve"
                  ? "Catatan persetujuan (opsional)"
                  : "Alasan penolakan (opsional)"
              }
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
        )}

        {selectedAction === "approve" && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <ShieldCheck className="h-4 w-4 inline mr-1" />
            Menyetujui transaksi ini akan memperbarui saldo akun kas secara
            otomatis.
          </div>
        )}
      </div>

      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-5 mt-2">
        <Button type="button" variant="outline" onClick={handleClose}>
          Batal
        </Button>
        {selectedAction && (
          <Button
            type="button"
            onClick={handleConfirm}
            isLoading={verify.isPending}
            variant={selectedAction === "approve" ? "default" : "outline"}
            className={
              selectedAction === "reject"
                ? "border-red-300 text-red-600 hover:bg-red-50"
                : ""
            }
          >
            {selectedAction === "approve"
              ? "Setujui Transaksi"
              : "Tolak Transaksi"}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
