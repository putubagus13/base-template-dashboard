// src/app/dashboard/finance/cash-accounts/_components/cash-accounts-form-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCashAccount,
  useUpdateCashAccount,
} from "@/hooks/use-cash-accounts";
import { CashAccount } from "@prisma/client";

// ─── Schemas ──────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2, "Nama akun kas minimal 2 karakter"),
  description: z.string().optional().nullable(),
  balance: z
    .string()
    .transform((val) => (val === "" ? 0 : parseFloat(val)))
    .pipe(z.number().min(0, "Saldo awal tidak boleh negatif")),
  isActive: z.boolean(),
});

const editSchema = z.object({
  name: z.string().min(2, "Nama akun kas minimal 2 karakter").optional(),
  description: z.string().optional().nullable(),
  balance: z
    .string()
    .transform((val) => (val === "" ? 0 : parseFloat(val)))
    .pipe(z.number().min(0, "Saldo tidak boleh negatif"))
    .optional(),
  isActive: z.boolean().optional(),
});

type CreateInput = z.infer<typeof createSchema>;
type EditInput = z.infer<typeof editSchema>;

// ─── Types ────────────────────────────────────────────────────

type CashAccountForEdit = Pick<
  CashAccount,
  "id" | "name" | "description" | "balance" | "isActive"
>;

type CashAccountFormDialogProps = {
  open: boolean;
  onClose: () => void;
  account?: CashAccountForEdit | undefined;
};

// ─── Create Form ──────────────────────────────────────────────

function CreateCashAccountForm({ onClose }: { onClose: () => void }) {
  const createCashAccount = useCreateCashAccount();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateInput>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      description: "",
      balance: 0,
      isActive: true,
    },
  });

  const isActiveValue = watch("isActive");

  const onSubmit = (data: CreateInput) => {
    const payload = {
      name: data.name,
      description: data.description || null,
      balance: data.balance,
      isActive: data.isActive,
    };
    createCashAccount.mutate(payload, {
      onSuccess: () => {
        reset({
          name: "",
          description: "",
          balance: 0,
          isActive: true,
        });
        onClose();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        label="Nama Akun Kas"
        htmlFor="name"
        error={errors.name?.message}
        required
      >
        <Input
          id="name"
          placeholder="Contoh: Kas Umum, Kas Kecil"
          error={errors.name?.message}
          {...register("name")}
        />
      </FormField>

      <FormField
        label="Deskripsi"
        htmlFor="description"
        error={errors.description?.message}
      >
        <Textarea
          id="description"
          placeholder="Deskripsi akun kas (opsional)"
          rows={3}
          {...register("description")}
        />
      </FormField>

      <FormField
        label="Saldo Awal"
        htmlFor="balance"
        error={errors.balance?.message}
      >
        <Input
          id="balance"
          type="number"
          step="0.01"
          placeholder="0"
          error={errors.balance?.message}
          {...register("balance")}
        />
      </FormField>

      <Checkbox
        id="create-isActive"
        label="Aktif"
        description="Tandai sebagai akun kas aktif"
        checked={isActiveValue}
        onChange={(e) =>
          setValue("isActive", (e.target as HTMLInputElement).checked)
        }
      />

      <DialogFooter className="-mx-6 -mb-5 mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={createCashAccount.isPending}>
          Tambah Akun Kas
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Edit Form ────────────────────────────────────────────────

function EditCashAccountForm({
  account,
  onClose,
}: {
  account: CashAccountForEdit;
  onClose: () => void;
}) {
  const updateCashAccount = useUpdateCashAccount(account.id);

  const balanceValue =
    typeof account.balance === "object" && "toString" in account.balance
      ? Number(account.balance.toString())
      : Number(account.balance);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditInput>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: account.name,
      description: account.description ?? "",
      balance: balanceValue,
      isActive: account.isActive,
    },
  });

  const isActiveValue = watch("isActive");

  const onSubmit = (data: EditInput) => {
    const payload = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
      ...(data.balance !== undefined && { balance: data.balance }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };
    updateCashAccount.mutate(payload, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        label="Nama Akun Kas"
        htmlFor="edit-name"
        error={errors.name?.message}
        required
      >
        <Input
          id="edit-name"
          placeholder="Contoh: Kas Umum, Kas Kecil"
          error={errors.name?.message}
          {...register("name")}
        />
      </FormField>

      <FormField
        label="Deskripsi"
        htmlFor="edit-description"
        error={errors.description?.message}
      >
        <Textarea
          id="edit-description"
          placeholder="Deskripsi akun kas (opsional)"
          rows={3}
          {...register("description")}
        />
      </FormField>

      <FormField
        label="Saldo"
        htmlFor="edit-balance"
        error={errors.balance?.message}
      >
        <Input
          id="edit-balance"
          type="number"
          step="0.01"
          placeholder="0"
          error={errors.balance?.message}
          {...register("balance")}
        />
      </FormField>

      <Checkbox
        id="edit-isActive"
        label="Aktif"
        description="Tandai sebagai akun kas aktif"
        checked={isActiveValue}
        onChange={(e) =>
          setValue("isActive", (e.target as HTMLInputElement).checked)
        }
      />

      <DialogFooter className="-mx-6 -mb-5 mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={updateCashAccount.isPending}>
          Simpan Perubahan
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────

export function CashAccountFormDialog({
  open,
  onClose,
  account,
}: CashAccountFormDialogProps) {
  const isEditing = Boolean(account);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Akun Kas" : "Tambah Akun Kas"}
      description={
        isEditing
          ? "Perbarui informasi akun kas."
          : "Isikan detail untuk menambahkan akun kas baru."
      }
      size="md"
    >
      {isEditing && account ? (
        <EditCashAccountForm account={account} onClose={onClose} />
      ) : (
        <CreateCashAccountForm onClose={onClose} />
      )}
    </Dialog>
  );
}
