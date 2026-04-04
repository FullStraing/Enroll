import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl border-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 border-[var(--enroll-strong-border)] focus-visible:ring-[var(--enroll-primary-ring)]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--enroll-yellow)] text-[var(--enroll-strong-fg)] hover:-translate-y-0.5",
        secondary: "bg-[var(--enroll-cyan)] text-[var(--enroll-fg)] hover:-translate-y-0.5",
        outline: "bg-[var(--enroll-surface-elevated)] text-[var(--enroll-fg)] hover:bg-[color-mix(in_srgb,var(--enroll-fg)_5%,var(--enroll-surface-elevated))]",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
