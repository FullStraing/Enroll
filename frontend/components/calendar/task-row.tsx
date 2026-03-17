"use client";

import { Circle, CircleCheckBig } from "lucide-react";
import type { TaskItem } from "@/app/calendar/types";
import { formatTaskDueLabel } from "@/app/calendar/utils";

type TaskRowProps = {
  task: TaskItem;
  saving: boolean;
  onToggle: (task: TaskItem) => void;
};

export function TaskRow({ task, saving, onToggle }: TaskRowProps) {
  const dueLabel = formatTaskDueLabel(task);
  const isDone = task.status === "done";

  return (
    <button
      type="button"
      onClick={() => onToggle(task)}
      disabled={saving}
      className={`flex w-full items-start gap-3 border-b border-black/8 py-3 text-left transition last:border-b-0 hover:bg-black/[0.02] disabled:opacity-50 ${isDone ? "opacity-60" : ""}`}
      aria-label={isDone ? `Mark ${task.title} as not completed` : `Mark ${task.title} as completed`}
    >
      <span className="mt-0.5 shrink-0 rounded-full text-black/55 transition">
        {isDone ? <CircleCheckBig className="h-5 w-5 text-[#63CDB8]" /> : <Circle className="h-5 w-5" />}
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block text-base font-semibold text-black ${isDone ? "line-through" : ""}`}>{task.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-black/55">
          {dueLabel ? (
            <span className="rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
              {dueLabel}
            </span>
          ) : null}
          {task.application?.university_name ? <span>{task.application.university_name}</span> : null}
        </span>
      </span>
    </button>
  );
}
