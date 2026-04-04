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
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--enroll-surface-border)] pb-4">
      <div className="flex items-center gap-2 rounded-xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)] p-1">
        <button
          type="button"
          onClick={() => onTabChange("my")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            activeTab === "my" ? "bg-[var(--enroll-yellow)] text-[var(--enroll-strong-fg)]" : "text-[var(--enroll-muted-strong)] hover:bg-[var(--enroll-surface-elevated)]"
          }`}
        >
          {copy.myTab}
        </button>
        <button
          type="button"
          onClick={() => onTabChange("discover")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            activeTab === "discover" ? "bg-[var(--enroll-cyan)] text-[var(--enroll-fg)]" : "text-[var(--enroll-muted-strong)] hover:bg-[var(--enroll-surface-elevated)]"
          }`}
        >
          {copy.discoverTab}
        </button>
      </div>

      {activeTab === "discover" ? (
        <label className="flex items-center gap-2 text-sm text-[var(--enroll-muted-strong)]">
          {copy.perPage}
          <Select
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value) || 10)}
            options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
            className="h-9 min-w-[92px] rounded-lg border border-[var(--enroll-surface-border)] px-3 py-1 text-sm shadow-none"
            ariaLabel={copy.perPage}
          />
        </label>
      ) : null}
    </div>
  );
}

