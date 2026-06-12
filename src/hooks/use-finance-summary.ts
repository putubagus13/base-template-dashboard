// src/hooks/use-finance-summary.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ROUTES } from "@/config/routes";
import { FinanceSummaryData } from "@/app/api/finance/summary/route";

export const financeSummaryKeys = {
  all: ["financeSummary"] as const,
  detail: (year: number, month: number) =>
    [...financeSummaryKeys.all, year, month] as const,
};

export function useFinanceSummary(year: number, month: number) {
  return useQuery({
    queryKey: financeSummaryKeys.detail(year, month),
    queryFn: () =>
      apiClient.get<FinanceSummaryData>(
        `${ROUTES.api.financeSummary}?year=${year}&month=${month}`
      ),
  });
}
