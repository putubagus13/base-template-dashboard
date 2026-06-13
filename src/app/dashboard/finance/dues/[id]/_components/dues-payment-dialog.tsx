// src/app/dashboard/finance/dues/[id]/_components/dues-payment-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button, Input, Select, Textarea, FormField } from "@/components/ui";
import { usePayDuesPayment } from "@/hooks/use-dues";
import { useCashAccounts } from "@/hooks/use-cash-accounts";
import type { MemberDuesPaymentProfile } from "@/types";

const todayStr = () => new Date().toISOString().split("T")[0] ?? "";

const paySchema = z.object({
  accountId: z.string().min(1, "Akun kas wajib dipilih"),
  transactionDate: z.string().min(1, "Tanggal transaksi wajib diisi"),
  notes: z.string().optional().nullable(),
});

type PayInput = z.infer<typeof paySchema>;

function formatCurrency(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

type Props = {
  payment: MemberDuesPaymentProfile;
  agendaTitle: string;
  onClose: () => void;
};

export function DuesPaymentDialog({ payment, agendaTitle, onClose }: Props) {
  const payMutation = usePayDuesPayment(payment.id);
  const { data: accountsData } = useCashAccounts({ isActive: true });
  const accounts = accountsData?.data?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PayInput>({
    resolver: zodResolver(paySchema),
    defaultValues: {
      accountId: "",
      transactionDate: todayStr(),
      notes: "",
    },
  });

  const onSubmit = (data: PayInput) => {
    payMutation.mutate(
      {
        accountId: data.accountId,
        transactionDate: data.transactionDate,
        notes: data.notes || null,
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title="Catat Pembayaran Iuran"
      size="md"
    >
      <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Agenda</p>
            <p className="font-medium text-slate-800">{agendaTitle}</p>
          </div>
          <div>
            <p className="text-slate-500">Anggota</p>
            <p className="font-medium text-slate-800">
              {payment.member.fullName}
            </p>
          </div>
          <div>
            <p className="text-slate-500">No. Anggota</p>
            <p className="font-medium text-slate-800">
              {payment.member.memberNumber}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Nominal Iuran</p>
            <p className="text-lg font-bold text-slate-900">
              {formatCurrency(Number(payment.amount))}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          label="Akun Kas"
          htmlFor="accountId"
          error={errors.accountId?.message}
          required
        >
          <Select
            id="accountId"
            options={accounts.map((acc) => ({
              value: acc.id,
              label: acc.name,
            }))}
            placeholder="Pilih akun kas..."
            error={errors.accountId?.message}
            {...register("accountId")}
          />
        </FormField>

        <FormField
          label="Tanggal Pembayaran"
          htmlFor="transactionDate"
          error={errors.transactionDate?.message}
          required
        >
          <Input
            id="transactionDate"
            type="date"
            error={errors.transactionDate?.message}
            {...register("transactionDate")}
          />
        </FormField>

        <FormField
          label="Catatan"
          htmlFor="notes"
          error={errors.notes?.message}
        >
          <Textarea
            id="notes"
            placeholder="Catatan tambahan (opsional)"
            rows={2}
            {...register("notes")}
          />
        </FormField>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          Pembayaran akan otomatis membuat transaksi kas masuk (INCOME) yang
          sudah terverifikasi dan menambah saldo akun kas.
        </div>

        <DialogFooter className="-mx-6 -mb-5 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={payMutation.isPending}
          >
            Batal
          </Button>
          <Button type="submit" isLoading={payMutation.isPending}>
            Konfirmasi Pembayaran
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
