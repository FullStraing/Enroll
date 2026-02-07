"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/loader";

type RoadmapStage = {
  id: number;
  code: string;
  title: string;
  order: number;
};

type Task = {
  id: number;
  title: string;
  description: string;
  due_date: string | null;
  status: "planned" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  roadmap_stage?: RoadmapStage | null;
};

const statusOptions: Task["status"][] = ["planned", "in_progress", "done"];
const priorityOptions: Task["priority"][] = ["low", "medium", "high"];

export default function TasksPage() {
  const [stages, setStages] = useState<RoadmapStage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [filter, setFilter] = useState<"all" | Task["status"]>("all");
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "planned" as Task["status"],
    priority: "medium" as Task["priority"],
    roadmap_stage_id: "",
  });

  const visibleTasks = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((item) => item.status === filter);
  }, [tasks, filter]);

  async function loadData() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [stageData, taskData] = await Promise.all([
        apiFetch<RoadmapStage[]>("/api/roadmap-stages/", { method: "GET" }, token),
        apiFetch<Task[]>("/api/tasks/", { method: "GET" }, token),
      ]);
      setStages(stageData);
      setTasks(taskData);
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось загрузить задачи.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createTask(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;
    if (!form.title.trim()) {
      setStatusText("Укажите название задачи.");
      return;
    }
    setCreating(true);
    setStatusText("");
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        due_date: form.due_date || null,
        status: form.status,
        priority: form.priority,
      };
      if (form.roadmap_stage_id) payload.roadmap_stage_id = Number(form.roadmap_stage_id);
      await apiFetch("/api/tasks/", { method: "POST", body: JSON.stringify(payload) }, token);
      setForm({
        title: "",
        description: "",
        due_date: "",
        status: "planned",
        priority: "medium",
        roadmap_stage_id: "",
      });
      await loadData();
      setStatusText("Задача создана.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось создать задачу.");
    } finally {
      setCreating(false);
    }
  }

  async function generatePlan() {
    const token = getToken();
    if (!token) return;
    setGenerating(true);
    setStatusText("");
    try {
      const created = await apiFetch<Task[]>("/api/tasks/generate/", { method: "POST", body: JSON.stringify({}) }, token);
      await loadData();
      setStatusText(created.length ? `Сгенерировано задач: ${created.length}.` : "Новых задач не добавлено.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось сгенерировать задачи.");
    } finally {
      setGenerating(false);
    }
  }

  async function updateTaskStatus(task: Task, nextStatus: Task["status"]) {
    const token = getToken();
    if (!token) return;
    setSavingId(task.id);
    try {
      await apiFetch(
        `/api/tasks/${task.id}/`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            due_date: task.due_date,
            status: nextStatus,
            priority: task.priority,
            roadmap_stage_id: task.roadmap_stage?.id ?? null,
          }),
        },
        token,
      );
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось обновить статус.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Задачи" subtitle="План, ручные задачи и контроль прогресса.">
        <div className="grid gap-5">
          <section className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Генерация и фильтры</h2>
              <button
                type="button"
                onClick={generatePlan}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-70"
              >
                {generating ? <Loader size="sm" /> : null}
                <span>{generating ? "Генерируем..." : "Сгенерировать план"}</span>
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setFilter("all")} className={`rounded-xl px-3 py-1.5 text-sm ${filter === "all" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}`}>
                Все
              </button>
              {statusOptions.map((status) => (
                <button key={status} onClick={() => setFilter(status)} className={`rounded-xl px-3 py-1.5 text-sm ${filter === status ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}`}>
                  {status}
                </button>
              ))}
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Добавить задачу</h2>
            <form onSubmit={createTask} className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-white/70">
                Название
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                />
              </label>
              <label className="text-sm text-white/70">
                Срок
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(event) => setForm((prev) => ({ ...prev, due_date: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                />
              </label>
              <label className="text-sm text-white/70 md:col-span-2">
                Описание
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                />
              </label>
              <label className="text-sm text-white/70">
                Статус
                <select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as Task["status"] }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status} className="bg-[#0b1020]">
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-white/70">
                Приоритет
                <select
                  value={form.priority}
                  onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as Task["priority"] }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority} className="bg-[#0b1020]">
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-white/70 md:col-span-2">
                Этап roadmap
                <select
                  value={form.roadmap_stage_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, roadmap_stage_id: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <option value="" className="bg-[#0b1020]">Без этапа</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id} className="bg-[#0b1020]">
                      {stage.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-70 md:col-span-2 md:w-fit"
              >
                {creating ? <Loader size="sm" /> : null}
                <span>{creating ? "Сохраняем..." : "Создать задачу"}</span>
              </button>
            </form>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Список задач</h2>
            {loading ? (
              <div className="mt-4 grid gap-2">
                <div className="h-12 animate-pulse rounded-xl bg-white/10" />
                <div className="h-12 animate-pulse rounded-xl bg-white/10" />
                <div className="h-12 animate-pulse rounded-xl bg-white/10" />
              </div>
            ) : visibleTasks.length ? (
              <div className="mt-4 overflow-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-white/70">
                    <tr>
                      <th className="px-3 py-2">Задача</th>
                      <th className="px-3 py-2">Этап</th>
                      <th className="px-3 py-2">Срок</th>
                      <th className="px-3 py-2">Приоритет</th>
                      <th className="px-3 py-2">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTasks.map((task) => (
                      <tr key={task.id} className="border-t border-white/10">
                        <td className="px-3 py-2">
                          <p className="font-medium">{task.title}</p>
                          {task.description ? <p className="text-xs text-white/60">{task.description}</p> : null}
                        </td>
                        <td className="px-3 py-2">{task.roadmap_stage?.title || "-"}</td>
                        <td className="px-3 py-2">{task.due_date || "-"}</td>
                        <td className="px-3 py-2">{task.priority}</td>
                        <td className="px-3 py-2">
                          <select
                            value={task.status}
                            onChange={(event) => void updateTaskStatus(task, event.target.value as Task["status"])}
                            disabled={savingId === task.id}
                            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 disabled:opacity-60"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status} className="bg-[#0b1020]">
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/70">Пока задач нет.</p>
            )}
          </section>

          {statusText ? <p className="text-sm text-white/70">{statusText}</p> : null}
        </div>
      </AppShell>
    </ProtectedPage>
  );
}

