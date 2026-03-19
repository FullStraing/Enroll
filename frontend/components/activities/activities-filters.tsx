"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  ACTIVITIES_CATEGORY_OPTIONS,
  ACTIVITIES_COST_OPTIONS,
  ACTIVITIES_FORMAT_OPTIONS,
  ACTIVITIES_MAJOR_OPTIONS,
  DEFAULT_ACTIVITIES_FILTERS,
} from "@/app/activities/constants";
import type { ActivitiesFilters } from "@/app/activities/types";

type Props = {
  filters: ActivitiesFilters;
  resultsCount: number;
  onChange: (next: ActivitiesFilters) => void;
  onReset: () => void;
};

const fieldClass =
  "mt-2 h-12 w-full rounded-2xl border-2 border-black/15 bg-white px-4 text-sm font-semibold text-black outline-none transition focus:border-black";

export function ActivitiesFiltersPanel({ filters, resultsCount, onChange, onReset }: Props) {
  return (
    <Card className="shadow-none">
      <CardTitle className="text-lg">Filters</CardTitle>
      <CardDescription className="mt-2">Keep only useful opportunities for CA/CIS and international applicants.</CardDescription>

      <div className="mt-4 space-y-4">
        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Search</span>
          <input
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder="For example: robotics, volunteer, research"
            className={fieldClass}
          />
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Category</span>
          <select value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value as ActivitiesFilters["category"] })} className={fieldClass}>
            {ACTIVITIES_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Format</span>
          <select value={filters.format} onChange={(event) => onChange({ ...filters, format: event.target.value as ActivitiesFilters["format"] })} className={fieldClass}>
            {ACTIVITIES_FORMAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Cost</span>
          <select value={filters.cost} onChange={(event) => onChange({ ...filters, cost: event.target.value as ActivitiesFilters["cost"] })} className={fieldClass}>
            {ACTIVITIES_COST_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Track</span>
          <select value={filters.major} onChange={(event) => onChange({ ...filters, major: event.target.value as ActivitiesFilters["major"] })} className={fieldClass}>
            {ACTIVITIES_MAJOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-[#DAF5F0]/45 px-4 py-3 text-sm font-semibold text-black">
          <input
            type="checkbox"
            checked={filters.cisOnly}
            onChange={(event) => onChange({ ...filters, cisOnly: event.target.checked })}
            className="h-4 w-4 rounded border-black"
          />
          Show stronger fits for CA / CIS
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-[#FFF4CC]/55 px-4 py-3 text-sm font-semibold text-black">
          <input
            type="checkbox"
            checked={filters.internationalOnly}
            onChange={(event) => onChange({ ...filters, internationalOnly: event.target.checked })}
            className="h-4 w-4 rounded border-black"
          />
          Hide listings with unclear international eligibility
        </label>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Results</p>
          <p className="mt-1 text-lg font-black text-black">{resultsCount}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            onReset();
            onChange(DEFAULT_ACTIVITIES_FILTERS);
          }}
        >
          Reset
        </Button>
      </div>
    </Card>
  );
}
