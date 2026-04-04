"use client";

import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, GripVertical, MoreVertical, SlidersHorizontal } from "lucide-react";
import {
  ACTION_MENU_GAP,
  MY_UNIVERSITIES_DEFAULT_COLUMNS,
  MY_UNIVERSITIES_SORT_KEY,
  MY_UNIVERSITIES_VISIBLE_COLUMNS_KEY,
} from "@/app/universities/constants";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UniversityLogo } from "@/components/universities/university-logo";
import { STATUS_OPTIONS } from "@/app/universities/constants";
import type { ActionMenuState, MyUniversitiesColumnId, MyUniversitiesSortId, StudentUniversity } from "@/app/universities/types";
import { categoryLabelForLocale, categorySelectToneClass, getNetCostValue, money, rowStatusTone, statusSelectTone, sumKnown } from "@/app/universities/utils";
import { formatDateShort } from "@/lib/date-format";
import { useLocale } from "@/components/locale-provider";
import { getProductCopy } from "@/lib/product-copy";

type MyUniversitiesTableProps = {
  loading: boolean;
  items: StudentUniversity[];
  updatingItemId: number | null;
  draggingItemId: number | null;
  dropTargetItemId: number | null;
  actionMenu: ActionMenuState | null;
  onStartDiscover: () => void;
  onBeginDrag: (event: ReactPointerEvent, itemId: number) => void;
  onUpdateCategory: (itemId: number, category: StudentUniversity["category"]) => void;
  onUpdateStatus: (itemId: number, status: StudentUniversity["status"]) => void;
  onOpenActionMenu: (event: ReactMouseEvent<HTMLButtonElement>, itemId: number) => void;
  onOpenUniversity: (universityId: number) => void;
  onRemove: (item: StudentUniversity) => void;
};

type ActionMenuPopupProps = {
  anchorRect: ActionMenuState["anchorRect"];
  children: ReactNode;
};

type TableSettingsPopupProps = {
  anchorRect: DOMRect;
  children: ReactNode;
};

type TableSettingsSection = "columns" | "sort";
type SortDirection = "asc" | "desc";
type SortState = {
  column: MyUniversitiesSortId;
  direction: SortDirection;
};

type ColumnDefinition = {
  id: MyUniversitiesColumnId;
  label: string;
  header: string;
  renderCell?: (item: StudentUniversity) => ReactNode;
};

type SortDefinition = {
  id: MyUniversitiesSortId;
  label: string;
  getValue: (item: StudentUniversity) => string | number | null;
};

const CATEGORY_SORT_ORDER: Record<StudentUniversity["category"], number> = {
  high_reach: 0,
  reach: 1,
  target: 2,
  likely: 3,
  safety: 4,
};

const DEFAULT_SORT_STATE: SortState = {
  column: "deadline",
  direction: "asc",
};

const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  {
    id: "category",
    label: "Category",
    header: "Category",
  },
  {
    id: "status",
    label: "Status",
    header: "Status",
  },
  {
    id: "acceptance",
    label: "Acceptance rate",
    header: "Acceptance",
    renderCell: (item) => (item.university.acceptance_rate != null ? `${item.university.acceptance_rate}%` : "N/A"),
  },
  {
    id: "sat",
    label: "SAT",
    header: "SAT",
    renderCell: (item) => item.university.sat_range || "N/A",
  },
  {
    id: "tuition",
    label: "Tuition",
    header: "Tuition",
    renderCell: (item) => money(item.university.tuition_out_state),
  },
  {
    id: "scholarship",
    label: "Scholarship",
    header: "Scholarship",
    renderCell: (item) => money(item.university.aid_package),
  },
  {
    id: "netCost",
    label: "Net cost",
    header: "Net Cost",
    renderCell: (item) => money(getNetCostValue(item.university)),
  },
  {
    id: "appFee",
    label: "App fee",
    header: "App Fee",
    renderCell: (item) => money(item.university.application_fee),
  },
  {
    id: "deadline",
    label: "Deadline",
    header: "Deadline",
    renderCell: (item) => formatDateShort(item.university.main_deadline),
  },
];

