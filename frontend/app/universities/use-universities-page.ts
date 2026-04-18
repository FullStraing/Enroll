"use client";

import { type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ACTION_MENU_GAP,
  DISCOVER_CACHE_KEY,
  EMPTY_FILTERS,
  MY_UNIVERSITIES_CACHE_KEY,
  PAGE_SCROLL_Y_KEY,
  PAGE_SIZE_OPTIONS,
  PAGE_SIZE_STORAGE_KEY,
  PAGE_UI_STATE_KEY,
} from "@/app/universities/constants";
import type { ActionMenuState, DiscoverFilters, PaginatedResponse, StudentUniversity, University } from "@/app/universities/types";
import { buildQuery, chanceBandToStudentCategory, filtersHash } from "@/app/universities/utils";
import { useAuth } from "@/components/auth-provider";
import { ApiError, apiFetch } from "@/lib/api";
import { formatPlanLabel, getUniversityUsage } from "@/lib/account-plan";
import { getToken } from "@/lib/auth";
import { getUserScopedSessionCacheKey } from "@/lib/session-cache";
import { useLocale } from "@/components/locale-provider";
import { getProductCopy } from "@/lib/product-copy";

type StatusAction = { label: string; onClick: () => void } | null;

type PlanLimitPayload = {
  code?: string;
  feature?: string;
  plan?: string;
  limit?: number;
  used?: number;
  remaining?: number;
  detail?: string;
};

function getUniversityLimitMessage(locale: "ru" | "en", limit: number) {
  return locale === "ru"
    ? `Лимит текущего плана: ${limit} университетов. Чтобы добавить ещё, нужен более высокий тариф.`
    : `Your current plan includes up to ${limit} universities. Upgrade the plan to add more.`;
}

function getUniversityLimitReachedLabel(locale: "ru" | "en") {
  return locale === "ru" ? "Лимит достигнут" : "Limit reached";
}

function getPricingAction(locale: "ru" | "en"): StatusAction {
  return {
    label: locale === "ru" ? "Тарифы" : "Pricing",
    onClick: () => {
      if (typeof window !== "undefined") {
        window.location.href = "/pricing";
      }
    },
  };
}

function extractPlanLimitPayload(error: unknown): PlanLimitPayload | null {
  if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null) {
    return null;
  }
  const payload = error.data as PlanLimitPayload;
  if (payload.code !== "plan_limit_reached") {
    return null;
  }
  return payload;
}

