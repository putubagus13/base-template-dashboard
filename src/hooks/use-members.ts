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

// type CreateUserPayload = {
//   name: string;
//   email: string;
//   password: string;
//   roleIds: string[];
// };

// type UpdateUserPayload = {
//   name?: string;
//   status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
//   roleIds?: string[];
// };

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

// export function useCreateUser() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (payload: CreateUserPayload) =>
//       apiClient.post<UserListItem>("/api/users", payload),
//     onSuccess: () => {
//       void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
//       toast.success("Pengguna berhasil dibuat.");
//     },
//     onError: (error: unknown) => {
//       if (error instanceof ApiError) {
//         toast.error(error.message);
//       } else {
//         toast.error("Gagal membuat pengguna.");
//       }
//     },
//   });
// }

// export function useUpdateUser(id: string) {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (payload: UpdateUserPayload) =>
//       apiClient.patch<UserListItem>(`/api/users/${id}`, payload),
//     onSuccess: (response) => {
//       void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
//       void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
//       if (response.data) {
//         queryClient.setQueryData(userKeys.detail(id), response);
//       }
//       toast.success("Pengguna berhasil diperbarui.");
//     },
//     onError: (error: unknown) => {
//       if (error instanceof ApiError) {
//         toast.error(error.message);
//       } else {
//         toast.error("Gagal memperbarui pengguna.");
//       }
//     },
//   });
// }

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
