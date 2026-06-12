// src/hooks/use-cash-transactions.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import { ListCashTransactionQueryParam } from "@/types";
import { ROUTES } from "@/config/routes";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { CashTransactionSummary } from "@/app/api/cash-transactions/route";

export type CashTransactionWithRelations = {
  id: string;
  organizationId: string;
  accountId: string;
  categoryId: string | null;
  type: TransactionType;
  amount: string; // Decimal serialized
  description: string;
  referenceNo: string | null;
  donorId: string | null;
  transactionDate: string;
  recordedBy: string;
  attachmentUrl: string | null;
  isVerified: boolean;
  verificationStatus: TransactionStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  account: { id: string; name: string };
  category: { id: string; name: string; color: string | null } | null;
  recorder: { id: string; name: string };
  verifier: { id: string; name: string } | null;
};

export const cashTransactionKeys = {
  all: ["cashTransactions"] as const,
  lists: () => [...cashTransactionKeys.all, "list"] as const,
  list: (params: ListCashTransactionQueryParam) =>
    [...cashTransactionKeys.lists(), params] as const,
};

export type CreateCashTransactionPayload = {
  accountId: string;
  categoryId?: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  referenceNo?: string | null;
  transactionDate: string;
  notes?: string | null;
};

export type UpdateCashTransactionPayload =
  Partial<CreateCashTransactionPayload>;

export type VerifyCashTransactionPayload = {
  action: "approve" | "reject";
  notes?: string | null;
};

export function useCashTransactions(
  params: ListCashTransactionQueryParam = {}
) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.type) searchParams.set("type", params.type);
  if (params.accountId) searchParams.set("accountId", params.accountId);
  if (params.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params.verificationStatus)
    searchParams.set("verificationStatus", params.verificationStatus);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);

  return useQuery({
    queryKey: cashTransactionKeys.list(params),
    queryFn: () =>
      apiClient.get<{
        summary: CashTransactionSummary;
        data: CashTransactionWithRelations[];
      }>(`${ROUTES.api.cashTransactions}?${searchParams.toString()}`),
    placeholderData: (prev) => prev,
  });
}

export function useCreateCashTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCashTransactionPayload) =>
      apiClient.post<CashTransactionWithRelations>(
        ROUTES.api.cashTransactions,
        payload
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: cashTransactionKeys.lists(),
      });
      toast.success("Transaksi berhasil dibuat.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal membuat transaksi."
      );
    },
  });
}

export function useUpdateCashTransaction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCashTransactionPayload) =>
      apiClient.patch<CashTransactionWithRelations>(
        ROUTES.api.cashTransaction(id),
        payload
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: cashTransactionKeys.lists(),
      });
      toast.success("Transaksi berhasil diperbarui.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal memperbarui transaksi."
      );
    },
  });
}

export function useDeleteCashTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(ROUTES.api.cashTransaction(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: cashTransactionKeys.lists(),
      });
      toast.success("Transaksi berhasil dihapus.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal menghapus transaksi."
      );
    },
  });
}

export function useVerifyCashTransaction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyCashTransactionPayload) =>
      apiClient.post<CashTransactionWithRelations>(
        ROUTES.api.cashTransactionVerify(id),
        payload
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: cashTransactionKeys.lists(),
      });
      // Also invalidate cash accounts since balance may have changed
      void queryClient.invalidateQueries({ queryKey: ["cashAccounts"] });
      toast.success(
        variables.action === "approve"
          ? "Transaksi berhasil disetujui."
          : "Transaksi ditolak."
      );
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal memverifikasi transaksi."
      );
    },
  });
}
