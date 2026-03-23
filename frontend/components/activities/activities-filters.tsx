"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
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
          <Select
            value={filters.category}
            onChange={(value) => onChange({ ...filters, category: value as ActivitiesFilters["category"] })}
            options={ACTIVITIES_CATEGORY_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            className={fieldClass}
            ariaLabel="Filter by category"
          />
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Format</span>
          <Select
            value={filters.format}
            onChange={(value) => onChange({ ...filters, format: value as ActivitiesFilters["format"] })}
            options={ACTIVITIES_FORMAT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            className={fieldClass}
            ariaLabel="Filter by format"
          />
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Cost</span>
          <Select
            value={filters.cost}
            onChange={(value) => onChange({ ...filters, cost: value as ActivitiesFilters["cost"] })}
            options={ACTIVITIES_COST_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            className={fieldClass}
            ariaLabel="Filter by cost"
          />
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Track</span>
          <Select
            value={filters.major}
            onChange={(value) => onChange({ ...filters, major: value as ActivitiesFilters["major"] })}
            options={ACTIVITIES_MAJOR_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            className={fieldClass}
            ariaLabel="Filter by track"
          />
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
