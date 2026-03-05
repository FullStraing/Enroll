"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProtectedPage } from "@/components/protected-page";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Section = {
  key: string;
  title: string;
  completed_required: number;
  required_total: number;
  percent: number;
};

type CommonAppProgress = {
  overall: {
    completed_required: number;
    required_total: number;
    percent: number;
  };
  sections: Section[];
};

type Stats = {
  universities: number;
  tasks: number;
  documents: number;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [stats, setStats] = useState<Stats>({ universities: 0, tasks: 0, documents: 0 });
  const [progressData, setProgressData] = useState<CommonAppProgress | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const run = async () => {
      setLoading(true);
      try {
        const [progress, universities, tasks, documents] = await Promise.all([
          apiFetch<CommonAppProgress>("/api/auth/common-app-progress/", { method: "GET" }, token),
          apiFetch<unknown[]>("/api/my-universities/", { method: "GET" }, token),
          apiFetch<unknown[]>("/api/tasks/", { method: "GET" }, token),
          apiFetch<unknown[]>("/api/documents/", { method: "GET" }, token),
        ]);
        setProgressData(progress);
        setStats({ universities: universities.length, tasks: tasks.length, documents: documents.length });
        setStatusText("");
      } catch (error) {
        setStatusText(error instanceof Error ? error.message : "Не удалось загрузить dashboard.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const sectionCount = progressData?.sections.length || 0;
  const completedSections = useMemo(
    () => progressData?.sections.filter((section) => section.percent === 100).length || 0,
    [progressData],
  );

  return (
    <ProtectedPage>
      <AppShell title="Dashboard" subtitle="Общий обзор и прогресс заполнения Common Application.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardDescription>Заполнение Common App</CardDescription>
            {loading || !progressData ? (
              <Skeleton className="mt-3 h-8 w-24" />
            ) : (
              <p className="mt-3 text-2xl font-semibold">
                {progressData.overall.percent}% ({progressData.overall.completed_required}/{progressData.overall.required_total})
              </p>
            )}
          </Card>
          <Card className="shadow-none">
            <CardDescription>Закрыто секций</CardDescription>
            {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-3 text-2xl font-semibold">{completedSections}/{sectionCount}</p>}
          </Card>
          <Card className="shadow-none">
            <CardDescription>Сохраненные университеты</CardDescription>
            {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-3 text-2xl font-semibold">{stats.universities}</p>}
          </Card>
          <Card className="shadow-none">
            <CardDescription>Задачи / Документы</CardDescription>
            {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-3 text-2xl font-semibold">{stats.tasks} / {stats.documents}</p>}
          </Card>
        </div>

        <Card className="mt-5 shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Моя Common Application</CardTitle>
              <CardDescription className="mt-2">
                Все поля анкеты заполняются на отдельной странице. Здесь только сводка и проценты.
              </CardDescription>
            </div>
            <Link href="/common-app">
              <Button>Открыть Common Application</Button>
            </Link>
          </div>
          <div className="mt-4">
            <Progress value={loading || !progressData ? 0 : progressData.overall.percent} variant="primary" className="h-3" />
          </div>
          {loading ? (
            <div className="mt-4">
              <Spinner size="md" label="Загружаем прогресс..." />
            </div>
          ) : (
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {(progressData?.sections || []).map((section) => (
                <div key={section.key} className="rounded-xl border border-black/10 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{section.title}</p>
                    <Badge variant={section.percent === 100 ? "cyan" : "orange"}>{section.percent}%</Badge>
                  </div>
                  <p className="mt-1 text-xs text-black/60">
                    {section.completed_required}/{section.required_total} обязательных полей
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {statusText ? <p className="mt-4 text-sm text-black/70">{statusText}</p> : null}
      </AppShell>
    </ProtectedPage>
  );
}
