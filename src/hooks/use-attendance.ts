// src/hooks/use-attendance.ts
// ============================================================
// ATTENDANCE HOOKS
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import {
  AttendancePointConfigProfile,
  AttendanceProfile,
  AttendanceLeaderboardEntry,
  BulkAttendanceInput,
  ListAttendanceLeaderboardParam,
} from "@/types";
import { ROUTES } from "@/config/routes";

export const attendanceKeys = {
  all: ["attendance"] as const,
  byMeeting: (meetingId: string) =>
    [...attendanceKeys.all, "meeting", meetingId] as const,
  pointConfig: () => [...attendanceKeys.all, "pointConfig"] as const,
  leaderboard: (params: ListAttendanceLeaderboardParam) =>
    [...attendanceKeys.all, "leaderboard", params] as const,
};

// ─── Attendance per meeting ──────────────────────────────────

export function useAttendance(meetingId: string) {
  return useQuery({
    queryKey: attendanceKeys.byMeeting(meetingId),
    queryFn: () =>
      apiClient.get<AttendanceProfile[]>(
        ROUTES.api.meetingAttendance(meetingId)
      ),
    enabled: Boolean(meetingId),
  });
}

export function useSaveAttendance(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attendances: BulkAttendanceInput[]) =>
      apiClient.put<AttendanceProfile[]>(
        ROUTES.api.meetingAttendance(meetingId),
        { attendances }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.byMeeting(meetingId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["meetings"],
      });
      toast.success("Absensi berhasil disimpan.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal menyimpan absensi.");
    },
  });
}

// ─── Point Config ────────────────────────────────────────────

export function useAttendancePointConfig() {
  return useQuery({
    queryKey: attendanceKeys.pointConfig(),
    queryFn: () =>
      apiClient.get<AttendancePointConfigProfile[]>(
        ROUTES.api.attendancePointConfig
      ),
  });
}

export function useUpdateAttendancePointConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      configs: Array<{
        status: "HADIR" | "IZIN" | "TIDAK_HADIR" | "SAKIT";
        points: number;
      }>
    ) =>
      apiClient.put<AttendancePointConfigProfile[]>(
        ROUTES.api.attendancePointConfig,
        { configs }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.pointConfig(),
      });
      toast.success("Konfigurasi poin berhasil diperbarui.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Gagal memperbarui konfigurasi poin.");
    },
  });
}

// ─── Leaderboard ─────────────────────────────────────────────

export function useAttendanceLeaderboard(
  params: ListAttendanceLeaderboardParam = {}
) {
  const searchParams = new URLSearchParams();
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.limit) searchParams.set("limit", String(params.limit));

  return useQuery({
    queryKey: attendanceKeys.leaderboard(params),
    queryFn: () =>
      apiClient.get<AttendanceLeaderboardEntry[]>(
        `${ROUTES.api.attendanceLeaderboard}?${searchParams.toString()}`
      ),
  });
}
