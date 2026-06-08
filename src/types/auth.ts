// src/types/auth.ts
// ============================================================
// AUTHENTICATION TYPES
// ============================================================

import { UserStatus } from "@prisma/client";
import { Organization } from ".";

/**
 * User object yang disimpan dalam session/JWT.
 * Hanya berisi data yang aman untuk expose.
 */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  status: UserStatus;
  roles: string[];
  permissions: string[]; // Format: "action:subject" e.g. "read:user"
  activeOrganization: Organization;
};

/**
 * JWT payload yang di-encode dalam token.
 */
export type JwtPayload = {
  sub: string; // userId
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  activeOrganization: Organization;
  iat: number;
  exp: number;
};

/**
 * Credentials untuk login.
 */
export type LoginCredentials = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

/**
 * Data yang dibutuhkan untuk register.
 */
export type RegisterCredentials = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/**
 * Request forgot password.
 */
export type ForgotPasswordRequest = {
  email: string;
};

/**
 * Request reset password.
 */
export type ResetPasswordRequest = {
  token: string;
  password: string;
  confirmPassword: string;
};

/**
 * Response dari login endpoint.
 */
export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
};