function getSatSortValue(item: StudentUniversity): number | null {
  const raw = item.university.sat_range;
  if (!raw) return null;
  const numbers = raw.match(/\d+/g)?.map((value) => Number(value)).filter((value) => Number.isFinite(value)) ?? [];
  if (numbers.length === 0) return null;
  if (numbers.length === 1) return numbers[0];
  return (numbers[0] + numbers[1]) / 2;
}

const SORT_DEFINITIONS: SortDefinition[] = [
  {
    id: "university",
    label: "University",
    getValue: (item) => item.university.name,
  },
  {
    id: "category",
    label: "Category",
    getValue: (item) => CATEGORY_SORT_ORDER[item.category],
  },
  {
    id: "status",
    label: "Status",
    getValue: (item) => item.status,
  },
  {
    id: "acceptance",
    label: "Acceptance rate",
    getValue: (item) => item.university.acceptance_rate ?? null,
  },
  {
    id: "sat",
    label: "SAT",
    getValue: (item) => getSatSortValue(item),
  },
  {
    id: "tuition",
    label: "Tuition",
    getValue: (item) => item.university.tuition_out_state ?? null,
  },
  {
    id: "scholarship",
    label: "Scholarship",
    getValue: (item) => item.university.aid_package ?? null,
  },
  {
    id: "netCost",
    label: "Net cost",
    getValue: (item) => getNetCostValue(item.university),
  },
  {
    id: "appFee",
    label: "App fee",
    getValue: (item) => item.university.application_fee ?? null,
  },
  {
    id: "deadline",
    label: "Deadline",
    getValue: (item) => item.university.main_deadline ?? null,
  },
];

function compareSortValues(left: string | number | null, right: string | number | null, direction: SortDirection): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;

  let result = 0;
  if (typeof left === "number" && typeof right === "number") {
    result = left - right;
  } else {
    result = String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
  }

  return direction === "asc" ? result : -result;
}

function loadStoredVisibleColumns(): MyUniversitiesColumnId[] {
  if (typeof window === "undefined") return MY_UNIVERSITIES_DEFAULT_COLUMNS;

  const raw = window.localStorage.getItem(MY_UNIVERSITIES_VISIBLE_COLUMNS_KEY);
  if (!raw) return MY_UNIVERSITIES_DEFAULT_COLUMNS;

  try {
    const parsed = JSON.parse(raw) as MyUniversitiesColumnId[];
    const allowed = new Set(COLUMN_DEFINITIONS.map((column) => column.id));
    const normalized = parsed.filter((value) => allowed.has(value));
    if (normalized.length) {
      return COLUMN_DEFINITIONS.map((column) => column.id).filter((id) => normalized.includes(id));
    }
  } catch {
    // Ignore invalid user preference payload.
  }

  return MY_UNIVERSITIES_DEFAULT_COLUMNS;
}

function loadStoredSortState(): SortState {
  if (typeof window === "undefined") return DEFAULT_SORT_STATE;

  const raw = window.localStorage.getItem(MY_UNIVERSITIES_SORT_KEY);
  if (!raw) return DEFAULT_SORT_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<SortState>;
    const allowed = new Set(SORT_DEFINITIONS.map((definition) => definition.id));
    if (
      parsed.column &&
      allowed.has(parsed.column) &&
      (parsed.direction === "asc" || parsed.direction === "desc")
    ) {
      return { column: parsed.column, direction: parsed.direction };
    }
  } catch {
    // Ignore invalid sort preference payload.
  }

  return DEFAULT_SORT_STATE;
}

function ActionMenuPopup({ anchorRect, children }: ActionMenuPopupProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<CSSProperties>({
    top: anchorRect.bottom + ACTION_MENU_GAP,
    left: anchorRect.right,
    visibility: "hidden",
  });

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const left = Math.min(
      Math.max(ACTION_MENU_GAP, anchorRect.right - menuWidth),
      viewportWidth - menuWidth - ACTION_MENU_GAP,
    );

    const fitsBelow = anchorRect.bottom + ACTION_MENU_GAP + menuHeight <= viewportHeight - ACTION_MENU_GAP;
    const top = fitsBelow
      ? anchorRect.bottom + ACTION_MENU_GAP
      : Math.max(ACTION_MENU_GAP, anchorRect.top - menuHeight - ACTION_MENU_GAP);

    setPosition({ top, left, visibility: "visible" });
  }, [anchorRect]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 w-52 rounded-xl border-2 border-black bg-white p-1 shadow-[0_4px_0_#000]"
      style={position}
    >
      {children}
    </div>,
    document.body,
  );
}

