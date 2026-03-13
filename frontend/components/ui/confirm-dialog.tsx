"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  note?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmDisabled?: boolean;
  confirmIcon?: ReactNode;
  tone?: "default" | "warning";
};

export function ConfirmDialog({
  open,
  title,
  description,
  note,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmDisabled = false,
  confirmIcon,
  tone = "default",
}: ConfirmDialogProps) {
  if (!open) return null;

  const noteClass =
    tone === "warning"
      ? "border-[#F8D6B3] bg-[#F8D6B3]/45 text-black/80"
      : "border-black/15 bg-[#DAF5F0]/45 text-black/80";
  const confirmClass = tone === "warning" ? "bg-[#F8D6B3] hover:bg-[#efc597]" : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-black bg-white p-5 shadow-[0_8px_0_#000]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="mt-2 text-sm text-black/75">{description}</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onCancel} aria-label="Close dialog">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {note ? <div className={`mt-4 rounded-xl border p-3 text-sm ${noteClass}`}>{note}</div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            className={confirmClass}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmIcon}
            <span>{confirmLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
