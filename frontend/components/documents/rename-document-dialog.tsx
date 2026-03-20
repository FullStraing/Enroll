"use client";

import { type FormEvent, useEffect, useState } from "react";
import type { DocumentItem } from "@/app/documents/types";
import { Button } from "@/components/ui/button";
import { useBodyScrollLock } from "@/components/ui/use-body-scroll-lock";
import { Loader } from "@/components/loader";

type RenameDocumentDialogProps = {
  document: DocumentItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
};

export function RenameDocumentDialog({ document, saving, onClose, onSave }: RenameDocumentDialogProps) {
  const [title, setTitle] = useState("");

  useBodyScrollLock(Boolean(document));

  useEffect(() => {
    setTitle(document?.title || "");
  }, [document]);

  if (!document) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSave(title);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/35 p-4">
      <div className="mx-auto mt-16 w-full max-w-lg rounded-3xl border-2 border-black bg-white p-5 shadow-[0_10px_0_0_rgba(0,0,0,1)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Rename document</p>
        <h3 className="mt-2 text-2xl font-black text-black">Update display name</h3>
        <p className="mt-1 text-sm text-black/65">The file itself stays the same. This only changes how the document appears inside Enroll.</p>

        <form onSubmit={submit} className="mt-4 grid gap-3">
          <label className="text-sm text-black/70">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2"
              autoFocus
            />
          </label>

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? <Loader size="sm" /> : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
