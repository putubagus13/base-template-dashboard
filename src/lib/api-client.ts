// src/lib/api-client.ts
// ============================================================
// API CLIENT
// Wrapper fetch dengan auto-refresh token pada 401.
// Gunakan ini di semua React Query hooks.
// ============================================================

import type { ApiResponse } from "@/types/api";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export { ApiError };

// ─── Refresh lock ────────────────────────────────────────────
// Prevents concurrent refresh requests — only one refresh runs at a time.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: 'same-origin' is default — cookies sent automatically
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Core request function ──────────────────────────────────

async function request<T>(
  url: string,
  options: RequestOptions = {},
  isRetry = false
): Promise<ApiResponse<T>> {
  const { body, ...rest } = options;

  const response = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...rest.headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // If 401 and not already a retry attempt → try refresh then retry
  if (response.status === 401 && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry original request with new access token (cookie updated by refresh)
      return request<T>(url, options, true);
    }
    // Refresh failed → let the 401 propagate (middleware will redirect)
  }

  const data: ApiResponse<T> = await response.json();

  if (!data.success || !response.ok) {
    throw new ApiError(
      data.message,
      data.error?.code ?? "UNKNOWN_ERROR",
      response.status
    );
  }

  return data;
}

export const apiClient = {
  get: <T>(url: string, options?: Omit<RequestOptions, "body">) =>
    request<T>(url, { ...options, method: "GET" }),

  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "POST", body }),

  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "PATCH", body }),

  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "PUT", body }),

  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "DELETE" }),
};
