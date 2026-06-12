// src/hooks/use-transaction-categories.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import { ListTransactionCategoryQueryParam } from "@/types";
import { ROUTES } from "@/config/routes";
import { TransactionCategory } from "@prisma/client";
import { TransactionCategorySummary } from "@/app/api/transaction-categories/route";

export const transactionCategoryKeys = {
  all: ["transactionCategories"] as const,
  lists: () => [...transactionCategoryKeys.all, "list"] as const,
  list: (params: ListTransactionCategoryQueryParam) =>
    [...transactionCategoryKeys.lists(), params] as const,
};

export type CreateTransactionCategoryPayload = {
  name: string;
  description?: string | null;
  color?: string | null;
  isActive: boolean;
};

export type UpdateTransactionCategoryPayload = {
  name?: string;
  description?: string | null;
  color?: string | null;
  isActive?: boolean;
};

export function useTransactionCategories(
  params: ListTransactionCategoryQueryParam = {}
) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.isActive !== undefined)
    searchParams.set("isActive", String(params.isActive));

  return useQuery({
    queryKey: transactionCategoryKeys.list(params),
    queryFn: () =>
      apiClient.get<{
        summary: TransactionCategorySummary;
        data: TransactionCategory[];
      }>(`${ROUTES.api.transactionCategories}?${searchParams.toString()}`),
    placeholderData: (prev) => prev,
  });
}

export function useCreateTransactionCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionCategoryPayload) =>
      apiClient.post<TransactionCategory>(
        ROUTES.api.transactionCategories,
        payload
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: transactionCategoryKeys.lists(),
      });
      toast.success("Kategori berhasil ditambahkan.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal menambahkan kategori."
      );
    },
  });
}

export function useUpdateTransactionCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTransactionCategoryPayload) =>
      apiClient.patch<TransactionCategory>(
        ROUTES.api.transactionCategory(id),
        payload
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: transactionCategoryKeys.lists(),
      });
      toast.success("Kategori berhasil diperbarui.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal memperbarui kategori."
      );
    },
  });
}

export function useDeleteTransactionCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(ROUTES.api.transactionCategory(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: transactionCategoryKeys.lists(),
      });
      toast.success("Kategori berhasil dihapus.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal menghapus kategori."
      );
    },
  });
}
