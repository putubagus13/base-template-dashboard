// src/components/shared/avatar.tsx
import Image from "next/image";
import { cn } from "@/utils/cn";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<AvatarSize, { wrapper: string; text: string }> = {
  xs: { wrapper: "h-6 w-6", text: "text-[10px]" },
  sm: { wrapper: "h-8 w-8", text: "text-xs" },
  md: { wrapper: "h-10 w-10", text: "text-sm" },
  lg: { wrapper: "h-12 w-12", text: "text-base" },
  xl: { wrapper: "h-16 w-16", text: "text-lg" },
};

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
};

/**
 * Avatar with image fallback to initials.
 */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const { wrapper, text } = SIZE_MAP[size];

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full",
          wrapper,
          className
        )}
      >
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 select-none",
        wrapper,
        text,
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
