// src/hooks/use-meetings.ts
// ============================================================
// MEETING HOOKS
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import { ListMeetingQueryParam, MeetingProfile, MeetingSummary } from "@/types";
import { ROUTES } from "@/config/routes";
import { MeetingStatus } from "@prisma/client";

export const meetingKeys = {
  all: ["meetings"] as const,
  lists: () => [...meetingKeys.all, "list"] as const,
  list: (params: ListMeetingQueryParam) =>
    [...meetingKeys.lists(), params] as const,
  details: () => [...meetingKeys.all, "detail"] as const,
  detail: (id: string) => [...meetingKeys.details(), id] as const,
};

export type MeetingWithSummary = {
  summary: MeetingSummary;
  data: MeetingProfile[];
};

export function useMeetings(params: ListMeetingQueryParam = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.meetingTypeId)
    searchParams.set("meetingTypeId", params.meetingTypeId);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);

  return useQuery({
    queryKey: meetingKeys.list(params),
    queryFn: () =>
      apiClient.get<MeetingWithSummary>(
        `${ROUTES.api.meetings}?${searchParams.toString()}`
      ),
    placeholderData: (prev) => prev,
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: meetingKeys.detail(id),
    queryFn: () => apiClient.get(ROUTES.api.meeting(id)),
    enabled: Boolean(id),
  });
}

export type CreateMeetingPayload = {
  title: string;
  meetingTypeId: string;
  scheduledAt: string;
  status?: MeetingStatus;
  description?: string | null;
};

export type UpdateMeetingPayload = {
  title?: string;
  meetingTypeId?: string;
  scheduledAt?: string;
  status?: MeetingStatus;
  description?: string | null;
  discussionNotes?: string | null;
};

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMeetingPayload) =>
      apiClient.post<MeetingProfile>(ROUTES.api.meetings, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      toast.success("Rapat berhasil ditambahkan.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal menambahkan rapat.");
    },
  });
}

export function useUpdateMeeting(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMeetingPayload) =>
      apiClient.patch<MeetingProfile>(ROUTES.api.meeting(id), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      toast.success("Rapat berhasil diperbarui.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal memperbarui rapat.");
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(ROUTES.api.meeting(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      toast.success("Rapat berhasil dihapus.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal menghapus rapat.");
    },
  });
}
