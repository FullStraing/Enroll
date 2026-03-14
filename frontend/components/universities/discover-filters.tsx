"use client";

import { Button } from "@/components/ui/button";
import type { DiscoverFilters } from "@/app/universities/types";

type DiscoverFiltersProps = {
  open: boolean;
  activeFiltersCount: number;
  filtersDraft: DiscoverFilters;
  onToggle: () => void;
  onChange: (updater: (prev: DiscoverFilters) => DiscoverFilters) => void;
  onReset: () => void;
  onApply: () => void;
};

type FieldConfig = {
  key: keyof DiscoverFilters;
  label: string;
  type?: "text" | "number";
  step?: string;
  placeholder?: string;
};

const INPUT_FIELDS: FieldConfig[] = [
  { key: "major", label: "Major", placeholder: "CS, Business, Biology" },
  { key: "state", label: "State", placeholder: "CA, NY, TX" },
  { key: "acceptanceMin", label: "Acceptance % min", type: "number" },
  { key: "acceptanceMax", label: "Acceptance % max", type: "number" },
  { key: "tuitionMin", label: "Tuition min ($)", type: "number" },
  { key: "tuitionMax", label: "Tuition max ($)", type: "number" },
  { key: "satMin", label: "SAT min", type: "number" },
  { key: "satMax", label: "SAT max", type: "number" },
  { key: "actMin", label: "ACT min", type: "number" },
  { key: "actMax", label: "ACT max", type: "number" },
  { key: "gpaMin", label: "GPA min", type: "number", step: "0.01" },
  { key: "gpaMax", label: "GPA max", type: "number", step: "0.01" },
  { key: "netPriceMin", label: "Net cost min ($)", type: "number" },
  { key: "netPriceMax", label: "Net cost max ($)", type: "number" },
  { key: "housingMin", label: "Housing min ($)", type: "number" },
  { key: "housingMax", label: "Housing max ($)", type: "number" },
];

export function DiscoverFiltersPanel({
  open,
  activeFiltersCount,
  filtersDraft,
  onToggle,
  onChange,
  onReset,
  onApply,
}: DiscoverFiltersProps) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Button size="sm" variant="outline" onClick={onToggle} className={open ? "bg-[#DAF5F0]" : ""}>
          {open ? "Hide filters" : "Show filters"}
        </Button>
        <div className="text-sm text-black/65">
          Active filters: <span className="font-semibold text-black">{activeFiltersCount}</span>
        </div>
      </div>

      {open ? (
        <div className="grid gap-3 rounded-xl border border-black/10 bg-black/[0.02] p-3 md:grid-cols-2 xl:grid-cols-4">
          {INPUT_FIELDS.slice(0, 2).map((field) => (
            <label key={field.key} className="text-xs text-black/70">
              {field.label}
              <input
                type={field.type ?? "text"}
                step={field.step}
                value={filtersDraft[field.key]}
                onChange={(event) => onChange((prev) => ({ ...prev, [field.key]: event.target.value }))}
                placeholder={field.placeholder}
                className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
              />
            </label>
          ))}

          <label className="text-xs text-black/70">
            Ranking band
            <select
              value={filtersDraft.rankingBand}
              onChange={(event) =>
                onChange((prev) => ({ ...prev, rankingBand: event.target.value as DiscoverFilters["rankingBand"] }))
              }
              className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
            >
              <option value="">Any</option>
              <option value="high">High selectivity</option>
              <option value="medium">Medium selectivity</option>
              <option value="low">Low selectivity</option>
            </select>
          </label>

          {INPUT_FIELDS.slice(2).map((field) => (
            <label key={field.key} className="text-xs text-black/70">
              {field.label}
              <input
                type={field.type ?? "text"}
                step={field.step}
                value={filtersDraft[field.key]}
                onChange={(event) => onChange((prev) => ({ ...prev, [field.key]: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
              />
            </label>
          ))}

          <div className="col-span-full flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" onClick={onReset}>
              Reset
            </Button>
            <Button size="sm" onClick={onApply}>
              Apply filters
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
