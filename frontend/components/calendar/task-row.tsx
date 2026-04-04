"use client";

import Lottie from "lottie-react";
import { Circle, CircleCheckBig } from "lucide-react";
import type { TaskItem } from "@/app/calendar/types";
import { formatCompletedTaskLabel, formatTaskDueLabel } from "@/app/calendar/utils";
import checkboxAnimation from "@/public/animations/checkbox-animation.json";

type TaskRowProps = {
  task: TaskItem;
  saving: boolean;
  completing: boolean;
  completionLocked: boolean;
  onToggle: (task: TaskItem) => void;
};

export function TaskRow({ task, saving, completing, completionLocked, onToggle }: TaskRowProps) {
  const isDone = task.status === "done";
  const metaLabel = isDone ? formatCompletedTaskLabel(task) : formatTaskDueLabel(task);

  function handleToggle() {
    if (saving || completing || completionLocked) return;
    onToggle(task);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving || completing || completionLocked}
      className={`flex w-full items-start gap-3 border-b border-[var(--enroll-surface-border)] py-3 text-left transition last:border-b-0 hover:bg-[color-mix(in_srgb,var(--enroll-fg)_3%,transparent)] disabled:opacity-50 ${isDone ? "opacity-60" : ""} ${completing ? "task-row-completing bg-[color-mix(in_srgb,var(--enroll-cyan)_22%,transparent)]" : ""}`}
      aria-label={isDone ? `Mark ${task.title} as not completed` : `Mark ${task.title} as completed`}
    >
      <span className={`relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-visible rounded-full text-[var(--enroll-muted)] transition ${completing ? "task-row-icon" : ""}`}>
        {completing ? (
          <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-visible">
            <Lottie
              animationData={checkboxAnimation}
              autoplay
              loop={false}
              initialSegment={[4, 25]}
              className="h-16 w-16 scale-[1.6]"
            />
          </span>
        ) : isDone ? (
          <CircleCheckBig className="h-7 w-7 text-[#63CDB8]" />
        ) : (
          <Circle className="h-7 w-7" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block text-base font-semibold text-[var(--enroll-fg)] ${isDone ? "line-through" : ""} ${completing ? "task-row-title" : ""}`}>
          {task.title}
        </span>
        <span className={`mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--enroll-muted)] ${completing ? "task-row-meta" : ""}`}>
          {metaLabel ? (
            <span className="rounded-full border border-[var(--enroll-surface-border)] bg-[color-mix(in_srgb,var(--enroll-fg)_4%,transparent)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--enroll-muted-strong)]">
              {metaLabel}
            </span>
          ) : null}
          {task.application?.university_name ? <span>{task.application.university_name}</span> : null}
        </span>
      </span>
    </button>
  );
}
