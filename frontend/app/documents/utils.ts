import { MAX_DOCUMENT_FILE_SIZE_BYTES } from "@/app/documents/constants";

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / (1024 * 102.4)) / 10} MB`;
}

export function validateSelectedFiles(files: File[]): string | null {
  const oversized = files.find((file) => file.size > MAX_DOCUMENT_FILE_SIZE_BYTES);
  if (oversized) {
    return `File "${oversized.name}" exceeds the 5 MB limit.`;
  }
  return null;
}
