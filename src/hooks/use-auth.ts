// src/hooks/use-auth.ts
// ============================================================
// AUTH HOOKS - React Query mutations untuk semua auth actions
// ============================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import type {
  LoginCredentials,
  RegisterCredentials,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  LoginResponse,
} from "@/types/auth";
import { ROUTES } from "@/config/routes";

// ─── Login ───────────────────────────────────────────────────

export function useLogin() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      apiClient.post<LoginResponse>(ROUTES.api.auth.login, credentials),
    onSuccess: (response) => {
      if (response.data) {
        setUser(response.data.user);
        queryClient.clear();
        toast.success("Welcome back!");
        router.push("/dashboard");
        router.refresh();
      }
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    },
  });
}

// ─── Register ────────────────────────────────────────────────

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterCredentials) =>
      apiClient.post(ROUTES.api.auth.register, data),
    onSuccess: () => {
      toast.success("Registration successful! Please verify your email.");
      router.push("/auth/login?registered=true");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    },
  });
}

// ─── Logout ──────────────────────────────────────────────────

export function useLogout() {
  const router = useRouter();
  const clearUser = useAuthStore((s) => s.clearUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post(ROUTES.api.auth.logout),
    onSuccess: () => {
      clearUser();
      queryClient.clear();
      router.push("/auth/login");
      router.refresh();
    },
    onError: () => {
      // Force logout even on error
      clearUser();
      queryClient.clear();
      router.push("/auth/login");
    },
  });
}

// ─── Forgot Password ─────────────────────────────────────────

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) =>
      apiClient.post(ROUTES.api.auth.forgotPassword, data),
    onSuccess: () => {
      toast.success("Password reset email sent. Please check your inbox.");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    },
  });
}

// ─── Reset Password ──────────────────────────────────────────

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) =>
      apiClient.post(ROUTES.api.auth.resetPassword, data),
    onSuccess: () => {
      toast.success("Password reset successful! Please log in.");
      router.push(`/auth/login?reset=true`);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    },
  });
}
