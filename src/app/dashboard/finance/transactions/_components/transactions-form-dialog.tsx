// src/app/dashboard/finance/transactions/_components/transactions-form-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCashTransaction,
  useUpdateCashTransaction,
  CashTransactionWithRelations,
} from "@/hooks/use-cash-transactions";
import { TransactionType } from "@prisma/client";
import { CashAccount, TransactionCategory } from "@prisma/client";
import { toLocalDateString } from "@/utils";

const schema = z.object({
  accountId: z.string().min(1, "Akun kas wajib dipilih"),
  categoryId: z.string().optional().nullable(),
  type: z.enum(
    [TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.TRANSFER],
    {
      required_error: "Tipe wajib dipilih",
    }
  ),
  amount: z
    .string()
    .transform((v) => parseFloat(v || "0"))
    .pipe(z.number().positive("Jumlah harus lebih dari 0")),
  description: z.string().min(2, "Deskripsi minimal 2 karakter"),
  referenceNo: z.string().optional().nullable(),
  transactionDate: z.string().min(1, "Tanggal wajib diisi"),
  notes: z.string().optional().nullable(),
});

type FormInput = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  transaction?: CashTransactionWithRelations | undefined;
  accounts: CashAccount[];
  categories: TransactionCategory[];
};

const TYPE_OPTIONS = [
  { value: "INCOME", label: "Pemasukan" },
  { value: "EXPENSE", label: "Pengeluaran" },
  { value: "TRANSFER", label: "Transfer" },
];

function toDateStr(v: string | Date | null | undefined): string {
  if (!v) return "";
  return toLocalDateString(v);
}

