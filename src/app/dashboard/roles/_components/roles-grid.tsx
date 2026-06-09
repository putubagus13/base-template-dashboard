// src/app/dashboard/roles/_components/roles-grid.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, Lock, Users, Pencil } from "lucide-react";
import { useRoles, useDeleteRole } from "@/hooks/use-roles";
import { usePermissions } from "@/hooks/use-permission";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RoleFormDialog } from "./role-form-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/badge";

type RoleItem = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: { id: string; action: string; subject: string }[];
  createdAt: string;
};

export function RolesGrid() {
  const { data, isLoading, isError } = useRoles();
  const deleteRole = useDeleteRole();
  const { can } = usePermissions();

  const [formOpen, setFormOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleItem | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const openCreate = () => {
    setEditRole(undefined);
    setFormOpen(true);
  };

  const openEdit = (role: RoleItem) => {
    setEditRole(role);
    setFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteRole.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );

  if (isError)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
        Failed to load roles. Please refresh the page.
      </div>
    );

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <PermissionGuard permission="create:role">
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          </PermissionGuard>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.data?.map((role) => (
            <div
              key={role.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                    {role.isSystem ? (
                      <Lock className="h-4 w-4 text-brand-600" />
                    ) : (
                      <Users className="h-4 w-4 text-brand-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-slate-900">
                        {role.name}
                      </p>
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-[10px]">
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {role.userCount} user{role.userCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {!role.isSystem && (
                  <div className="flex items-center gap-1">
                    {can("update:role") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(role)}
                        aria-label="Edit role"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {can("delete:role") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() =>
                          setDeleteTarget({ id: role.id, name: role.name })
                        }
                        aria-label="Delete role"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {role.description && (
                <p className="mt-3 text-xs text-slate-500 line-clamp-2">
                  {role.description}
                </p>
              )}

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Permissions ({role.permissions.length})
                </p>
                {role.permissions.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No permissions assigned
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 6).map((perm) => (
                      <Badge
                        key={perm.id}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {perm.action}:{perm.subject}
                      </Badge>
                    ))}
                    {role.permissions.length > 6 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{role.permissions.length - 6} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <RoleFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        role={editRole}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Role"
        description={`Delete role "${
          deleteTarget?.name ?? ""
        }"? Users assigned this role will lose its permissions. This action cannot be undone.`}
        confirmLabel="Delete Role"
        isLoading={deleteRole.isPending}
      />
    </>
  );
}
