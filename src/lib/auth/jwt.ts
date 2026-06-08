// src/lib/auth/jwt.ts
// ============================================================
// JWT TOKEN UTILITIES
// ============================================================

import { SignJWT, jwtVerify } from "jose";
import type { JwtPayload } from "@/types/auth";
import { Organization } from "@/types";

const getAccessTokenSecret = (): Uint8Array => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not defined");
  return new TextEncoder().encode(secret);
};

const getRefreshTokenSecret = (): Uint8Array => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not defined");
  return new TextEncoder().encode(secret);
};

/**
 * Generate access token (15 menit).
 */
export async function generateAccessToken(
  payload: Omit<JwtPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    roles: payload.roles,
    permissions: payload.permissions,
    activeOrganization: payload.activeOrganization,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getAccessTokenSecret());
}

/**
 * Generate refresh token (7 hari).
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getRefreshTokenSecret());
}

/**
 * Verify dan decode access token.
 * Throws jika token invalid atau expired.
 */
export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getAccessTokenSecret());

  return {
    sub: payload.sub as string,
    email: payload["email"] as string,
    name: payload["name"] as string,
    roles: payload["roles"] as string[],
    activeOrganization: payload["activeOrganization"] as Organization,
    permissions: payload["permissions"] as string[],
    iat: payload.iat as number,
    exp: payload.exp as number,
  };
}

/**
 * Verify dan decode refresh token.
 */
export async function verifyRefreshToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, getRefreshTokenSecret());
  return payload.sub as string;
}
