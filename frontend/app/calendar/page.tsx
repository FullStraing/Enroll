"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, ListTodo } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { clearSessionCaches, readSessionCache, SESSION_CACHE_KEYS, SESSION_CACHE_TTLS, writeSessionCache } from "@/lib/session-cache";
import type { ApplicationItem, DuePreset, MyUniversityItem, TaskItem } from "@/app/calendar/types";
import { buildTaskUpdatePayload, getTaskLists, resolveDueDate } from "@/app/calendar/utils";
import { QuickTaskComposer } from "@/components/calendar/quick-task-composer";
import { TaskSection } from "@/components/calendar/task-section";

type CalendarCachePayload = {
  tasks: TaskItem[];
  applications: ApplicationItem[];
  myUniversities: MyUniversityItem[];
};

function LoadingState() {
  return (
    <div className="grid gap-4">
      <Card className="shadow-none">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-3 h-12 w-full rounded-2xl" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="shadow-none">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="mt-2 h-4 w-40" />
            <Skeleton className="mt-5 h-14 w-full rounded-2xl" />
            <Skeleton className="mt-3 h-14 w-full rounded-2xl" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [myUniversities, setMyUniversities] = useState<MyUniversityItem[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [duePreset, setDuePreset] = useState<DuePreset>("today");
  const [customDueDate, setCustomDueDate] = useState("");
  const [selectedUniversityId, setSelectedUniversityId] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<number | null>(null);
  const [statusText, setStatusText] = useState("");

  async function loadWorkspace() {
    const token = getToken();
    if (!token) return;

    const { payload: cached, isFresh } = readSessionCache<CalendarCachePayload>(SESSION_CACHE_KEYS.calendar, SESSION_CACHE_TTLS.calendar);
    if (cached) {
      setTasks(cached.tasks);
      setApplications(cached.applications);
      setMyUniversities(cached.myUniversities);
      setLoading(false);
    } else {
      setLoading(true);
    }

    if (isFresh) {
      setStatusText("");
      return;
    }

    try {
      const [taskData, appData, myUniData] = await Promise.all([
        apiFetch<TaskItem[]>("/api/tasks/", { method: "GET" }, token),
        apiFetch<ApplicationItem[]>("/api/applications/", { method: "GET" }, token),
        apiFetch<MyUniversityItem[]>("/api/my-universities/", { method: "GET" }, token),
      ]);
      setTasks(taskData);
      setApplications(appData);
      setMyUniversities(myUniData);
      setStatusText("");
      writeSessionCache(SESSION_CACHE_KEYS.calendar, {
        tasks: taskData,
        applications: appData,
        myUniversities: myUniData,
      });
    } catch (error) {
      if (!cached) {
        setStatusText(error instanceof Error ? error.message : "Could not load tasks.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, []);

  useEffect(() => {
    if (loading) return;
    writeSessionCache(SESSION_CACHE_KEYS.calendar, {
      tasks,
      applications,
      myUniversities,
    });
  }, [loading, tasks, applications, myUniversities]);

  const { todayTasks, upcomingTasks, inboxTasks, completedTasks } = useMemo(() => getTaskLists(tasks), [tasks]);

  const universityOptions = useMemo(
    () =>
      myUniversities
        .filter((item) => item.university)
        .map((item) => ({
          id: item.university?.id as number,
          name: item.university?.name as string,
        })),
    [myUniversities],
  );

  async function addTask() {
    const token = getToken();
    if (!token || !taskTitle.trim()) return;

    setSaving(true);
    setStatusText("");
    try {
      const dueDate = resolveDueDate(duePreset, customDueDate);
      const payload: Record<string, unknown> = {
        title: taskTitle.trim(),
        description: "",
        due_date: dueDate,
        status: "planned",
        priority: "medium",
      };

      const universityId = selectedUniversityId === "all" ? null : Number(selectedUniversityId);
      if (universityId) {
        const relatedApplication = applications.find((item) => item.university?.id === universityId);
        if (relatedApplication) payload.application_id = relatedApplication.id;
      }

      const created = await apiFetch<TaskItem>("/api/tasks/", { method: "POST", body: JSON.stringify(payload) }, token);
      setTasks((prev) => [created, ...prev]);
      clearSessionCaches([SESSION_CACHE_KEYS.dashboard]);
      setTaskTitle("");
      setDuePreset("today");
      setCustomDueDate("");
      setSelectedUniversityId("all");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Could not add task.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: TaskItem) {
    const token = getToken();
    if (!token) return;

    const nextStatus: TaskItem["status"] = task.status === "done" ? "planned" : "done";
    setSavingTaskId(task.id);
    try {
      await apiFetch(`/api/tasks/${task.id}/`, { method: "PUT", body: JSON.stringify(buildTaskUpdatePayload(task, { status: nextStatus })) }, token);
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));
      clearSessionCaches([SESSION_CACHE_KEYS.dashboard]);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Could not update task.");
    } finally {
      setSavingTaskId(null);
    }
  }

  const openTasksCount = todayTasks.length + upcomingTasks.length + inboxTasks.length;

  return (
    <ProtectedPage>
      <AppShell title="Tasks" subtitle="Simple, fast task planning for admissions work.">
        {loading ? (
          <LoadingState />
        ) : (
          <div className="grid gap-4">
            <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-[#DAF5F0]/20 shadow-none">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.28fr)_320px]">
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.05em] text-black sm:text-4xl">Today</h2>
                  <p className="mt-2 max-w-xl text-sm text-black/60 sm:text-[15px]">
                    Add one task fast and keep your day clear.
                  </p>

                  <div className="mt-4 sm:mt-5">
                    <QuickTaskComposer
                      title={taskTitle}
                      onTitleChange={setTaskTitle}
                      duePreset={duePreset}
                      onDuePresetChange={setDuePreset}
                      customDate={customDueDate}
                      onCustomDateChange={setCustomDueDate}
                      universityId={selectedUniversityId}
                      onUniversityIdChange={setSelectedUniversityId}
                      universities={universityOptions}
                      saving={saving}
                      onSubmit={() => void addTask()}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FFF4CC]">
                        <ListTodo className="h-4 w-4 text-black/70" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Open tasks</p>
                        <p className="mt-1 text-2xl font-black text-black">{openTasksCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#DAF5F0]">
                        <Clock3 className="h-4 w-4 text-black/70" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Due today</p>
                        <p className="mt-1 text-2xl font-black text-black">{todayTasks.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#E8F4CF]">
                        <CheckCircle2 className="h-4 w-4 text-black/70" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Completed</p>
                        <p className="mt-1 text-2xl font-black text-black">{completedTasks.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <TaskSection
                title="Today"
                description="Tasks due today and anything already overdue."
                tasks={todayTasks}
                emptyText="Nothing due today. Add one important task and keep the momentum."
                savingTaskId={savingTaskId}
                onToggle={(task) => void toggleTask(task)}
                bodyClassName="max-h-[360px] xl:max-h-[390px]"
              />

              <TaskSection
                title="Upcoming"
                description="Tasks already scheduled for later."
                tasks={upcomingTasks}
                emptyText="No upcoming tasks yet."
                savingTaskId={savingTaskId}
                onToggle={(task) => void toggleTask(task)}
                bodyClassName="max-h-[360px] xl:max-h-[390px]"
              />

              <TaskSection
                title="Inbox"
                description="Tasks without a date."
                tasks={inboxTasks}
                emptyText="Your inbox is clear."
                savingTaskId={savingTaskId}
                onToggle={(task) => void toggleTask(task)}
                bodyClassName="max-h-[320px] xl:max-h-[360px]"
              />

              <TaskSection
                title="Completed"
                description="Recently finished work."
                tasks={completedTasks}
                emptyText="Completed tasks will show up here."
                savingTaskId={savingTaskId}
                onToggle={(task) => void toggleTask(task)}
                bodyClassName="max-h-[320px] xl:max-h-[360px]"
              />
            </div>

            {statusText ? (
              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/60">
                {statusText}
              </div>
            ) : null}
          </div>
        )}
      </AppShell>
    </ProtectedPage>
  );
}
