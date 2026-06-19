// src/app/dashboard/finance/loans/[id]/_components/loan-detail-client.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Plus } from "lucide-react";
import {
  useLoan,
  useVerifyLoan,
  useDeleteLoan,
  useVerifyLoanPayment,
} from "@/hooks/use-loans";
import { usePermissions } from "@/hooks/use-permission";
import {
  Button,
  Badge,
  Spinner,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PaymentFormDialog } from "./payment-form-dialog";
import { formatDate } from "@/utils/format";
import { LoanStatus } from "@prisma/client";

const STATUS_BADGE: Record<
  LoanStatus,
  {
    label: string;
    variant: "default" | "success" | "warning" | "destructive" | "secondary";
  }
> = {
  PENDING: { label: "Menunggu", variant: "warning" },
  APPROVED: { label: "Disetujui", variant: "success" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
  PAID_OFF: { label: "Lunas", variant: "default" },
};

const PAYMENT_STATUS: Record<
  LoanStatus,
  {
    label: string;
    variant: "default" | "success" | "warning" | "destructive" | "secondary";
  }
> = {
  PENDING: { label: "Menunggu", variant: "warning" },
  APPROVED: { label: "Disetujui", variant: "success" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
  PAID_OFF: { label: "Lunas", variant: "default" },
};

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

type Props = { loanId: string };

export function LoanDetailClient({ loanId }: Props) {
  const { can } = usePermissions();
  const { data, isLoading } = useLoan(loanId);
  const verifyLoan = useVerifyLoan(loanId);
  const verifyPayment = useVerifyLoanPayment();
  const deleteLoan = useDeleteLoan();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loan = (data as { data?: unknown })?.data as
    | import("@/types").LoanDetailProfile
    | undefined;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!loan) {
    return (
      <p className="text-center text-slate-500 py-12">
        Pinjaman tidak ditemukan.
      </p>
    );
  }

  const badge = STATUS_BADGE[loan.status];
  const canVerify = can("verify:loan") && loan.status === "PENDING";
  const canVerifyPayment = can("verify:loanPayment");
  const canAddPayment = can("create:loanPayment") && loan.status === "APPROVED";
  const canDelete = can("delete:loan") && loan.status === "PENDING";
  const progress =
    parseFloat(loan.totalOwed) > 0
      ? (parseFloat(loan.paidAmount) / parseFloat(loan.totalOwed)) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => (window.location.href = "/dashboard/finance/loans")}
        className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Pinjaman
      </button>

      {/* Loan Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{loan.loanNumber}</CardTitle>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Peminjam</p>
              <p className="font-medium">{loan.borrower.name}</p>
              <p className="text-xs text-slate-400">
                {loan.borrower.isMember ? "Anggota" : "Eksternal"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Akun Kas</p>
              <p className="font-medium">{loan.account.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tanggal Pinjaman</p>
              <p className="font-medium">{formatDate(loan.loanDate)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Jatuh Tempo</p>
              <p className="font-medium">{formatDate(loan.dueDate)}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Nominal</p>
              <p className="text-lg font-bold">
                {formatCurrency(loan.principal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Bunga</p>
              <p className="text-lg font-bold">
                {(parseFloat(loan.interestRate) * 100).toFixed(1)}%/bln
              </p>
              <p className="text-xs text-slate-400">
                Total: {formatCurrency(loan.totalInterest)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Bayar</p>
              <p className="text-lg font-bold">
                {formatCurrency(loan.totalOwed)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sisa</p>
              <p className="text-lg font-bold text-amber-700">
                {formatCurrency(loan.remainingAmount)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Terbayar: {formatCurrency(loan.paidAmount)}</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>

          {loan.purpose && (
            <div className="mt-4">
              <p className="text-xs text-slate-500">Tujuan</p>
              <p className="text-sm">{loan.purpose}</p>
            </div>
          )}
          {loan.notes && (
            <div className="mt-2">
              <p className="text-xs text-slate-500">Catatan</p>
              <p className="text-sm">{loan.notes}</p>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <span>Dicatat oleh: {loan.recorder.name}</span>
            {loan.verifier && (
              <span>• Diverifikasi oleh: {loan.verifier.name}</span>
            )}
          </div>

          {/* Verify Actions */}
          {canVerify && (
            <div className="mt-4 flex gap-3 border-t border-slate-100 pt-4">
              <Button
                onClick={() => verifyLoan.mutate({ action: "approve" })}
                isLoading={verifyLoan.isPending}
              >
                <CheckCircle2 className="h-4 w-4" /> Setujui
              </Button>
              <Button
                variant="outline"
                onClick={() => verifyLoan.mutate({ action: "reject" })}
                isLoading={verifyLoan.isPending}
              >
                <XCircle className="h-4 w-4" /> Tolak
              </Button>
            </div>
          )}

          {/* Delete Action */}
          {canDelete && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Hapus Pinjaman
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Riwayat Pembayaran</CardTitle>
            {canAddPayment && parseFloat(loan.remainingAmount) > 0 && (
              <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                <Plus className="h-4 w-4" /> Tambah Pembayaran
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TableRoot>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pencatat</TableHead>
                <TableHead>Verifikator</TableHead>
                <TableHead>Catatan</TableHead>
                {canVerifyPayment && <TableHead>Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loan.payments.length === 0 ? (
                <TableEmpty
                  colSpan={canVerifyPayment ? 7 : 6}
                  message="Belum ada pembayaran."
                />
              ) : (
                loan.payments.map((p) => {
                  const pBadge = PAYMENT_STATUS[p.status];
                  const isPendingPayment = p.status === "PENDING";
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.paymentDate)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(p.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={pBadge.variant}>{pBadge.label}</Badge>
                      </TableCell>
                      <TableCell>{p.recorder.name}</TableCell>
                      <TableCell>{p.verifier?.name ?? "-"}</TableCell>
                      <TableCell className="text-slate-500">
                        {p.notes ?? "-"}
                      </TableCell>
                      {canVerifyPayment && (
                        <TableCell>
                          {isPendingPayment && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  verifyPayment.mutate({
                                    paymentId: p.id,
                                    action: "approve",
                                  })
                                }
                                isLoading={verifyPayment.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  verifyPayment.mutate({
                                    paymentId: p.id,
                                    action: "reject",
                                  })
                                }
                                isLoading={verifyPayment.isPending}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </TableRoot>
        </CardContent>
      </Card>

      {/* Payment Form Dialog */}
      <PaymentFormDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        loanId={loanId}
        remainingAmount={parseFloat(loan.remainingAmount)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Hapus Pinjaman"
        description="Apakah Anda yakin ingin menghapus pinjaman ini?"
        confirmLabel="Hapus"
        isLoading={deleteLoan.isPending}
        onConfirm={() =>
          deleteLoan.mutate(loanId, {
            onSuccess: () =>
              (window.location.href = "/dashboard/finance/loans"),
          })
        }
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
