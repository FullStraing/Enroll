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

type UploadPanelProps = {
  documentTypes: readonly DocumentTypeMeta[];
  studentUniversities: StudentUniversityOption[];
  currentDocumentCount: number;
  initialType?: DocumentType;
  uploading: boolean;
  onUpload: (payload: { title: string; type: DocumentType; studentUniversityId: string; files: File[] }) => Promise<void>;
  onError: (message: string) => void;
};

export function UploadPanel({
  documentTypes,
  studentUniversities,
  currentDocumentCount,
  initialType = "transcript",
  uploading,
  onUpload,
  onError,
}: UploadPanelProps) {
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
      onError(`You can upload up to ${remainingSlots} more document${remainingSlots === 1 ? "" : "s"}.`);
      return;
    }

    const validationError = validateSelectedFiles(combined);
    if (validationError) {
      onError(validationError);
      return;
    }

    setFiles(combined);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);
    applyFiles(Array.from(event.dataTransfer.files));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!files.length) {
      onError("Choose at least one file.");
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
    <Card className="shadow-none">
      <CardTitle className="text-lg">Upload document</CardTitle>
      <CardDescription className="mt-2">
        Keep admissions files in one place. Drag and drop works here, and one upload can include multiple files of the same type.
      </CardDescription>

      <form onSubmit={submit} className="mt-4 grid gap-3">
        <label className="text-sm text-black/70">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Used only for a single-file upload"
            className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2"
          />
        </label>

        <label className="text-sm text-black/70">
          Document type<RequiredMark />
          <Select
            value={type}
            onChange={(value) => setType(value as DocumentType)}
            options={documentTypes.map((item) => ({ value: item.id, label: item.label }))}
            className="mt-1 w-full border border-black/15"
            ariaLabel="Document type"
          />
        </label>

        <label className="text-sm text-black/70">
          Link to university
          <Select
            value={studentUniversityId}
            onChange={setStudentUniversityId}
            options={[
              { value: "", label: "No university link" },
              ...studentUniversities.map((item) => ({ value: String(item.id), label: item.university.name })),
            ]}
            className="mt-1 w-full border border-black/15"
            ariaLabel="Link document to university"
          />
        </label>

        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
            dragActive ? "border-black bg-[#DAF5F0]/50" : "border-black/20 bg-black/[0.02]"
          }`}
        >
          <Upload className="mx-auto h-5 w-5 text-black/55" />
          <p className="mt-2 text-sm font-semibold text-black">
            Drag & drop files here<RequiredMark />
          </p>
          <p className="mt-1 text-xs text-black/55">Up to 5 MB per file, {remainingSlots} slot{remainingSlots === 1 ? "" : "s"} left.</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={(event) => applyFiles(Array.from(event.target.files || []))}
            className="sr-only"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => inputRef.current?.click()}
          >
            Choose files
          </Button>
        </label>

        {files.length ? (
          <div className="rounded-2xl border border-black/15 bg-white px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-black">Selected files</p>
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="text-xs font-semibold text-black/55 underline underline-offset-2"
              >
                Clear
              </button>
            </div>
            <div className="mt-2 grid gap-2">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2 text-sm">
                  <span className="truncate text-black">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                    className="ml-3 rounded-md p-1 text-black/45 hover:bg-black/5 hover:text-black"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Button type="submit" disabled={uploading || remainingSlots === 0} className="mt-1 gap-2">
          {uploading ? <Loader size="sm" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload document"}
        </Button>
      </form>
    </Card>
  );
}
