// src/components/shared/permission-guard.tsx
// ============================================================
// PERMISSION GUARD COMPONENT
//
// Gunakan untuk conditional rendering berdasarkan permission:
//
// <PermissionGuard permission="create:user">
//   <CreateUserButton />
// </PermissionGuard>
//
// <PermissionGuard permission="delete:user" fallback={<span>No access</span>}>
//   <DeleteButton />
// </PermissionGuard>
// ============================================================

"use client";

import { useHasPermission, useHasAnyPermission, useHasRole } from "@/hooks/use-permission";
import type { PermissionString } from "@/types/rbac";

type PermissionGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
} & (
  | { permission: PermissionString; anyPermission?: never; role?: never }
  | { anyPermission: PermissionString[]; permission?: never; role?: never }
  | { role: string; permission?: never; anyPermission?: never }
);

export function PermissionGuard({
  children,
  fallback = null,
  permission,
  anyPermission,
  role,
}: PermissionGuardProps) {
  const hasSinglePermission = useHasPermission(permission ?? ("" as PermissionString));
  const hasAnyPerm = useHasAnyPermission(anyPermission ?? []);
  const hasRoleCheck = useHasRole(role ?? "");

  let hasAccess = false;

  if (permission) hasAccess = hasSinglePermission;
  else if (anyPermission) hasAccess = hasAnyPerm;
  else if (role) hasAccess = hasRoleCheck;

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
