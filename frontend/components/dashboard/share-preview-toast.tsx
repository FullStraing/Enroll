"use client";

type SharePreviewToastProps = {
  imageUrl: string | null;
  visible: boolean;
};

export function SharePreviewToast({ imageUrl, visible }: SharePreviewToastProps) {
  if (!visible || !imageUrl) return null;

  return (
    <div
      data-share-ignore
      className="pointer-events-none fixed bottom-5 right-5 z-[120] w-[280px] rounded-2xl border-2 border-black bg-white p-3 shadow-[0_8px_0_#000]"
    >
      <p className="text-xs font-black uppercase tracking-[0.16em] text-black/45">Copied to clipboard</p>
      <p className="mt-1 text-sm font-semibold text-black">Dashboard snapshot is ready to share.</p>
      <div className="mt-3 overflow-hidden rounded-xl border border-black/10 bg-[#F5F8FC]">
        {/* `blob:` preview URLs are more reliable with a plain img in production than with next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Dashboard preview" className="h-auto w-full object-cover" />
      </div>
    </div>
  );
}
