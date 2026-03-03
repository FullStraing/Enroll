"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type University = {
  id: number;
  name: string;
  country?: string;
  city?: string;
  state?: string;
  selectivity?: "high" | "medium" | "low" | string;
  website_url?: string;
  main_deadline?: string | null;
  min_profile_score?: number | null;
  avg_profile_score?: number | null;
  acceptance_rate?: number | null;
  sat_range?: string;
  act_range?: string;
  source?: string;
  source_provider?: string;
  external_id?: string | null;
  source_url?: string;
  is_active?: boolean;
  last_ingested_at?: string | null;
  last_scraped_at?: string | null;
  data_freshness_days?: number | null;
  net_price?: number | string | null;
  room_and_board?: number | string | null;
  housing_cost?: number | string | null;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 40];
const PAGE_SIZE_STORAGE_KEY = "enroll_universities_page_size";

type MyUniversity = {
  id: number;
  university?: University;
  category: string;
  status: string;
  progress_percent?: number;
};

type Application = {
  id: number;
  university?: University;
  university_name?: string;
  deadline_date: string | null;
  status: string;
};

const selectivityLabel: Record<string, string> = {
  high: "Высокая",
  medium: "Средняя",
  low: "Низкая",
};

export default function ApplicationsPage() {
  const showLegacyForms = false;
  const [universities, setUniversities] = useState<University[]>([]);
  const [universitiesCount, setUniversitiesCount] = useState(0);
  const [universitiesPage, setUniversitiesPage] = useState(1);
  const [universitiesTotalPages, setUniversitiesTotalPages] = useState(1);
  const [universitiesPageSize, setUniversitiesPageSize] = useState(5);
  const [myUniversities, setMyUniversities] = useState<MyUniversity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUniId, setSelectedUniId] = useState("");
  const [myCategory, setMyCategory] = useState("target");
  const [myStatus, setMyStatus] = useState("planning");
  const [myNotes, setMyNotes] = useState("");

  const [applicationUniId, setApplicationUniId] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [applicationStatus, setApplicationStatus] = useState("planned");

  const filteredUniversities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter((u) => {
      const hay = `${u.name} ${u.city || ""} ${u.state || ""} ${u.country || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [universities, search]);

  async function loadUniversitiesPage(page = universitiesPage, pageSize = universitiesPageSize) {
    const token = getToken();
    if (!token) return;
    try {
      const uniPage = await apiFetch<PaginatedResponse<University>>(
        `/api/universities/?page=${page}&page_size=${pageSize}`,
        { method: "GET" },
        token,
      );
      setUniversities(uniPage.results);
      setUniversitiesCount(uniPage.count);
      const totalPages = Math.max(1, Math.ceil(uniPage.count / pageSize));
      setUniversitiesTotalPages(totalPages);
      setUniversitiesPage(page);
      setStatus("Готово.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка загрузки университетов");
    }
  }

  async function loadAll(page = universitiesPage, pageSize = universitiesPageSize) {
    const token = getToken();
    if (!token) return;
    setStatus("????????? ??????...");
    try {
      const uniPage = await apiFetch<PaginatedResponse<University>>(
        `/api/universities/?page=${page}&page_size=${pageSize}`,
        { method: "GET" },
        token,
      );
      setUniversities(uniPage.results);
      setUniversitiesCount(uniPage.count);
      const totalPages = Math.max(1, Math.ceil(uniPage.count / pageSize));
      setUniversitiesTotalPages(totalPages);
      setUniversitiesPage(page);
      if (showLegacyForms) {
        const [myUni, apps] = await Promise.all([
          apiFetch<MyUniversity[]>("/api/my-universities/", { method: "GET" }, token),
          apiFetch<Application[]>("/api/applications/", { method: "GET" }, token),
        ]);
        setMyUniversities(myUni);
        setApplications(apps);
      }
      setStatus("??????.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "?????? ????????");
    }
  }

  useEffect(() => {
    let initialPageSize = 5;
    if (typeof window !== "undefined") {
      const saved = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
      if (PAGE_SIZE_OPTIONS.includes(saved)) {
        initialPageSize = saved;
      }
    }
    setUniversitiesPageSize(initialPageSize);
    void loadAll(1, initialPageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addMyUniversity() {
    const token = getToken();
    if (!token) return;
    if (!selectedUniId) {
      setStatus("Выберите университет.");
      return;
    }

    setStatus("Добавляем университет...");
    try {
      await apiFetch(
        "/api/my-universities/",
        {
          method: "POST",
          body: JSON.stringify({
            university_id: Number(selectedUniId),
            category: myCategory,
            status: myStatus,
            notes: myNotes,
          }),
        },
        token,
      );
      setSelectedUniId("");
      setMyNotes("");
      await loadAll(universitiesPage);
      setStatus("Университет добавлен в список.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка добавления");
    }
  }

  async function createApplication() {
    const token = getToken();
    if (!token) return;
    if (!applicationUniId) {
      setStatus("Выберите университет из My Universities.");
      return;
    }

    setStatus("Создаём заявку...");
    try {
      await apiFetch(
        "/api/applications/",
        {
          method: "POST",
          body: JSON.stringify({
            university_id: Number(applicationUniId),
            deadline_date: applicationDeadline || null,
            status: applicationStatus,
          }),
        },
        token,
      );
      setApplicationUniId("");
      setApplicationDeadline("");
      setApplicationStatus("planned");
      await loadAll(universitiesPage);
      setStatus("Заявка создана.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка создания заявки");
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Universities" subtitle="Manage universities and applications end-to-end.">
        <div className="grid gap-5">
          <section className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">University Cards</h2>
                <p className="mt-1 text-sm text-white/65">Каждый университет с полным профилем: admissions, factors, diversity, living expenses, fees.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск университета..."
                className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <span className="text-sm text-white/65">Показано: {filteredUniversities.length}</span>
              <span className="text-sm text-white/65">Всего: {universitiesCount}</span>
              <label className="flex items-center gap-2 text-sm text-white/65">
                На странице
                <select
                  value={universitiesPageSize}
                  onChange={(e) => {
                    const nextSize = Number(e.target.value) || 5;
                    setUniversitiesPageSize(nextSize);
                    if (typeof window !== "undefined") {
                      window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(nextSize));
                    }
                    void loadAll(1, nextSize);
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-sm"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size} className="bg-[#0b1020]">
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => void loadUniversitiesPage(Math.max(1, universitiesPage - 1))}
                  disabled={universitiesPage <= 1}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Назад
                </button>
                <span className="text-xs text-white/70">
                  Стр. {universitiesPage} / {universitiesTotalPages}
                </span>
                <button
                  onClick={() => void loadUniversitiesPage(Math.min(universitiesTotalPages, universitiesPage + 1))}
                  disabled={universitiesPage >= universitiesTotalPages}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Далее
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {filteredUniversities.map((u) => (
                <Link key={u.id} href={`/universities/${u.id}`} className="block">
                  <article className="card-shadow-hover rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/40 hover:bg-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold">{u.name}</h3>
                        <p className="mt-1 text-xs text-white/60">{u.city || "-"}, {u.state || "-"}, {u.country || "USA"}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-lg border border-white/15 px-2 py-1 text-white/75">Selectivity: {selectivityLabel[u.selectivity || ""] || u.selectivity || "-"}</span>
                          <span className="rounded-lg border border-white/15 px-2 py-1 text-white/75">Freshness: {u.data_freshness_days != null ? `${u.data_freshness_days}d` : "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <p><span className="text-white/60">Acceptance:</span> {u.acceptance_rate != null ? `${u.acceptance_rate}%` : "-"}</p>
                      <p><span className="text-white/60">SAT:</span> {u.sat_range || "-"}</p>
                      <p><span className="text-white/60">ACT:</span> {u.act_range || "-"}</p>
                      <p><span className="text-white/60">Deadline:</span> {u.main_deadline || "-"}</p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>

          {showLegacyForms ? <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">My Universities</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-white/70">
                University
                <select value={selectedUniId} onChange={(e) => setSelectedUniId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <option value="" className="bg-[#0b1020]">-- select --</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#0b1020]">{u.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-white/70">
                Category
                <select value={myCategory} onChange={(e) => setMyCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  {["reach", "target", "safety"].map((value) => <option key={value} className="bg-[#0b1020]" value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm text-white/70">
                Status
                <select value={myStatus} onChange={(e) => setMyStatus(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  {["planning", "preparing", "applying", "submitted", "admitted", "rejected"].map((value) => <option key={value} className="bg-[#0b1020]" value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm text-white/70 md:col-span-2">
                Notes
                <input value={myNotes} onChange={(e) => setMyNotes(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
              </label>
            </div>
            <button onClick={addMyUniversity} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">Add to My Universities</button>

            <div className="mt-4 overflow-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/70">
                  <tr>
                    <th className="px-3 py-2">University</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {myUniversities.map((item) => (
                    <tr key={item.id} className="border-t border-white/10">
                      <td className="px-3 py-2">{item.university?.name || "-"}</td>
                      <td className="px-3 py-2">{item.category}</td>
                      <td className="px-3 py-2">{item.status}</td>
                      <td className="px-3 py-2">{item.progress_percent ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section> : null}

          {showLegacyForms ? <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Applications</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="text-sm text-white/70">
                University (from My Universities)
                <select value={applicationUniId} onChange={(e) => setApplicationUniId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <option value="" className="bg-[#0b1020]">-- select --</option>
                  {myUniversities.map((item) => (
                    <option key={item.id} className="bg-[#0b1020]" value={item.university?.id || ""}>
                      {item.university?.name || "-"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-white/70">
                Deadline
                <input type="date" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
              </label>
              <label className="text-sm text-white/70">
                Status
                <select value={applicationStatus} onChange={(e) => setApplicationStatus(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  {["planned", "in_progress", "submitted"].map((value) => <option key={value} className="bg-[#0b1020]" value={value}>{value}</option>)}
                </select>
              </label>
            </div>
            <button onClick={createApplication} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">Create application</button>

            <div className="mt-4 overflow-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/70">
                  <tr>
                    <th className="px-3 py-2">University</th>
                    <th className="px-3 py-2">Deadline</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-t border-white/10">
                      <td className="px-3 py-2">{app.university?.name || app.university_name || "-"}</td>
                      <td className="px-3 py-2">{app.deadline_date || "-"}</td>
                      <td className="px-3 py-2">{app.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section> : null}

          {showLegacyForms ? <p className="text-sm text-white/70">{status}</p> : null}
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
