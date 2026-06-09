// src/app/dashboard/roles/_components/role-form-dialog.tsx
"use client";

// import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/badge";
import {
  useCreateRole,
  useUpdateRole,
  usePermissions as usePermissionsData,
} from "@/hooks/use-roles";
import { RoleInput } from "@/types";
import { useEffect } from "react";

const schema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Max 50 characters")
    .regex(
      /^[A-Z_]+$/,
      "Use uppercase letters and underscores only (e.g. MANAGER)"
    ),
  description: z.string().max(200).optional(),
  permissionIds: z.array(z.string()),
});

type FormInput = z.infer<typeof schema>;

type RoleForEdit = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: { id: string; action: string; subject: string }[];
};

type RoleFormDialogProps = {
  open: boolean;
  onClose: () => void;
  role?: RoleForEdit | undefined;
};

export function RoleFormDialog({ open, onClose, role }: RoleFormDialogProps) {
  const isEditing = Boolean(role);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole(role?.id ?? "");
  const { data: permissionsData, isLoading: permsLoading } =
    usePermissionsData();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
      permissionIds: role?.permissions.map((p) => p.id) ?? [],
    },
  });

  const selectedPermIds = watch("permissionIds");

  const togglePermission = (permId: string) => {
    const current = selectedPermIds;
    setValue(
      "permissionIds",
      current.includes(permId)
        ? current.filter((id) => id !== permId)
        : [...current, permId]
    );
  };

  const toggleSubjectAll = (permIds: string[]) => {
    const allSelected = permIds.every((id) => selectedPermIds.includes(id));
    if (allSelected) {
      setValue(
        "permissionIds",
        selectedPermIds.filter((id) => !permIds.includes(id))
      );
    } else {
      setValue("permissionIds", [...new Set([...selectedPermIds, ...permIds])]);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: FormInput) => {
    if (isEditing) {
      updateRole.mutate(data as RoleInput, { onSuccess: handleClose });
    } else {
      createRole.mutate(data as RoleInput, { onSuccess: handleClose });
    }
  };

  const grouped = permissionsData?.data?.grouped ?? {};
  const isPending = isEditing ? updateRole.isPending : createRole.isPending;

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description || undefined,
        permissionIds: role.permissions.map((p) => p.id),
      });
    }
  }, [role, reset]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={isEditing ? "Edit Role" : "Create Role"}
      description="Configure role name and assign permissions."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Role name"
            htmlFor="role-name"
            error={errors.name?.message}
            required
          >
            <Input
              id="role-name"
              placeholder="MANAGER"
              error={errors.name?.message}
              disabled={role?.isSystem}
              className="uppercase placeholder:normal-case"
              {...register("name")}
            />
          </FormField>
          <FormField
            label="Description"
            htmlFor="role-desc"
            error={errors.description?.message}
          >
            <Input
              id="role-desc"
              placeholder="Optional description"
              error={errors.description?.message}
              {...register("description")}
            />
          </FormField>
        </div>

        {/* Permissions Matrix */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Permissions
            <span className="ml-1.5 text-xs font-normal text-slate-500">
              ({selectedPermIds.length} selected)
            </span>
          </p>

          {permsLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
              <Spinner size="sm" /> Loading permissions...
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 scrollbar-thin">
              {Object.entries(grouped).map(([subject, perms]) => {
                const permIds = perms.map((p) => p.id);
                const allSelected = permIds.every((id) =>
                  selectedPermIds.includes(id)
                );
                const someSelected = permIds.some((id) =>
                  selectedPermIds.includes(id)
                );

                return (
                  <div
                    key={subject}
                    className="border-b border-slate-100 last:border-0"
                  >
                    {/* Subject header */}
                    <div className="flex items-center gap-3 bg-slate-50/80 px-3 py-2.5">
                      <input
                        type="checkbox"
                        id={`subject-${subject}`}
                        checked={allSelected}
                        ref={(el) => {
                          if (el)
                            el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={() => toggleSubjectAll(permIds)}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-brand-600"
                      />
                      <label
                        htmlFor={`subject-${subject}`}
                        className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-600"
                      >
                        {subject}
                      </label>
                    </div>
                    {/* Permission rows */}
                    <div className="grid grid-cols-2 gap-1.5 px-3 py-2.5 sm:grid-cols-4">
                      {perms.map((perm) => (
                        <Checkbox
                          key={perm.id}
                          id={`perm-${perm.id}`}
                          label={perm.action}
                          checked={selectedPermIds.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="-mx-6 -mb-5 mt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEditing ? "Save Changes" : "Create Role"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
