// src/hooks/use-member-status-type.ts
// ============================================================
// MEMBER STATUS TYPE MANAGEMENT HOOKS
// ============================================================

import { ROUTES } from "@/config/routes";
import { apiClient } from "@/lib/api-client";
import { ListQueryParams } from "@/types";
import { useQuery } from "@tanstack/react-query";

// ─── Query Keys ──────────────────────────────────────────────
// Centralize query keys untuk konsistensi cache invalidation.

export const memberStatusTypeKeys = {
  all: ["members-status-type"] as const,
  lists: () => [...memberStatusTypeKeys.all, "list"] as const,
  list: (params: ListQueryParams) =>
    [...memberStatusTypeKeys.lists(), params] as const,
  //   details: () => [...memberKeys.all, "detail"] as const,
  //   detail: (id: string) => [...memberKeys.details(), id] as const,
};

// ─── Types ───────────────────────────────────────────────────
export type MemberStatusType = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
  deletedAt: Date | null;
};

// ─── Hooks ───────────────────────────────────────────────────

export function useMemberStatusType(params: ListQueryParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);

  return useQuery({
    queryKey: memberStatusTypeKeys.list(params),
    queryFn: () =>
      apiClient.get<MemberStatusType[]>(
        `${ROUTES.api.memberStatusType}?${searchParams.toString()}`
      ),
    placeholderData: (prev) => prev,
  });
}
