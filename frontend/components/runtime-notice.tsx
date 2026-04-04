"use client";

type RuntimeNoticeProps = {
  message: string;
  tone?: "warning" | "info";
};

export function RuntimeNotice({ message, tone = "warning" }: RuntimeNoticeProps) {
  const toneClass =
    tone === "warning"
      ? "border-[var(--enroll-surface-border-strong)] bg-[var(--enroll-yellow-soft)] text-[var(--enroll-fg-soft)]"
      : "border-[var(--enroll-surface-border-strong)] bg-[color-mix(in_srgb,var(--enroll-cyan)_75%,var(--enroll-surface-elevated))] text-[var(--enroll-fg-soft)]";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>{message}</div>;
}
