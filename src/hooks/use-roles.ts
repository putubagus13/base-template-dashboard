// src/hooks/use-roles.ts
// ============================================================
// ROLE MANAGEMENT HOOKS
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import type { RoleInput } from "@/types/rbac";
import { ROUTES } from "@/config/routes";

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  detail: (id: string) => [...roleKeys.all, "detail", id] as const,
  permissions: () => [...roleKeys.all, "permissions"] as const,
};

type RoleListItem = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: { id: string; action: string; subject: string }[];
  createdAt: string;
};

type PermissionsGrouped = {
  list: {
    id: string;
    action: string;
    subject: string;
    description: string | null;
  }[];
  grouped: Record<string, { id: string; action: string; subject: string }[]>;
};

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: () => apiClient.get<RoleListItem[]>(ROUTES.api.roles),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: () => apiClient.get<PermissionsGrouped>(ROUTES.api.permissions),
    staleTime: 5 * 60 * 1000, // 5 minutes - permissions rarely change
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RoleInput) =>
      apiClient.post<RoleListItem>(ROUTES.api.roles, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success("Role created successfully.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Failed to create role.");
    },
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<RoleInput>) =>
      apiClient.patch<RoleListItem>(ROUTES.api.roles + `/${id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
      toast.success("Role updated successfully.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Failed to update role.");
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(ROUTES.api.roles + `/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success("Role deleted successfully.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Failed to delete role.");
    },
  });
}
