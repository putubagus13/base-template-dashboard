// src/components/shared/filter-bar.tsx
"use client";

import { cn } from "@/utils/cn";
import { SearchBar } from "./search-bar";

type FilterBarProps = {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
};

/**
 * Reusable toolbar for data tables — combines search + filter controls + actions.
 *
 * @example
 * <FilterBar
 *   search={search}
 *   onSearch={setSearch}
 *   searchPlaceholder="Search users..."
 *   actions={<Button size="sm">Add User</Button>}
 * />
 */
export function FilterBar({
  search,
  onSearch,
  searchPlaceholder,
  actions,
  filters,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3",
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <SearchBar
          value={search}
          onChange={onSearch}
          placeholder={searchPlaceholder || "Search..."}
          className="w-full max-w-xs"
        />
        {filters}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
