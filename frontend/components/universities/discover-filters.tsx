"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { DiscoverFilters } from "@/app/universities/types";
import { getProductCopy } from "@/lib/product-copy";
import { useLocale } from "@/components/locale-provider";

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

export function DiscoverFiltersPanel({
  open,
  activeFiltersCount,
  filtersDraft,
  onToggle,
  onChange,
  onReset,
  onApply,
}: DiscoverFiltersProps) {
  const { locale } = useLocale();
  const copy = getProductCopy(locale).universities;

  const inputFields: FieldConfig[] = [
    { key: "major", label: copy.major, placeholder: copy.majorPlaceholder },
    { key: "state", label: copy.state, placeholder: copy.statePlaceholder },
    { key: "acceptanceMin", label: copy.acceptanceMin, type: "number" },
    { key: "acceptanceMax", label: copy.acceptanceMax, type: "number" },
    { key: "tuitionMin", label: copy.tuitionMin, type: "number" },
    { key: "tuitionMax", label: copy.tuitionMax, type: "number" },
    { key: "satMin", label: copy.satMin, type: "number" },
    { key: "satMax", label: copy.satMax, type: "number" },
    { key: "actMin", label: copy.actMin, type: "number" },
    { key: "actMax", label: copy.actMax, type: "number" },
    { key: "gpaMin", label: copy.gpaMin, type: "number", step: "0.01" },
    { key: "gpaMax", label: copy.gpaMax, type: "number", step: "0.01" },
    { key: "netPriceMin", label: copy.netPriceMin, type: "number" },
    { key: "netPriceMax", label: copy.netPriceMax, type: "number" },
    { key: "housingMin", label: copy.housingMin, type: "number" },
    { key: "housingMax", label: copy.housingMax, type: "number" },
  ];

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Button size="sm" variant="outline" onClick={onToggle} className={open ? "bg-[#DAF5F0]" : ""}>
          {open ? copy.hideFilters : copy.showFilters}
        </Button>
        <div className="text-sm text-black/65">{copy.activeFilters.replace("{count}", String(activeFiltersCount))}</div>
      </div>

      {open ? (
        <div className="grid gap-3 rounded-xl border border-black/10 bg-black/[0.02] p-3 md:grid-cols-2 xl:grid-cols-4">
          {inputFields.slice(0, 2).map((field) => (
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
            {copy.chanceBand}
            <Select
              value={filtersDraft.chanceBand}
              onChange={(value) => onChange((prev) => ({ ...prev, chanceBand: value as DiscoverFilters["chanceBand"] }))}
              options={[
                { value: "", label: copy.anyChance },
                { value: "safety", label: copy.chanceLabels.safety },
                { value: "likely", label: copy.chanceLabels.likely },
                { value: "target", label: copy.chanceLabels.target },
                { value: "reach", label: copy.chanceLabels.reach },
                { value: "high_reach", label: copy.chanceLabels.high_reach },
              ]}
              className="mt-1 w-full rounded-lg border border-black/15 px-2 py-2 text-sm"
              ariaLabel={copy.chanceBand}
            />
          </label>

          <label className="text-xs text-black/70">
            {copy.rankingBand}
            <Select
              value={filtersDraft.rankingBand}
              onChange={(value) => onChange((prev) => ({ ...prev, rankingBand: value as DiscoverFilters["rankingBand"] }))}
              options={[
                { value: "", label: copy.any },
                { value: "high", label: copy.highSelectivity },
                { value: "medium", label: copy.mediumSelectivity },
                { value: "low", label: copy.lowSelectivity },
              ]}
              className="mt-1 w-full rounded-lg border border-black/15 px-2 py-2 text-sm"
              ariaLabel={copy.rankingBand}
            />
          </label>

          {inputFields.slice(2).map((field) => (
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
              {copy.reset}
            </Button>
            <Button size="sm" onClick={onApply}>
              {copy.applyFilters}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
