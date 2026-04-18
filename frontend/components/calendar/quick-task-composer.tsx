"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, University } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { DuePreset } from "@/app/calendar/types";

type UniversityOption = {
  id: number;
  name: string;
};

type QuickTaskComposerProps = {
  title: string;
  onTitleChange: (value: string) => void;
  duePreset: DuePreset;
  onDuePresetChange: (value: DuePreset) => void;
  customDate: string;
  onCustomDateChange: (value: string) => void;
  universityId: string;
  onUniversityIdChange: (value: string) => void;
  universities: UniversityOption[];
  saving: boolean;
  onSubmit: () => void;
};

const DUE_PRESET_OPTIONS: Array<{ value: DuePreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
];

const TASK_PLACEHOLDER_EXAMPLES = [
  "Finish Brown supplemental essay draft",
  "Upload transcript for Boston College",
  "Review Common App activities section",
  "Send recommender follow-up email",
  "Shortlist 3 new target universities",
];

export function QuickTaskComposer({
  title,
  onTitleChange,
  duePreset,
  onDuePresetChange,
  customDate,
  onCustomDateChange,
  universityId,
  onUniversityIdChange,
  universities,
  saving,
  onSubmit,
}: QuickTaskComposerProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typedLength, setTypedLength] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isTitleEmpty = !title.trim();

  const activePlaceholder = useMemo(
    () => TASK_PLACEHOLDER_EXAMPLES[placeholderIndex % TASK_PLACEHOLDER_EXAMPLES.length] || "",
    [placeholderIndex],
  );

  useEffect(() => {
    if (!isTitleEmpty) return;

    if (isPaused) {
      const pauseTimer = window.setTimeout(() => {
        setIsPaused(false);
        if (typedLength >= activePlaceholder.length) {
          setIsDeleting(true);
        }
      }, isDeleting ? 220 : 1100);
      return () => window.clearTimeout(pauseTimer);
    }

    const completedTyping = typedLength >= activePlaceholder.length;
    const completedDeleting = typedLength <= 0;

    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        if (completedTyping) {
          setIsPaused(true);
          return;
        }
        setTypedLength((prev) => prev + 1);
        return;
      }

      if (completedDeleting) {
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % TASK_PLACEHOLDER_EXAMPLES.length);
        setIsPaused(true);
        return;
      }

      setTypedLength((prev) => Math.max(0, prev - 1));
    }, isDeleting ? 20 : 38);

    return () => window.clearTimeout(timer);
  }, [activePlaceholder, isDeleting, isPaused, isTitleEmpty, placeholderIndex, typedLength]);

  const animatedPlaceholder = isTitleEmpty ? activePlaceholder.slice(0, typedLength) : "";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="surface-panel rounded-[28px] p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-yellow-soft)]">
            <Plus className="h-5 w-5 text-[var(--enroll-strong-fg)]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--enroll-muted)] sm:text-xs sm:tracking-[0.18em]">
              Quick capture
            </p>
            <label className="mt-2 block">
              <span className="sr-only">Task title</span>
              <span className="relative block">
                <input
                  value={title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder=""
                  className={`relative z-[2] w-full border-0 !bg-transparent px-0 py-0 text-[18px] font-black leading-[1.2] tracking-[-0.03em] outline-none caret-[var(--enroll-fg)] sm:text-[26px] sm:tracking-[-0.04em] ${
                    isTitleEmpty ? "text-transparent" : "text-[var(--enroll-fg)]"
                  }`}
                />
                {isTitleEmpty ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-1/2 z-[3] flex -translate-y-1/2 items-center overflow-hidden whitespace-nowrap text-[18px] font-black leading-[1.2] tracking-[-0.03em] text-[var(--enroll-muted-strong)] sm:text-[26px] sm:tracking-[-0.04em]"
                  >
                    <span className="min-w-0 truncate">{animatedPlaceholder}</span>
                    <span className="ml-1 inline-block h-[1.05em] w-[2px] shrink-0 animate-pulse rounded-full bg-[var(--enroll-muted-strong)]" />
                  </span>
                ) : null}
              </span>
            </label>
            <p className="mt-2 hidden text-sm text-[var(--enroll-muted)] sm:block">
              New tasks are dated today by default, and you can override the date right after.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {DUE_PRESET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onDuePresetChange(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    duePreset === option.value
                      ? "border-[var(--enroll-strong-border)] bg-[var(--enroll-cyan)] text-[var(--enroll-fg)]"
                      : "border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] text-[var(--enroll-muted-strong)] hover:border-[var(--enroll-surface-border-strong)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="inline-flex items-center gap-2 rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1.5 text-sm text-[var(--enroll-muted-strong)]">
                <CalendarDays className="h-4 w-4" />
                <input
                  type="date"
                  value={customDate}
                  onChange={(event) => {
                    onCustomDateChange(event.target.value);
                    onDuePresetChange("custom");
                  }}
                  className="border-0 bg-transparent outline-none"
                />
              </label>

              <label className="inline-flex min-w-0 items-center gap-2 rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1.5 text-sm text-[var(--enroll-muted-strong)] sm:min-w-[240px]">
                <University className="h-4 w-4 shrink-0" />
                <Select
                  value={universityId}
                  onChange={onUniversityIdChange}
                  options={[
                    { value: "all", label: "No university" },
                    ...universities.map((university) => ({ value: String(university.id), label: university.name })),
                  ]}
                  className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm font-medium text-[var(--enroll-fg-soft)] shadow-none hover:border-transparent focus-visible:border-transparent"
                  menuClassName="z-[90]"
                  ariaLabel="Link task to university"
                />
              </label>
            </div>
          </div>

          <Button type="submit" disabled={saving || !title.trim()} className="h-12 w-full px-6 text-base font-black lg:w-auto">
            {saving ? "Adding..." : "Add task"}
          </Button>
        </div>
      </div>
    </form>
  );
}
