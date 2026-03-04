"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

type EssayType = "personal_statement" | "motivation_essay" | "supplemental_essay" | "other";

type Essay = {
  id: number;
  title: string;
  essay_type: EssayType;
  university: number | null;
  university_detail?: {
    id: number;
    name: string;
  } | null;
  prompt_title: string;
  prompt_text: string;
  target_word_count: number;
  versions_count: number;
  last_edited_at: string | null;
};

type University = {
  id: number;
  name: string;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const essayTypeOptions: Array<{ value: EssayType; label: string }> = [
  { value: "personal_statement", label: "Personal Statement" },
  { value: "motivation_essay", label: "Motivation Essay" },
  { value: "supplemental_essay", label: "Supplemental Essay" },
  { value: "other", label: "Other" },
];

function formatEssayType(value: EssayType) {
  const match = essayTypeOptions.find((item) => item.value === value);
  return match ? match.label : value;
}

export default function EssaysPage() {
  const router = useRouter();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    essay_type: "personal_statement" as EssayType,
    university: "",
    prompt_title: "",
    prompt_text: "",
    target_word_count: "650",
  });

  const requireSupplementalFields = form.essay_type === "supplemental_essay";

  async function loadData() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [essayData, universitiesPage] = await Promise.all([
        apiFetch<Essay[]>("/api/essays/", { method: "GET" }, token),
        apiFetch<PaginatedResponse<University>>("/api/universities/?page=1&page_size=300", { method: "GET" }, token),
      ]);
      setEssays(essayData);
      setUniversities(universitiesPage.results);
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to load essays.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const sortedUniversities = useMemo(
    () => [...universities].sort((a, b) => a.name.localeCompare(b.name)),
    [universities],
  );

  async function createEssay(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;

    if (requireSupplementalFields && !form.university) {
      setStatusText("For supplemental essay, select a university.");
      return;
    }
    if (requireSupplementalFields && !form.prompt_title.trim()) {
      setStatusText("For supplemental essay, add prompt title.");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        essay_type: form.essay_type,
        prompt_title: form.prompt_title.trim(),
        prompt_text: form.prompt_text.trim(),
        target_word_count: Number(form.target_word_count) || 650,
      };
      if (form.university) payload.university = Number(form.university);
      const created = await apiFetch<Essay>("/api/essays/", { method: "POST", body: JSON.stringify(payload) }, token);
      setShowCreate(false);
      setForm({
        title: "",
        essay_type: "personal_statement",
        university: "",
        prompt_title: "",
        prompt_text: "",
        target_word_count: "650",
      });
      router.push(`/essays/${created.id}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to create essay.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Essays" subtitle="Essay Manager: one essay -> many versions">
        <section className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Essay Manager</h2>
              <p className="mt-1 text-sm text-black/65">Manage drafts like GitHub: each essay has its own version history.</p>
            </div>
            <Button onClick={() => setShowCreate((prev) => !prev)}>{showCreate ? "Close" : "+ New Essay"}</Button>
          </div>

          {showCreate ? (
            <Card className="mt-4 shadow-none">
              <CardTitle>Create New Essay</CardTitle>
              <form onSubmit={createEssay} className="mt-3 grid gap-3">
                <label className="text-sm text-black/70">
                  Essay type
                  <select
                    value={form.essay_type}
                    onChange={(event) => setForm((prev) => ({ ...prev, essay_type: event.target.value as EssayType }))}
                    className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  >
                    {essayTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-black/70">
                  Essay title
                  <input
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Optional (auto from type if empty)"
                    className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  />
                </label>

                {requireSupplementalFields ? (
                  <>
                    <label className="text-sm text-black/70">
                      University
                      <select
                        value={form.university}
                        onChange={(event) => setForm((prev) => ({ ...prev, university: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                      >
                        <option value="">Select university</option>
                        {sortedUniversities.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm text-black/70">
                      Prompt title
                      <input
                        value={form.prompt_title}
                        onChange={(event) => setForm((prev) => ({ ...prev, prompt_title: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                      />
                    </label>

                    <label className="text-sm text-black/70">
                      Prompt text
                      <textarea
                        rows={3}
                        value={form.prompt_text}
                        onChange={(event) => setForm((prev) => ({ ...prev, prompt_text: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                      />
                    </label>
                  </>
                ) : null}

                <label className="text-sm text-black/70">
                  Target words
                  <input
                    type="number"
                    min={100}
                    max={2000}
                    value={form.target_word_count}
                    onChange={(event) => setForm((prev) => ({ ...prev, target_word_count: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  />
                </label>

                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner size="sm" /> : null}
                  <span>{saving ? "Creating..." : "Create Essay"}</span>
                </Button>
              </form>
            </Card>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <Card key={`essay-sk-${idx}`} className="shadow-none">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                    <Skeleton className="mt-3 h-4 w-full" />
                  </Card>
                ))
              : essays.map((essay) => (
                  <Link key={essay.id} href={`/essays/${essay.id}`}>
                    <Card className="card-shadow-hover shadow-none">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle>{essay.title}</CardTitle>
                        <Badge>{formatEssayType(essay.essay_type)}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-black/65">
                        {essay.university_detail?.name || "General essay"}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <p>
                          <span className="text-black/60">Versions:</span> {essay.versions_count || 0}
                        </p>
                        <p>
                          <span className="text-black/60">Target:</span> {essay.target_word_count}
                        </p>
                      </div>
                      <p className="mt-2 text-xs text-black/55">
                        Last edited:{" "}
                        {essay.last_edited_at
                          ? new Date(essay.last_edited_at).toLocaleString("ru-RU")
                          : "-"}
                      </p>
                    </Card>
                  </Link>
                ))}
          </div>

          {!loading && !essays.length ? (
            <p className="mt-4 text-sm text-black/65">No essays yet. Start with + New Essay.</p>
          ) : null}
          {statusText ? <p className="mt-4 text-sm text-black/65">{statusText}</p> : null}
        </section>
      </AppShell>
    </ProtectedPage>
  );
}
