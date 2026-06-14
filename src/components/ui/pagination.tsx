// src/components/ui/pagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/utils/cn";
import type { PaginationMeta } from "@/types/api";

type PaginationProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({ meta, onPageChange, className }: PaginationProps) {
  const { page, totalPages, total, limit, hasNextPage, hasPrevPage } = meta;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Generate page number array with ellipsis
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-slate-500 order-2 sm:order-1">
        Menampilkan{" "}
        <span className="font-medium text-slate-700">
          {from}–{to}
        </span>{" "}
        dari <span className="font-medium text-slate-700">{total}</span> hasil
      </p>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 text-slate-400 select-none"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="icon"
              onClick={() => onPageChange(p)}
              aria-label={`Go to page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className="h-8 w-8 text-xs"
            >
              {p}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