function TableSettingsPopup({ anchorRect, children }: TableSettingsPopupProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<CSSProperties>({
    top: anchorRect.bottom + 12,
    left: anchorRect.right,
    visibility: "hidden",
    width: "min(360px, calc(100vw - 24px))",
  });

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportPadding = 12;
    const gap = 12;
    const panelWidth = Math.min(360, viewportWidth - viewportPadding * 2);
    const panelHeight = Math.min(panel.scrollHeight, Math.max(320, viewportHeight - viewportPadding * 2));

    const left = Math.min(
      Math.max(viewportPadding, anchorRect.right - panelWidth),
      viewportWidth - panelWidth - viewportPadding,
    );

    const spaceBelow = viewportHeight - anchorRect.bottom - gap - viewportPadding;
    const spaceAbove = anchorRect.top - gap - viewportPadding;
    const fitsBelow = spaceBelow >= Math.min(panelHeight, 420);
    const top = fitsBelow || spaceBelow >= spaceAbove
      ? Math.max(viewportPadding, anchorRect.bottom + gap)
      : Math.max(viewportPadding, anchorRect.top - panelHeight - gap);

    setPosition({
      top,
      left,
      width: panelWidth,
      maxHeight: viewportHeight - viewportPadding * 2,
      visibility: "visible",
    });
  }, [anchorRect]);

  return createPortal(
    <div
      ref={panelRef}
      data-table-settings-panel
      className="surface-panel fixed z-50 flex flex-col overflow-hidden rounded-[24px] p-3 shadow-[0_18px_48px_rgba(0,0,0,0.12)]"
      style={position}
    >
      {children}
    </div>,
    document.body,
  );
}

