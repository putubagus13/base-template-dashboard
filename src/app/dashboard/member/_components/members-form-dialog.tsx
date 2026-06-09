// src/app/dashboard/users/_components/user-form-dialog.tsx
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
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { useRoles } from "@/hooks/use-roles";
import { Spinner } from "@/components/ui/badge";

// ─── Schemas ──────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Alamat email tidak valid"),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter")
    .regex(/[A-Z]/, "Kata sandi harus mengandung huruf besar")
    .regex(/[0-9]/, "Kata sandi harus mengandung angka"),
  roleIds: z.array(z.string()).min(1, "Select at least one role"),
});

const editSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  roleIds: z.array(z.string()).min(1, "Pilih setidaknya satu role"),
});

type CreateInput = z.infer<typeof createSchema>;
type EditInput = z.infer<typeof editSchema>;

// ─── Types ────────────────────────────────────────────────────

type UserForEdit = {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  roles: { id: string; name: string }[];
};

type UserFormDialogProps = {
  open: boolean;
  onClose: () => void;
  user?: UserForEdit | undefined;
};

// ─── Create Form ──────────────────────────────────────────────

function CreateUserForm({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser();
  const { data: rolesData, isLoading: rolesLoading } = useRoles();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateInput>({
    resolver: zodResolver(createSchema),
    defaultValues: { roleIds: [] },
  });

  const selectedRoleIds = watch("roleIds");

  const toggleRole = (roleId: string) => {
    const current = selectedRoleIds;
    setValue(
      "roleIds",
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
      { shouldValidate: true }
    );
  };

  const onSubmit = (data: CreateInput) => {
    createUser.mutate(data, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        label="Nama"
        htmlFor="name"
        error={errors.name?.message}
        required
      >
        <Input
          id="name"
          placeholder="John Doe"
          error={errors.name?.message}
          {...register("name")}
        />
      </FormField>

      <FormField
        label="Email"
        htmlFor="email"
        error={errors.email?.message}
        required
      >
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
      </FormField>

      <FormField
        label="Kata sandi"
        htmlFor="password"
        error={errors.password?.message}
        required
      >
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
      </FormField>

      <FormField
        label="Roles"
        htmlFor="roles"
        error={errors.roleIds?.message}
        required
      >
        {rolesLoading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
            <Spinner size="sm" /> Loading roles...
          </div>
        ) : (
          <div className="space-y-2 rounded-lg border border-slate-200 p-3">
            {rolesData?.data?.map((role) => (
              <Checkbox
                key={role.id}
                id={`role-${role.id}`}
                label={role.name || undefined}
                description={role.description ?? undefined}
                checked={selectedRoleIds.includes(role.id)}
                onChange={() => toggleRole(role.id)}
              />
            ))}
          </div>
        )}
      </FormField>

      <DialogFooter className="-mx-6 -mb-5 mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={createUser.isPending}>
          Create User
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Edit Form ────────────────────────────────────────────────

function EditUserForm({
  user,
  onClose,
}: {
  user: UserForEdit;
  onClose: () => void;
}) {
  const updateUser = useUpdateUser(user.id);
  const { data: rolesData, isLoading: rolesLoading } = useRoles();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditInput>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: user.name,
      status: user.status === "PENDING_VERIFICATION" ? "ACTIVE" : user.status,
      roleIds: user.roles.map((r) => r.id),
    },
  });

  const selectedRoleIds = watch("roleIds");

  const toggleRole = (roleId: string) => {
    const current = selectedRoleIds;
    setValue(
      "roleIds",
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
      { shouldValidate: true }
    );
  };

  const onSubmit = (data: EditInput) => {
    updateUser.mutate(data, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
        <span className="font-medium text-slate-700">Email:</span> {user.email}
      </div>

      <FormField
        label="Full name"
        htmlFor="edit-name"
        error={errors.name?.message}
        required
      >
        <Input
          id="edit-name"
          error={errors.name?.message}
          {...register("name")}
        />
      </FormField>

      <FormField
        label="Status"
        htmlFor="edit-status"
        error={errors.status?.message}
        required
      >
        <Select
          id="edit-status"
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
            { value: "SUSPENDED", label: "Suspended" },
          ]}
          error={errors.status?.message}
          {...register("status")}
        />
      </FormField>

      <FormField
        label="Roles"
        htmlFor="edit-roles"
        error={errors.roleIds?.message}
        required
      >
        {rolesLoading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
            <Spinner size="sm" /> Loading roles...
          </div>
        ) : (
          <div className="space-y-2 rounded-lg border border-slate-200 p-3">
            {rolesData?.data?.map((role) => (
              <Checkbox
                key={role.id}
                id={`edit-role-${role.id}`}
                label={role.name}
                description={role.description ?? undefined}
                checked={selectedRoleIds.includes(role.id)}
                onChange={() => toggleRole(role.id)}
              />
            ))}
          </div>
        )}
      </FormField>

      <DialogFooter className="-mx-6 -mb-5 mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={updateUser.isPending}>
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────

export function UserFormDialog({ open, onClose, user }: UserFormDialogProps) {
  const isEditing = Boolean(user);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Pengguna" : "Buat Pengguna"}
      description={
        isEditing
          ? "Perbarui informasi pengguna dan peran yang dialaminya."
          : "Isikan detail untuk membuat akun pengguna baru."
      }
      size="md"
    >
      {isEditing && user ? (
        <EditUserForm user={user} onClose={onClose} />
      ) : (
        <CreateUserForm onClose={onClose} />
      )}
    </Dialog>
  );
}
