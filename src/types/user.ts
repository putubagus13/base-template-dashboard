// src/types/user.ts
// ============================================================
// USER DOMAIN TYPES
// ============================================================

import type { UserStatus } from "@prisma/client";

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  avatar: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  roles: { id: string; name: string }[];
};

export type UserDetail = UserListItem & {
  emailVerifiedAt: string | null;
  updatedAt: string;
  roles: {
    id: string;
    name: string;
    description: string | null;
    permissions: { id: string; action: string; subject: string }[];
  }[];
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  roleIds: string[];
};

export type UpdateUserPayload = {
  name?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  roleIds?: string[];
};
