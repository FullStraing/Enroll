"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/locale-provider";
import { getDashboardCopy } from "@/lib/dashboard-copy";
import checkboxAnimation from "@/public/animations/checkbox-animation.json";

type SharePreviewToastProps = {
  imageUrl: string | null;
  visible: boolean;
};

export function SharePreviewToast({ imageUrl, visible }: SharePreviewToastProps) {
  const { locale } = useLocale();
  const copy = getDashboardCopy(locale).shareToast;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!visible || !imageUrl) return null;
  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-share-ignore
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[160] mx-auto w-auto max-w-[340px] rounded-2xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] p-3 shadow-[0_8px_0_#000] sm:inset-x-auto sm:right-5 sm:mx-0 sm:w-[320px]"
    >
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center overflow-visible rounded-full bg-[var(--enroll-cyan)]/75 ring-1 ring-[var(--enroll-surface-border)]">
          <span className="absolute h-11 w-11 rounded-full bg-[var(--enroll-cyan)]/25 animate-ping" />
          <Lottie
            animationData={checkboxAnimation}
            autoplay
            loop={false}
            initialSegment={[4, 25]}
            className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 scale-[1.58]"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--enroll-muted)]">{copy.title}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--enroll-fg)]">{copy.body}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--enroll-muted)]">{copy.hint}</p>
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)]">
        {/* `blob:` preview URLs are more reliable with a plain img in production than with next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={copy.previewAlt} className="h-auto w-full object-cover" />
      </div>
    </div>,
    document.body,
  );
}

