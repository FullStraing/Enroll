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
import { Check, ChevronDown, GripVertical, MoreVertical, SlidersHorizontal } from "lucide-react";
import {
  ACTION_MENU_GAP,
  MY_UNIVERSITIES_DEFAULT_COLUMNS,
  MY_UNIVERSITIES_SORT_KEY,
  MY_UNIVERSITIES_VISIBLE_COLUMNS_KEY,
} from "@/app/universities/constants";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UniversityLogo } from "@/components/universities/university-logo";
import { STATUS_OPTIONS } from "@/app/universities/constants";
import type { ActionMenuState, MyUniversitiesColumnId, MyUniversitiesSortId, StudentUniversity } from "@/app/universities/types";
import { categorySelectToneClass, getNetCostValue, money, rowStatusTone, statusSelectTone, sumKnown } from "@/app/universities/utils";
import { formatDateShort } from "@/lib/date-format";

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

type TableSettingsSection = "columns" | "filters" | "sort";
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
    getValue: (item) => item.category,
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
  const appFeeSummary = sumKnown(items.map((item) => item.university.application_fee));
  const [tableSettingsOpen, setTableSettingsOpen] = useState(false);
  const [tableSettingsSection, setTableSettingsSection] = useState<TableSettingsSection>("columns");
  const [visibleColumns, setVisibleColumns] = useState<MyUniversitiesColumnId[]>(MY_UNIVERSITIES_DEFAULT_COLUMNS);
  const [sortState, setSortState] = useState<SortState>({ column: "deadline", direction: "asc" });
  const tableSettingsRef = useRef<HTMLDivElement | null>(null);

  const activeColumns = useMemo(() => {
    const visibleSet = new Set(visibleColumns);
    return COLUMN_DEFINITIONS.filter((column) => visibleSet.has(column.id));
  }, [visibleColumns]);

  const sortedItems = useMemo(() => {
    const sortDefinition = SORT_DEFINITIONS.find((definition) => definition.id === sortState.column);
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
  }, [items, sortState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(MY_UNIVERSITIES_VISIBLE_COLUMNS_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as MyUniversitiesColumnId[];
      const allowed = new Set(COLUMN_DEFINITIONS.map((column) => column.id));
      const normalized = parsed.filter((value) => allowed.has(value));
      if (normalized.length) {
        setVisibleColumns(COLUMN_DEFINITIONS.map((column) => column.id).filter((id) => normalized.includes(id)));
      }
    } catch {
      // Ignore invalid user preference payload.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MY_UNIVERSITIES_VISIBLE_COLUMNS_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(MY_UNIVERSITIES_SORT_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<SortState>;
      const allowed = new Set(SORT_DEFINITIONS.map((definition) => definition.id));
      if (
        parsed.column &&
        allowed.has(parsed.column) &&
        (parsed.direction === "asc" || parsed.direction === "desc")
      ) {
        setSortState({ column: parsed.column, direction: parsed.direction });
      }
    } catch {
      // Ignore invalid sort preference payload.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MY_UNIVERSITIES_SORT_KEY, JSON.stringify(sortState));
  }, [sortState]);

  useEffect(() => {
    if (!tableSettingsOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (tableSettingsRef.current?.contains(target)) return;
      setTableSettingsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTableSettingsOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
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
      <Card className="shadow-none">
        <CardTitle className="text-lg">My list is empty</CardTitle>
        <CardDescription className="mt-2">Find universities in the Discover tab and add them to your list.</CardDescription>
        <div className="mt-3">
          <Button size="sm" onClick={onStartDiscover}>
            Start building your university list
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <div className="relative" data-table-settings-root ref={tableSettingsRef}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTableSettingsOpen((prev) => !prev)}
            className="gap-2"
            aria-expanded={tableSettingsOpen}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Edit table
          </Button>

          {tableSettingsOpen ? (
            <div className="absolute right-0 top-[calc(100%+12px)] z-20 w-[320px] rounded-2xl border-2 border-black bg-white p-3 shadow-[0_6px_0_#000]">
              <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-3">
                <div>
                  <p className="text-sm font-semibold text-black">Edit table</p>
                  <p className="text-xs text-black/55">Control how your university list is displayed.</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                {(["columns", "filters", "sort"] as const).map((section) => {
                  const disabled = section === "filters";
                  return (
                    <button
                      key={section}
                      type="button"
                      disabled={disabled}
                      onClick={() => setTableSettingsSection(section)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                        tableSettingsSection === section
                          ? "border-black bg-[#DAF5F0] text-black"
                          : "border-black/15 bg-white text-black/55"
                      } ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-black/40"}`}
                    >
                      {section === "columns" ? "Columns" : section === "filters" ? "Filters" : "Sort"}
                    </button>
                  );
                })}
              </div>

              {tableSettingsSection === "columns" ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Visible columns</p>
                    <button
                      type="button"
                      onClick={() => setVisibleColumns(MY_UNIVERSITIES_DEFAULT_COLUMNS)}
                      className="text-xs font-semibold text-black/55 underline underline-offset-2"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="grid gap-2">
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
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Sort rows</p>
                    <button
                      type="button"
                      onClick={() => setSortState({ column: "deadline", direction: "asc" })}
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
                        {direction === "asc" ? "Ascending" : "Descending"}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-2">
                    {SORT_DEFINITIONS.map((definition) => {
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

              {tableSettingsSection === "filters" ? (
                <div className="mt-3 rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-3 py-2 text-xs text-black/55">
                  Filters will be added here next, inside the same control.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/15 text-black/60">
            <th className="px-2 py-2 font-semibold">University</th>
            {activeColumns.map((column) => (
              <th key={column.id} className="px-2 py-2 font-semibold">
                {column.header}
              </th>
            ))}
            <th className="px-2 py-2 font-semibold">Actions</th>
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
                    aria-label={`Drag ${item.university.name}`}
                    title="Drag to reorder"
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
                    <div className="relative inline-block">
                      <select
                        value={item.category}
                        onChange={(event) => onUpdateCategory(item.id, event.target.value as StudentUniversity["category"])}
                        className={`h-10 appearance-none rounded-xl border-2 px-3 pr-9 text-sm font-semibold text-black shadow-[0_2px_0_#000] ${categorySelectToneClass(item.category)}`}
                        disabled={updatingItemId === item.id}
                      >
                        <option value="high_reach">High Reach</option>
                        <option value="reach">Reach</option>
                        <option value="target">Target</option>
                        <option value="likely">Likely</option>
                        <option value="safety">Safety</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-black/70" />
                    </div>
                  ) : column.id === "status" ? (
                    <div className="relative inline-block">
                      <select
                        value={item.status}
                        onChange={(event) => onUpdateStatus(item.id, event.target.value as StudentUniversity["status"])}
                        className={`h-10 appearance-none rounded-xl border-2 px-3 pr-9 text-sm font-semibold text-black shadow-[0_2px_0_#000] ${statusSelectTone(item.status)}`}
                        disabled={updatingItemId === item.id}
                      >
                        {STATUS_OPTIONS.map((statusOption) => (
                          <option key={statusOption.value} value={statusOption.value}>
                            {statusOption.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-black/70" />
                    </div>
                  ) : (
                    column.renderCell?.(item)
                  )}
                </td>
              ))}
              <td className="px-2 py-3">
                <div className="relative inline-block" data-actions-menu-root>
                  <Button size="sm" variant="outline" onClick={(event) => onOpenActionMenu(event, item.id)} aria-label="Open actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  {actionMenu?.itemId === item.id ? (
                    <ActionMenuPopup anchorRect={actionMenu.anchorRect}>
                      <button
                        type="button"
                        onClick={() => onOpenUniversity(item.university.id)}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5"
                      >
                        Open university page
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenUniversity(item.university.id)}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5"
                      >
                        Edit details
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(item)}
                        disabled={updatingItemId === item.id}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      >
                        Remove from list
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
        <div className="rounded-2xl border border-black/15 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">Application Fees</p>
          <p className="mt-2 text-2xl font-black text-black">{money(appFeeSummary.total)}</p>
          <p className="mt-1 text-xs text-black/55">
            {appFeeSummary.missing ? `N/A for ${appFeeSummary.missing} universities` : `All ${appFeeSummary.known} universities included`}
          </p>
        </div>
      </div>
    </div>
  );
}
