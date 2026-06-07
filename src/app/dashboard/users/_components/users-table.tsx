// src/app/dashboard/users/_components/users-table.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Users } from "lucide-react";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { usePermissions } from "@/hooks/use-permission";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchBar } from "@/components/shared/search-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar } from "@/components/shared/avatar";
import { UserFormDialog } from "./user-form-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  TableEmpty,
} from "@/components/ui/table";
import { PaginationMeta, UserListItem } from "@/types";

type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

export function UsersTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { can } = usePermissions();
  const deleteUser = useDeleteUser();

  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserListItem | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data, isLoading, isError } = useUsers({ page, limit: 10, search });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openCreate = () => {
    setEditUser(undefined);
    setFormOpen(true);
  };

  const openEdit = (user: UserListItem) => {
    setEditUser(user);
    setFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <>
      <TableRoot>
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or email..."
            className="max-w-xs w-full"
          />
          <PermissionGuard permission="create:user">
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </PermissionGuard>
        </div>

        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableSkeleton colSpan={5} rows={8} />
          ) : isError ? (
            <TableEmpty
              colSpan={5}
              message="Failed to load users. Please refresh."
            />
          ) : !data?.data?.length ? (
            <TableEmpty
              colSpan={5}
              message={
                search ? `No results for "${search}"` : "No users found."
              }
              icon={<Users className="h-10 w-10" />}
            />
          ) : (
            data.data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} src={user.avatar} size="sm" />
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role.id} variant="secondary">
                        {role.name}
                      </Badge>
                    ))}
                    {user.roles.length === 0 && (
                      <span className="text-xs text-slate-400">No roles</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={user.status as UserStatus} />
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "Never"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {can("update:user") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(user as UserListItem)}
                        aria-label="Edit user"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {can("delete:user") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() =>
                          setDeleteTarget({ id: user.id, name: user.name })
                        }
                        aria-label="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>

        {data?.meta && (
          <div className="border-t border-slate-200">
            <Pagination
              meta={data.meta as PaginationMeta}
              onPageChange={setPage}
            />
          </div>
        )}
      </TableRoot>

      <UserFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        user={editUser}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        description={`Delete "${
          deleteTarget?.name ?? ""
        }"? This cannot be undone.`}
        confirmLabel="Delete User"
        isLoading={deleteUser.isPending}
      />
    </>
  );
}
