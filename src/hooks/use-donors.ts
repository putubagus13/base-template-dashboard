// src/hooks/use-donors.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import { ListDonorQueryParam } from "@/types";
import { ROUTES } from "@/config/routes";
import { DonorSummary } from "@/app/api/donors/route";
import { LeaderboardDonor } from "@/app/api/donors/leaderboard/route";
import { MemberSearchResult } from "@/app/api/members/search/route";
import { DonorVerificationStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────

export type DonorWithMember = {
  id: string;
  organizationId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalDonated: string; // Decimal serialized
  isMember: boolean;
  memberId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  verificationStatus: DonorVerificationStatus;
  member: { id: string; fullName: string } | null;
};

export type CreateDonorPayload = {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isMember: boolean;
  memberId?: string | null;
  notes?: string | null;
};

export type UpdateDonorPayload = Partial<CreateDonorPayload>;

// ─── Query Keys ──────────────────────────────────────────────

export const donorKeys = {
  all: ["donors"] as const,
  lists: () => [...donorKeys.all, "list"] as const,
  list: (params: ListDonorQueryParam) =>
    [...donorKeys.lists(), params] as const,
  leaderboard: () => [...donorKeys.all, "leaderboard"] as const,
};

// ─── Hooks ───────────────────────────────────────────────────

export function useDonors(params: ListDonorQueryParam = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.isMember !== undefined)
    searchParams.set("isMember", String(params.isMember));
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);

  return useQuery({
    queryKey: donorKeys.list(params),
    queryFn: () =>
      apiClient.get<{ summary: DonorSummary; data: DonorWithMember[] }>(
        `${ROUTES.api.donors}?${searchParams.toString()}`
      ),
    placeholderData: (prev) => prev,
  });
}

export function useCreateDonor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDonorPayload) =>
      apiClient.post<DonorWithMember>(ROUTES.api.donors, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: donorKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: donorKeys.leaderboard(),
      });
      toast.success("Donatur berhasil ditambahkan.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal menambahkan donatur."
      );
    },
  });
}

export function useUpdateDonor(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDonorPayload) =>
      apiClient.patch<DonorWithMember>(ROUTES.api.donor(id), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: donorKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: donorKeys.leaderboard(),
      });
      toast.success("Donatur berhasil diperbarui.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal memperbarui donatur."
      );
    },
  });
}

export function useDeleteDonor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(ROUTES.api.donor(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: donorKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: donorKeys.leaderboard(),
      });
      toast.success("Donatur berhasil dihapus.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError ? error.message : "Gagal menghapus donatur."
      );
    },
  });
}

export function useDonorLeaderboard() {
  return useQuery({
    queryKey: donorKeys.leaderboard(),
    queryFn: () =>
      apiClient.get<LeaderboardDonor[]>(ROUTES.api.donorLeaderboard),
  });
}

export function useMemberSearch(query: string) {
  return useQuery({
    queryKey: ["memberSearch", query],
    queryFn: () =>
      apiClient.get<MemberSearchResult[]>(
        `${ROUTES.api.memberSearch}?q=${encodeURIComponent(query)}`
      ),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}
