// src/hooks/use-meeting-types.ts
// ============================================================
// MEETING TYPE HOOKS
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import { MeetingTypeProfile } from "@/types";
import { ROUTES } from "@/config/routes";

export const meetingTypeKeys = {
  all: ["meetingTypes"] as const,
  list: () => [...meetingTypeKeys.all, "list"] as const,
};

export function useMeetingTypes() {
  return useQuery({
    queryKey: meetingTypeKeys.list(),
    queryFn: () => apiClient.get<MeetingTypeProfile[]>(ROUTES.api.meetingTypes),
  });
}

export function useCreateMeetingType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; color?: string | null }) =>
      apiClient.post<MeetingTypeProfile>(ROUTES.api.meetingTypes, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meetingTypeKeys.all });
      toast.success("Tipe rapat berhasil ditambahkan.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal menambahkan tipe rapat.");
    },
  });
}

export function useUpdateMeetingType(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; color?: string | null }) =>
      apiClient.patch<MeetingTypeProfile>(ROUTES.api.meetingType(id), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meetingTypeKeys.all });
      toast.success("Tipe rapat berhasil diperbarui.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal memperbarui tipe rapat.");
    },
  });
}

export function useDeleteMeetingType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(ROUTES.api.meetingType(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meetingTypeKeys.all });
      toast.success("Tipe rapat berhasil dihapus.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal menghapus tipe rapat.");
    },
  });
}
