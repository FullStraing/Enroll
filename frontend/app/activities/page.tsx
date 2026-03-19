"use client";

import { useEffect, useMemo, useState } from "react";
import { Hammer, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivitiesFiltersPanel } from "@/components/activities/activities-filters";
import { OpportunityCard } from "@/components/activities/opportunity-card";
import { ACTIVITIES_PAGE_STORAGE_KEY, ACTIVITIES_SEED_DATA, DEFAULT_ACTIVITIES_FILTERS } from "@/app/activities/constants";
import type { ActivitiesFilters } from "@/app/activities/types";
import { applyActivitiesFilters, countUsefulForCis } from "@/app/activities/utils";

export default function ActivitiesPage() {
  const [filters, setFilters] = useState<ActivitiesFilters>(DEFAULT_ACTIVITIES_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ACTIVITIES_PAGE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ActivitiesFilters>;
      setFilters((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore invalid local state.
    } finally {
      window.setTimeout(() => setLoading(false), 280);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search), 220);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVITIES_PAGE_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const effectiveFilters = useMemo(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch]);
  const filteredItems = useMemo(() => applyActivitiesFilters(ACTIVITIES_SEED_DATA, effectiveFilters), [effectiveFilters]);
  const usefulForCisCount = useMemo(() => countUsefulForCis(ACTIVITIES_SEED_DATA), []);

  return (
    <ProtectedPage>
      <AppShell
        title="Activities"
        subtitle="Useful extracurricular opportunities that can realistically strengthen a student profile for CA, CIS, and international admissions paths."
      >
        <div className="space-y-5">
          <Card className="border-2 border-black bg-[#FFF4CC] shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Hammer className="h-4 w-4" />
                  Page in progress
                </CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-black/70">
                  This is a curated MVP. We will keep expanding it with more verified opportunities, deadlines, eligibility details, and better coverage for CA/CIS students.
                </CardDescription>
              </div>
              <span className="rounded-full border border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-black/70">
                MVP
              </span>
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
            <div className="space-y-5">
              <ActivitiesFiltersPanel
                filters={filters}
                resultsCount={filteredItems.length}
                onChange={setFilters}
                onReset={() => window.localStorage.removeItem(ACTIVITIES_PAGE_STORAGE_KEY)}
              />

              <Card className="shadow-none">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-4 w-4" />
                  What we count as useful
                </CardTitle>
                <CardDescription className="mt-2">
                  Not just pretty programs. We prioritize opportunities that create real admissions signal: leadership, competition, research, service, and project ownership.
                </CardDescription>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-black/10 bg-[#DAF5F0] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">CA / CIS fit</p>
                    <p className="mt-2 text-2xl font-black text-black">{usefulForCisCount}</p>
                    <p className="mt-1 text-sm text-black/65">
                      Out of {ACTIVITIES_SEED_DATA.length} starter records, these are already marked as more practical for CA and CIS students.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-[#FFF4CC] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Source rule</p>
                    <p className="mt-2 text-sm text-black/70">
                      We always keep the official source visible. If eligibility, cost, or access is unclear, we do not invent details.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-none">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Curated now</p>
                      <p className="mt-2 text-3xl font-black text-black">{ACTIVITIES_SEED_DATA.length}</p>
                    </div>
                    <Sparkles className="h-5 w-5 text-black/45" />
                  </div>
                </Card>
                <Card className="shadow-none">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Visible after filters</p>
                      <p className="mt-2 text-3xl font-black text-black">{filteredItems.length}</p>
                    </div>
                    <Target className="h-5 w-5 text-black/45" />
                  </div>
                </Card>
              </div>

              {loading ? (
                <div className="grid gap-4">
                  <Skeleton className="h-64 rounded-2xl" />
                  <Skeleton className="h-64 rounded-2xl" />
                  <Skeleton className="h-64 rounded-2xl" />
                </div>
              ) : filteredItems.length ? (
                <div className="grid gap-4">
                  {filteredItems.map((item) => (
                    <OpportunityCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <Card className="shadow-none">
                  <CardTitle className="text-lg">No matches found</CardTitle>
                  <CardDescription className="mt-2">
                    Your current filters are too strict. Relax CA/CIS fit, international eligibility, or category to see more opportunities.
                  </CardDescription>
                </Card>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
