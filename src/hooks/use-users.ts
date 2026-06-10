// src/hooks/use-users.ts
// ============================================================
// USER MANAGEMENT HOOKS
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import type { ListQueryParams } from "@/types/api";
import { ROUTES } from "@/config/routes";

// ─── Query Keys ──────────────────────────────────────────────
// Centralize query keys untuk konsistensi cache invalidation.

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: ListQueryParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// ─── Types ───────────────────────────────────────────────────

type UserListItem = {
  id: string;
  name: string;
  email: string;
  status: string;
  avatar: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  roles: { id: string; name: string }[];
};

type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  roleIds: string[];
};

type UpdateUserPayload = {
  name?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  roleIds?: string[];
};

// ─── Hooks ───────────────────────────────────────────────────

export function useUsers(params: ListQueryParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () =>
      apiClient.get<UserListItem[]>(
        `${ROUTES.api.users}?${searchParams.toString()}`
      ),
    placeholderData: (prev) => prev,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => apiClient.get<UserListItem>(`${ROUTES.api.users}/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      apiClient.post<UserListItem>(ROUTES.api.users, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User created successfully.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create user.");
      }
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserPayload) =>
      apiClient.patch<UserListItem>(`${ROUTES.api.users}/${id}`, payload),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      if (response.data) {
        queryClient.setQueryData(userKeys.detail(id), response);
      }
      toast.success("User updated successfully.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update user.");
      }
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`${ROUTES.api.users}/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User deleted successfully.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete user.");
      }
    },
  });
}
