"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProtectedPage } from "@/components/protected-page";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Stats = {
  profileFilled: string;
  universities: number;
  tasks: number;
  documents: number;
};

function StatCard({ title, value, loading }: { title: string; value: string; loading: boolean }) {
  return (
    <Card className="shadow-none">
      <CardDescription>{title}</CardDescription>
      {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-3 text-2xl font-semibold">{value}</p>}
    </Card>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ profileFilled: "0/4", universities: 0, tasks: 0, documents: 0 });

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const run = async () => {
      setLoading(true);
      try {
        const [profile, universities, tasks, documents] = await Promise.all([
          apiFetch<Record<string, unknown>>("/api/auth/profile/", { method: "GET" }, token),
          apiFetch<unknown[]>("/api/my-universities/", { method: "GET" }, token),
          apiFetch<unknown[]>("/api/tasks/", { method: "GET" }, token),
          apiFetch<unknown[]>("/api/documents/", { method: "GET" }, token),
        ]);

        const filled = ["full_name", "country", "graduation_year", "intended_major"].filter((k) => Boolean(profile[k])).length;
        setStats({
          profileFilled: `${filled}/4`,
          universities: universities.length,
          tasks: tasks.length,
          documents: documents.length,
        });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  return (
    <ProtectedPage>
      <AppShell title="Dashboard" subtitle="Overview of your admissions workspace.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Profile completeness" value={stats.profileFilled} loading={loading} />
          <StatCard title="Saved universities" value={String(stats.universities)} loading={loading} />
          <StatCard title="Tasks" value={String(stats.tasks)} loading={loading} />
          <StatCard title="Documents" value={String(stats.documents)} loading={loading} />
        </div>
        <Card className="mt-5 shadow-none">
          <CardTitle>Workspace status</CardTitle>
          <CardDescription className="mt-2">Единый frontend на Next.js подключен к API. Здесь видна текущая загрузка рабочего пространства.</CardDescription>
          <div className="mt-4">
            <Progress value={loading ? 35 : 100} variant="primary" className="h-3" />
          </div>
          {loading ? (
            <div className="mt-4">
              <Spinner size="md" label="Загружаем данные..." />
            </div>
          ) : null}
        </Card>
      </AppShell>
    </ProtectedPage>
  );
}
