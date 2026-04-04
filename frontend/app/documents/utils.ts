import { MAX_DOCUMENT_FILE_SIZE_BYTES } from "@/app/documents/constants";
import { getProductCopy } from "@/lib/product-copy";
import type { Locale } from "@/lib/i18n";

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / (1024 * 102.4)) / 10} MB`;
}

export function validateSelectedFiles(files: File[], locale: Locale = "en"): string | null {
  const oversized = files.find((file) => file.size > MAX_DOCUMENT_FILE_SIZE_BYTES);
  if (oversized) {
    return getProductCopy(locale).documents.fileTooLarge.replace("{name}", oversized.name);
  }
  return null;
}