export function useUniversitiesPage() {
  const { locale } = useLocale();
  const { profile } = useAuth();
  const copy = getProductCopy(locale).universities;
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [status, setStatus] = useState("");
  const [statusAction, setStatusAction] = useState<StatusAction>(null);
  const [draggingItemId, setDraggingItemId] = useState<number | null>(null);
  const [dropTargetItemId, setDropTargetItemId] = useState<number | null>(null);
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);
  const restoredScrollRef = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const dropTargetRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const [uiStateReady, setUiStateReady] = useState(false);

  const scopedUiKey = useCallback((key: string) => getUserScopedSessionCacheKey(key), []);
  const accountPlanLabel = useMemo(() => formatPlanLabel(profile?.account_plan), [profile?.account_plan]);
  const accountPlanCode = profile?.account_plan?.code || "";
  const profileUniversityUsage = getUniversityUsage(profile);
  const universityUsage = useMemo(() => {
    const maxCount = profileUniversityUsage.maxCount;
    const discoverVisibleCount = profileUniversityUsage.discoverVisibleCount;
    const used = loadingMy && myItems.length === 0 ? profileUniversityUsage.used : myItems.length;
    const remaining = maxCount > 0 ? Math.max(maxCount - used, 0) : profileUniversityUsage.remaining;
    return {
      maxCount,
      discoverVisibleCount,
      used,
      remaining,
      canCreate: maxCount > 0 ? used < maxCount : profileUniversityUsage.canCreate,
    };
  }, [loadingMy, myItems.length, profileUniversityUsage]);
  const hasUniversityLimit = useMemo(
    () => universityUsage.maxCount > 0 && !universityUsage.canCreate,
    [universityUsage],
  );
  const universityLimitMessage = useMemo(
    () => getUniversityLimitMessage(locale, universityUsage.maxCount),
    [locale, universityUsage.maxCount],
  );

  const myUniversityIds = useMemo(() => new Set(myItems.map((item) => item.university.id)), [myItems]);
  const activeFiltersCount = useMemo(
    () =>
      Object.values(filters).reduce((count, value) => {
        if (typeof value === "string" && value.trim()) return count + 1;
        return count;
      }, 0),
    [filters],
  );

  async function loadMyUniversities(options?: { silent?: boolean }) {
    const token = getToken();
    if (!token) return;

    const silent = options?.silent ?? false;
    if (!silent) setLoadingMy(true);

    try {
      const items = await apiFetch<StudentUniversity[]>("/api/my-universities/", { method: "GET" }, token);
      setMyItems(items);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(scopedUiKey(MY_UNIVERSITIES_CACHE_KEY), JSON.stringify({ items }));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.loadMineFailed);
    } finally {
      if (!silent) setLoadingMy(false);
    }
  }

  const loadDiscover = useCallback(async (
    page = discoverPage,
    nextFilters = filters,
    nextPageSize = pageSize,
    options?: { silent?: boolean },
  ) => {
    const token = getToken();
    if (!token) return;

    const silent = options?.silent ?? false;
    if (!silent) setLoadingDiscover(true);

    try {
      const query = buildQuery(nextFilters, page, nextPageSize);
      const payload = await apiFetch<PaginatedResponse<University>>(`/api/universities/?${query}`, { method: "GET" }, token);

      setDiscover(payload.results);
      setDiscoverCount(payload.count);
      setDiscoverPage(page);
      setDiscoverTotalPages(Math.max(1, Math.ceil(payload.count / nextPageSize)));
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          scopedUiKey(DISCOVER_CACHE_KEY),
          JSON.stringify({
            page,
            pageSize: nextPageSize,
            filtersHash: filtersHash(nextFilters),
            count: payload.count,
            results: payload.results,
          }),
        );
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.loadDiscoverFailed);
    } finally {
      if (!silent) setLoadingDiscover(false);
    }
  }, [copy.loadDiscoverFailed, discoverPage, filters, pageSize, scopedUiKey]);

  async function patchMyUniversity(itemId: number, payload: Partial<Pick<StudentUniversity, "category" | "status" | "sort_order">>) {
    const token = getToken();
    if (!token) return;

    setUpdatingItemId(itemId);
    try {
      await apiFetch(`/api/my-universities/${itemId}/`, { method: "PATCH", body: JSON.stringify(payload) }, token);
      setMyItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...payload } : item)));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.updateFailed);
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function saveMyOrder(next: StudentUniversity[]) {
    const token = getToken();
    if (!token) return;
    try {
      await Promise.all(
        next.map((item, index) =>
          apiFetch(
            `/api/my-universities/${item.id}/`,
            { method: "PATCH", body: JSON.stringify({ sort_order: index + 1 }) },
            token,
          ),
        ),
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.saveOrderFailed);
      await loadMyUniversities();
    }
  }

  async function reorderMyUniversities(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= myItems.length || toIndex >= myItems.length) return;

    const next = [...myItems];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const normalized = next.map((item, index) => ({ ...item, sort_order: index + 1 }));
    setMyItems(normalized);
    await saveMyOrder(normalized);
  }

  function endPointerDrag() {
    if (dragCleanupRef.current) {
      dragCleanupRef.current();
      dragCleanupRef.current = null;
    }
    setDraggingItemId(null);
    setDropTargetItemId(null);
    dropTargetRef.current = null;
  }

  function beginPointerDrag(event: ReactPointerEvent, itemId: number) {
    event.preventDefault();
    setDraggingItemId(itemId);
    setDropTargetItemId(itemId);
    dropTargetRef.current = itemId;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY) as HTMLElement | null;
      const row = target?.closest("tr[data-row-id]") as HTMLTableRowElement | null;
      if (!row) return;
      const nextId = Number(row.dataset.rowId);
      if (Number.isFinite(nextId)) {
        setDropTargetItemId(nextId);
        dropTargetRef.current = nextId;
      }
    };

    const onPointerUp = () => {
      const fromIndex = myItems.findIndex((row) => row.id === itemId);
      const toIndex = myItems.findIndex((row) => row.id === dropTargetRef.current);
      endPointerDrag();
      if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
        void reorderMyUniversities(fromIndex, toIndex);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { once: true });
    dragCleanupRef.current = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }

  function openActionMenu(event: ReactMouseEvent<HTMLButtonElement>, itemId: number) {
    const rect = event.currentTarget.getBoundingClientRect();
    setActionMenu((prev) =>
      prev?.itemId === itemId
        ? null
        : {
            itemId,
            anchorRect: {
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              left: rect.left,
            },
          },
    );
  }

  async function removeFromMyList(item: StudentUniversity) {
    const token = getToken();
    if (!token) return;

    setUpdatingItemId(item.id);
    try {
      await apiFetch(`/api/my-universities/${item.id}/`, { method: "DELETE" }, token);
      await loadMyUniversities();
      setStatus(copy.removed.replace("{name}", item.university.name));
      setStatusAction(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.removeFailed);
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function addToMyList(university: University) {
    const token = getToken();
    if (!token) return;
    if (hasUniversityLimit) {
      setStatus(universityLimitMessage);
      setStatusAction(getPricingAction(locale));
      return;
    }

    setUpdatingItemId(university.id);
    try {
      await apiFetch(
        "/api/my-universities/",
        {
          method: "POST",
          body: JSON.stringify({
            university_id: university.id,
            category: chanceBandToStudentCategory(university.acceptance_rate),
          }),
        },
        token,
      );

      await loadMyUniversities();
      setStatus(copy.added.replace("{name}", university.name));
      setStatusAction({ label: copy.statusActionViewMyList, onClick: () => setActiveTab("my") });
    } catch (error) {
      const limitPayload = extractPlanLimitPayload(error);
      if (limitPayload?.feature === "universities.max_count") {
        setStatus(getUniversityLimitMessage(locale, limitPayload.limit || universityUsage.maxCount));
        setStatusAction(getPricingAction(locale));
      } else {
        setStatus(error instanceof Error ? error.message : copy.addFailed);
      }
    } finally {
      setUpdatingItemId(null);
    }
  }

  function setPageSizeAndPersist(nextSize: number) {
    setPageSize(nextSize);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(nextSize));
    }
    void loadDiscover(1, filters, nextSize);
  }

  function resetFilters() {
    setFiltersDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setSearchQuery("");
    void loadDiscover(1, EMPTY_FILTERS, pageSize);
  }

  function applyFilters() {
    setFilters(filtersDraft);
    void loadDiscover(1, filtersDraft, pageSize);
  }

  function setChanceBandFilter(chanceBand: DiscoverFilters["chanceBand"]) {
    const nextFilters = { ...filters, chanceBand };
    setFilters(nextFilters);
    setFiltersDraft((prev) => ({ ...prev, chanceBand }));
    void loadDiscover(1, nextFilters, pageSize);
  }

  useEffect(() => {
    return () => endPointerDrag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-actions-menu-root]")) return;
      setActionMenu(null);
    };
    window.addEventListener("mousedown", onOutsideClick);
    return () => window.removeEventListener("mousedown", onOutsideClick);
  }, []);

  useEffect(() => {
    const close = () => setActionMenu(null);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, []);

  useEffect(() => {
    let initialPageSize = 10;
    let initialTab: "my" | "discover" = "my";
    let initialFilters: DiscoverFilters = EMPTY_FILTERS;
    let initialFiltersDraft: DiscoverFilters = EMPTY_FILTERS;
    let initialDiscoverPage = 1;
    let initialFiltersOpen = false;

    if (typeof window !== "undefined") {
      const saved = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
      if (PAGE_SIZE_OPTIONS.includes(saved)) {
        initialPageSize = saved;
      }

      const rawUiState = window.sessionStorage.getItem(scopedUiKey(PAGE_UI_STATE_KEY));
      if (rawUiState) {
        try {
          const parsed = JSON.parse(rawUiState) as {
            activeTab?: "my" | "discover";
            filters?: DiscoverFilters;
            filtersDraft?: DiscoverFilters;
            discoverPage?: number;
            filtersOpen?: boolean;
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
          if (typeof parsed.filtersOpen === "boolean") {
            initialFiltersOpen = parsed.filtersOpen;
          }
        } catch {
          // Ignore invalid session payload and use defaults.
        }
      }
    }

    let hasMyCache = false;
    let hasDiscoverCache = false;
    if (typeof window !== "undefined") {
      const rawMyCache = window.sessionStorage.getItem(scopedUiKey(MY_UNIVERSITIES_CACHE_KEY));
      if (rawMyCache) {
        try {
          const parsed = JSON.parse(rawMyCache) as { items?: StudentUniversity[] };
          if (Array.isArray(parsed.items)) {
            setMyItems(parsed.items);
            hasMyCache = true;
          }
        } catch {
          // Ignore invalid cache data.
        }
      }

      const rawDiscoverCache = window.sessionStorage.getItem(scopedUiKey(DISCOVER_CACHE_KEY));
      if (rawDiscoverCache) {
        try {
          const parsed = JSON.parse(rawDiscoverCache) as {
            page?: number;
            pageSize?: number;
            filtersHash?: string;
            count?: number;
            results?: University[];
          };
          const isSameScope =
            parsed.page === initialDiscoverPage &&
            parsed.pageSize === initialPageSize &&
            parsed.filtersHash === filtersHash(initialFilters) &&
            Array.isArray(parsed.results) &&
            typeof parsed.count === "number";
          if (isSameScope) {
            setDiscover(parsed.results ?? []);
            setDiscoverCount(parsed.count ?? 0);
            setDiscoverPage(initialDiscoverPage);
            setDiscoverTotalPages(Math.max(1, Math.ceil((parsed.count ?? 0) / initialPageSize)));
            hasDiscoverCache = true;
          }
        } catch {
          // Ignore invalid cache data.
        }
      }
    }

    setPageSize(initialPageSize);
    setActiveTab(initialTab);
    setFilters(initialFilters);
    setFiltersDraft(initialFiltersDraft);
    setFiltersOpen(initialFiltersOpen);
    setSearchQuery(initialFilters.search);
    void loadMyUniversities({ silent: hasMyCache });
    void loadDiscover(initialDiscoverPage, initialFilters, initialPageSize, { silent: hasDiscoverCache });
    setUiStateReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedUiKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !uiStateReady) return;
    window.sessionStorage.setItem(
      scopedUiKey(PAGE_UI_STATE_KEY),
      JSON.stringify({
        activeTab,
        filters,
        filtersDraft,
        discoverPage,
        filtersOpen,
      }),
    );
  }, [activeTab, filters, filtersDraft, discoverPage, filtersOpen, scopedUiKey, uiStateReady]);

  useEffect(() => {
    if (!uiStateReady) return;

    const normalizedSearch = searchQuery.trim();
    if (normalizedSearch === filters.search) return;

    const timer = window.setTimeout(() => {
      const nextFilters = { ...filters, search: normalizedSearch };
      setFilters(nextFilters);
      setFiltersDraft((prev) => ({ ...prev, search: normalizedSearch }));
      void loadDiscover(1, nextFilters, pageSize);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery, filters, pageSize, uiStateReady, loadDiscover]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saveScroll = () => {
      if (scrollFrameRef.current !== null) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        window.sessionStorage.setItem(scopedUiKey(PAGE_SCROLL_Y_KEY), String(window.scrollY));
        scrollFrameRef.current = null;
      });
    };

    window.addEventListener("beforeunload", saveScroll);
    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
      window.removeEventListener("beforeunload", saveScroll);
      window.removeEventListener("scroll", saveScroll);
    };
  }, [scopedUiKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (restoredScrollRef.current) return;
    if (loadingMy || loadingDiscover) return;

    const rawScrollY = window.sessionStorage.getItem(scopedUiKey(PAGE_SCROLL_Y_KEY));
    const scrollY = rawScrollY ? Number(rawScrollY) : 0;
    if (Number.isFinite(scrollY) && scrollY > 0) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
      });
    }
    restoredScrollRef.current = true;
  }, [loadingMy, loadingDiscover, scopedUiKey]);

  return {
    activeTab,
    setActiveTab,
    myItems,
    loadingMy,
    updatingItemId,
    discover,
    discoverCount,
    discoverPage,
    discoverTotalPages,
    pageSize,
    loadingDiscover,
    filtersDraft,
    setFiltersDraft,
    filters,
    filtersOpen,
    setFiltersOpen,
    searchQuery,
    setSearchQuery,
    status,
    statusAction,
    draggingItemId,
    dropTargetItemId,
    actionMenu,
    accountPlanLabel,
    accountPlanCode,
    universityUsage,
    hasUniversityLimit,
    universityLimitMessage,
    universityLimitReachedLabel: getUniversityLimitReachedLabel(locale),
    myUniversityIds,
    activeFiltersCount,
    setActionMenu,
    loadDiscover,
    patchMyUniversity,
    beginPointerDrag,
    openActionMenu,
    removeFromMyList,
    addToMyList,
    setPageSizeAndPersist,
    setChanceBandFilter,
    resetFilters,
    applyFilters,
  };
}
