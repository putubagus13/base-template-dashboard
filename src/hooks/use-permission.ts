// src/hooks/use-permission.ts
// ============================================================
// CLIENT-SIDE PERMISSION HOOKS
// Digunakan di komponen untuk conditional rendering.
// Untuk server-side protection, gunakan hasPermission() dari lib/auth/rbac.
// ============================================================

import { useAuthStore } from "@/store/auth.store";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  isSuperAdmin,
} from "@/lib/auth/rbac";
import type { PermissionString } from "@/types/rbac";

/**
 * Hook untuk cek single permission.
 *
 * @example
 * const canCreateUser = useHasPermission("create:user")
 * return canCreateUser ? <CreateButton /> : null
 */
export function useHasPermission(permission: PermissionString): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return hasPermission(user, permission);
}

/**
 * Hook untuk cek apakah memiliki salah satu dari beberapa permissions.
 */
export function useHasAnyPermission(permissions: PermissionString[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return hasAnyPermission(user, permissions);
}

/**
 * Hook untuk cek apakah memiliki semua permissions.
 */
export function useHasAllPermissions(permissions: PermissionString[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return hasAllPermissions(user, permissions);
}

/**
 * Hook untuk cek role.
 */
export function useHasRole(role: string): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return hasRole(user, role);
}

/**
 * Hook untuk cek salah satu dari beberapa roles.
 */
export function useHasAnyRole(roles: string[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return hasAnyRole(user, roles);
}

/**
 * Hook untuk cek apakah user adalah Super Admin.
 */
export function useIsSuperAdmin(): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return isSuperAdmin(user);
}

/**
 * Hook yang return semua permission utilities sekaligus.
 * Gunakan ini bila butuh beberapa check sekaligus.
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  return {
    user,
    can: (permission: PermissionString) =>
      user ? hasPermission(user, permission) : false,
    canAny: (permissions: PermissionString[]) =>
      user ? hasAnyPermission(user, permissions) : false,
    canAll: (permissions: PermissionString[]) =>
      user ? hasAllPermissions(user, permissions) : false,
    hasRole: (role: string) => (user ? hasRole(user, role) : false),
    isSuperAdmin: user ? isSuperAdmin(user) : false,
  };
}
