"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, ListTodo } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DeepWorkflowTheme } from "@/components/deep-workflow-theme";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import {
  clearSessionCaches,
  readSessionCache,
  SESSION_CACHE_KEYS,
  SESSION_CACHE_TTLS,
  writeSessionCache,
} from "@/lib/session-cache";
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
      <Card>
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
          <Card key={index}>
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
  const [hydrated, setHydrated] = useState(false);
  const [cacheReady, setCacheReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<number | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [statusText, setStatusText] = useState("");
  const completeTimeoutRef = useRef<number | null>(null);
  const loadRequestIdRef = useRef(0);
  const mutationVersionRef = useRef(0);
  const applicationsRef = useRef<ApplicationItem[]>([]);
  const myUniversitiesRef = useRef<MyUniversityItem[]>([]);

  useEffect(() => {
    applicationsRef.current = applications;
  }, [applications]);

  useEffect(() => {
    myUniversitiesRef.current = myUniversities;
  }, [myUniversities]);

  const invalidateWorkspaceLoads = useCallback(() => {
    loadRequestIdRef.current += 1;
    mutationVersionRef.current += 1;
  }, []);

  const persistCalendarCache = useCallback(
    (
      nextTasks: TaskItem[],
      nextApplications = applicationsRef.current,
      nextUniversities = myUniversitiesRef.current,
    ) => {
      const token = getToken();
      if (!token) return;
      writeSessionCache(
        SESSION_CACHE_KEYS.calendar,
        {
          tasks: nextTasks,
          applications: nextApplications,
          myUniversities: nextUniversities,
        },
        token,
      );
    },
    [],
  );

  const loadWorkspace = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const requestId = ++loadRequestIdRef.current;
    const mutationVersionAtStart = mutationVersionRef.current;

    const { payload: cached, isFresh } = readSessionCache<CalendarCachePayload>(SESSION_CACHE_KEYS.calendar, SESSION_CACHE_TTLS.calendar, token);
    if (cached) {
      setTasks(cached.tasks);
      setApplications(cached.applications);
      setMyUniversities(cached.myUniversities);
      setLoading(false);
      setHydrated(true);
      setCacheReady(true);
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
      if (requestId !== loadRequestIdRef.current || mutationVersionRef.current !== mutationVersionAtStart) {
        return;
      }
      setTasks(taskData);
      setApplications(appData);
      setMyUniversities(myUniData);
      setStatusText("");
      persistCalendarCache(taskData, appData, myUniData);
      setCacheReady(true);
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      if (!cached) {
        setStatusText(error instanceof Error ? error.message : "Could not load tasks.");
      }
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false);
        setHydrated(true);
      }
    }
  }, [persistCalendarCache]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    return () => {
      if (completeTimeoutRef.current) {
        window.clearTimeout(completeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (loading || !hydrated || !cacheReady) return;
    persistCalendarCache(tasks);
  }, [cacheReady, hydrated, loading, persistCalendarCache, tasks]);

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
      invalidateWorkspaceLoads();
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
      setTasks((prev) => {
        const nextTasks = [created, ...prev.filter((item) => item.id !== created.id)];
        persistCalendarCache(nextTasks);
        return nextTasks;
      });
      setHydrated(true);
      setCacheReady(true);
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
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldAnimateCompletion = task.status !== "done" && !prefersReducedMotion;
    const animationDelay = shouldAnimateCompletion ? 500 : 0;

    if (completingTaskId !== null && completingTaskId !== task.id) return;

    if (completeTimeoutRef.current) {
      window.clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }

    if (shouldAnimateCompletion) {
      setCompletingTaskId(task.id);
      await new Promise<void>((resolve) => {
        completeTimeoutRef.current = window.setTimeout(() => {
          completeTimeoutRef.current = null;
          resolve();
        }, animationDelay);
      });
    }

    setSavingTaskId(task.id);
    try {
      invalidateWorkspaceLoads();
      await apiFetch(`/api/tasks/${task.id}/`, { method: "PUT", body: JSON.stringify(buildTaskUpdatePayload(task, { status: nextStatus })) }, token);
      setTasks((prev) => {
        const nextTasks = prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item));
        persistCalendarCache(nextTasks);
        return nextTasks;
      });
      setHydrated(true);
      setCacheReady(true);
      clearSessionCaches([SESSION_CACHE_KEYS.dashboard]);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Could not update task.");
    } finally {
      setSavingTaskId(null);
      setCompletingTaskId(null);
    }
  }

  const openTasksCount = todayTasks.length + upcomingTasks.length + inboxTasks.length;

  return (
    <ProtectedPage>
      <AppShell title="Tasks" subtitle="Simple, fast task planning for admissions work.">
        <DeepWorkflowTheme>
          <div className="theme-workflow grid gap-4">
            {loading ? (
              <LoadingState />
            ) : (
              <>
                <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-[#DAF5F0]/20">
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
                      <div className="surface-card rounded-2xl bg-white/90 p-4">
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

                      <div className="surface-card rounded-2xl bg-white/90 p-4">
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

                      <div className="surface-card rounded-2xl bg-white/90 p-4">
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
                    completingTaskId={completingTaskId}
                    onToggle={(task) => void toggleTask(task)}
                    bodyClassName="max-h-[360px] xl:max-h-[390px]"
                  />

                  <TaskSection
                    title="Upcoming"
                    description="Tasks already scheduled for later."
                    tasks={upcomingTasks}
                    emptyText="No upcoming tasks yet."
                    savingTaskId={savingTaskId}
                    completingTaskId={completingTaskId}
                    onToggle={(task) => void toggleTask(task)}
                    bodyClassName="max-h-[360px] xl:max-h-[390px]"
                  />

                  <TaskSection
                    title="Inbox"
                    description="Tasks without a date."
                    tasks={inboxTasks}
                    emptyText="Your inbox is clear."
                    savingTaskId={savingTaskId}
                    completingTaskId={completingTaskId}
                    onToggle={(task) => void toggleTask(task)}
                    bodyClassName="max-h-[320px] xl:max-h-[360px]"
                  />

                  <TaskSection
                    title="Completed"
                    description="Recently finished work."
                    tasks={completedTasks}
                    emptyText="Completed tasks will show up here."
                    savingTaskId={savingTaskId}
                    completingTaskId={completingTaskId}
                    onToggle={(task) => void toggleTask(task)}
                    bodyClassName="max-h-[320px] xl:max-h-[360px]"
                  />
                </div>

                {statusText ? (
                  <div className="surface-card rounded-2xl px-4 py-3 text-sm text-black/60">{statusText}</div>
                ) : null}
              </>
            )}
          </div>
        </DeepWorkflowTheme>
      </AppShell>
    </ProtectedPage>
  );
}
