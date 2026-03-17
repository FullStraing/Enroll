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
  onToggle: (task: TaskItem) => void;
};

export function TaskSection({
  title,
  description,
  tasks,
  emptyText,
  savingTaskId,
  onToggle,
}: TaskSectionProps) {
  return (
    <Card className="shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        <div className="rounded-full border border-black/10 bg-[#F5F8FC] px-3 py-1 text-sm font-semibold text-black/65">
          {tasks.length}
        </div>
      </div>

      <div className="mt-4">
        {tasks.length ? (
          tasks.map((task) => (
            <TaskRow key={task.id} task={task} saving={savingTaskId === task.id} onToggle={onToggle} />
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-black/10 bg-black/[0.02] px-4 py-6 text-sm text-black/50">
            {emptyText}
          </p>
        )}
      </div>
    </Card>
  );
}
