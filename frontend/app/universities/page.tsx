"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { DiscoverFiltersPanel } from "@/components/universities/discover-filters";
import { DiscoverGrid } from "@/components/universities/discover-grid";
import { MyUniversitiesTable } from "@/components/universities/my-universities-table";
import { UniversitiesTabs } from "@/components/universities/universities-tabs";
import { PAGE_SIZE_OPTIONS } from "@/app/universities/constants";
import { useUniversitiesPage } from "@/app/universities/use-universities-page";

function UniversitiesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = useUniversitiesPage();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "my" || tab === "discover") {
      state.setActiveTab(tab);
    }
  }, [searchParams, state]);

  return (
    <ProtectedPage>
      <AppShell title="Universities" subtitle="My list and discover flow in one screen.">
        <section className="glass rounded-2xl p-5">
          <UniversitiesTabs
            activeTab={state.activeTab}
            onTabChange={state.setActiveTab}
            pageSize={state.pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={state.setPageSizeAndPersist}
          />

          {state.status ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-black/10 bg-[#DAF5F0]/60 px-3 py-2 text-sm">
              <span>{state.status}</span>
              {state.statusAction ? (
                <Button size="sm" variant="outline" onClick={state.statusAction.onClick}>
                  {state.statusAction.label}
                </Button>
              ) : null}
            </div>
          ) : null}

          {state.activeTab === "my" ? (
            <div className="mt-4 overflow-x-auto">
              <MyUniversitiesTable
                loading={state.loadingMy}
                items={state.myItems}
                updatingItemId={state.updatingItemId}
                draggingItemId={state.draggingItemId}
                dropTargetItemId={state.dropTargetItemId}
                actionMenu={state.actionMenu}
                onStartDiscover={() => state.setActiveTab("discover")}
                onBeginDrag={state.beginPointerDrag}
                onUpdateCategory={(itemId, category) => void state.patchMyUniversity(itemId, { category })}
                onUpdateStatus={(itemId, statusValue) => void state.patchMyUniversity(itemId, { status: statusValue })}
                onOpenActionMenu={state.openActionMenu}
                onOpenUniversity={(universityId) => {
                  state.setActionMenu(null);
                  router.push(`/universities/${universityId}`);
                }}
                onRemove={(item) => {
                  state.setActionMenu(null);
                  void state.removeFromMyList(item);
                }}
              />
            </div>
          ) : (
            <div className="mt-4">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <label className="relative block w-full max-w-xl">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" />
                  <input
                    value={state.searchQuery}
                    onChange={(event) => state.setSearchQuery(event.target.value)}
                    placeholder="Search universities by name"
                    className="w-full rounded-2xl border-2 border-black bg-white py-2.5 pl-10 pr-4 text-sm text-black outline-none transition placeholder:text-black/40 focus:bg-[#DAF5F0]/30"
                  />
                </label>
                <div className="text-sm text-black/60">
                  {state.loadingDiscover ? "Searching..." : `Results across all pages: ${state.discoverCount}`}
                </div>
              </div>

              <DiscoverFiltersPanel
                open={state.filtersOpen}
                activeFiltersCount={state.activeFiltersCount}
                filtersDraft={state.filtersDraft}
                onToggle={() => state.setFiltersOpen((prev) => !prev)}
                onChange={(updater) => state.setFiltersDraft((prev) => updater(prev))}
                onReset={state.resetFilters}
                onApply={state.applyFilters}
              />

              <div className="mt-3 flex items-center justify-between text-sm text-black/70">
                <span>Total: {state.discoverCount}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void state.loadDiscover(Math.max(1, state.discoverPage - 1), state.filters, state.pageSize)}
                    disabled={state.discoverPage <= 1 || state.loadingDiscover}
                  >
                    Back
                  </Button>
                  <span>
                    {state.discoverPage} / {state.discoverTotalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void state.loadDiscover(Math.min(state.discoverTotalPages, state.discoverPage + 1), state.filters, state.pageSize)
                    }
                    disabled={state.discoverPage >= state.discoverTotalPages || state.loadingDiscover}
                  >
                    Next
                  </Button>
                </div>
              </div>

              <DiscoverGrid
                loading={state.loadingDiscover}
                items={state.discover}
                pageSize={state.pageSize}
                myUniversityIds={state.myUniversityIds}
                updatingItemId={state.updatingItemId}
                onOpen={(universityId) => router.push(`/universities/${universityId}`)}
                onAdd={(university) => void state.addToMyList(university)}
              />
            </div>
          )}
        </section>
      </AppShell>
    </ProtectedPage>
  );
}

export default function UniversitiesPage() {
  return (
    <Suspense fallback={null}>
      <UniversitiesPageContent />
    </Suspense>
  );
}
