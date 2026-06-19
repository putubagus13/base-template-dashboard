// src/app/dashboard/finance/loans/[id]/_components/payment-form-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button, Input, FormField } from "@/components/ui";
import { useCreateLoanPayment } from "@/hooks/use-loans";
import { toLocalDateString } from "@/utils/format";

type PaymentFormDialogProps = {
  open: boolean;
  onClose: () => void;
  loanId: string;
  remainingAmount: number;
};

export function PaymentFormDialog({
  open,
  onClose,
  loanId,
  remainingAmount,
}: PaymentFormDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(toLocalDateString());
  const [notes, setNotes] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const createPayment = useCreateLoanPayment(loanId);

  useEffect(() => {
    if (open) {
      setAmount("");
      setPaymentDate(toLocalDateString());
      setNotes("");
      setShowConfirmation(false);
    }
  }, [open]);

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const numAmount = parseFloat(amount) || 0;
  const exceedsRemaining = numAmount > remainingAmount;

  const handleSubmit = () => {
    createPayment.mutate(
      {
        amount: numAmount,
        paymentDate,
        notes: notes || null,
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <>
      <Dialog
        open={open && !showConfirmation}
        onClose={onClose}
        title="Tambah Pembayaran"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="text-slate-500">Sisa Pinjaman</p>
            <p className="text-xl font-bold text-amber-700">
              {formatCurrency(remainingAmount)}
            </p>
          </div>

          <FormField
            label="Nominal Pembayaran"
            htmlFor="payment-amount"
            required
          >
            <Input
              id="payment-amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {exceedsRemaining && (
              <p className="text-xs text-red-600">
                Nominal melebihi sisa pinjaman (
                {formatCurrency(remainingAmount)})
              </p>
            )}
          </FormField>

          <FormField label="Tanggal Pembayaran" htmlFor="payment-date" required>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </FormField>

          <FormField label="Catatan" htmlFor="payment-notes">
            <Input
              id="payment-notes"
              placeholder="Catatan tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
        </div>

        <DialogFooter className="mt-4 -mx-4 -mb-4 sm:-mx-6 sm:-mb-5 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={() => setShowConfirmation(true)}
            disabled={!amount || !paymentDate || exceedsRemaining}
          >
            Ajukan Pembayaran
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Konfirmasi Pembayaran"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Pastikan data berikut sudah benar. Pembayaran yang sudah
            diverifikasi akan otomatis tercatat di transaksi kas.
          </p>
          <div className="rounded-lg border border-slate-200 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Nominal:</span>
              <span className="font-semibold">{formatCurrency(numAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal:</span>
              <span>{paymentDate}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-500">Sisa setelah bayar:</span>
              <span className="font-bold text-brand-700">
                {formatCurrency(Math.max(0, remainingAmount - numAmount))}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 -mx-4 -mb-4 sm:-mx-6 sm:-mb-5 rounded-b-2xl">
          <Button variant="outline" onClick={() => setShowConfirmation(false)}>
            Periksa Lagi
          </Button>
          <Button onClick={handleSubmit} isLoading={createPayment.isPending}>
            Konfirmasi & Ajukan
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
