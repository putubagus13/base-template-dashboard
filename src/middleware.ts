// src/middleware.ts
// ============================================================
// NEXT.JS MIDDLEWARE — ROUTE PROTECTION + TOKEN REFRESH
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { PUBLIC_API_ROUTES, PUBLIC_ROUTES, ROUTES } from "./config/routes";
import { AUTH_CONFIG } from "./config/app";

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

/**
 * Attempt silent token refresh via the refresh API.
 * Returns the Set-Cookie headers from the response on success, or null on failure.
 */
async function tryRefreshToken(
  refreshToken: string,
  baseUrl: string
): Promise<string[] | null> {
  try {
    const refreshUrl = new URL(ROUTES.api.auth.refresh, baseUrl);
    const refreshResponse = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        Cookie: `${AUTH_CONFIG.cookieNames.refreshToken}=${refreshToken}`,
        "Content-Type": "application/json",
      },
    });

    if (refreshResponse.ok) {
      return refreshResponse.headers.getSetCookie();
    }
  } catch {
    // Refresh failed — fall through
  }
  return null;
}

/**
 * Build a response that forwards Set-Cookie headers from a refresh response.
 */
function buildResponseWithCookies(
  response: NextResponse,
  cookies: string[]
): NextResponse {
  cookies.forEach((cookie) => {
    response.headers.append("Set-Cookie", cookie);
  });
  return response;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (isStaticAsset(pathname)) return NextResponse.next();

  // Allow public API routes
  if (isPublicApiRoute(pathname)) return NextResponse.next();

  // Public pages: redirect to dashboard if already authed
  if (isPublicRoute(pathname)) {
    const accessToken = request.cookies.get(
      AUTH_CONFIG.cookieNames.accessToken
    )?.value;
    if (accessToken) {
      try {
        await verifyAccessToken(accessToken);
        return NextResponse.redirect(
          new URL(ROUTES.dashboard.home, request.url)
        );
      } catch {
        // Invalid token — show the public page
      }
    }
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === "/") {
    const accessToken = request.cookies.get(
      AUTH_CONFIG.cookieNames.accessToken
    )?.value;
    if (accessToken) {
      try {
        await verifyAccessToken(accessToken);
        return NextResponse.redirect(
          new URL(ROUTES.dashboard.home, request.url)
        );
      } catch {
        // Token expired/invalid — redirect to login
      }
    }
    return NextResponse.redirect(new URL(ROUTES.auth.login, request.url));
  }

  // ─── Protected routes ────────────────────────────────────────
  const accessToken = request.cookies.get(
    AUTH_CONFIG.cookieNames.accessToken
  )?.value;
  const refreshToken = request.cookies.get(
    AUTH_CONFIG.cookieNames.refreshToken
  )?.value;

  // Case 1: Valid access token → proceed with user context
  if (accessToken) {
    try {
      const payload = await verifyAccessToken(accessToken);

      // Inject user context into request headers for Server Components
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.sub);
      requestHeaders.set("x-user-email", payload.email);
      requestHeaders.set("x-user-roles", JSON.stringify(payload.roles));
      requestHeaders.set(
        "x-user-permissions",
        JSON.stringify(payload.permissions)
      );

      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      // Access token expired/invalid → try refresh below
    }
  }

  // Case 2: Access token missing or expired → try silent refresh
  if (refreshToken) {
    const newCookies = await tryRefreshToken(refreshToken, request.url);
    if (newCookies) {
      // Refresh succeeded → continue with new tokens set via cookies
      return buildResponseWithCookies(NextResponse.next(), newCookies);
    }
  }

  // Case 3: No valid tokens — redirect to login
  const loginUrl = new URL(ROUTES.auth.login, request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(AUTH_CONFIG.cookieNames.accessToken);
  response.cookies.delete(AUTH_CONFIG.cookieNames.refreshToken);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
