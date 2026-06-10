// src/config/app.ts
// ============================================================
// APP CONFIGURATION CONSTANTS
// Import dari sini, jangan hardcode di file lain.
// ============================================================

export const APP_CONFIG = {
  name: "Dashboard Template",
  description: "A full-stack dashboard built with Next.js 15",
  version: "1.0.0",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export const AUTH_CONFIG = {
  accessTokenExpiry: "15m",
  ageAccessTokenExpiry: 15 * 60 * 60 * 1000, // 15 minutes in ms
  refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days in seconds
  rememberMeExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  defaultExpiry: 24 * 60 * 60 * 1000, // 1 day in ms
  passwordResetExpiry: 60 * 60 * 1000, // 1 hour in ms
  saltRounds: 12,
  cookieNames: {
    accessToken: "access_token",
    refreshToken: "refresh_token",
  },
} as const;

export const PAGINATION_CONFIG = {
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 100,
  pageSizeOptions: [10, 25, 50, 100],
} as const;

export const RATE_LIMIT_CONFIG = {
  auth: {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  },
  passwordReset: {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  },
  api: {
    limit: 100,
    windowMs: 60 * 1000,
  },
} as const;

// System roles yang tidak bisa dihapus
export const SYSTEM_ROLES = ["SUPER_ADMIN", "USER"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];
