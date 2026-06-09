// src/config/routes.ts
// ============================================================
// ROUTE CONFIGURATION
// Single source of truth untuk semua route aplikasi.
// ============================================================

export const ROUTES = {
  // Auth
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  // Dashboard
  dashboard: {
    home: "/dashboard",
    users: "/dashboard/users",
    roles: "/dashboard/roles",
    auditLogs: "/dashboard/audit-logs",
    profile: "/dashboard/profile",
    settings: "/dashboard/settings",
  },

  // API
  api: {
    auth: {
      login: "/api/auth/login",
      register: "/api/auth/register",
      logout: "/api/auth/logout",
      refresh: "/api/auth/refresh",
      forgotPassword: "/api/auth/forgot-password",
      resetPassword: "/api/auth/reset-password",
    },
    users: "/api/users",
    user: (id: string) => `/api/users/${id}`,
    roles: "/api/roles",
    role: (id: string) => `/api/roles/${id}`,
    permissions: "/api/roles/permissions",
    profile: "/api/profile",
    changePassword: "/api/profile/change-password",
    auditLogs: "/api/audit-logs",
    member: "/api/members",
  },
} as const;

// Public routes (no auth required)
export const PUBLIC_ROUTES = Object.values(ROUTES.auth);

// Public API routes
export const PUBLIC_API_ROUTES = Object.values(ROUTES.api.auth);
