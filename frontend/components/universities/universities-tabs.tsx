"use client";

import { Button } from "@/components/ui/button";

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
          My Universities
        </button>
        <button
          type="button"
          onClick={() => onTabChange("discover")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            activeTab === "discover" ? "bg-[#DAF5F0] text-black" : "text-black/70 hover:bg-black/5"
          }`}
        >
          Discover Universities
        </button>
      </div>

      {activeTab === "discover" ? (
        <label className="flex items-center gap-2 text-sm text-black/70">
          Per page
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value) || 10)}
            className="rounded-lg border border-black/20 bg-white px-2 py-1 text-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