export function MyUniversitiesTable({
  loading,
  items,
  updatingItemId,
  draggingItemId,
  dropTargetItemId,
  actionMenu,
  onStartDiscover,
  onBeginDrag,
  onUpdateCategory,
  onUpdateStatus,
  onOpenActionMenu,
  onOpenUniversity,
  onRemove,
}: MyUniversitiesTableProps) {
  const { locale } = useLocale();
  const copy = getProductCopy(locale).universities;
  const appFeeSummary = sumKnown(items.map((item) => item.university.application_fee));
  const [tableSettingsOpen, setTableSettingsOpen] = useState(false);
  const [tableSettingsSection, setTableSettingsSection] = useState<TableSettingsSection>("columns");
  const [visibleColumns, setVisibleColumns] = useState<MyUniversitiesColumnId[]>(loadStoredVisibleColumns);
  const [sortState, setSortState] = useState<SortState>(loadStoredSortState);
  const tableSettingsRef = useRef<HTMLDivElement | null>(null);
  const tableSettingsAnchorRef = useRef<HTMLDivElement | null>(null);
  const [tableSettingsAnchorRect, setTableSettingsAnchorRect] = useState<DOMRect | null>(null);
  const statusLabels: Record<StudentUniversity["status"], string> =
    locale === "ru"
      ? {
          planning: "Планирование",
          preparing: "Подготовка",
          applying: "Подача",
          submitted: "Отправлено",
          admitted: "Зачислен",
          rejected: "Отказ",
        }
      : {
          planning: "Planning",
          preparing: "Preparing",
          applying: "Applying",
          submitted: "Submitted",
          admitted: "Admitted",
          rejected: "Rejected",
        };

  const localizedColumns = useMemo<ColumnDefinition[]>(() => {
    return COLUMN_DEFINITIONS.map((column) => {
      switch (column.id) {
        case "category":
          return { ...column, label: locale === "ru" ? "Категория" : "Category", header: locale === "ru" ? "Категория" : "Category" };
        case "status":
          return { ...column, label: locale === "ru" ? "Статус" : "Status", header: locale === "ru" ? "Статус" : "Status" };
        case "acceptance":
          return { ...column, label: locale === "ru" ? "Шанс поступления" : "Acceptance rate", header: locale === "ru" ? "Шанс" : "Acceptance" };
        case "sat":
          return { ...column, label: "SAT", header: "SAT" };
        case "tuition":
          return { ...column, label: locale === "ru" ? "Стоимость" : "Tuition", header: locale === "ru" ? "Стоимость" : "Tuition" };
        case "scholarship":
          return { ...column, label: locale === "ru" ? "Стипендия" : "Scholarship", header: locale === "ru" ? "Стипендия" : "Scholarship" };
        case "netCost":
          return { ...column, label: locale === "ru" ? "Net cost" : "Net cost", header: locale === "ru" ? "Net cost" : "Net cost" };
        case "appFee":
          return { ...column, label: locale === "ru" ? "Сбор" : "App fee", header: locale === "ru" ? "Сбор" : "App fee" };
        case "deadline":
          return { ...column, label: locale === "ru" ? "Дедлайн" : "Deadline", header: locale === "ru" ? "Дедлайн" : "Deadline" };
        default:
          return column;
      }
    });
  }, [locale]);

  const localizedSortDefinitions = useMemo<SortDefinition[]>(() => {
    return SORT_DEFINITIONS.map((definition) => {
      switch (definition.id) {
        case "university":
          return { ...definition, label: copy.university };
        case "category":
          return { ...definition, label: locale === "ru" ? "Категория" : "Category" };
        case "status":
          return { ...definition, label: locale === "ru" ? "Статус" : "Status" };
        case "acceptance":
          return { ...definition, label: locale === "ru" ? "Шанс поступления" : "Acceptance rate" };
        case "sat":
          return { ...definition, label: "SAT" };
        case "tuition":
          return { ...definition, label: locale === "ru" ? "Стоимость" : "Tuition" };
        case "scholarship":
          return { ...definition, label: locale === "ru" ? "Стипендия" : "Scholarship" };
        case "netCost":
          return { ...definition, label: locale === "ru" ? "Net cost" : "Net cost" };
        case "appFee":
          return { ...definition, label: locale === "ru" ? "Сбор" : "App fee" };
        case "deadline":
          return { ...definition, label: locale === "ru" ? "Дедлайн" : "Deadline" };
        default:
          return definition;
      }
    });
  }, [copy.university, locale]);

  const activeColumns = useMemo(() => {
    const visibleSet = new Set(visibleColumns);
    return localizedColumns.filter((column) => visibleSet.has(column.id));
  }, [localizedColumns, visibleColumns]);

  const sortedItems = useMemo(() => {
    const sortDefinition = localizedSortDefinitions.find((definition) => definition.id === sortState.column);
    if (!sortDefinition) return items;

    return [...items].sort((left, right) => {
      const valueResult = compareSortValues(
        sortDefinition.getValue(left),
        sortDefinition.getValue(right),
        sortState.direction,
      );
      if (valueResult !== 0) return valueResult;
      return left.sort_order - right.sort_order;
    });
  }, [items, localizedSortDefinitions, sortState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MY_UNIVERSITIES_VISIBLE_COLUMNS_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MY_UNIVERSITIES_SORT_KEY, JSON.stringify(sortState));
  }, [sortState]);

  useEffect(() => {
    if (!tableSettingsOpen) return;

    const syncAnchorRect = () => {
      if (!tableSettingsAnchorRef.current) return;
      setTableSettingsAnchorRect(tableSettingsAnchorRef.current.getBoundingClientRect());
    };

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (tableSettingsRef.current?.contains(target) || target?.closest("[data-table-settings-panel]")) return;
      setTableSettingsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTableSettingsOpen(false);
      }
    };

    syncAnchorRect();
    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", syncAnchorRect);
    window.addEventListener("scroll", syncAnchorRect, true);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", syncAnchorRect);
      window.removeEventListener("scroll", syncAnchorRect, true);
    };
  }, [tableSettingsOpen]);

  function toggleColumn(columnId: MyUniversitiesColumnId) {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      }
      return COLUMN_DEFINITIONS.map((column) => column.id).filter((id) => id === columnId || prev.includes(id));
    });
  }

  if (loading) {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardTitle className="text-lg">{copy.emptyListTitle}</CardTitle>
        <CardDescription className="mt-2">{copy.emptyListBody}</CardDescription>
        <div className="mt-3">
          <Button size="sm" onClick={onStartDiscover}>
            {copy.openDiscover}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <div className="relative" data-table-settings-root ref={tableSettingsRef}>
          <div className="relative inline-flex" ref={tableSettingsAnchorRef}>
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              setTableSettingsAnchorRect(tableSettingsAnchorRef.current?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect());
              setTableSettingsOpen((prev) => !prev);
            }}
            className="gap-2"
            aria-expanded={tableSettingsOpen}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {copy.editTable}
          </Button>
          </div>

          {tableSettingsOpen && tableSettingsAnchorRect ? (
            <TableSettingsPopup anchorRect={tableSettingsAnchorRect}>
              <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-3">
                <div>
                  <p className="text-sm font-semibold text-black">{copy.editTable}</p>
                  <p className="text-xs text-black/55">{copy.editTableDescription}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                {(["columns", "sort"] as const).map((section) => {
                  return (
                    <button
                      key={section}
                      type="button"
                      onClick={() => setTableSettingsSection(section)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                        tableSettingsSection === section
                          ? "border-black bg-[#DAF5F0] text-black"
                          : "border-black/15 bg-white text-black/55 hover:border-black/40"
                      }`}
                    >
                      {section === "columns" ? copy.columns : copy.sort}
                    </button>
                  );
                })}
              </div>

              {tableSettingsSection === "columns" ? (
                <div className="mt-3 flex min-h-0 flex-1 flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{copy.visibleColumns}</p>
                    <button
                      type="button"
                      onClick={() => setVisibleColumns(MY_UNIVERSITIES_DEFAULT_COLUMNS)}
                      className="text-xs font-semibold text-black/55 underline underline-offset-2"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="grid min-h-0 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    {COLUMN_DEFINITIONS.map((column) => {
                      const checked = visibleColumns.includes(column.id);
                      return (
                        <label
                          key={column.id}
                          className="flex cursor-pointer items-center justify-between rounded-xl border border-black/10 px-3 py-2 transition hover:border-black/25 hover:bg-black/[0.02]"
                        >
                          <span className="text-sm font-medium text-black">{column.label}</span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border text-black transition ${
                              checked ? "border-black bg-[#DAF5F0]" : "border-black/20 bg-white"
                            }`}
                          >
                            {checked ? <Check className="h-3.5 w-3.5" /> : null}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleColumn(column.id)}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {tableSettingsSection === "sort" ? (
                <div className="mt-3 flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{copy.sortRows}</p>
                    <button
                      type="button"
                      onClick={() => setSortState(DEFAULT_SORT_STATE)}
                      className="text-xs font-semibold text-black/55 underline underline-offset-2"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(["asc", "desc"] as const).map((direction) => (
                      <button
                        key={direction}
                        type="button"
                        onClick={() => setSortState((prev) => ({ ...prev, direction }))}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                          sortState.direction === direction
                            ? "border-black bg-[#DAF5F0] text-black"
                            : "border-black/15 bg-white text-black/55 hover:border-black/40"
                        }`}
                      >
                        {direction === "asc" ? copy.ascending : copy.descending}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-2">
                    {localizedSortDefinitions.map((definition) => {
                      const checked = sortState.column === definition.id;
                      return (
                        <button
                          key={definition.id}
                          type="button"
                          onClick={() => setSortState((prev) => ({ ...prev, column: definition.id }))}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                            checked
                              ? "border-black bg-[#DAF5F0]"
                              : "border-black/10 bg-white hover:border-black/25 hover:bg-black/[0.02]"
                          }`}
                        >
                          <span className="text-sm font-medium text-black">{definition.label}</span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border text-black transition ${
                              checked ? "border-black bg-white" : "border-black/20 bg-white"
                            }`}
                          >
                            {checked ? <Check className="h-3.5 w-3.5" /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

            </TableSettingsPopup>
          ) : null}
        </div>
      </div>

      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/15 text-black/60">
            <th className="px-2 py-2 font-semibold">{copy.university}</th>
            {activeColumns.map((column) => (
              <th key={column.id} className="px-2 py-2 font-semibold">
                {column.header}
              </th>
            ))}
            <th className="px-2 py-2 font-semibold">{copy.actions}</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            <tr
              key={item.id}
              data-row-id={item.id}
              className={`border-b border-black/10 transition ${rowStatusTone(item.status)} ${
                draggingItemId === item.id
                  ? "opacity-60"
                  : dropTargetItemId === item.id && draggingItemId !== item.id
                    ? "outline outline-2 outline-cyan-500/60"
                    : ""
              }`}
            >
              <td className="px-2 py-3 font-semibold">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onPointerDown={(event) => onBeginDrag(event, item.id)}
                    className="cursor-grab rounded-md border border-black/20 bg-white px-1.5 py-1 text-black/60 active:cursor-grabbing"
                    aria-label={copy.dragLabel.replace("{name}", item.university.name)}
                    title={copy.dragTitle}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <UniversityLogo name={item.university.name} size="sm" />
                  <span>{item.university.name}</span>
                </div>
              </td>
              {activeColumns.map((column) => (
                <td key={column.id} className="px-2 py-3">
                  {column.id === "category" ? (
                    <div className="inline-block">
                      <Select
                        value={item.category}
                        onChange={(value) => onUpdateCategory(item.id, value as StudentUniversity["category"])}
                        className={`h-10 rounded-xl border-2 px-3 py-2 text-sm font-semibold text-black shadow-[0_2px_0_#000] ${categorySelectToneClass(item.category)}`}
                        disabled={updatingItemId === item.id}
                        options={[
                          { value: "high_reach", label: categoryLabelForLocale("high_reach", locale) },
                          { value: "reach", label: categoryLabelForLocale("reach", locale) },
                          { value: "target", label: categoryLabelForLocale("target", locale) },
                          { value: "likely", label: categoryLabelForLocale("likely", locale) },
                          { value: "safety", label: categoryLabelForLocale("safety", locale) },
                        ]}
                        ariaLabel={`${copy.columns}: ${item.university.name}`}
                      />
                    </div>
                  ) : column.id === "status" ? (
                    <div className="inline-block">
                      <Select
                        value={item.status}
                        onChange={(value) => onUpdateStatus(item.id, value as StudentUniversity["status"])}
                        className={`h-10 rounded-xl border-2 px-3 py-2 text-sm font-semibold text-black shadow-[0_2px_0_#000] ${statusSelectTone(item.status)}`}
                        disabled={updatingItemId === item.id}
                        options={STATUS_OPTIONS.map((statusOption) => ({ value: statusOption.value, label: statusLabels[statusOption.value] }))}
                        ariaLabel={`${copy.sort}: ${item.university.name}`}
                      />
                    </div>
                  ) : (
                    column.renderCell?.(item)
                  )}
                </td>
              ))}
              <td className="px-2 py-3">
                <div className="relative inline-block" data-actions-menu-root>
                  <Button size="sm" variant="outline" onClick={(event) => onOpenActionMenu(event, item.id)} aria-label={copy.openActions}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  {actionMenu?.itemId === item.id ? (
                    <ActionMenuPopup anchorRect={actionMenu.anchorRect}>
                      <button
                        type="button"
                        onClick={() => onOpenUniversity(item.university.id)}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5"
                      >
                        {copy.openUniversityPage}
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenUniversity(item.university.id)}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5"
                      >
                        {copy.editDetails}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(item)}
                        disabled={updatingItemId === item.id}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      >
                        {copy.removeFromList}
                      </button>
                    </ActionMenuPopup>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid gap-3 md:grid-cols-1">
        <div className="surface-card rounded-2xl px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">{copy.applicationFees}</p>
          <p className="mt-2 text-2xl font-black text-black">{money(appFeeSummary.total)}</p>
          <p className="mt-1 text-xs text-black/55">
            {appFeeSummary.missing
              ? copy.applicationFeesMissing.replace("{count}", String(appFeeSummary.missing))
              : copy.applicationFeesAll.replace("{count}", String(appFeeSummary.known))}
          </p>
        </div>
      </div>
    </div>
  );
}
