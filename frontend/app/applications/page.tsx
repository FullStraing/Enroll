"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type University = {
  id: number;
  name: string;
  country?: string;
  city?: string;
  state?: string;
  selectivity?: "high" | "medium" | "low" | string;
  main_deadline?: string | null;
  acceptance_rate?: number | null;
  sat_range?: string;
  act_range?: string;
  data_freshness_days?: number | null;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type StudentUniversity = {
  id: number;
  university: {
    id: number;
    name: string;
  };
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 40];
const PAGE_SIZE_STORAGE_KEY = "enroll_universities_page_size";

const selectivityLabel: Record<string, string> = {
  high: "Высокая",
  medium: "Средняя",
  low: "Низкая",
};

export default function ApplicationsPage() {
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [universitiesCount, setUniversitiesCount] = useState(0);
  const [universitiesPage, setUniversitiesPage] = useState(1);
  const [universitiesTotalPages, setUniversitiesTotalPages] = useState(1);
  const [universitiesPageSize, setUniversitiesPageSize] = useState(5);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [savedUniversityIds, setSavedUniversityIds] = useState<number[]>([]);
  const [savedMapping, setSavedMapping] = useState<Record<number, number>>({});
  const [savingUniversityId, setSavingUniversityId] = useState<number | null>(null);

  async function loadMyUniversities() {
    const token = getToken();
    if (!token) return;
    const items = await apiFetch<StudentUniversity[]>("/api/my-universities/", { method: "GET" }, token);
    const idMap: Record<number, number> = {};
    for (const item of items) {
      idMap[item.university.id] = item.id;
    }
    setSavedMapping(idMap);
    setSavedUniversityIds(items.map((item) => item.university.id));
  }

  async function toggleUniversityInProfile(universityId: number) {
    const token = getToken();
    if (!token) return;
    const alreadySaved = savedUniversityIds.includes(universityId);
    setSavingUniversityId(universityId);
    try {
      if (alreadySaved) {
        const studentUniversityId = savedMapping[universityId];
        if (!studentUniversityId) return;
        await apiFetch(`/api/my-universities/${studentUniversityId}/`, { method: "DELETE" }, token);
      } else {
        await apiFetch("/api/my-universities/", {
          method: "POST",
          body: JSON.stringify({ university_id: universityId }),
        }, token);
      }
      await loadMyUniversities();
      setStatus(alreadySaved ? "Университет убран из профиля." : "Университет добавлен в профиль.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось обновить профиль.");
    } finally {
      setSavingUniversityId(null);
    }
  }

  async function loadUniversities(page = universitiesPage, pageSize = universitiesPageSize, q = search) {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const searchParam = q.trim() ? `&q=${encodeURIComponent(q.trim())}` : "";
      const uniPage = await apiFetch<PaginatedResponse<University>>(
        `/api/universities/?page=${page}&page_size=${pageSize}${searchParam}`,
        { method: "GET" },
        token,
      );

      setUniversities(uniPage.results);
      setUniversitiesCount(uniPage.count);
      setUniversitiesTotalPages(Math.max(1, Math.ceil(uniPage.count / pageSize)));
      setUniversitiesPage(page);
      setStatus("Готово.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка загрузки университетов");
    } finally {
      setLoading(false);
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
    void loadUniversities(1, initialPageSize, "");
    void loadMyUniversities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      void loadUniversities(1, universitiesPageSize, searchInput);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <ProtectedPage>
      <AppShell title="Universities" subtitle="Глобальный поиск и карточки университетов">
        <section className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">University Cards</h2>
              <p className="mt-1 text-sm text-black/65">Поиск работает по всей базе, а не только по текущей странице.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Найти университет по названию, городу или штату..."
              className="w-full max-w-xl rounded-xl border border-black/15 bg-black/[0.03] px-3 py-2 text-sm"
            />
            <span className="text-sm text-black/65">Показано: {loading ? "-" : universities.length}</span>
            <span className="text-sm text-black/65">Всего найдено: {universitiesCount}</span>
            <label className="ml-auto flex items-center gap-2 text-sm text-black/65">
              На странице
              <select
                value={universitiesPageSize}
                onChange={(e) => {
                  const nextSize = Number(e.target.value) || 5;
                  setUniversitiesPageSize(nextSize);
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(nextSize));
                  }
                  void loadUniversities(1, nextSize, search);
                }}
                className="rounded-lg border border-black/20 bg-white px-2 py-1 text-sm"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadUniversities(Math.max(1, universitiesPage - 1), universitiesPageSize, search)}
              disabled={universitiesPage <= 1}
            >
              Назад
            </Button>
            <span className="text-xs text-black/70">
              Стр. {universitiesPage} / {universitiesTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadUniversities(Math.min(universitiesTotalPages, universitiesPage + 1), universitiesPageSize, search)}
              disabled={universitiesPage >= universitiesTotalPages}
            >
              Далее
            </Button>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {loading
              ? Array.from({ length: Math.min(universitiesPageSize, 6) }).map((_, idx) => (
                  <Card key={`sk-${idx}`} className="shadow-none">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                    <div className="mt-3 flex gap-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </Card>
                ))
              : universities.map((u) => (
              <Card
                key={u.id}
                className="card-shadow-hover cursor-pointer shadow-none"
                onClick={() => router.push(`/universities/${u.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/universities/${u.id}`);
                  }
                }}
              >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{u.name}</CardTitle>
                      <p className="mt-1 text-xs text-black/60">
                        {u.city || "-"}, {u.state || "-"}, {u.country || "USA"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <Badge>
                          Selectivity: {selectivityLabel[u.selectivity || ""] || u.selectivity || "-"}
                        </Badge>
                        <Badge variant="cyan">
                          Freshness: {u.data_freshness_days != null ? `${u.data_freshness_days}d` : "-"}
                        </Badge>
                        {savedUniversityIds.includes(u.id) ? <Badge variant="primary">In profile</Badge> : null}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={savedUniversityIds.includes(u.id) ? "outline" : "secondary"}
                      disabled={savingUniversityId === u.id}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void toggleUniversityInProfile(u.id);
                      }}
                    >
                      {savingUniversityId === u.id
                        ? "..."
                        : savedUniversityIds.includes(u.id)
                          ? "Убрать из профиля"
                          : "Добавить в профиль"}
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <span className="text-black/60">Acceptance:</span> {u.acceptance_rate != null ? `${u.acceptance_rate}%` : "-"}
                    </p>
                    <p>
                      <span className="text-black/60">SAT:</span> {u.sat_range || "-"}
                    </p>
                    <p>
                      <span className="text-black/60">ACT:</span> {u.act_range || "-"}
                    </p>
                    <p>
                      <span className="text-black/60">Deadline:</span> {u.main_deadline || "-"}
                    </p>
                  </div>
                </Card>
            ))}
          </div>

          {loading ? (
            <div className="mt-4">
              <Spinner size="sm" label="Загружаем университеты..." />
            </div>
          ) : status ? <p className="mt-4 text-sm text-black/70">{status}</p> : null}
        </section>
      </AppShell>
    </ProtectedPage>
  );
}
