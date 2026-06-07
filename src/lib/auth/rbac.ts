// src/lib/auth/rbac.ts
// ============================================================
// ROLE-BASED ACCESS CONTROL UTILITIES
//
// Cara pengecekan permission:
//   hasPermission(user, "read:user")        → single permission
//   hasAnyPermission(user, [...])           → OR check
//   hasAllPermissions(user, [...])          → AND check
//   hasRole(user, "SUPER_ADMIN")            → role check
// ============================================================

import type { AuthUser } from "@/types/auth";
import type { PermissionString } from "@/types/rbac";

/**
 * Cek apakah user memiliki permission tertentu.
 */
export function hasPermission(
  user: AuthUser,
  permission: PermissionString
): boolean {
  return user.permissions.includes(permission);
}

/**
 * Cek apakah user memiliki minimal satu dari permissions yang diberikan.
 */
export function hasAnyPermission(
  user: AuthUser,
  permissions: PermissionString[]
): boolean {
  return permissions.some((p) => user.permissions.includes(p));
}

/**
 * Cek apakah user memiliki semua permissions yang diberikan.
 */
export function hasAllPermissions(
  user: AuthUser,
  permissions: PermissionString[]
): boolean {
  return permissions.every((p) => user.permissions.includes(p));
}

/**
 * Cek apakah user memiliki role tertentu.
 */
export function hasRole(user: AuthUser, role: string): boolean {
  return user.roles.includes(role);
}

/**
 * Cek apakah user memiliki minimal satu dari roles yang diberikan.
 */
export function hasAnyRole(user: AuthUser, roles: string[]): boolean {
  return roles.some((r) => user.roles.includes(r));
}

/**
 * Cek apakah user adalah Super Admin.
 */
export function isSuperAdmin(user: AuthUser): boolean {
  return hasRole(user, "SUPER_ADMIN");
}
