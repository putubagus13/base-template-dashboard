// src/app/dashboard/attendance/meeting-types/_components/meeting-type-form-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button, Input, FormField } from "@/components/ui";
import {
  useCreateMeetingType,
  useUpdateMeetingType,
} from "@/hooks/use-meeting-types";
import type { MeetingTypeProfile } from "@/types";
import { useEffect } from "react";

type MeetingTypeFormDialogProps = {
  open: boolean;
  onClose: () => void;
  meetingType?: MeetingTypeProfile;
};

type FormValues = {
  name: string;
  color: string;
};

export function MeetingTypeFormDialog({
  open,
  onClose,
  meetingType,
}: MeetingTypeFormDialogProps) {
  const isEdit = Boolean(meetingType);
  const create = useCreateMeetingType();
  const update = useUpdateMeetingType(meetingType?.id ?? "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
  } = useForm<FormValues>({
    defaultValues: {
      name: meetingType?.name || "",
      color: meetingType?.color || "",
    },
  });

  useEffect(() => {
    if (open && meetingType) {
      reset({ name: meetingType.name, color: meetingType.color ?? "" });
    } else if (open) {
      reset({ name: "", color: "" });
    }
  }, [open, meetingType, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (isEdit) {
      update.mutate(
        { name: values.name, color: values.color },
        {
          onSuccess: () => {
            reset();
            onClose();
          },
        }
      );
    } else {
      create.mutate(
        { name: values.name, color: values.color },
        {
          onSuccess: () => {
            reset();
            onClose();
          },
        }
      );
    }
  });

  const isLoading = create.isPending || update.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Tipe Rapat" : "Tambah Tipe Rapat"}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          htmlFor="mt-name"
          label="Nama Tipe"
          error={errors.name?.message}
        >
          <Input
            id="mt-name"
            {...register("name", {
              required: "Nama tipe wajib diisi",
              minLength: { value: 2, message: "Minimal 2 karakter" },
            })}
            placeholder="Contoh: Rapat Rutin"
          />
        </FormField>

        <FormField htmlFor="mt-color" label="Warna">
          <div className="flex items-center gap-3">
            <input
              id="mt-color"
              type="color"
              {...register("color")}
              className="h-10 w-14 cursor-pointer rounded border border-slate-200"
            />
            <Input
              // {...register("color")}
              placeholder="Pilih warna"
              className="flex-1"
              disabled
              value={getValues().color}
            />
          </div>
        </FormField>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEdit ? "Perbarui" : "Simpan"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
