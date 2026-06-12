// src/hooks/use-cash-accounts.ts
// ============================================================
// CASH ACCOUNT MANAGEMENT HOOKS
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import { ListCashAccountQueryParam } from "@/types";
import { ROUTES } from "@/config/routes";
import { CashAccount } from "@prisma/client";
import { CashAccountSummary } from "@/app/api/cash-accounts/route";

// ─── Query Keys ──────────────────────────────────────────────

export const cashAccountKeys = {
  all: ["cashAccounts"] as const,
  lists: () => [...cashAccountKeys.all, "list"] as const,
  list: (params: ListCashAccountQueryParam) =>
    [...cashAccountKeys.lists(), params] as const,
};

// ─── Payload Types ────────────────────────────────────────────

export type CreateCashAccountPayload = {
  name: string;
  description?: string | null;
  balance?: number;
  isActive: boolean;
};

export type UpdateCashAccountPayload = {
  name?: string;
  description?: string | null;
  balance?: number;
  isActive?: boolean;
};

// ─── Hooks ───────────────────────────────────────────────────

export function useCashAccounts(params: ListCashAccountQueryParam = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.isActive !== undefined)
    searchParams.set("isActive", String(params.isActive));

  return useQuery({
    queryKey: cashAccountKeys.list(params),
    queryFn: () =>
      apiClient.get<{ summary: CashAccountSummary; data: CashAccount[] }>(
        `${ROUTES.api.cashAccounts}?${searchParams.toString()}`
      ),
    placeholderData: (prev) => prev,
  });
}

export function useCreateCashAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCashAccountPayload) =>
      apiClient.post<CashAccount>(ROUTES.api.cashAccounts, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cashAccountKeys.lists() });
      toast.success("Akun kas berhasil ditambahkan.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Gagal menambahkan akun kas.");
      }
    },
  });
}

export function useUpdateCashAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCashAccountPayload) =>
      apiClient.patch<CashAccount>(ROUTES.api.cashAccount(id), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cashAccountKeys.lists() });
      toast.success("Akun kas berhasil diperbarui.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Gagal memperbarui akun kas.");
      }
    },
  });
}

export function useDeleteCashAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(ROUTES.api.cashAccount(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cashAccountKeys.lists() });
      toast.success("Akun kas berhasil dihapus.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Gagal menghapus akun kas.");
      }
    },
  });
}
