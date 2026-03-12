"use client";

import { type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronDown, GripVertical, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_OPTIONS } from "@/app/universities/constants";
import type { ActionMenuState, StudentUniversity } from "@/app/universities/types";
import { getNetCostValue, money, rowStatusTone, statusSelectTone } from "@/app/universities/utils";
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
            <td className="px-2 py-3">{formatDateShort(item.university.main_deadline)}</td>
            <td className="px-2 py-3">
              <div className="relative inline-block" data-actions-menu-root>
                <Button size="sm" variant="outline" onClick={(event) => onOpenActionMenu(event, item.id)} aria-label="Open actions">
                  <MoreVertical className="h-4 w-4" />
                </Button>
                {actionMenu?.itemId === item.id ? (
                  <div
                    className="fixed z-50 w-52 rounded-xl border-2 border-black bg-white p-1 shadow-[0_4px_0_#000]"
                    style={{ top: actionMenu.top, left: actionMenu.left }}
                  >
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
                  </div>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
