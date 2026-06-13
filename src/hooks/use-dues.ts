// src/hooks/use-dues.ts
// ============================================================
// DUES (IURAN ANGGOTA) HOOKS
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import {
  ListDuesAgendaQueryParam,
  DuesAgendaProfile,
  MemberDuesPaymentProfile,
  CreateDuesAgendaPayload,
  UpdateDuesAgendaPayload,
  PayDuesPaymentPayload,
} from "@/types";
import { ROUTES } from "@/config/routes";

// ─── Query Keys ──────────────────────────────────────────────

export const duesKeys = {
  all: ["dues-agendas"] as const,
  lists: () => [...duesKeys.all, "list"] as const,
  list: (params: ListDuesAgendaQueryParam) =>
    [...duesKeys.lists(), params] as const,
  details: () => [...duesKeys.all, "detail"] as const,
  detail: (id: string) => [...duesKeys.details(), id] as const,
  payments: (agendaId: string) =>
    [...duesKeys.all, "payments", agendaId] as const,
};

// ─── Agenda Hooks ─────────────────────────────────────────────

export function useDuesAgendas(params: ListDuesAgendaQueryParam = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.type) searchParams.set("type", params.type);
  if (params.isActive !== undefined)
    searchParams.set("isActive", String(params.isActive));
  if (params.periodMonth)
    searchParams.set("periodMonth", String(params.periodMonth));
  if (params.periodYear)
    searchParams.set("periodYear", String(params.periodYear));

  return useQuery({
    queryKey: duesKeys.list(params),
    queryFn: () =>
      apiClient.get<DuesAgendaProfile[]>(
        `${ROUTES.api.duesAgendas}?${searchParams.toString()}`
      ),
    placeholderData: (prev) => prev,
  });
}

export function useDuesAgenda(id: string) {
  return useQuery({
    queryKey: duesKeys.detail(id),
    queryFn: () => apiClient.get<DuesAgendaProfile>(ROUTES.api.duesAgenda(id)),
    enabled: Boolean(id),
  });
}

export function useCreateDuesAgenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDuesAgendaPayload) =>
      apiClient.post<DuesAgendaProfile>(ROUTES.api.duesAgendas, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: duesKeys.lists() });
      toast.success("Agenda iuran berhasil ditambahkan.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal menambahkan agenda iuran.");
    },
  });
}

export function useUpdateDuesAgenda(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDuesAgendaPayload) =>
      apiClient.patch<DuesAgendaProfile>(ROUTES.api.duesAgenda(id), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: duesKeys.all });
      toast.success("Agenda iuran berhasil diperbarui.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal memperbarui agenda iuran.");
    },
  });
}

export function useDeleteDuesAgenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(ROUTES.api.duesAgenda(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: duesKeys.lists() });
      toast.success("Agenda iuran berhasil dihapus.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal menghapus agenda iuran.");
    },
  });
}

// ─── Payment Generation ──────────────────────────────────────

export function useGenerateDuesPayments(agendaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post(ROUTES.api.duesAgendaGeneratePayments(agendaId), {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: duesKeys.all });
      toast.success("Data pembayaran berhasil digenerate.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal generate data pembayaran.");
    },
  });
}

// ─── Payment Hooks ───────────────────────────────────────────

export function useDuesPayments(
  agendaId: string,
  params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);

  return useQuery({
    queryKey: [...duesKeys.payments(agendaId), params],
    queryFn: () =>
      apiClient.get<MemberDuesPaymentProfile[]>(
        `${ROUTES.api.memberDuesPayments(agendaId)}?${searchParams.toString()}`
      ),
    enabled: Boolean(agendaId),
    placeholderData: (prev) => prev,
  });
}

export function usePayDuesPayment(paymentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PayDuesPaymentPayload) =>
      apiClient.post(ROUTES.api.memberDuesPaymentPay(paymentId), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: duesKeys.all });
      toast.success("Pembayaran iuran berhasil dicatat.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal mencatat pembayaran.");
    },
  });
}
