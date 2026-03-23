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
  { value: "none", label: "No date" },
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

  const activePlaceholder = useMemo(
    () => TASK_PLACEHOLDER_EXAMPLES[placeholderIndex % TASK_PLACEHOLDER_EXAMPLES.length] || "",
    [placeholderIndex],
  );

  useEffect(() => {
    if (title.trim()) return;

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
  }, [activePlaceholder, isDeleting, isPaused, placeholderIndex, title, typedLength]);

  const animatedPlaceholder = title.trim() ? "" : activePlaceholder.slice(0, typedLength);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="rounded-[28px] border-2 border-black bg-white p-5 shadow-[0_8px_0_rgba(0,0,0,0.06)]"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-[#FFF4CC]">
            <Plus className="h-5 w-5 text-black/70" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">Quick capture</p>
            <label className="mt-2 block">
              <span className="sr-only">Task title</span>
              <span className="relative block">
                <input
                  value={title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder=""
                  className="relative z-[1] w-full border-0 bg-transparent px-0 py-0 text-[26px] font-black tracking-[-0.04em] text-black outline-none sm:text-[30px]"
                />
                {!title.trim() ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 flex items-center text-[26px] font-black tracking-[-0.04em] text-black/28 sm:text-[30px]"
                  >
                    <span>{animatedPlaceholder}</span>
                    <span className="ml-1 inline-block h-[1.05em] w-[2px] animate-pulse rounded-full bg-black/28" />
                  </span>
                ) : null}
              </span>
            </label>
            <p className="mt-2 text-sm text-black/55">
              Start with one clear task. You can add the date and university right after.
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
                      ? "border-black bg-[#DAF5F0] text-black"
                      : "border-black/10 bg-white text-black/65 hover:border-black/30"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-black/65">
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

              <label className="inline-flex min-w-0 items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-black/65 sm:min-w-[240px]">
                <University className="h-4 w-4 shrink-0" />
                <Select
                  value={universityId}
                  onChange={onUniversityIdChange}
                  options={[
                    { value: "all", label: "No university" },
                    ...universities.map((university) => ({ value: String(university.id), label: university.name })),
                  ]}
                  className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm font-medium text-black/70 shadow-none hover:border-transparent focus-visible:border-transparent"
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
