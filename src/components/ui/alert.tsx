// src/components/ui/alert.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/utils/cn";

const alertVariants = cva(
  "flex items-start gap-3 rounded-xl border p-4 text-sm",
  {
    variants: {
      variant: {
        info: "border-blue-200 bg-blue-50 text-blue-800",
        success: "border-emerald-200 bg-emerald-50 text-emerald-800",
        warning: "border-amber-200 bg-amber-50 text-amber-800",
        error: "border-red-200 bg-red-50 text-red-800",
      },
    },
    defaultVariants: { variant: "info" },
  }
);

const ICON_MAP = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
};

export type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    title?: string;
  };

export function Alert({ className, variant = "info", title, children, ...props }: AlertProps) {
  const Icon = ICON_MAP[variant ?? "info"];

  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert" {...props}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <p className={cn(title && "mt-0.5 opacity-90")}>{children}</p>}
      </div>
    </div>
  );
}
