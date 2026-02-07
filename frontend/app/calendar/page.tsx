"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/loader";

type TaskItem = {
  id: number;
  title: string;
  description: string;
  due_date: string | null;
  status: "planned" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  roadmap_stage?: {
    id: number;
    title: string;
  } | null;
  application?: {
    id: number;
    university_id: number | null;
    university_name: string;
    deadline_date: string | null;
    status: string;
  } | null;
};

type ApplicationItem = {
  id: number;
  university_name?: string;
  deadline_date: string | null;
  status: string;
  university?: {
    id: number;
    name: string;
  } | null;
};

type MyUniversityItem = {
  id: number;
  university?: {
    id: number;
    name: string;
  } | null;
};

type CalendarEvent = {
  id: string;
  date: string;
  type: "task" | "deadline";
  title: string;
  status: string;
  universityId?: number | null;
  task?: TaskItem;
};

type ViewMode = "month" | "week";

type QuickTaskParsed = {
  title: string;
  dueDate: string;
  time: string | null;
};

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(date: Date, amount: number): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function getMonthGrid(anchor: Date): Date[] {
  const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(firstDay);
  return Array.from({ length: 42 }).map((_, index) => addDays(gridStart, index));
}

function getWeekGrid(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }).map((_, index) => addDays(start, index));
}

