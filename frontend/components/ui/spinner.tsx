import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

export function Spinner({
  size = "md",
  className,
  label,
}: {
  size?: keyof typeof sizeMap;
  className?: string;
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} role="status" aria-live="polite">
      <Loader2 className={cn("animate-spin", sizeMap[size])} />
      {label ? <span className="text-sm text-black/65">{label}</span> : null}
    </span>
  );
}

