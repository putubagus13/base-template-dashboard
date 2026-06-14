// src/app/dashboard/finance/donors/_components/donors-form-dialog.tsx
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
  useCreateDonor,
  useUpdateDonor,
  useMemberSearch,
  DonorWithMember,
} from "@/hooks/use-donors";
import { MemberSearchResult } from "@/app/api/members/search/route";
import { useState, useEffect, useRef } from "react";

// ─── Schemas ──────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2, "Nama donatur minimal 2 karakter"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email tidak valid").optional().nullable(),
  address: z.string().optional().nullable(),
  isMember: z.boolean(),
  memberId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const editSchema = z.object({
  name: z.string().min(2, "Nama donatur minimal 2 karakter").optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email tidak valid").optional().nullable(),
  address: z.string().optional().nullable(),
  isMember: z.boolean().optional(),
  memberId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type CreateInput = z.infer<typeof createSchema>;
type EditInput = z.infer<typeof editSchema>;

// ─── Types ────────────────────────────────────────────────────

type DonorsFormDialogProps = {
  open: boolean;
  onClose: () => void;
  donor?: DonorWithMember | undefined;
};

// ─── Member Autocomplete ──────────────────────────────────────

function MemberAutocomplete({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (memberId: string | null, memberName: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { data: members, isLoading } = useMemberSearch(query);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        placeholder="Ketik nama anggota..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && query.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-slate-500">Mencari...</div>
          ) : !members?.data?.length ? (
            <div className="px-3 py-2 text-sm text-slate-500">
              Tidak ditemukan
            </div>
          ) : (
            members.data.map((m: MemberSearchResult) => (
              <button
                key={m.id}
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                  value === m.id ? "bg-brand-50 text-brand-700" : ""
                }`}
                onClick={() => {
                  onChange(m.id, m.fullName);
                  setQuery(m.fullName);
                  setIsOpen(false);
                }}
              >
                <div className="font-medium">{m.fullName}</div>
                {(m.phone || m.email) && (
                  <div className="text-xs text-slate-500">
                    {m.phone && <span>{m.phone}</span>}
                    {m.phone && m.email && <span> · </span>}
                    {m.email && <span>{m.email}</span>}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Create Form ──────────────────────────────────────────────

function CreateDonorForm({ onClose }: { onClose: () => void }) {
  const createDonor = useCreateDonor();

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
      phone: "",
      email: "",
      address: "",
      isMember: false,
      memberId: null,
      notes: "",
    },
  });

  const isMemberValue = watch("isMember");

  const onSubmit = (data: CreateInput) => {
    const payload = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      isMember: data.isMember,
      memberId: data.isMember ? data.memberId ?? null : null,
      notes: data.notes || null,
    };
    createDonor.mutate(payload, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Checkbox
        id="create-isMember"
        label="Anggota Organisasi"
        description="Tandai jika donatur adalah anggota organisasi"
        checked={isMemberValue}
        onChange={(e) => {
          const checked = (e.target as HTMLInputElement).checked;
          setValue("isMember", checked);
          if (!checked) {
            setValue("memberId", null);
          }
        }}
      />

      {isMemberValue ? (
        <FormField
          label="Pilih Anggota"
          htmlFor="memberId"
          error={errors.memberId?.message}
        >
          <MemberAutocomplete
            value={watch("memberId")}
            onChange={(memberId, memberName) => {
              setValue("memberId", memberId);
              setValue("name", memberName);
            }}
          />
        </FormField>
      ) : (
        <>
          <FormField
            label="Nama Donatur"
            htmlFor="create-name"
            error={errors.name?.message}
            required
          >
            <Input
              id="create-name"
              placeholder="Nama lengkap donatur"
              error={errors.name?.message}
              {...register("name")}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Telepon"
              htmlFor="create-phone"
              error={errors.phone?.message}
            >
              <Input
                id="create-phone"
                placeholder="No. telepon"
                error={errors.phone?.message}
                {...register("phone")}
              />
            </FormField>

            <FormField
              label="Email"
              htmlFor="create-email"
              error={errors.email?.message}
            >
              <Input
                id="create-email"
                type="email"
                placeholder="Email donatur"
                error={errors.email?.message}
                {...register("email")}
              />
            </FormField>
          </div>

          <FormField
            label="Alamat"
            htmlFor="create-address"
            error={errors.address?.message}
          >
            <Input
              id="create-address"
              placeholder="Alamat donatur"
              error={errors.address?.message}
              {...register("address")}
            />
          </FormField>
        </>
      )}

      {isMemberValue && (
        <FormField
          label="Nama"
          htmlFor="create-name-member"
          error={errors.name?.message}
          required
        >
          <Input
            id="create-name-member"
            placeholder="Nama (terisi otomatis)"
            error={errors.name?.message}
            readOnly
            {...register("name")}
          />
        </FormField>
      )}

      <FormField
        label="Catatan"
        htmlFor="create-notes"
        error={errors.notes?.message}
      >
        <Textarea
          id="create-notes"
          placeholder="Catatan tambahan (opsional)"
          rows={3}
          {...register("notes")}
        />
      </FormField>

      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-5 mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={createDonor.isPending}>
          Tambah Donatur
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Edit Form ────────────────────────────────────────────────

function EditDonorForm({
  donor,
  onClose,
}: {
  donor: DonorWithMember;
  onClose: () => void;
}) {
  const updateDonor = useUpdateDonor(donor.id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditInput>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: donor.name,
      phone: donor.phone ?? "",
      email: donor.email ?? "",
      address: donor.address ?? "",
      isMember: donor.isMember,
      memberId: donor.memberId,
      notes: donor.notes ?? "",
    },
  });

  const isMemberValue = watch("isMember");

  const onSubmit = (data: EditInput) => {
    const payload = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.isMember !== undefined && { isMember: data.isMember }),
      ...(data.memberId !== undefined && {
        memberId: data.isMember ? data.memberId ?? null : null,
      }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
    };
    updateDonor.mutate(payload, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Checkbox
        id="edit-isMember"
        label="Anggota Organisasi"
        description="Tandai jika donatur adalah anggota organisasi"
        checked={isMemberValue}
        onChange={(e) => {
          const checked = (e.target as HTMLInputElement).checked;
          setValue("isMember", checked);
          if (!checked) {
            setValue("memberId", null);
          }
        }}
      />

      {isMemberValue ? (
        <FormField
          label="Pilih Anggota"
          htmlFor="edit-memberId"
          error={errors.memberId?.message}
        >
          <MemberAutocomplete
            value={watch("memberId")}
            onChange={(memberId, memberName) => {
              setValue("memberId", memberId);
              setValue("name", memberName);
            }}
          />
        </FormField>
      ) : (
        <>
          <FormField
            label="Nama Donatur"
            htmlFor="edit-name"
            error={errors.name?.message}
            required
          >
            <Input
              id="edit-name"
              placeholder="Nama lengkap donatur"
              error={errors.name?.message}
              {...register("name")}
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
                placeholder="No. telepon"
                error={errors.phone?.message}
                {...register("phone")}
              />
            </FormField>

            <FormField
              label="Email"
              htmlFor="edit-email"
              error={errors.email?.message}
            >
              <Input
                id="edit-email"
                type="email"
                placeholder="Email donatur"
                error={errors.email?.message}
                {...register("email")}
              />
            </FormField>
          </div>

          <FormField
            label="Alamat"
            htmlFor="edit-address"
            error={errors.address?.message}
          >
            <Input
              id="edit-address"
              placeholder="Alamat donatur"
              error={errors.address?.message}
              {...register("address")}
            />
          </FormField>
        </>
      )}

      <FormField
        label="Catatan"
        htmlFor="edit-notes"
        error={errors.notes?.message}
      >
        <Textarea
          id="edit-notes"
          placeholder="Catatan tambahan (opsional)"
          rows={3}
          {...register("notes")}
        />
      </FormField>

      <DialogFooter className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-5 mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" isLoading={updateDonor.isPending}>
          Simpan Perubahan
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────

export function DonorsFormDialog({
  open,
  onClose,
  donor,
}: DonorsFormDialogProps) {
  const isEditing = Boolean(donor);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Donatur" : "Tambah Donatur"}
      description={
        isEditing
          ? "Perbarui informasi donatur."
          : "Isikan detail untuk menambahkan donatur baru."
      }
      size="md"
    >
      {isEditing && donor ? (
        <EditDonorForm donor={donor} onClose={onClose} />
      ) : (
        <CreateDonorForm onClose={onClose} />
      )}
    </Dialog>
  );
}