function formatDayLabel(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}`;
}

function parseQuickTask(command: string): QuickTaskParsed | null {
  const trimmed = command.trim();
  const regex = /^\/task\s+(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?\s+(.+)$/;
  const match = trimmed.match(regex);
  if (!match) return null;
  const dueDate = match[1];
  const time = match[2] || null;
  const title = match[3].trim();
  if (!title) return null;
  return { title, dueDate, time };
}

function buildTaskUpdatePayload(task: TaskItem, patch: Partial<TaskItem>): Record<string, unknown> {
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

export default function CalendarPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [myUniversities, setMyUniversities] = useState<MyUniversityItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [eventTypeFilter, setEventTypeFilter] = useState<"all" | "task" | "deadline">("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | TaskItem["status"]>("all");
  const [universityFilter, setUniversityFilter] = useState<string>("all");
  const [quickTaskCommand, setQuickTaskCommand] = useState("/task 2026-02-20 18:00 Подготовить черновик эссе");
  const [quickTaskUniversity, setQuickTaskUniversity] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<number | null>(null);
  const [statusText, setStatusText] = useState("");

  async function loadWorkspace() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
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
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось загрузить календарь.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, []);

  const events = useMemo(() => {
    const taskEvents: CalendarEvent[] = tasks
      .filter((item) => Boolean(item.due_date))
      .map((item) => ({
        id: `task-${item.id}`,
        date: item.due_date as string,
        type: "task",
        title: item.title,
        status: item.status,
        universityId: item.application?.university_id,
        task: item,
      }));

    const deadlineEvents: CalendarEvent[] = applications
      .filter((item) => Boolean(item.deadline_date))
      .map((item) => ({
        id: `deadline-${item.id}`,
        date: item.deadline_date as string,
        type: "deadline",
        title: `Дедлайн: ${item.university?.name || item.university_name || `Application #${item.id}`}`,
        status: item.status,
        universityId: item.university?.id || null,
      }));

    return [...taskEvents, ...deadlineEvents];
  }, [tasks, applications]);

  const filteredEvents = useMemo(() => {
    return events.filter((item) => {
      if (eventTypeFilter !== "all" && item.type !== eventTypeFilter) return false;
      if (taskStatusFilter !== "all" && item.type === "task" && item.status !== taskStatusFilter) return false;
      if (universityFilter !== "all") {
        const uniId = Number(universityFilter);
        if ((item.universityId || -1) !== uniId) return false;
      }
      return true;
    });
  }, [events, eventTypeFilter, taskStatusFilter, universityFilter]);

  const eventMap = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    for (const event of filteredEvents) {
      const bucket = grouped.get(event.date) || [];
      bucket.push(event);
      grouped.set(event.date, bucket);
    }
    return grouped;
  }, [filteredEvents]);

  const visibleDays = useMemo(() => {
    return viewMode === "month" ? getMonthGrid(anchorDate) : getWeekGrid(anchorDate);
  }, [viewMode, anchorDate]);

  const todayPanelEvents = useMemo(() => {
    const today = startOfWeek(new Date());
    const end = addDays(today, 7);
    return filteredEvents
      .filter((event) => {
        const date = fromIsoDate(event.date);
        return date >= today && date <= end;
      })
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [filteredEvents]);

  const timelineEvents = useMemo(() => {
    const today = startOfWeek(new Date());
    const end = addDays(today, 14);
    return filteredEvents
      .filter((event) => {
        const date = fromIsoDate(event.date);
        return date >= today && date <= end;
      })
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [filteredEvents]);

  function navigate(delta: number) {
    const next = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());
    if (viewMode === "month") {
      next.setMonth(next.getMonth() + delta);
    } else {
      next.setDate(next.getDate() + delta * 7);
    }
    setAnchorDate(next);
  }

  async function quickAddTask(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;

    const parsed = parseQuickTask(quickTaskCommand);
    if (!parsed) {
      setStatusText("Формат: /task YYYY-MM-DD [HH:MM] Текст задачи");
      return;
    }

    setQuickSaving(true);
    setStatusText("");
    try {
      const payload: Record<string, unknown> = {
        title: parsed.title,
        due_date: parsed.dueDate,
        status: "planned",
        priority: "medium",
        description: parsed.time ? `Время: ${parsed.time}` : "",
      };

      const selectedUniversityId = quickTaskUniversity === "all" ? null : Number(quickTaskUniversity);
      if (selectedUniversityId) {
        const relatedApplication = applications.find((item) => item.university?.id === selectedUniversityId);
        if (relatedApplication) payload.application_id = relatedApplication.id;
      }

      await apiFetch("/api/tasks/", { method: "POST", body: JSON.stringify(payload) }, token);
      await loadWorkspace();
      setStatusText("Задача добавлена в календарь.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось добавить задачу.");
    } finally {
      setQuickSaving(false);
    }
  }

  async function moveTaskToDate(task: TaskItem, date: string) {
    const token = getToken();
    if (!token) return;
    setSavingTaskId(task.id);
    try {
      await apiFetch(`/api/tasks/${task.id}/`, { method: "PUT", body: JSON.stringify(buildTaskUpdatePayload(task, { due_date: date })) }, token);
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, due_date: date } : item)));
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось переместить задачу.");
    } finally {
      setSavingTaskId(null);
    }
  }

  async function toggleTaskStatus(task: TaskItem) {
    const token = getToken();
    if (!token) return;
    const nextStatus: TaskItem["status"] = task.status === "done" ? "in_progress" : "done";
    setSavingTaskId(task.id);
    try {
      await apiFetch(`/api/tasks/${task.id}/`, { method: "PUT", body: JSON.stringify(buildTaskUpdatePayload(task, { status: nextStatus })) }, token);
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось изменить статус.");
    } finally {
      setSavingTaskId(null);
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Календарь" subtitle="Month/Week планирование: дедлайны и задачи в одном месте.">
        <div className="grid gap-5">
          <section className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Панель управления</h2>
              <div className="flex gap-2">
                <button onClick={() => setViewMode("month")} className={`rounded-xl px-3 py-2 text-sm ${viewMode === "month" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}`}>Month</button>
                <button onClick={() => setViewMode("week")} className={`rounded-xl px-3 py-2 text-sm ${viewMode === "week" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}`}>Week</button>
              </div>
            </div>

            <form onSubmit={quickAddTask} className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
              <label className="text-sm text-white/70">
                Быстрый ввод задачи
                <input
                  value={quickTaskCommand}
                  onChange={(event) => setQuickTaskCommand(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                />
                <span className="mt-1 block text-xs text-white/55">Пример: /task 2026-02-20 18:00 Подготовить эссе</span>
              </label>
              <label className="text-sm text-white/70">
                Вуз (опционально)
                <select value={quickTaskUniversity} onChange={(event) => setQuickTaskUniversity(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <option value="all" className="bg-[#0b1020]">Без вуза</option>
                  {myUniversities
                    .filter((item) => item.university)
                    .map((item) => (
                      <option key={item.id} value={item.university?.id} className="bg-[#0b1020]">
                        {item.university?.name}
                      </option>
                    ))}
                </select>
              </label>
              <button type="submit" disabled={quickSaving} className="mt-6 inline-flex h-fit items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-70">
                {quickSaving ? <Loader size="sm" /> : null}
                <span>{quickSaving ? "Добавляем..." : "Добавить"}</span>
              </button>
            </form>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="text-sm text-white/70">
                Тип события
                <select value={eventTypeFilter} onChange={(event) => setEventTypeFilter(event.target.value as "all" | "task" | "deadline")} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <option value="all" className="bg-[#0b1020]">Все</option>
                  <option value="task" className="bg-[#0b1020]">Tasks</option>
                  <option value="deadline" className="bg-[#0b1020]">Deadlines</option>
                </select>
              </label>
              <label className="text-sm text-white/70">
                Статус задач
                <select value={taskStatusFilter} onChange={(event) => setTaskStatusFilter(event.target.value as "all" | TaskItem["status"])} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <option value="all" className="bg-[#0b1020]">Все</option>
                  <option value="planned" className="bg-[#0b1020]">planned</option>
                  <option value="in_progress" className="bg-[#0b1020]">in_progress</option>
                  <option value="done" className="bg-[#0b1020]">done</option>
                </select>
              </label>
              <label className="text-sm text-white/70">
                Фильтр по вузу
                <select value={universityFilter} onChange={(event) => setUniversityFilter(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <option value="all" className="bg-[#0b1020]">Все</option>
                  {myUniversities
                    .filter((item) => item.university)
                    .map((item) => (
                      <option key={item.id} value={item.university?.id} className="bg-[#0b1020]">
                        {item.university?.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10">Назад</button>
                <button onClick={() => setAnchorDate(new Date())} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10">Сегодня</button>
                <button onClick={() => navigate(1)} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10">Вперёд</button>
              </div>
              <p className="text-sm text-white/70">{anchorDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 14 }).map((_, idx) => (
                  <div key={idx} className="h-24 animate-pulse rounded-xl bg-white/10" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {visibleDays.map((day, index) => {
                  const dateKey = toIsoDate(day);
                  const dayEvents = eventMap.get(dateKey) || [];
                  const outOfMonth = viewMode === "month" && day.getMonth() !== anchorDate.getMonth();

                  return (
                    <div
                      key={`${dateKey}-${index}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const rawId = event.dataTransfer.getData("text/task-id");
                        const taskId = Number(rawId);
                        if (!taskId) return;
                        const task = tasks.find((item) => item.id === taskId);
                        if (!task) return;
                        void moveTaskToDate(task, dateKey);
                      }}
                      className={`min-h-28 rounded-xl border p-2 ${outOfMonth ? "border-white/5 bg-white/[0.02] text-white/40" : "border-white/10 bg-white/5"}`}
                    >
                      <p className="mb-1 text-xs font-semibold">{WEEK_DAYS[index % 7]} {formatDayLabel(day)}</p>
                      <div className="grid gap-1">
                        {dayEvents.slice(0, 4).map((eventItem) => (
                          <button
                            key={eventItem.id}
                            type="button"
                            draggable={eventItem.type === "task"}
                            onDragStart={(event) => {
                              if (eventItem.type === "task" && eventItem.task) {
                                event.dataTransfer.setData("text/task-id", String(eventItem.task.id));
                              }
                            }}
                            onClick={() => {
                              if (eventItem.type === "task" && eventItem.task) {
                                void toggleTaskStatus(eventItem.task);
                              }
                            }}
                            disabled={savingTaskId === eventItem.task?.id}
                            className={`w-full rounded-lg px-2 py-1 text-left text-xs ${eventItem.type === "deadline" ? "bg-violet-500/25 text-violet-100" : "bg-cyan-500/20 text-cyan-100"}`}
                          >
                            {eventItem.type === "task" ? "Task" : "Deadline"}: {eventItem.title}
                          </button>
                        ))}
                        {dayEvents.length > 4 ? <p className="text-[11px] text-white/50">+{dayEvents.length - 4} ещё</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-lg font-semibold">Today / Next 7 days</h3>
              {todayPanelEvents.length ? (
                <ul className="mt-3 grid gap-2">
                  {todayPanelEvents.slice(0, 7).map((item) => (
                    <li key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                      <span className="text-white/60">{item.date}</span> - {item.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-white/70">На ближайшую неделю событий нет.</p>
              )}
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="text-lg font-semibold">Timeline (14 дней)</h3>
              {timelineEvents.length ? (
                <ul className="mt-3 grid gap-2">
                  {timelineEvents.map((item) => (
                    <li key={`${item.id}-timeline`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                      <span className="text-white/60">{item.date}</span> - {item.type === "deadline" ? "deadline" : "task"} - {item.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-white/70">Пока нечего показывать в timeline.</p>
              )}
            </div>
          </section>

          {statusText ? <p className="text-sm text-white/70">{statusText}</p> : null}
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
