// src/lib/audit.ts
// ============================================================
// AUDIT LOG UTILITY
// Gunakan fungsi ini di API routes untuk mencatat aktivitas.
//
// Contoh:
//   await writeAuditLog({
//     userId: authUser.id,
//     action: "create",
//     subject: "user",
//     subjectId: newUser.id,
//     newValues: { name, email },
//     request,
//   });
// ============================================================

import type { NextRequest } from "next/server";
import { prisma } from "./db/prisma";
import { Prisma } from "@prisma/client";

type AuditLogInput = {
  userId?: string;
  action: string;
  subject: string;
  subjectId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  request?: NextRequest;
};

/**
 * Write an audit log entry.
 * Fire-and-forget: tidak throw error agar tidak mengganggu main flow.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const ipAddress =
      input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      input.request?.headers.get("x-real-ip") ??
      null;

    const userAgent = input.request?.headers.get("user-agent") ?? null;

    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        subject: input.subject,
        subjectId: input.subjectId ?? null,
        oldValues: input.oldValues ?? null,
        newValues: input.newValues ?? null,
        ipAddress,
        userAgent,
      } as Prisma.AuditLogCreateInput,
    });
  } catch (error) {
    // Never let audit log failures break the main request
    console.error("[AuditLog] Failed to write log:", error);
  }
}

/**
 * Sanitize object untuk audit log — hapus field sensitif.
 */
export function sanitizeForAudit(
  obj: Record<string, unknown>,
  sensitiveFields: string[] = ["password", "token", "secret", "hash"]
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      sensitiveFields.some((f) => key.toLowerCase().includes(f))
        ? "[REDACTED]"
        : value,
    ])
  );
}
