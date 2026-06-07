// src/types/rbac.ts
// ============================================================
// ROLE-BASED ACCESS CONTROL TYPES
// ============================================================

/**
 * Permission entity dari database.
 */
export type Permission = {
  id: string;
  action: string;
  subject: string;
  description: string | null;
};

/**
 * Role entity dari database.
 */
export type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
};

/**
 * User dengan relasi roles dan permissions.
 */
export type UserWithRoles = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  status: string;
  roles: RoleWithPermissions[];
};

/**
 * Role beserta permissions-nya.
 */
export type RoleWithPermissions = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
};

/**
 * Format permission string untuk pengecekan: "action:subject"
 * Contoh: "read:user", "delete:post"
 */
export type PermissionString = `${string}:${string}`;

/**
 * Input untuk create/update role.
 */
export type RoleInput = {
  name: string;
  description?: string;
  permissionIds: string[];
};
