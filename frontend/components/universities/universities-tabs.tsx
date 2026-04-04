"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useLocale } from "@/components/locale-provider";
import { getProductCopy } from "@/lib/product-copy";

type UniversitiesTabsProps = {
  activeTab: "my" | "discover";
  onTabChange: (tab: "my" | "discover") => void;
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (size: number) => void;
};

export function UniversitiesTabs({
  activeTab,
  onTabChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: UniversitiesTabsProps) {
  const { locale } = useLocale();
  const copy = getProductCopy(locale).universities;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
      <div className="flex items-center gap-2 rounded-xl border border-black/15 bg-black/[0.02] p-1">
        <button
          type="button"
          onClick={() => onTabChange("my")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            activeTab === "my" ? "bg-[#FFDB58] text-black" : "text-black/70 hover:bg-black/5"
          }`}
        >
          {copy.myTab}
        </button>
        <button
          type="button"
          onClick={() => onTabChange("discover")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            activeTab === "discover" ? "bg-[#DAF5F0] text-black" : "text-black/70 hover:bg-black/5"
          }`}
        >
          {copy.discoverTab}
        </button>
      </div>

      {activeTab === "discover" ? (
        <label className="flex items-center gap-2 text-sm text-black/70">
          {copy.perPage}
          <Select
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value) || 10)}
            options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
            className="h-9 min-w-[92px] rounded-lg border border-black/20 px-3 py-1 text-sm shadow-none"
            ariaLabel={copy.perPage}
          />
        </label>
      ) : null}
    </div>
  );
}
