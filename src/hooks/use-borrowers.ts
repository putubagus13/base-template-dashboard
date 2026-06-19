// src/hooks/use-borrowers.ts
// ============================================================
// BORROWER (PEMINJAM) HOOKS
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import {
  ListBorrowerQueryParam,
  BorrowerProfile,
  BorrowerSearchResult,
  CreateBorrowerPayload,
} from "@/types";
import { ROUTES } from "@/config/routes";

// ─── Query Keys ──────────────────────────────────────────────

export const borrowerKeys = {
  all: ["borrowers"] as const,
  lists: () => [...borrowerKeys.all, "list"] as const,
  list: (params: ListBorrowerQueryParam) =>
    [...borrowerKeys.lists(), params] as const,
  search: (q: string) => [...borrowerKeys.all, "search", q] as const,
};

// ─── Borrower Hooks ──────────────────────────────────────────

export function useBorrowers(params: ListBorrowerQueryParam = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.isMember !== undefined)
    searchParams.set("isMember", String(params.isMember));

  return useQuery({
    queryKey: borrowerKeys.list(params),
    queryFn: () =>
      apiClient.get<{ data: BorrowerProfile[]; total: number }>(
        `${ROUTES.api.borrowers}?${searchParams.toString()}`
      ),
    placeholderData: (prev) => prev,
  });
}

export function useBorrowerSearch(query: string) {
  return useQuery({
    queryKey: borrowerKeys.search(query),
    queryFn: () =>
      apiClient.get<BorrowerSearchResult[]>(
        `${ROUTES.api.borrowerSearch}?q=${encodeURIComponent(query)}`
      ),
    enabled: query.length >= 1,
    staleTime: 30_000,
  });
}

export function useCreateBorrower() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBorrowerPayload) =>
      apiClient.post<BorrowerProfile>(ROUTES.api.borrowers, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: borrowerKeys.lists(),
      });
      toast.success("Peminjam berhasil ditambahkan.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal menambahkan peminjam."
      );
    },
  });
}
