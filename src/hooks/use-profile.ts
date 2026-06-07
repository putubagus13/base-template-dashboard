// src/hooks/use-profile.ts
// ============================================================
// PROFILE HOOKS
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
// import type { AuthUser } from "@/types/auth";
import { UserStatus } from "@prisma/client";

export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
};

type ProfileData = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  status: UserStatus;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  roles: {
    id: string;
    name: string;
    description: string | null;
    permissions: { id: string; action: string; subject: string }[];
  }[];
};

type UpdateProfilePayload = {
  name?: string;
  avatar?: string | null;
};

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => apiClient.get<ProfileData>("/api/profile"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      apiClient.patch<ProfileData>("/api/profile", payload),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      if (response.data) {
        // Partially update auth store
        const currentUser = useAuthStore.getState().user;
        if (currentUser && response.data) {
          setUser({
            ...currentUser,
            name: response.data.name,
            avatar: response.data.avatar ?? null,
          });
        }
      }
      toast.success("Profile updated successfully.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Failed to update profile.");
    },
  });
}

export function useChangePassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      apiClient.post("/api/profile/change-password", payload),
    onSuccess: () => {
      toast.success("Password changed. Please sign in again.");
      // Force logout since all sessions invalidated
      router.push("/auth/login");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message);
      else toast.error("Failed to change password.");
    },
  });
}
