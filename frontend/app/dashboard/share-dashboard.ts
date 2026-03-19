import { toBlob } from "html-to-image";

export async function captureDashboardBlob(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#F9F5F6",
    filter: (domNode) => {
      if (!(domNode instanceof HTMLElement)) return true;
      return !domNode.hasAttribute("data-share-ignore");
    },
  });

  if (!blob) {
    throw new Error("Unable to render dashboard image.");
  }

  return blob;
}

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (!("clipboard" in navigator) || typeof ClipboardItem === "undefined") {
    return false;
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      [blob.type || "image/png"]: blob,
    }),
  ]);

  return true;
}
