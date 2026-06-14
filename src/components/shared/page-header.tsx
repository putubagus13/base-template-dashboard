// src/components/shared/page-header.tsx
import { cn } from "@/utils/cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Consistent page header with optional action slot.
 *
 * @example
 * <PageHeader
 *   title="Users"
 *   description="Manage user accounts and roles."
 *   actions={<Button>Add User</Button>}
 * />
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
