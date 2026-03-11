"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type University = {
  id: number;
  name: string;
  country?: string;
  city?: string;
  state?: string;
  selectivity?: "high" | "medium" | "low" | string;
  main_deadline?: string | null;
  acceptance_rate?: number | null;
  tuition_out_state?: number | null;
  net_price?: number | null;
};

type StudentUniversity = {
  id: number;
  category: "reach" | "target" | "safety";
  status: "planning" | "preparing" | "applying" | "submitted" | "admitted" | "rejected";
  university: University;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type DiscoverFilters = {
  search: string;
  major: string;
  state: string;
  rankingBand: "" | "high" | "medium" | "low";
  acceptanceMin: string;
  acceptanceMax: string;
  tuitionMin: string;
  tuitionMax: string;
  satMin: string;
  satMax: string;
  actMin: string;
  actMax: string;
  gpaMin: string;
  gpaMax: string;
  netPriceMin: string;
  netPriceMax: string;
  housingMin: string;
  housingMax: string;
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 40];
const PAGE_SIZE_STORAGE_KEY = "enroll_universities_page_size";
const PAGE_UI_STATE_KEY = "enroll_universities_ui_state";
const PAGE_SCROLL_Y_KEY = "enroll_universities_scroll_y";
const EMPTY_FILTERS: DiscoverFilters = {
  search: "",
  major: "",
  state: "",
  rankingBand: "",
  acceptanceMin: "",
  acceptanceMax: "",
  tuitionMin: "",
  tuitionMax: "",
  satMin: "",
  satMax: "",
  actMin: "",
  actMax: "",
  gpaMin: "",
  gpaMax: "",
  netPriceMin: "",
  netPriceMax: "",
  housingMin: "",
  housingMax: "",
};

const STATUS_OPTIONS: Array<{ value: StudentUniversity["status"]; label: string }> = [
  { value: "planning", label: "Planning" },
  { value: "preparing", label: "Preparing" },
  { value: "applying", label: "Applying" },
  { value: "submitted", label: "Submitted" },
  { value: "admitted", label: "Admitted" },
  { value: "rejected", label: "Rejected" },
];

function money(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return `$${Math.round(value).toLocaleString()}`;
}

function categoryLabel(category: StudentUniversity["category"]): string {
  if (category === "reach") return "Reach";
  if (category === "safety") return "Safety";
  return "Target";
}

function buildQuery(paramsSource: DiscoverFilters, page: number, pageSize: number): string {
  const queryParts = [
    paramsSource.search.trim(),
    paramsSource.major.trim(),
    paramsSource.state.trim(),
  ].filter(Boolean);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  if (queryParts.length > 0) {
    params.set("q", queryParts.join(" "));
  }
  if (paramsSource.rankingBand) params.set("selectivity", paramsSource.rankingBand);
  if (paramsSource.acceptanceMin.trim()) params.set("acceptance_min", paramsSource.acceptanceMin.trim());
  if (paramsSource.acceptanceMax.trim()) params.set("acceptance_max", paramsSource.acceptanceMax.trim());
  if (paramsSource.tuitionMin.trim()) params.set("tuition_min", paramsSource.tuitionMin.trim());
  if (paramsSource.tuitionMax.trim()) params.set("tuition_max", paramsSource.tuitionMax.trim());
  if (paramsSource.satMin.trim()) params.set("avg_sat_min", paramsSource.satMin.trim());
  if (paramsSource.satMax.trim()) params.set("avg_sat_max", paramsSource.satMax.trim());
  if (paramsSource.actMin.trim()) params.set("avg_act_min", paramsSource.actMin.trim());
  if (paramsSource.actMax.trim()) params.set("avg_act_max", paramsSource.actMax.trim());
  if (paramsSource.gpaMin.trim()) params.set("avg_gpa_min", paramsSource.gpaMin.trim());
  if (paramsSource.gpaMax.trim()) params.set("avg_gpa_max", paramsSource.gpaMax.trim());
  if (paramsSource.netPriceMin.trim()) params.set("net_price_min", paramsSource.netPriceMin.trim());
  if (paramsSource.netPriceMax.trim()) params.set("net_price_max", paramsSource.netPriceMax.trim());
  if (paramsSource.housingMin.trim()) params.set("housing_min", paramsSource.housingMin.trim());
  if (paramsSource.housingMax.trim()) params.set("housing_max", paramsSource.housingMax.trim());

  return params.toString();
}

export default function UniversitiesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"my" | "discover">("my");

  const [myItems, setMyItems] = useState<StudentUniversity[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  const [discover, setDiscover] = useState<University[]>([]);
  const [discoverCount, setDiscoverCount] = useState(0);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [discoverTotalPages, setDiscoverTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loadingDiscover, setLoadingDiscover] = useState(false);

  const [filtersDraft, setFiltersDraft] = useState<DiscoverFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<DiscoverFilters>(EMPTY_FILTERS);

  const [pendingAdd, setPendingAdd] = useState<{ universityId: number; name: string; category: StudentUniversity["category"] } | null>(null);
  const [status, setStatus] = useState("");
  const [statusAction, setStatusAction] = useState<null | { label: string; onClick: () => void }>(null);
  const restoredScrollRef = useRef(false);

  const myUniversityIds = useMemo(() => new Set(myItems.map((item) => item.university.id)), [myItems]);

  async function loadMyUniversities() {
    const token = getToken();
    if (!token) return;

    setLoadingMy(true);
    try {
      const items = await apiFetch<StudentUniversity[]>("/api/my-universities/", { method: "GET" }, token);
      setMyItems(items);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load your universities.");
    } finally {
      setLoadingMy(false);
    }
  }

  async function loadDiscover(page = discoverPage, nextFilters = filters, nextPageSize = pageSize) {
    const token = getToken();
    if (!token) return;

    setLoadingDiscover(true);
    try {
      const query = buildQuery(nextFilters, page, nextPageSize);
      const payload = await apiFetch<PaginatedResponse<University>>(`/api/universities/?${query}`, { method: "GET" }, token);

      setDiscover(payload.results);
      setDiscoverCount(payload.count);
      setDiscoverPage(page);
      setDiscoverTotalPages(Math.max(1, Math.ceil(payload.count / nextPageSize)));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load universities.");
    } finally {
      setLoadingDiscover(false);
    }
  }

  async function patchMyUniversity(itemId: number, payload: Partial<Pick<StudentUniversity, "category" | "status">>) {
    const token = getToken();
    if (!token) return;

    setUpdatingItemId(itemId);
    try {
      await apiFetch(`/api/my-universities/${itemId}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }, token);
      await loadMyUniversities();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update university.");
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function removeFromMyList(item: StudentUniversity) {
    const token = getToken();
    if (!token) return;

    setUpdatingItemId(item.id);
    try {
      await apiFetch(`/api/my-universities/${item.id}/`, { method: "DELETE" }, token);
      await loadMyUniversities();
      setStatus(`${item.university.name} removed from your list.`);
      setStatusAction(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to remove university.");
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function confirmAddToMyList() {
    const token = getToken();
    if (!token || !pendingAdd) return;

    setUpdatingItemId(pendingAdd.universityId);
    try {
      await apiFetch("/api/my-universities/", {
        method: "POST",
        body: JSON.stringify({
          university_id: pendingAdd.universityId,
          category: pendingAdd.category,
        }),
      }, token);

      await loadMyUniversities();
      setStatus(`Added to your university list: ${pendingAdd.name}`);
      setStatusAction({ label: "View my list", onClick: () => setActiveTab("my") });
      setPendingAdd(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to add university.");
    } finally {
      setUpdatingItemId(null);
    }
  }

  useEffect(() => {
    let initialPageSize = 10;
    let initialTab: "my" | "discover" = "my";
    let initialFilters: DiscoverFilters = EMPTY_FILTERS;
    let initialFiltersDraft: DiscoverFilters = EMPTY_FILTERS;
    let initialDiscoverPage = 1;

    if (typeof window !== "undefined") {
      const saved = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
      if (PAGE_SIZE_OPTIONS.includes(saved)) {
        initialPageSize = saved;
      }

      const rawUiState = window.sessionStorage.getItem(PAGE_UI_STATE_KEY);
      if (rawUiState) {
        try {
          const parsed = JSON.parse(rawUiState) as {
            activeTab?: "my" | "discover";
            filters?: DiscoverFilters;
            filtersDraft?: DiscoverFilters;
            discoverPage?: number;
          };
          if (parsed.activeTab === "my" || parsed.activeTab === "discover") {
            initialTab = parsed.activeTab;
          }
          if (parsed.filters) {
            initialFilters = { ...EMPTY_FILTERS, ...parsed.filters };
          }
          if (parsed.filtersDraft) {
            initialFiltersDraft = { ...EMPTY_FILTERS, ...parsed.filtersDraft };
          } else {
            initialFiltersDraft = initialFilters;
          }
          if (typeof parsed.discoverPage === "number" && parsed.discoverPage > 0) {
            initialDiscoverPage = parsed.discoverPage;
          }
        } catch {
          // Ignore invalid session payload and use defaults.
        }
      }
    }

    setPageSize(initialPageSize);
    setActiveTab(initialTab);
    setFilters(initialFilters);
    setFiltersDraft(initialFiltersDraft);
    void loadMyUniversities();
    void loadDiscover(initialDiscoverPage, initialFilters, initialPageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      PAGE_UI_STATE_KEY,
      JSON.stringify({
        activeTab,
        filters,
        filtersDraft,
        discoverPage,
      }),
    );
  }, [activeTab, filters, filtersDraft, discoverPage]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saveScroll = () => {
      window.sessionStorage.setItem(PAGE_SCROLL_Y_KEY, String(window.scrollY));
    };

    window.addEventListener("beforeunload", saveScroll);
    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => {
      window.removeEventListener("beforeunload", saveScroll);
      window.removeEventListener("scroll", saveScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (restoredScrollRef.current) return;
    if (loadingMy || loadingDiscover) return;

    const rawScrollY = window.sessionStorage.getItem(PAGE_SCROLL_Y_KEY);
    const scrollY = rawScrollY ? Number(rawScrollY) : 0;
    if (Number.isFinite(scrollY) && scrollY > 0) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
      });
    }
    restoredScrollRef.current = true;
  }, [loadingMy, loadingDiscover]);

  return (
    <ProtectedPage>
      <AppShell title="Universities" subtitle="My list and discover flow in one screen.">
        <section className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div className="flex items-center gap-2 rounded-xl border border-black/15 bg-black/[0.02] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("my")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  activeTab === "my" ? "bg-[#FFDB58] text-black" : "text-black/70 hover:bg-black/5"
                }`}
              >
                My Universities
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("discover")}
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
                  onChange={(event) => {
                    const nextSize = Number(event.target.value) || 10;
                    setPageSize(nextSize);
                    if (typeof window !== "undefined") {
                      window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(nextSize));
                    }
                    void loadDiscover(1, filters, nextSize);
                  }}
                  className="rounded-lg border border-black/20 bg-white px-2 py-1 text-sm"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          {status ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-black/10 bg-[#DAF5F0]/60 px-3 py-2 text-sm">
              <span>{status}</span>
              {statusAction ? (
                <Button size="sm" variant="outline" onClick={statusAction.onClick}>
                  {statusAction.label}
                </Button>
              ) : null}
            </div>
          ) : null}

          {pendingAdd ? (
            <Card className="mt-4 shadow-none">
              <CardTitle className="text-base">How do you classify this university?</CardTitle>
              <CardDescription className="mt-1">{pendingAdd.name}</CardDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["reach", "target", "safety"] as const).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setPendingAdd((prev) => (prev ? { ...prev, category } : prev))}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                      pendingAdd.category === category ? "border-black bg-[#FFDB58]" : "border-black/20 bg-white"
                    }`}
                  >
                    {categoryLabel(category)}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => void confirmAddToMyList()} disabled={updatingItemId === pendingAdd.universityId}>
                  Add to my list
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPendingAdd(null)}>
                  Cancel
                </Button>
              </div>
            </Card>
          ) : null}

          {activeTab === "my" ? (
            <div className="mt-4 overflow-x-auto">
              {loadingMy ? (
                <div className="grid gap-3">
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </div>
              ) : myItems.length === 0 ? (
                <Card className="shadow-none">
                  <CardTitle className="text-lg">My list is empty</CardTitle>
                  <CardDescription className="mt-2">Find universities in the Discover tab and add them to your list.</CardDescription>
                  <div className="mt-3">
                    <Button size="sm" onClick={() => setActiveTab("discover")}>
                      Start building your university list
                    </Button>
                  </div>
                </Card>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/15 text-black/60">
                      <th className="px-2 py-2 font-semibold">University</th>
                      <th className="px-2 py-2 font-semibold">Category</th>
                      <th className="px-2 py-2 font-semibold">Status</th>
                      <th className="px-2 py-2 font-semibold">Acceptance</th>
                      <th className="px-2 py-2 font-semibold">Tuition</th>
                      <th className="px-2 py-2 font-semibold">Scholarship</th>
                      <th className="px-2 py-2 font-semibold">Net Cost</th>
                      <th className="px-2 py-2 font-semibold">Deadline</th>
                      <th className="px-2 py-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myItems.map((item) => (
                      <tr key={item.id} className="border-b border-black/10">
                        <td className="px-2 py-3 font-semibold">{item.university.name}</td>
                        <td className="px-2 py-3">
                          <select
                            value={item.category}
                            onChange={(event) => void patchMyUniversity(item.id, { category: event.target.value as StudentUniversity["category"] })}
                            className="rounded-lg border border-black/20 bg-white px-2 py-1"
                            disabled={updatingItemId === item.id}
                          >
                            <option value="reach">Reach</option>
                            <option value="target">Target</option>
                            <option value="safety">Safety</option>
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          <select
                            value={item.status}
                            onChange={(event) => void patchMyUniversity(item.id, { status: event.target.value as StudentUniversity["status"] })}
                            className="rounded-lg border border-black/20 bg-white px-2 py-1"
                            disabled={updatingItemId === item.id}
                          >
                            {STATUS_OPTIONS.map((statusOption) => (
                              <option key={statusOption.value} value={statusOption.value}>
                                {statusOption.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-3">{item.university.acceptance_rate != null ? `${item.university.acceptance_rate}%` : "N/A"}</td>
                        <td className="px-2 py-3">{money(item.university.tuition_out_state)}</td>
                        <td className="px-2 py-3">N/A</td>
                        <td className="px-2 py-3">{money(item.university.net_price ?? item.university.tuition_out_state)}</td>
                        <td className="px-2 py-3">{item.university.main_deadline || "N/A"}</td>
                        <td className="px-2 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => router.push(`/universities/${item.university.id}`)}>
                              Open card
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => void removeFromMyList(item)} disabled={updatingItemId === item.id}>
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <div className="grid gap-3 rounded-xl border border-black/10 bg-black/[0.02] p-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-xs text-black/70">
                  Search
                  <input
                    value={filtersDraft.search}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, search: event.target.value }))}
                    placeholder="University / city / state"
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  Major
                  <input
                    value={filtersDraft.major}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, major: event.target.value }))}
                    placeholder="CS, Business, Biology"
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  State
                  <input
                    value={filtersDraft.state}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, state: event.target.value }))}
                    placeholder="CA, NY, TX"
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  Ranking band
                  <select
                    value={filtersDraft.rankingBand}
                    onChange={(event) =>
                      setFiltersDraft((prev) => ({ ...prev, rankingBand: event.target.value as DiscoverFilters["rankingBand"] }))
                    }
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  >
                    <option value="">Any</option>
                    <option value="high">High selectivity</option>
                    <option value="medium">Medium selectivity</option>
                    <option value="low">Low selectivity</option>
                  </select>
                </label>
                <label className="text-xs text-black/70">
                  Acceptance % min
                  <input
                    type="number"
                    value={filtersDraft.acceptanceMin}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, acceptanceMin: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  Acceptance % max
                  <input
                    type="number"
                    value={filtersDraft.acceptanceMax}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, acceptanceMax: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  Tuition min ($)
                  <input
                    type="number"
                    value={filtersDraft.tuitionMin}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, tuitionMin: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  Tuition max ($)
                  <input
                    type="number"
                    value={filtersDraft.tuitionMax}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, tuitionMax: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  SAT min
                  <input
                    type="number"
                    value={filtersDraft.satMin}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, satMin: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  SAT max
                  <input
                    type="number"
                    value={filtersDraft.satMax}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, satMax: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  ACT min
                  <input
                    type="number"
                    value={filtersDraft.actMin}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, actMin: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  ACT max
                  <input
                    type="number"
                    value={filtersDraft.actMax}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, actMax: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  GPA min
                  <input
                    type="number"
                    step="0.01"
                    value={filtersDraft.gpaMin}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, gpaMin: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  GPA max
                  <input
                    type="number"
                    step="0.01"
                    value={filtersDraft.gpaMax}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, gpaMax: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  Net cost min ($)
                  <input
                    type="number"
                    value={filtersDraft.netPriceMin}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, netPriceMin: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  Net cost max ($)
                  <input
                    type="number"
                    value={filtersDraft.netPriceMax}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, netPriceMax: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  Housing min ($)
                  <input
                    type="number"
                    value={filtersDraft.housingMin}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, housingMin: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-black/70">
                  Housing max ($)
                  <input
                    type="number"
                    value={filtersDraft.housingMax}
                    onChange={(event) => setFiltersDraft((prev) => ({ ...prev, housingMax: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm"
                  />
                </label>

                <div className="col-span-full flex flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFiltersDraft(EMPTY_FILTERS);
                      setFilters(EMPTY_FILTERS);
                      void loadDiscover(1, EMPTY_FILTERS, pageSize);
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setFilters(filtersDraft);
                      void loadDiscover(1, filtersDraft, pageSize);
                    }}
                  >
                    Apply filters
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-black/70">
                <span>Total: {discoverCount}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void loadDiscover(Math.max(1, discoverPage - 1), filters, pageSize)}
                    disabled={discoverPage <= 1 || loadingDiscover}
                  >
                    Back
                  </Button>
                  <span>
                    {discoverPage} / {discoverTotalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void loadDiscover(Math.min(discoverTotalPages, discoverPage + 1), filters, pageSize)}
                    disabled={discoverPage >= discoverTotalPages || loadingDiscover}
                  >
                    Next
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {loadingDiscover
                  ? Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
                      <Card key={`d-sk-${index}`} className="shadow-none">
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="mt-2 h-4 w-1/2" />
                        <Skeleton className="mt-3 h-9 w-28" />
                      </Card>
                    ))
                  : discover.map((university) => (
                      <Card
                        key={university.id}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer shadow-none transition hover:-translate-y-0.5"
                        onClick={() => router.push(`/universities/${university.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(`/universities/${university.id}`);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle>{university.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {university.city || "-"}, {university.state || "-"}, {university.country || "USA"}
                            </CardDescription>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge>Acceptance: {university.acceptance_rate != null ? `${university.acceptance_rate}%` : "N/A"}</Badge>
                              <Badge variant="cyan">Tuition: {money(university.tuition_out_state)}</Badge>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {myUniversityIds.has(university.id) ? (
                              <Badge variant="primary">Added</Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPendingAdd({ universityId: university.id, name: university.name, category: "target" });
                                }}
                                disabled={updatingItemId === university.id}
                              >
                                Add to my list
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
              </div>
            </div>
          )}
        </section>
      </AppShell>
    </ProtectedPage>
  );
}
