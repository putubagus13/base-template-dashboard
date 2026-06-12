// src/hooks/use-members.ts
// ============================================================
// MEMBER MANAGEMENT HOOKS
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import { ListMemberQueryParam } from "@/types";
import { GenderType } from "@prisma/client";
import { ROUTES } from "@/config/routes";

// ─── Query Keys ──────────────────────────────────────────────
// Centralize query keys untuk konsistensi cache invalidation.

export const memberKeys = {
  all: ["members"] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (params: ListMemberQueryParam) =>
    [...memberKeys.lists(), params] as const,
  //   details: () => [...memberKeys.all, "detail"] as const,
  //   detail: (id: string) => [...memberKeys.details(), id] as const,
};

// ─── Types ───────────────────────────────────────────────────
export type MemberSummary = {
  total: number;
  activeTotal: number;
  inactiveTotal: number;
};
export type MemberProfile = {
  id: string;
  organizationId: string;
  memberNumber: string;
  fullName: string;
  dateOfBirth: Date | null;
  gender: GenderType;
  address: string | null;
  phone: string | null;
  email: string | null;
  statusId: string | null;
  position: string | null;
  joinDate: Date | null;
  isActive: boolean;
  activityPoint: number;
  photoUrl: string | null;
  occupation: string | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
  deletedAt: Date | null;
};

export type CreateMemberPayload = {
  fullName: string;
  memberNumber: string;
  gender: GenderType;
  dateOfBirth?: string | null;
  address?: string | null;
  phone?: string | null;
  position?: string | null;
  statusId?: string | null;
  joinDate?: string | null;
  occupation?: string | null;
  notes?: string | null;
  isActive: boolean;
};

export type UpdateMemberPayload = {
  fullName?: string;
  memberNumber?: string;
  gender?: GenderType;
  dateOfBirth?: string | null;
  address?: string | null;
  phone?: string | null;
  position?: string | null;
  statusId?: string | null;
  joinDate?: string | null;
  occupation?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

// ─── Hooks ───────────────────────────────────────────────────

export function useMembers(params: ListMemberQueryParam = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.statusId) searchParams.set("statusId", params.statusId);
  if (params.isActive !== undefined)
    searchParams.set("isActive", String(params.isActive));

  return useQuery({
    queryKey: memberKeys.list(params),
    queryFn: () =>
      apiClient.get<{ summary: MemberSummary; data: MemberProfile[] }>(
        `${ROUTES.api.member}?${searchParams.toString()}`
      ),
    placeholderData: (prev) => prev,
  });
}

// export function useUser(id: string) {
//   return useQuery({
//     queryKey: memberKeys.detail(id),
//     queryFn: () => apiClient.get<UserListItem>(`/api/users/${id}`),
//     enabled: Boolean(id),
//   });
// }

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMemberPayload) =>
      apiClient.post<MemberProfile>(ROUTES.api.member, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      toast.success("Member berhasil ditambahkan.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Gagal menambahkan member.");
      }
    },
  });
}

export function useUpdateMember(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMemberPayload) =>
      apiClient.patch<MemberProfile>(`${ROUTES.api.member}/${id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      toast.success("Member berhasil diperbarui.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Gagal memperbarui member.");
      }
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`${ROUTES.api.member}/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      toast.success("Pengguna berhasil dihapus.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Gagal menghapus pengguna.");
      }
    },
  });
}
