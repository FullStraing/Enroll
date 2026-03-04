"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string;
    variant?: "primary" | "cyan" | "orange" | "striped";
  }
>(({ className, value, indicatorClassName, variant = "primary", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full border border-black/10 bg-white", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all",
        variant === "primary" && "bg-[#FFDB58]",
        variant === "cyan" && "bg-[#DAF5F0]",
        variant === "orange" && "bg-[#F8D6B3]",
        variant === "striped" &&
          "bg-[linear-gradient(45deg,#FFDB58_25%,#F8D6B3_25%,#F8D6B3_50%,#FFDB58_50%,#FFDB58_75%,#F8D6B3_75%,#F8D6B3_100%)] [background-size:18px_18px]",
        indicatorClassName,
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;
