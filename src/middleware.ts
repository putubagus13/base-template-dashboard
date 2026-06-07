// src/middleware.ts
// ============================================================
// NEXT.JS MIDDLEWARE — ROUTE PROTECTION + TOKEN REFRESH
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/refresh",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r));
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (isStaticAsset(pathname)) return NextResponse.next();

  // Allow public API routes
  if (isPublicApiRoute(pathname)) return NextResponse.next();

  // Public pages: redirect to dashboard if already authed
  if (isPublicRoute(pathname)) {
    const accessToken = request.cookies.get("access_token")?.value;
    if (accessToken) {
      try {
        await verifyAccessToken(accessToken);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch {
        // Invalid token — show the public page
      }
    }
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === "/") {
    const accessToken = request.cookies.get("access_token")?.value;
    const dest = accessToken ? "/dashboard" : "/auth/login";
    try {
      if (accessToken) await verifyAccessToken(accessToken);
      return NextResponse.redirect(new URL(dest, request.url));
    } catch {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // ─── Protected routes ────────────────────────────────────────
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    // Try silent refresh via refresh token
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (refreshToken) {
      try {
        const refreshUrl = new URL("/api/auth/refresh", request.url);
        const refreshResponse = await fetch(refreshUrl, {
          method: "POST",
          headers: { Cookie: `refresh_token=${refreshToken}` },
        });

        if (refreshResponse.ok) {
          const response = NextResponse.next();
          refreshResponse.headers.getSetCookie().forEach((cookie) => {
            response.headers.append("Set-Cookie", cookie);
          });
          return response;
        }
      } catch {
        // Refresh failed
      }
    }

    // No valid tokens — redirect to login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify access token
  try {
    const payload = await verifyAccessToken(accessToken);

    // Inject user context into request headers for Server Components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.sub);
    requestHeaders.set("x-user-email", payload.email);
    requestHeaders.set("x-user-roles", JSON.stringify(payload.roles));
    requestHeaders.set("x-user-permissions", JSON.stringify(payload.permissions));

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    // Token expired or invalid
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);

    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("access_token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
