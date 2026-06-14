// src/app/dashboard/finance/categories/_components/categories-form-dialog.tsx
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
  useCreateTransactionCategory,
  useUpdateTransactionCategory,
} from "@/hooks";
import { TransactionCategory } from "@prisma/client";

const schema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean(),
});

type FormInput = z.infer<typeof schema>;
type CategoryForEdit = Pick<
  TransactionCategory,
  "id" | "name" | "description" | "color" | "isActive"
>;
type Props = {
  open: boolean;
  onClose: () => void;
  category?: CategoryForEdit | undefined;
};

function CreateForm({ onClose }: { onClose: () => void }) {
  const create = useCreateTransactionCategory();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", color: "", isActive: true },
  });
  const isActiveValue = watch("isActive");

  const onSubmit = (data: FormInput) => {
    create.mutate(
      {
        name: data.name,
        description: data.description || null,
        color: data.color || null,
        isActive: data.isActive,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        label="Nama Kategori"
        htmlFor="name"
        error={errors.name?.message}
        required
      >
        <Input
          id="name"
          placeholder="Contoh: Konsumsi, Transportasi"
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
          placeholder="Deskripsi (opsional)"
          rows={2}
          {...register("description")}
        />
      </FormField>
      <FormField label="Warna" htmlFor="color" error={errors.color?.message}>
        <div className="flex items-center gap-3">
          <Input
            id="color"
            type="color"
            className="w-12 h-10 p-1"
            {...register("color")}
          />
          <span className="text-sm text-slate-500">
            {watch("color") || "Pilih warna"}
          </span>
        </div>
      </FormField>
      <Checkbox
        id="create-isActive"
        label="Aktif"
        description="Tandai sebagai kategori aktif"
        checked={isActiveValue}
        onChange={(e) =>
          setValue("isActive", (e.target as HTMLInputElement).checked)
        }
      />
      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-5 mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={create.isPending}>
          Tambah Kategori
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditForm({
  category,
  onClose,
}: {
  category: CategoryForEdit;
  onClose: () => void;
}) {
  const update = useUpdateTransactionCategory(category.id);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category.name,
      description: category.description ?? "",
      color: category.color ?? "",
      isActive: category.isActive,
    },
  });
  const isActiveValue = watch("isActive");

  const onSubmit = (data: FormInput) => {
    update.mutate(
      {
        name: data.name,
        description: data.description || null,
        color: data.color || null,
        isActive: data.isActive,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        label="Nama Kategori"
        htmlFor="edit-name"
        error={errors.name?.message}
        required
      >
        <Input
          id="edit-name"
          placeholder="Contoh: Konsumsi, Transportasi"
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
          placeholder="Deskripsi (opsional)"
          rows={2}
          {...register("description")}
        />
      </FormField>
      <FormField
        label="Warna"
        htmlFor="edit-color"
        error={errors.color?.message}
      >
        <div className="flex items-center gap-3">
          <Input
            id="edit-color"
            type="color"
            className="w-12 h-10 p-1"
            {...register("color")}
          />
          <span className="text-sm text-slate-500">
            {watch("color") || "Pilih warna"}
          </span>
        </div>
      </FormField>
      <Checkbox
        id="edit-isActive"
        label="Aktif"
        description="Tandai sebagai kategori aktif"
        checked={isActiveValue}
        onChange={(e) =>
          setValue("isActive", (e.target as HTMLInputElement).checked)
        }
      />
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

export function CategoryFormDialog({ open, onClose, category }: Props) {
  const isEditing = Boolean(category);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Kategori" : "Tambah Kategori"}
      description={
        isEditing
          ? "Perbarui informasi kategori."
          : "Isikan detail untuk menambahkan kategori baru."
      }
      size="md"
    >
      {isEditing && category ? (
        <EditForm category={category} onClose={onClose} />
      ) : (
        <CreateForm onClose={onClose} />
      )}
    </Dialog>
  );
}
