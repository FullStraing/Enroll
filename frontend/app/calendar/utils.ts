import { formatDateShortNoYear, parseDateInput } from "@/lib/date-format";
import type { DuePreset, TaskItem } from "./types";

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, amount: number): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function getTodayIso(): string {
  return toIsoDate(new Date());
}

export function resolveDueDate(preset: DuePreset, customDate: string): string | null {
  if (preset === "tomorrow") return toIsoDate(addDays(new Date(), 1));
  if (preset === "custom") return customDate || getTodayIso();
  return getTodayIso();
}

export function buildTaskUpdatePayload(task: TaskItem, patch: Partial<TaskItem>): Record<string, unknown> {
  const next = { ...task, ...patch };
  return {
    title: next.title,
    description: next.description,
    due_date: next.due_date,
    status: next.status,
    priority: next.priority,
    roadmap_stage_id: next.roadmap_stage?.id ?? null,
    application_id: next.application?.id ?? null,
  };
}

export function taskSortValue(task: TaskItem): number {
  if (!task.due_date) return Number.MAX_SAFE_INTEGER;
  return parseDateInput(task.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

export function formatTaskDueLabel(task: TaskItem): string | null {
  if (!task.due_date) return null;
  const today = getTodayIso();
  const tomorrow = toIsoDate(addDays(new Date(), 1));

  if (task.due_date < today) return `Overdue · ${formatDateShortNoYear(task.due_date)}`;
  if (task.due_date === today) return "Today";
  if (task.due_date === tomorrow) return "Tomorrow";
  return formatDateShortNoYear(task.due_date);
}

export function formatCompletedTaskLabel(task: TaskItem): string | null {
  if (task.completed_at) {
    return `Done · ${formatDateShortNoYear(task.completed_at)}`;
  }
  if (task.due_date) {
    return `Done · ${formatDateShortNoYear(task.due_date)}`;
  }
  return "Done";
}

export function getTaskLists(tasks: TaskItem[]) {
  const today = getTodayIso();

  const active = tasks.filter((task) => task.status !== "done");
  const completedTasks = tasks
    .filter((task) => task.status === "done")
    .sort((left, right) => {
      const leftValue = parseDateInput(left.completed_at)?.getTime() ?? left.id;
      const rightValue = parseDateInput(right.completed_at)?.getTime() ?? right.id;
      return rightValue - leftValue;
    });

  const todayTasks = active
    .filter((task) => Boolean(task.due_date) && (task.due_date as string) <= today)
    .sort((left, right) => taskSortValue(left) - taskSortValue(right));

  const upcomingTasks = active
    .filter((task) => Boolean(task.due_date) && (task.due_date as string) > today)
    .sort((left, right) => taskSortValue(left) - taskSortValue(right));

  const inboxTasks = active
    .filter((task) => !task.due_date)
    .sort((left, right) => right.id - left.id);

  return { todayTasks, upcomingTasks, inboxTasks, completedTasks };
}
