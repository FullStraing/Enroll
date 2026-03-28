"use client";

import Lottie from "lottie-react";
import checkboxAnimation from "@/public/animations/checkbox-animation.json";

type SharePreviewToastProps = {
  imageUrl: string | null;
  visible: boolean;
};

export function SharePreviewToast({ imageUrl, visible }: SharePreviewToastProps) {
  if (!visible || !imageUrl) return null;

  return (
    <div
      data-share-ignore
      className="pointer-events-none fixed bottom-5 right-5 z-[120] w-[300px] rounded-2xl border-2 border-black bg-white p-3 shadow-[0_8px_0_#000]"
    >
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DAF5F0]/75 ring-1 ring-black/8">
          <span className="absolute h-8 w-8 rounded-full bg-[#63CDB8]/25 animate-ping" />
          <Lottie
            animationData={checkboxAnimation}
            autoplay
            loop={false}
            initialSegment={[4, 25]}
            className="relative h-12 w-12 scale-[1.12]"
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
    </div>
  );
}
