// src/components/ui/table.tsx
// ============================================================
// TABLE PRIMITIVES
// Composable table components untuk konsistensi UI.
// ============================================================
import { cn } from "@/utils/cn";

type DivProps = React.HTMLAttributes<HTMLDivElement> & {
  pagination?: React.ReactNode;
};
type ThProps = React.ThHTMLAttributes<HTMLTableCellElement>;
type TdProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export function TableRoot({ className, pagination, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm" {...props} />
      </div>
      {pagination && <div className="px-4 py-3">{pagination}</div>}
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-slate-100 bg-slate-50/70", className)}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("divide-y divide-slate-100", className)} {...props} />
  );
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-slate-50/60", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: ThProps) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdProps) {
  return (
    <td className={cn("px-4 py-3 text-slate-700", className)} {...props} />
  );
}

// ─── Empty State ──────────────────────────────────────────────

type TableEmptyProps = {
  colSpan: number;
  message?: string;
  icon?: React.ReactNode;
};

export function TableEmpty({
  colSpan,
  message = "No data found.",
  icon,
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center">
        {icon && (
          <div className="mb-2 flex justify-center text-slate-300">{icon}</div>
        )}
        <p className="text-sm text-slate-400">{message}</p>
      </td>
    </tr>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────

type TableSkeletonProps = { colSpan: number; rows?: number };

export function TableSkeleton({ colSpan, rows = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: colSpan }).map((_, j) => (
            <TableCell key={j}>
              <div className="h-4 animate-pulse rounded-md bg-slate-100" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
