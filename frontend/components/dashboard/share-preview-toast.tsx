"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { createPortal } from "react-dom";
import checkboxAnimation from "@/public/animations/checkbox-animation.json";

type SharePreviewToastProps = {
  imageUrl: string | null;
  visible: boolean;
};

export function SharePreviewToast({ imageUrl, visible }: SharePreviewToastProps) {
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
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[160] mx-auto w-auto max-w-[340px] rounded-2xl border-2 border-black bg-white p-3 shadow-[0_8px_0_#000] sm:inset-x-auto sm:right-5 sm:mx-0 sm:w-[320px]"
    >
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#DAF5F0]/75 ring-1 ring-black/8">
          <span className="absolute h-11 w-11 rounded-full bg-[#63CDB8]/25 animate-ping" />
          <Lottie
            animationData={checkboxAnimation}
            autoplay
            loop={false}
            initialSegment={[4, 25]}
            className="relative h-16 w-16 scale-[1.28]"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-black/45">Copied to clipboard</p>
          <p className="mt-1 text-sm font-semibold text-black">Dashboard snapshot is ready to share.</p>
          <p className="mt-1 text-xs leading-relaxed text-black/55">You can paste it straight into chats, docs, or social posts.</p>
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-black/10 bg-[#F5F8FC]">
        {/* `blob:` preview URLs are more reliable with a plain img in production than with next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Dashboard preview" className="h-auto w-full object-cover" />
      </div>
    </div>,
    document.body,
  );
}
