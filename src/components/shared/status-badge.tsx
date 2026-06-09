// src/components/shared/status-badge.tsx
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING_VERIFICATION";

const STATUS_CONFIG: Record<
  UserStatus,
  { variant: BadgeProps["variant"]; label: string }
> = {
  ACTIVE: { variant: "success", label: "Active" },
  INACTIVE: { variant: "secondary", label: "Inactive" },
  SUSPENDED: { variant: "destructive", label: "Suspended" },
  PENDING_VERIFICATION: { variant: "warning", label: "Pending" },
};

const STATUS_MEMBER_CONFIG: Record<
  string,
  { variant: BadgeProps["variant"]; label: string }
> = {
  active: { variant: "success", label: "Active" },
  inactive: { variant: "secondary", label: "Inactive" },
};

type StatusBadgeProps = {
  status: UserStatus;
  className?: string | undefined;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    variant: "secondary" as const,
    label: status,
  };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

type StatusBadgeMemberProps = {
  status: boolean;
  className?: string | undefined;
};

export function StatusBadgeMember({
  status,
  className,
}: StatusBadgeMemberProps) {
  const config = STATUS_MEMBER_CONFIG[status ? "active" : "inactive"] ?? {
    variant: "secondary" as const,
    label: status,
  };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
