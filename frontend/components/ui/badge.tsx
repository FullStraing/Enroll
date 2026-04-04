import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", {
  variants: {
    variant: {
      default: "border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] text-[var(--enroll-fg)]",
      primary: "border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow)] text-[var(--enroll-strong-fg)]",
      cyan: "border-[var(--enroll-surface-border)] bg-[var(--enroll-cyan)] text-[var(--enroll-fg)]",
      orange: "border-[var(--enroll-surface-border)] bg-[var(--enroll-orange)] text-[var(--enroll-fg)]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
