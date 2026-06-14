// src/app/dashboard/member/_components/members-form-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateMember,
  useUpdateMember,
  MemberProfile,
} from "@/hooks/use-members";
import { useGlobalShareStore } from "@/store/global-share.store";

// ─── Position Options ─────────────────────────────────────────

const POSITION_OPTIONS = [
  { value: "Ketua", label: "Ketua" },
  { value: "Wakil Ketua", label: "Wakil Ketua" },
  { value: "Sekertaris", label: "Sekertaris" },
  { value: "Bendahara", label: "Bendahara" },
  { value: "Anggota", label: "Anggota" },
  { value: "Anggota Kehormatan", label: "Anggota Kehormatan" },
] as const;

const GENDER_OPTIONS = [
  { value: "MALE", label: "Laki-laki" },
  { value: "FEMALE", label: "Perempuan" },
  { value: "OTHER", label: "Lainnya" },
] as const;

// ─── Schemas ──────────────────────────────────────────────────

const createSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  memberNumber: z.string().min(1, "Nomor anggota wajib diisi"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    required_error: "Jenis kelamin wajib dipilih",
  }),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  statusId: z.string().optional().nullable(),
  joinDate: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean(),
});

const editSchema = createSchema;

type CreateInput = z.infer<typeof createSchema>;
type EditInput = z.infer<typeof editSchema>;

// ─── Types ────────────────────────────────────────────────────

type MemberForEdit = Pick<
  MemberProfile,
  | "id"
  | "fullName"
  | "memberNumber"
  | "gender"
  | "dateOfBirth"
  | "address"
  | "phone"
  | "position"
  | "statusId"
  | "joinDate"
  | "occupation"
  | "notes"
  | "isActive"
>;

type MemberFormDialogProps = {
  open: boolean;
  onClose: () => void;
  member?: MemberForEdit | undefined;
};

// ─── Helper ────────────────────────────────────────────────────

function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0] ?? "";
}

// ─── Create Form ───────────────────────────────────────────────

