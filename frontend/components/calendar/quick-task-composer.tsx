"use client";

import { CalendarDays, Plus, University } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="rounded-[28px] border border-black/10 bg-white p-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-[#FFF4CC]">
          <Plus className="h-4 w-4 text-black/70" />
        </div>

        <div className="min-w-0 flex-1">
          <label className="block">
            <span className="sr-only">Task title</span>
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Add a task for today"
              className="w-full border-0 bg-transparent px-0 py-0 text-lg font-semibold text-black outline-none placeholder:text-black/35"
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-2">
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

            <label className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-black/65">
              <University className="h-4 w-4" />
              <select
                value={universityId}
                onChange={(event) => onUniversityIdChange(event.target.value)}
                className="border-0 bg-transparent pr-6 outline-none"
              >
                <option value="all">No university</option>
                {universities.map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <Button type="submit" disabled={saving || !title.trim()} className="shrink-0">
          {saving ? "Adding..." : "Add task"}
        </Button>
      </div>
    </form>
  );
}
