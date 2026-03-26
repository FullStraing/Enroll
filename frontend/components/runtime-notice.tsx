"use client";

type RuntimeNoticeProps = {
  message: string;
  tone?: "warning" | "info";
};

export function RuntimeNotice({ message, tone = "warning" }: RuntimeNoticeProps) {
  const toneClass =
    tone === "warning"
      ? "border-[#F5B27C] bg-[#FFF4CC] text-black/80"
      : "border-[#B7D9FF] bg-[#EFF7FF] text-black/80";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>{message}</div>;
}
