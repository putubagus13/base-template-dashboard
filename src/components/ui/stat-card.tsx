// src/components/ui/stat-card.tsx
import { cn } from "@/utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type TrendDirection = "up" | "down" | "neutral";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number; // percentage
    direction: TrendDirection;
    label?: string;
  };
  className?: string;
};

const TREND_CONFIG = {
  up: { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
  down: { icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
  neutral: { icon: Minus, color: "text-slate-500", bg: "bg-slate-100" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-50",
  trend,
  className,
}: StatCardProps) {
  const trendConfig = trend ? TREND_CONFIG[trend.direction] : null;
  const TrendIcon = trendConfig?.icon;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={cn("rounded-lg p-2", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      {trend && trendConfig && TrendIcon && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              trendConfig.bg,
              trendConfig.color
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {Math.abs(trend.value)}%
          </span>
          {trend.label && (
            <span className="text-xs text-slate-400">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
