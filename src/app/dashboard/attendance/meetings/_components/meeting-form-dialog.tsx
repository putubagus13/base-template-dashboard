// src/app/dashboard/attendance/meetings/_components/meeting-form-dialog.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button, Input, Select, Textarea, FormField } from "@/components/ui";
import { useMeetingTypes } from "@/hooks/use-meeting-types";
import {
  useCreateMeeting,
  useUpdateMeeting,
  CreateMeetingPayload,
} from "@/hooks/use-meetings";
import type { MeetingProfile } from "@/types";
import { MeetingStatus } from "@prisma/client";

type MeetingFormDialogProps = {
  open: boolean;
  onClose: () => void;
  meeting?: MeetingProfile;
};

type FormValues = {
  title: string;
  meetingTypeId: string;
  scheduledAt: string;
  status: MeetingStatus;
  description: string;
};

const statusOptions = [
  { value: "INCOMING", label: "Akan Datang" },
  { value: "LIVE", label: "Berlangsung" },
  { value: "DONE", label: "Selesai" },
];

export function MeetingFormDialog({
  open,
  onClose,
  meeting,
}: MeetingFormDialogProps) {
  const isEdit = Boolean(meeting);
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting(meeting?.id ?? "");
  const { data: meetingTypes } = useMeetingTypes();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      meetingTypeId: "",
      scheduledAt: "",
      status: "INCOMING",
      description: "",
    },
  });

  useEffect(() => {
    if (open && meeting) {
      reset({
        title: meeting.title,
        meetingTypeId: meeting.meetingTypeId,
        scheduledAt: meeting.scheduledAt
          ? new Date(meeting.scheduledAt).toISOString().slice(0, 16)
          : "",
        status: meeting.status,
        description: meeting.description ?? "",
      });
    } else if (open) {
      reset({
        title: "",
        meetingTypeId: "",
        scheduledAt: "",
        status: "INCOMING",
        description: "",
      });
    }
  }, [open, meeting, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateMeetingPayload = {
      title: values.title,
      meetingTypeId: values.meetingTypeId,
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      status: values.status,
      description: values.description || null,
    };

    if (isEdit) {
      updateMeeting.mutate(payload, { onSuccess: () => onClose() });
    } else {
      createMeeting.mutate(payload, { onSuccess: () => onClose() });
    }
  });

  const isLoading = createMeeting.isPending || updateMeeting.isPending;
  const meetingTypeOptions =
    meetingTypes?.data?.map((mt) => ({
      value: mt.id,
      label: mt.name,
    })) ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Rapat" : "Tambah Rapat"}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          htmlFor="title"
          label="Judul Rapat"
          error={errors.title?.message}
        >
          <Input
            id="title"
            {...register("title", {
              required: "Judul rapat wajib diisi",
              minLength: { value: 2, message: "Minimal 2 karakter" },
            })}
            placeholder="Masukkan judul rapat"
          />
        </FormField>

        <FormField
          htmlFor="meetingTypeId"
          label="Tipe Rapat"
          error={errors.meetingTypeId?.message}
        >
          <Select
            id="meetingTypeId"
            {...register("meetingTypeId", {
              required: "Tipe rapat wajib dipilih",
            })}
            options={meetingTypeOptions}
            placeholder="Pilih tipe rapat"
          />
        </FormField>

        <FormField
          htmlFor="scheduledAt"
          label="Jadwal"
          error={errors.scheduledAt?.message}
        >
          <Input
            id="scheduledAt"
            type="datetime-local"
            {...register("scheduledAt", {
              required: "Jadwal rapat wajib diisi",
            })}
          />
        </FormField>

        <FormField htmlFor="status" label="Status">
          <Select id="status" {...register("status")} options={statusOptions} />
        </FormField>

        <FormField htmlFor="description" label="Deskripsi">
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Deskripsi rapat (opsional)"
            rows={3}
          />
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
