"use client";

import { Download, FileText, Link2, Pencil, Trash2 } from "lucide-react";
import type { DocumentItem, DocumentTypeMeta } from "@/app/documents/types";
import { formatFileSize } from "@/app/documents/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/loader";
import { formatDateTimeShort } from "@/lib/date-format";
import { useLocale } from "@/components/locale-provider";
import { getProductCopy } from "@/lib/product-copy";

type DocumentGroupSectionProps = {
  group: DocumentTypeMeta;
  items: DocumentItem[];
  deletingId: number | null;
  onDelete: (documentId: number) => Promise<void>;
  onRename: (document: DocumentItem) => void;
};

export function DocumentGroupSection({ group, items, deletingId, onDelete, onRename }: DocumentGroupSectionProps) {
  const { locale } = useLocale();
  const copy = getProductCopy(locale).documents;

  return (
    <Card className="border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-lg">{group.label}</CardTitle>
          <CardDescription className="mt-1 hidden sm:block">{group.description}</CardDescription>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            items.length ? "border-[var(--enroll-strong-border)] bg-[var(--enroll-cyan)] text-[var(--enroll-fg)]" : "border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] text-[var(--enroll-muted)]"
          }`}
        >
          {items.length ? copy.uploaded.replace("{count}", String(items.length)) : copy.missingBadge}
        </span>
      </div>

      {items.length ? (
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="min-w-0 rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[var(--enroll-muted)]" />
                    <p className="truncate text-sm font-semibold text-[var(--enroll-fg)]">{item.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--enroll-muted)]">{item.file_name || copy.uploadedFile}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--enroll-muted)]">
                    <span className="rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)] px-2 py-1">{formatFileSize(item.file_size)}</span>
                    <span className="rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)] px-2 py-1">{item.mime_type || copy.unknownType}</span>
                    <span className="rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)] px-2 py-1">
                      {copy.updatedAt.replace("{value}", formatDateTimeShort(item.updated_at))}
                    </span>
                    {item.student_university?.university?.name ? (
                      <span className="rounded-full border border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow-soft)] px-2 py-1 text-[var(--enroll-fg)]">
                        <Link2 className="mr-1 inline h-3 w-3" />
                        {item.student_university.university.name}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                  <Button size="sm" variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => onRename(item)}>
                    <Pencil className="h-4 w-4" />
                    {copy.rename}
                  </Button>
                  <a href={item.download_url} target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                    <Button size="sm" variant="outline" className="w-full gap-2 sm:w-auto">
                      <Download className="h-4 w-4" />
                      {copy.download}
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 text-rose-700 hover:bg-rose-50 sm:w-auto"
                    onClick={() => void onDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? <Loader size="sm" /> : <Trash2 className="h-4 w-4" />}
                    {copy.delete}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)] px-4 py-4 text-sm text-[var(--enroll-muted)]">
          {copy.noFiles}
        </div>
      )}
    </Card>
  );
}