function CreateForm({
  onClose,
  accounts,
  categories,
}: {
  onClose: () => void;
  accounts: CashAccount[];
  categories: TransactionCategory[];
}) {
  const create = useCreateCashTransaction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "EXPENSE",
      amount: 0,
      description: "",
      referenceNo: "",
      notes: "",
      transactionDate: toDateStr(new Date()),
      accountId: "",
      categoryId: "",
    },
  });

  const onSubmit = (data: FormInput) => {
    create.mutate(
      {
        accountId: data.accountId,
        categoryId: data.categoryId || null,
        type: data.type as TransactionType,
        amount: data.amount,
        description: data.description,
        referenceNo: data.referenceNo || null,
        transactionDate: data.transactionDate,
        notes: data.notes || null,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Tipe Transaksi"
          htmlFor="type"
          error={errors.type?.message}
          required
        >
          <Select
            id="type"
            options={TYPE_OPTIONS}
            placeholder="Pilih tipe"
            error={errors.type?.message}
            {...register("type")}
          />
        </FormField>
        <FormField
          label="Akun Kas"
          htmlFor="accountId"
          error={errors.accountId?.message}
          required
        >
          <Select
            id="accountId"
            options={accounts
              .filter((a) => a.isActive)
              .map((a) => ({ value: a.id, label: a.name }))}
            placeholder="Pilih akun kas"
            error={errors.accountId?.message}
            {...register("accountId")}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Jumlah"
          htmlFor="amount"
          error={errors.amount?.message}
          required
        >
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0"
            error={errors.amount?.message}
            {...register("amount")}
          />
        </FormField>
        <FormField
          label="Tanggal"
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
      </div>
      <FormField
        label="Kategori"
        htmlFor="categoryId"
        error={errors.categoryId?.message}
      >
        <Select
          id="categoryId"
          options={categories
            .filter((c) => c.isActive)
            .map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Pilih kategori (opsional)"
          {...register("categoryId")}
        />
      </FormField>
      <FormField
        label="Deskripsi"
        htmlFor="description"
        error={errors.description?.message}
        required
      >
        <Input
          id="description"
          placeholder="Deskripsi transaksi"
          error={errors.description?.message}
          {...register("description")}
        />
      </FormField>
      <FormField
        label="No. Referensi"
        htmlFor="referenceNo"
        error={errors.referenceNo?.message}
      >
        <Input
          id="referenceNo"
          placeholder="No. referensi (opsional)"
          {...register("referenceNo")}
        />
      </FormField>
      <FormField label="Catatan" htmlFor="notes" error={errors.notes?.message}>
        <Textarea
          id="notes"
          placeholder="Catatan tambahan (opsional)"
          rows={2}
          {...register("notes")}
        />
      </FormField>
      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-5 mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={create.isPending}>
          Buat Transaksi
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditForm({
  transaction,
  onClose,
  accounts,
  categories,
}: {
  transaction: CashTransactionWithRelations;
  onClose: () => void;
  accounts: CashAccount[];
  categories: TransactionCategory[];
}) {
  const update = useUpdateCashTransaction(transaction.id);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountId: transaction.accountId,
      categoryId: transaction.categoryId ?? "",
      type: transaction.type,
      amount: parseFloat(transaction.amount),
      description: transaction.description,
      referenceNo: transaction.referenceNo ?? "",
      transactionDate: toDateStr(transaction.transactionDate),
      notes: transaction.notes ?? "",
    },
  });

  const onSubmit = (data: FormInput) => {
    update.mutate(
      {
        accountId: data.accountId,
        categoryId: data.categoryId || null,
        type: data.type as TransactionType,
        amount: data.amount,
        description: data.description,
        referenceNo: data.referenceNo || null,
        transactionDate: data.transactionDate,
        notes: data.notes || null,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Tipe Transaksi"
          htmlFor="edit-type"
          error={errors.type?.message}
          required
        >
          <Select
            id="edit-type"
            options={TYPE_OPTIONS}
            placeholder="Pilih tipe"
            error={errors.type?.message}
            {...register("type")}
          />
        </FormField>
        <FormField
          label="Akun Kas"
          htmlFor="edit-accountId"
          error={errors.accountId?.message}
          required
        >
          <Select
            id="edit-accountId"
            options={accounts
              .filter((a) => a.isActive)
              .map((a) => ({ value: a.id, label: a.name }))}
            placeholder="Pilih akun kas"
            error={errors.accountId?.message}
            {...register("accountId")}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Jumlah"
          htmlFor="edit-amount"
          error={errors.amount?.message}
          required
        >
          <Input
            id="edit-amount"
            type="number"
            step="0.01"
            placeholder="0"
            error={errors.amount?.message}
            {...register("amount")}
          />
        </FormField>
        <FormField
          label="Tanggal"
          htmlFor="edit-transactionDate"
          error={errors.transactionDate?.message}
          required
        >
          <Input
            id="edit-transactionDate"
            type="date"
            error={errors.transactionDate?.message}
            {...register("transactionDate")}
          />
        </FormField>
      </div>
      <FormField
        label="Kategori"
        htmlFor="edit-categoryId"
        error={errors.categoryId?.message}
      >
        <Select
          id="edit-categoryId"
          options={categories
            .filter((c) => c.isActive)
            .map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Pilih kategori (opsional)"
          {...register("categoryId")}
        />
      </FormField>
      <FormField
        label="Deskripsi"
        htmlFor="edit-description"
        error={errors.description?.message}
        required
      >
        <Input
          id="edit-description"
          placeholder="Deskripsi transaksi"
          error={errors.description?.message}
          {...register("description")}
        />
      </FormField>
      <FormField
        label="No. Referensi"
        htmlFor="edit-referenceNo"
        error={errors.referenceNo?.message}
      >
        <Input
          id="edit-referenceNo"
          placeholder="No. referensi (opsional)"
          {...register("referenceNo")}
        />
      </FormField>
      <FormField
        label="Catatan"
        htmlFor="edit-notes"
        error={errors.notes?.message}
      >
        <Textarea
          id="edit-notes"
          placeholder="Catatan tambahan (opsional)"
          rows={2}
          {...register("notes")}
        />
      </FormField>
      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-5 mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={update.isPending}>
          Simpan Perubahan
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TransactionFormDialog({
  open,
  onClose,
  transaction,
  accounts,
  categories,
}: Props) {
  const isEditing = Boolean(transaction);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Transaksi" : "Tambah Transaksi"}
      description={
        isEditing ? "Perbarui data transaksi." : "Isikan detail transaksi baru."
      }
      size="lg"
    >
      {isEditing && transaction ? (
        <EditForm
          transaction={transaction}
          onClose={onClose}
          accounts={accounts}
          categories={categories}
        />
      ) : (
        <CreateForm
          onClose={onClose}
          accounts={accounts}
          categories={categories}
        />
      )}
    </Dialog>
  );
}
