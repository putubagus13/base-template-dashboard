// src/hooks/use-loans.ts
// ============================================================
// LOAN (PINJAMAN) HOOKS
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import {
  ListLoanQueryParam,
  LoanProfile,
  LoanDetailProfile,
  LoanPaymentProfile,
  CreateLoanPayload,
  UpdateLoanPayload,
  VerifyLoanPayload,
  CreateLoanPaymentPayload,
  UpdateLoanPaymentPayload,
} from "@/types";
import { ROUTES } from "@/config/routes";
import { LoanListSummary } from "@/app/api/loans/route";

// ─── Query Keys ──────────────────────────────────────────────

export const loanKeys = {
  all: ["loans"] as const,
  lists: () => [...loanKeys.all, "list"] as const,
  list: (params: ListLoanQueryParam) => [...loanKeys.lists(), params] as const,
  details: () => [...loanKeys.all, "detail"] as const,
  detail: (id: string) => [...loanKeys.details(), id] as const,
  payments: (loanId: string) => [...loanKeys.all, "payments", loanId] as const,
};

// ─── Loan Hooks ─────────────────────────────────────────────

export function useLoans(params: ListLoanQueryParam = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.borrowerId) searchParams.set("borrowerId", params.borrowerId);
  if (params.accountId) searchParams.set("accountId", params.accountId);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.overdue) searchParams.set("overdue", "true");

  return useQuery({
    queryKey: loanKeys.list(params),
    queryFn: () =>
      apiClient.get<{
        summary: LoanListSummary;
        data: LoanProfile[];
      }>(`${ROUTES.api.loans}?${searchParams.toString()}`),
    placeholderData: (prev) => prev,
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: loanKeys.detail(id),
    queryFn: () => apiClient.get<LoanDetailProfile>(ROUTES.api.loan(id)),
    enabled: Boolean(id),
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLoanPayload) =>
      apiClient.post<LoanProfile>(ROUTES.api.loans, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: loanKeys.lists() });
      toast.success("Pengajuan pinjaman berhasil dibuat.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal membuat pengajuan pinjaman."
      );
    },
  });
}

export function useUpdateLoan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLoanPayload) =>
      apiClient.patch<LoanProfile>(ROUTES.api.loan(id), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
      toast.success("Pinjaman berhasil diperbarui.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal memperbarui pinjaman."
      );
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(ROUTES.api.loan(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: loanKeys.lists() });
      toast.success("Pinjaman berhasil dihapus.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal menghapus pinjaman."
      );
    },
  });
}

export function useVerifyLoan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyLoanPayload) =>
      apiClient.post<LoanProfile>(ROUTES.api.loanVerify(id), payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["cashAccounts"] });
      void queryClient.invalidateQueries({ queryKey: ["borrowers"] });
      toast.success(
        variables.action === "approve"
          ? "Pinjaman berhasil disetujui."
          : "Pinjaman ditolak."
      );
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal memverifikasi pinjaman."
      );
    },
  });
}

// ─── Loan Payment Hooks ──────────────────────────────────────

export function useLoanPayments(
  loanId: string,
  params: { status?: string; page?: number; limit?: number } = {}
) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status) searchParams.set("status", params.status);

  return useQuery({
    queryKey: [...loanKeys.payments(loanId), params],
    queryFn: () =>
      apiClient.get<{ data: LoanPaymentProfile[]; total: number }>(
        `${ROUTES.api.loanPayments(loanId)}?${searchParams.toString()}`
      ),
    enabled: Boolean(loanId),
    placeholderData: (prev) => prev,
  });
}

export function useCreateLoanPayment(loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLoanPaymentPayload) =>
      apiClient.post<LoanPaymentProfile>(
        ROUTES.api.loanPayments(loanId),
        payload
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
      toast.success("Pengajuan pembayaran berhasil dibuat.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal membuat pengajuan pembayaran."
      );
    },
  });
}

export function useUpdateLoanPayment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLoanPaymentPayload) =>
      apiClient.patch<LoanPaymentProfile>(ROUTES.api.loanPayment(id), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
      toast.success("Pembayaran berhasil diperbarui.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal memperbarui pembayaran."
      );
    },
  });
}

export function useDeleteLoanPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(ROUTES.api.loanPayment(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
      toast.success("Pembayaran berhasil dihapus.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal menghapus pembayaran."
      );
    },
  });
}

export function useVerifyLoanPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      action,
    }: { paymentId: string } & VerifyLoanPayload) =>
      apiClient.post<LoanPaymentProfile>(
        ROUTES.api.loanPaymentVerify(paymentId),
        { action }
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["cashAccounts"] });
      void queryClient.invalidateQueries({ queryKey: ["borrowers"] });
      toast.success(
        variables.action === "approve"
          ? "Pembayaran berhasil disetujui."
          : "Pembayaran ditolak."
      );
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Gagal memverifikasi pembayaran."
      );
    },
  });
}
