import { cn } from "@/lib/utils";

const variantStyles = {
  pulse: "animate-pulse bg-black/10",
  shimmer:
    "relative overflow-hidden bg-black/10 before:absolute before:inset-0 before:content-[''] before:-translate-x-full before:animate-[shimmer_1.6s_linear_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent",
  soft: "animate-pulse bg-[#ece7ea]",
} as const;

export function Skeleton({
  className,
  variant = "soft",
}: {
  className?: string;
  variant?: keyof typeof variantStyles;
}) {
  return <div className={cn("rounded-md", variantStyles[variant], className)} />;
}
