// src/components/ui/breadcrumb.tsx
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/utils/cn";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
};

export function Breadcrumb({
  items,
  showHome = true,
  className,
}: BreadcrumbProps) {
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Home", href: "/dashboard" }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1.5 text-sm">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
              )}
              {isLast ? (
                <span
                  className="font-medium text-slate-700"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href as unknown as URL}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {isFirst && showHome && <Home className="h-3.5 w-3.5" />}
                  <span>{isFirst && showHome ? "" : item.label}</span>
                </Link>
              ) : (
                <span className="text-slate-500">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
