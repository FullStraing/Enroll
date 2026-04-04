"use client";

import { type DragEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { MAX_DOCUMENTS_PER_USER } from "@/app/documents/constants";
import type { DocumentType, DocumentTypeMeta, StudentUniversityOption } from "@/app/documents/types";
import { validateSelectedFiles } from "@/app/documents/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/loader";
import { RequiredMark } from "@/components/ui/required-mark";
import { Select } from "@/components/ui/select";
import { RuntimeNotice } from "@/components/runtime-notice";
import { useLocale } from "@/components/locale-provider";
import { getProductCopy } from "@/lib/product-copy";

type UploadPanelProps = {
  documentTypes: readonly DocumentTypeMeta[];
  studentUniversities: StudentUniversityOption[];
  currentDocumentCount: number;
  initialType?: DocumentType;
  uploading: boolean;
  uploadsEnabled?: boolean;
  uploadUnavailableMessage?: string;
  onUpload: (payload: { title: string; type: DocumentType; studentUniversityId: string; files: File[] }) => Promise<void>;
  onError: (message: string) => void;
};

export function UploadPanel({
  documentTypes,
  studentUniversities,
  currentDocumentCount,
  initialType = "transcript",
  uploading,
  uploadsEnabled = true,
  uploadUnavailableMessage,
  onUpload,
  onError,
}: UploadPanelProps) {
  const { locale } = useLocale();
  const copy = getProductCopy(locale).documents;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DocumentType>(initialType);
  const [studentUniversityId, setStudentUniversityId] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const remainingSlots = Math.max(0, MAX_DOCUMENTS_PER_USER - currentDocumentCount);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  function applyFiles(nextFiles: File[]) {
    if (!nextFiles.length) return;

    const combined = [...files, ...nextFiles];
    if (combined.length > remainingSlots) {
      onError(copy.tooMany.replace("{count}", String(remainingSlots)).replace("{suffix}", remainingSlots === 1 ? "document" : "documents"));
      return;
    }

    const validationError = validateSelectedFiles(combined, locale);
    if (validationError) {
      onError(validationError);
      return;
    }

    setFiles(combined);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);
    if (!uploadsEnabled) return;
    applyFiles(Array.from(event.dataTransfer.files));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!uploadsEnabled) {
      onError(uploadUnavailableMessage || copy.uploadsUnavailable);
      return;
    }
    if (!files.length) {
      onError(copy.chooseAtLeastOne);
      return;
    }

    await onUpload({ title, type, studentUniversityId, files });
    setTitle("");
    setType(initialType);
    setStudentUniversityId("");
    setFiles([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <Card className="border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] shadow-none">
      <CardTitle className="text-lg">{copy.uploadTitle}</CardTitle>
      <CardDescription className="mt-2 text-sm">{copy.uploadDescription}</CardDescription>
      {!uploadsEnabled && uploadUnavailableMessage ? (
        <div className="mt-4">
          <RuntimeNotice message={uploadUnavailableMessage} />
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-4 grid gap-3">
        <label className="text-sm text-[var(--enroll-muted)]">
          {copy.title}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={copy.titlePlaceholder}
            className="mt-1 w-full rounded-xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-2 text-[var(--enroll-fg)] disabled:cursor-not-allowed disabled:bg-[var(--enroll-surface-inset)]"
            disabled={!uploadsEnabled || uploading}
          />
        </label>

        <label className="text-sm text-[var(--enroll-muted)]">
          {copy.type}<RequiredMark />
          <Select
            value={type}
            onChange={(value) => setType(value as DocumentType)}
            options={documentTypes.map((item) => ({ value: item.id, label: item.label }))}
            className="mt-1 w-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] text-[var(--enroll-fg)]"
            ariaLabel={copy.type}
            disabled={!uploadsEnabled || uploading}
          />
        </label>

        <label className="text-sm text-[var(--enroll-muted)]">
          {copy.linkUniversity}
          <Select
            value={studentUniversityId}
            onChange={setStudentUniversityId}
            options={[
              { value: "", label: copy.noUniversityLink },
              ...studentUniversities.map((item) => ({ value: String(item.id), label: item.university.name })),
            ]}
            className="mt-1 w-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] text-[var(--enroll-fg)]"
            ariaLabel={copy.linkUniversity}
            disabled={!uploadsEnabled || uploading}
          />
        </label>

        <label
          onDragOver={(event) => {
            event.preventDefault();
            if (!uploadsEnabled) return;
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
            !uploadsEnabled
              ? "border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)] opacity-70"
              : dragActive
                ? "border-[var(--enroll-strong-border)] bg-[var(--enroll-cyan)]/40"
                : "border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)]"
          }`}
        >
          <Upload className="mx-auto h-5 w-5 text-[var(--enroll-muted)]" />
          <p className="mt-2 text-sm font-semibold text-[var(--enroll-fg)]">{copy.dragHere}<RequiredMark /></p>
          <p className="mt-1 text-xs text-[var(--enroll-muted)]">
            {copy.uploadLimit.replace("{slots}", `${remainingSlots} ${remainingSlots === 1 ? (locale === "ru" ? "СЃР»РѕС‚" : "slot") : (locale === "ru" ? "СЃР»РѕС‚РѕРІ" : "slots")}`)}
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={(event) => applyFiles(Array.from(event.target.files || []))}
            className="sr-only"
            disabled={!uploadsEnabled || uploading}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => inputRef.current?.click()}
            disabled={!uploadsEnabled || uploading}
          >
            {copy.chooseFiles}
          </Button>
        </label>

        {files.length ? (
          <div className="rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--enroll-fg)]">{copy.selectedFiles}</p>
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="text-xs font-semibold text-[var(--enroll-muted)] underline underline-offset-2"
              >
                {copy.clear}
              </button>
            </div>
            <div className="mt-2 grid gap-2">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-xl border border-[var(--enroll-surface-border)] px-3 py-2 text-sm">
                  <span className="truncate text-[var(--enroll-fg)]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                    className="ml-3 rounded-md p-1 text-[var(--enroll-muted)] hover:bg-[var(--enroll-surface-inset)] hover:text-[var(--enroll-fg)]"
                    aria-label={copy.removeFile.replace("{name}", file.name)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Button type="submit" disabled={!uploadsEnabled || uploading || remainingSlots === 0} className="mt-1 w-full gap-2 sm:w-auto">
          {uploading ? <Loader size="sm" /> : <Upload className="h-4 w-4" />}
          {uploading ? copy.uploading : copy.uploadDocument}
        </Button>
      </form>
    </Card>
  );
}


