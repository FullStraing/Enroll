"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { TaskItem } from "@/app/calendar/types";
import { TaskRow } from "@/components/calendar/task-row";

type TaskSectionProps = {
  title: string;
  description: string;
  tasks: TaskItem[];
  emptyText: string;
  savingTaskId: number | null;
  completingTaskId: number | null;
  onToggle: (task: TaskItem) => void;
  bodyClassName?: string;
};

export function TaskSection({
  title,
  description,
  tasks,
  emptyText,
  savingTaskId,
  completingTaskId,
  onToggle,
  bodyClassName,
}: TaskSectionProps) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        <div className="rounded-full border border-black/10 bg-[#F5F8FC] px-3 py-1 text-sm font-semibold text-black/65">
          {tasks.length}
        </div>
      </div>

      <div className={`task-section-scroll mt-4 min-h-0 flex-1 overflow-y-auto pr-1 ${bodyClassName ?? "max-h-[360px]"}`}>
        {tasks.length ? (
          <div className="space-y-0">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                saving={savingTaskId === task.id}
                completing={completingTaskId === task.id}
                completionLocked={completingTaskId !== null && completingTaskId !== task.id}
                onToggle={onToggle}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-black/10 bg-black/[0.02] px-4 py-6 text-sm text-black/50">
            {emptyText}
          </p>
        )}
      </div>
    </Card>
  );
}