function CreateMemberForm({ onClose }: { onClose: () => void }) {
  const createMember = useCreateMember();
  const { memberStatusType } = useGlobalShareStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateInput>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      isActive: true,
      position: "",
      statusId: "",
    },
  });

  const isActiveValue = watch("isActive");

  const onSubmit = (data: CreateInput) => {
    const payload = {
      ...data,
      dateOfBirth: data.dateOfBirth || null,
      address: data.address || null,
      phone: data.phone || null,
      position: data.position || null,
      statusId: data.statusId || null,
      joinDate: data.joinDate || null,
      occupation: data.occupation || null,
      notes: data.notes || null,
    };
    createMember.mutate(payload, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Nama Lengkap"
          htmlFor="fullName"
          error={errors.fullName?.message}
          required
        >
          <Input
            id="fullName"
            placeholder="Nama lengkap"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </FormField>

        <FormField
          label="Nomor Anggota"
          htmlFor="memberNumber"
          error={errors.memberNumber?.message}
          required
        >
          <Input
            id="memberNumber"
            placeholder="Nomor anggota"
            error={errors.memberNumber?.message}
            {...register("memberNumber")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Jenis Kelamin"
          htmlFor="gender"
          error={errors.gender?.message}
          required
        >
          <Select
            id="gender"
            options={GENDER_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            placeholder="Pilih jenis kelamin"
            error={errors.gender?.message}
            {...register("gender")}
          />
        </FormField>

        <FormField
          label="Tanggal Lahir"
          htmlFor="dateOfBirth"
          error={errors.dateOfBirth?.message}
        >
          <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
        </FormField>
      </div>

      <FormField
        label="Alamat"
        htmlFor="address"
        error={errors.address?.message}
      >
        <Textarea
          id="address"
          placeholder="Alamat lengkap"
          rows={2}
          {...register("address")}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Telepon"
          htmlFor="phone"
          error={errors.phone?.message}
        >
          <Input
            id="phone"
            placeholder="Nomor telepon"
            {...register("phone")}
          />
        </FormField>

        <FormField
          label="Pekerjaan"
          htmlFor="occupation"
          error={errors.occupation?.message}
        >
          <Input
            id="occupation"
            placeholder="Pekerjaan"
            {...register("occupation")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Jabatan"
          htmlFor="position"
          error={errors.position?.message}
        >
          <Select
            id="position"
            options={POSITION_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            placeholder="Pilih jabatan"
            {...register("position")}
          />
        </FormField>

        <FormField
          label="Status Keanggotaan"
          htmlFor="statusId"
          error={errors.statusId?.message}
        >
          <Select
            id="statusId"
            options={memberStatusType.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
            placeholder="Pilih status"
            {...register("statusId")}
          />
        </FormField>
      </div>

      <FormField
        label="Tanggal Bergabung"
        htmlFor="joinDate"
        error={errors.joinDate?.message}
      >
        <Input id="joinDate" type="date" {...register("joinDate")} />
      </FormField>

      <FormField label="Catatan" htmlFor="notes" error={errors.notes?.message}>
        <Textarea
          id="notes"
          placeholder="Catatan tambahan"
          rows={2}
          {...register("notes")}
        />
      </FormField>

      <Checkbox
        id="isActive"
        label="Aktif"
        description="Tandai sebagai member aktif"
        checked={isActiveValue}
        onChange={(e) =>
          setValue("isActive", (e.target as HTMLInputElement).checked)
        }
      />

      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-5 mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={createMember.isPending}>
          Tambah Member
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Edit Form ─────────────────────────────────────────────────

function EditMemberForm({
  member,
  onClose,
}: {
  member: MemberForEdit;
  onClose: () => void;
}) {
  const updateMember = useUpdateMember(member.id);
  const { memberStatusType } = useGlobalShareStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditInput>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: member.fullName,
      memberNumber: member.memberNumber,
      gender: member.gender,
      dateOfBirth: toDateInputValue(member.dateOfBirth),
      address: member.address ?? "",
      phone: member.phone ?? "",
      position: member.position ?? "",
      statusId: member.statusId ?? "",
      joinDate: toDateInputValue(member.joinDate),
      occupation: member.occupation ?? "",
      notes: member.notes ?? "",
      isActive: member.isActive,
    },
  });

  const isActiveValue = watch("isActive");

  const onSubmit = (data: EditInput) => {
    const payload = {
      ...data,
      dateOfBirth: data.dateOfBirth || null,
      address: data.address || null,
      phone: data.phone || null,
      position: data.position || null,
      statusId: data.statusId || null,
      joinDate: data.joinDate || null,
      occupation: data.occupation || null,
      notes: data.notes || null,
    };
    updateMember.mutate(payload, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Nama Lengkap"
          htmlFor="edit-fullName"
          error={errors.fullName?.message}
          required
        >
          <Input
            id="edit-fullName"
            placeholder="Nama lengkap"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </FormField>

        <FormField
          label="Nomor Anggota"
          htmlFor="edit-memberNumber"
          error={errors.memberNumber?.message}
          required
        >
          <Input
            id="edit-memberNumber"
            placeholder="Nomor anggota"
            error={errors.memberNumber?.message}
            {...register("memberNumber")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Jenis Kelamin"
          htmlFor="edit-gender"
          error={errors.gender?.message}
          required
        >
          <Select
            id="edit-gender"
            options={GENDER_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            placeholder="Pilih jenis kelamin"
            error={errors.gender?.message}
            {...register("gender")}
          />
        </FormField>

        <FormField
          label="Tanggal Lahir"
          htmlFor="edit-dateOfBirth"
          error={errors.dateOfBirth?.message}
        >
          <Input
            id="edit-dateOfBirth"
            type="date"
            {...register("dateOfBirth")}
          />
        </FormField>
      </div>

      <FormField
        label="Alamat"
        htmlFor="edit-address"
        error={errors.address?.message}
      >
        <Textarea
          id="edit-address"
          placeholder="Alamat lengkap"
          rows={2}
          {...register("address")}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Telepon"
          htmlFor="edit-phone"
          error={errors.phone?.message}
        >
          <Input
            id="edit-phone"
            placeholder="Nomor telepon"
            {...register("phone")}
          />
        </FormField>

        <FormField
          label="Pekerjaan"
          htmlFor="edit-occupation"
          error={errors.occupation?.message}
        >
          <Input
            id="edit-occupation"
            placeholder="Pekerjaan"
            {...register("occupation")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Jabatan"
          htmlFor="edit-position"
          error={errors.position?.message}
        >
          <Select
            id="edit-position"
            options={POSITION_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            placeholder="Pilih jabatan"
            {...register("position")}
          />
        </FormField>

        <FormField
          label="Status Keanggotaan"
          htmlFor="edit-statusId"
          error={errors.statusId?.message}
        >
          <Select
            id="edit-statusId"
            options={memberStatusType.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
            placeholder="Pilih status"
            {...register("statusId")}
          />
        </FormField>
      </div>

      <FormField
        label="Tanggal Bergabung"
        htmlFor="edit-joinDate"
        error={errors.joinDate?.message}
      >
        <Input id="edit-joinDate" type="date" {...register("joinDate")} />
      </FormField>

      <FormField
        label="Catatan"
        htmlFor="edit-notes"
        error={errors.notes?.message}
      >
        <Textarea
          id="edit-notes"
          placeholder="Catatan tambahan"
          rows={2}
          {...register("notes")}
        />
      </FormField>

      <Checkbox
        id="edit-isActive"
        label="Aktif"
        description="Tandai sebagai member aktif"
        checked={isActiveValue}
        onChange={(e) =>
          setValue("isActive", (e.target as HTMLInputElement).checked)
        }
      />

      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-5 mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={updateMember.isPending}>
          Simpan Perubahan
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Main Dialog ───────────────────────────────────────────────

export function MemberFormDialog({
  open,
  onClose,
  member,
}: MemberFormDialogProps) {
  const isEditing = Boolean(member);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Member" : "Tambah Member"}
      description={
        isEditing
          ? "Perbarui informasi data member."
          : "Isikan detail untuk menambahkan member baru."
      }
      size="lg"
    >
      {isEditing && member ? (
        <EditMemberForm member={member} onClose={onClose} />
      ) : (
        <CreateMemberForm onClose={onClose} />
      )}
    </Dialog>
  );
}
