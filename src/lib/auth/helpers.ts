// src/lib/auth/helpers.ts
// ============================================================
// AUTH HELPER FUNCTIONS
// ============================================================

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { verifyAccessToken } from "./jwt";
import type { AuthUser, JwtPayload } from "@/types/auth";
import { Organization } from "@/types";

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

// ─── Password ────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Cookie Management ───────────────────────────────────────

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean = false
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 days or 1 day
    path: "/",
  });
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function getTokensFromCookies(): Promise<{
  accessToken: string | undefined;
  refreshToken: string | undefined;
}> {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}

// ─── Session ─────────────────────────────────────────────────

/**
 * Get authenticated user dari token di cookie.
 * Returns null jika tidak terautentikasi.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const { accessToken } = await getTokensFromCookies();
    if (!accessToken) return null;

    const payload: JwtPayload = await verifyAccessToken(accessToken);

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      avatar: null,
      status: "ACTIVE",
      roles: payload.roles,
      permissions: payload.permissions,
      activeOrganization: payload.activeOrganization,
    };
  } catch {
    return null;
  }
}

/**
 * Require authenticated user. Throw error jika tidak terautentikasi.
 * Digunakan di server components dan API routes yang butuh auth.
 */
export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

// ─── User Data ───────────────────────────────────────────────

/**
 * Build AuthUser object dari database.
 * Gunakan ini saat login atau refresh untuk mendapatkan data terbaru.
 */
export async function buildAuthUser(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
      organizations: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!user) return null;
  if (!user.organizations || user.organizations.length === 0) return null;

  const roles = user.roles.map((ur) => ur.role.name);
  const permissions = user.roles.flatMap((ur) =>
    ur.role.permissions.map(
      (rp) => `${rp.permission.action}:${rp.permission.subject}`
    )
  );

  // Deduplicate permissions
  const uniquePermissions = [...new Set(permissions)];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    status: user.status,
    roles,
    permissions: uniquePermissions,
    activeOrganization: user.organizations[0]?.organization as Organization,
  };
}
