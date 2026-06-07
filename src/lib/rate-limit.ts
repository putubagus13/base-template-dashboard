// src/lib/rate-limit.ts
// ============================================================
// SIMPLE IN-MEMORY RATE LIMITER
// Gunakan untuk melindungi auth endpoints dari brute force.
//
// Untuk production dengan multiple instances, ganti implementasi
// ini menggunakan Redis (Upstash) atau Vercel KV.
//
// Contoh penggunaan di API route:
//
//   const limiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 })
//   const { success, remaining, resetTime } = await limiter.check(request)
//   if (!success) {
//     return ApiResponseBuilder.error("RATE_LIMIT_EXCEEDED", "Too many requests.", 429)
//   }
// ============================================================

import type { NextRequest } from "next/server";

type RateLimitOptions = {
  /** Jumlah maksimum request dalam window */
  limit: number;
  /** Durasi window dalam milliseconds */
  windowMs: number;
};

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
};

type Entry = {
  count: number;
  resetTime: number;
};

/**
 * Create a rate limiter instance.
 * Satu instance per endpoint yang ingin dilindungi.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const store = new Map<string, Entry>();

  // Clean up expired entries periodically
  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetTime <= now) {
        store.delete(key);
      }
    }
  };

  // Cleanup every 5 minutes
  if (typeof setInterval !== "undefined") {
    setInterval(cleanup, 5 * 60 * 1000);
  }

  return {
    check(request: NextRequest): RateLimitResult {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";

      const now = Date.now();
      const key = `${ip}`;

      const existing = store.get(key);

      if (!existing || existing.resetTime <= now) {
        // First request or window expired
        const entry: Entry = {
          count: 1,
          resetTime: now + options.windowMs,
        };
        store.set(key, entry);

        return {
          success: true,
          limit: options.limit,
          remaining: options.limit - 1,
          resetTime: entry.resetTime,
        };
      }

      existing.count++;

      if (existing.count > options.limit) {
        return {
          success: false,
          limit: options.limit,
          remaining: 0,
          resetTime: existing.resetTime,
        };
      }

      return {
        success: true,
        limit: options.limit,
        remaining: options.limit - existing.count,
        resetTime: existing.resetTime,
      };
    },
  };
}

// ─── Pre-configured limiters ──────────────────────────────────

/** Auth endpoints: max 10 attempts per 15 minutes */
export const authRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 15 * 60 * 1000,
});

/** Password reset: max 3 attempts per hour */
export const passwordResetLimiter = createRateLimiter({
  limit: 3,
  windowMs: 60 * 60 * 1000,
});

/** General API: max 100 requests per minute */
export const apiRateLimiter = createRateLimiter({
  limit: 100,
  windowMs: 60 * 1000,
});
