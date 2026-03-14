"use client";

import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, GripVertical, MoreVertical } from "lucide-react";
import { ACTION_MENU_GAP } from "@/app/universities/constants";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_OPTIONS } from "@/app/universities/constants";
import type { ActionMenuState, StudentUniversity } from "@/app/universities/types";
import { getNetCostValue, money, rowStatusTone, statusSelectTone, sumKnown } from "@/app/universities/utils";
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
            <th className="px-2 py-2 font-semibold">App Fee</th>
            <th className="px-2 py-2 font-semibold">Deadline</th>
            <th className="px-2 py-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
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
                  <span>{item.university.name}</span>
                </div>
              </td>
              <td className="px-2 py-3">
                <div className="relative inline-block">
                  <select
                    value={item.category}
                    onChange={(event) => onUpdateCategory(item.id, event.target.value as StudentUniversity["category"])}
                    className="h-10 appearance-none rounded-xl border-2 border-black bg-[#DAF5F0] px-3 pr-9 text-sm font-semibold text-black shadow-[0_2px_0_#000]"
                    disabled={updatingItemId === item.id}
                  >
                    <option value="reach">Reach</option>
                    <option value="target">Target</option>
                    <option value="safety">Safety</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-black/70" />
                </div>
              </td>
              <td className="px-2 py-3">
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
              </td>
              <td className="px-2 py-3">{item.university.acceptance_rate != null ? `${item.university.acceptance_rate}%` : "N/A"}</td>
              <td className="px-2 py-3">{money(item.university.tuition_out_state)}</td>
              <td className="px-2 py-3">{money(item.university.aid_package)}</td>
              <td className="px-2 py-3">{money(getNetCostValue(item.university))}</td>
              <td className="px-2 py-3">{money(item.university.application_fee)}</td>
              <td className="px-2 py-3">{formatDateShort(item.university.main_deadline)}</td>
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
