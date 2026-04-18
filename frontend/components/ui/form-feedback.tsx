"use client";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type FormFeedbackTone = "error" | "success" | "info";

const toneClasses: Record<FormFeedbackTone, string> = {
  error:
    "border-[#dc5a47] bg-[color-mix(in_srgb,#c62828_22%,var(--enroll-surface-elevated))] text-[#ffe2dd] shadow-[0_0_0_1px_rgba(220,90,71,0.14)]",
  success:
    "border-[color-mix(in_srgb,var(--enroll-cyan)_58%,var(--enroll-surface-border-strong))] bg-[color-mix(in_srgb,var(--enroll-cyan)_24%,var(--enroll-surface-elevated))] text-[var(--enroll-fg)]",
  info:
    "border-[var(--enroll-surface-border-strong)] bg-[var(--enroll-surface-elevated)] text-[var(--enroll-fg)]",
};

const toneIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
} as const;

export function FormFeedback({
  message,
  tone = "error",
  className,
}: {
  message?: string;
  tone?: FormFeedbackTone;
  className?: string;
}) {
  if (!message) {
    return null;
  }

  const Icon = toneIcons[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "mt-3 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm",
        toneClasses[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="min-w-0 leading-6">{message}</p>
    </div>
  );
}

export function FieldError({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      className={cn("mt-2 text-sm font-medium text-[#ff9788]", className)}
    >
      {message}
    </p>
  );
}
