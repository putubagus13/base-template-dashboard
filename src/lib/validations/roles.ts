// src/lib/validations/roles.ts
// ============================================================
// ROLE VALIDATION SCHEMAS
// ============================================================

import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be at most 50 characters")
    .regex(
      /^[A-Z_]+$/,
      "Role name must contain only uppercase letters and underscores (e.g. SUPER_ADMIN)"
    ),
  description: z
    .string()
    .max(200, "Description must be at most 200 characters")
    .optional(),
  permissionIds: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z_]+$/, "Role name must be uppercase letters and underscores only")
    .optional(),
  description: z.string().max(200).nullable().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
