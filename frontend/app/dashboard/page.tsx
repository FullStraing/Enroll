"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Loader } from "@/components/loader";

type Stats = {
  profileFilled: string;
  universities: number;
  tasks: number;
  documents: number;
};

function StatCard({ title, value, loading }: { title: string; value: string; loading: boolean }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-sm text-white/70">{title}</p>
      {loading ? <div className="mt-3 h-6 w-24 animate-pulse rounded bg-white/10" /> : <p className="mt-3 text-2xl font-semibold">{value}</p>}
    </div>
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
        <div className="glass mt-5 rounded-2xl p-5">
          <h2 className="text-lg font-semibold">Workspace status</h2>
          <p className="mt-2 text-sm text-white/70">Current Django pages continue to work at http://127.0.0.1:8000.</p>
          {loading ? (
            <div className="mt-4">
              <Loader size="md" label="Загружаем данные..." />
            </div>
          ) : null}
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
