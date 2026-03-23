"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { useAuth } from "@/components/auth-provider";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { formatDateTimeShort } from "@/lib/date-format";
import { clearSessionCaches, readSessionCache, SESSION_CACHE_KEYS, SESSION_CACHE_TTLS, writeSessionCache } from "@/lib/session-cache";

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

type EssaysCachePayload = {
  essays: Essay[];
};

const essayTypeOptions: Array<{ value: EssayType; label: string }> = [
  { value: "personal_statement", label: "Personal Statement" },
  { value: "motivation_essay", label: "Motivation Essay" },
  { value: "supplemental_essay", label: "Supplemental Essay" },
  { value: "other", label: "Other" },
];
const DEMO_DURATION_SECONDS = 24;

const essayDraftTemplates: Record<
  EssayType,
  {
    title: string;
    promptTitle: string;
    promptText: string;
    targetWordCount: string;
  }
> = {
  personal_statement: {
    title: "Personal Statement - My growth through challenge",
    promptTitle: "",
    promptText: "",
    targetWordCount: "650",
  },
  motivation_essay: {
    title: "Motivation Essay - Why this path matters to me",
    promptTitle: "",
    promptText: "",
    targetWordCount: "650",
  },
  supplemental_essay: {
    title: "Why this university essay",
    promptTitle: "Why us?",
    promptText:
      "Describe why this university matches your academic goals, personal values, and the type of community where you want to grow.",
    targetWordCount: "250",
  },
  other: {
    title: "Essay draft - Working title",
    promptTitle: "",
    promptText: "",
    targetWordCount: "500",
  },
};

function getEssayDraftTemplate(type: EssayType) {
  return essayDraftTemplates[type];
}

function formatEssayType(value: EssayType) {
  const match = essayTypeOptions.find((item) => item.value === value);
  return match ? match.label : value;
}

function EssaysPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, refreshSession } = useAuth();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [universitiesLoaded, setUniversitiesLoaded] = useState(false);
  const [universitySearch, setUniversitySearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoSeconds, setDemoSeconds] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(() => {
    const template = getEssayDraftTemplate("personal_statement");
    return {
      title: template.title,
      essay_type: "personal_statement" as EssayType,
      university: "",
      prompt_title: template.promptTitle,
      prompt_text: template.promptText,
      target_word_count: template.targetWordCount,
    };
  });

  const requireSupplementalFields = form.essay_type === "supplemental_essay";

  async function loadData() {
    const token = getToken();
    if (!token) return;
    const { payload: cached, isFresh } = readSessionCache<EssaysCachePayload>(SESSION_CACHE_KEYS.essays, SESSION_CACHE_TTLS.essays);
    if (cached) {
      setEssays(cached.essays);
      setLoading(false);
    } else {
      setLoading(true);
    }

    if (isFresh) {
      setStatusText("");
      return;
    }

    try {
      const essayData = await apiFetch<Essay[]>("/api/essays/", { method: "GET" }, token);
      setEssays(essayData);
      setStatusText("");
      writeSessionCache(SESSION_CACHE_KEYS.essays, { essays: essayData });
    } catch (error) {
      if (!cached) {
        setStatusText(error instanceof Error ? error.message : "Failed to load essays.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadUniversities(query = "") {
    const token = getToken();
    if (!token) return;
    setUniversitiesLoading(true);
    try {
      const q = query.trim();
      const suffix = q ? `&q=${encodeURIComponent(q)}` : "";
      const universitiesPage = await apiFetch<PaginatedResponse<University>>(
        `/api/universities/?page=1&page_size=50${suffix}`,
        { method: "GET" },
        token,
      );
      setUniversities(universitiesPage.results);
      setUniversitiesLoaded(true);
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to load universities.");
    } finally {
      setUniversitiesLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (loading) return;
    writeSessionCache(SESSION_CACHE_KEYS.essays, { essays });
  }, [loading, essays]);

  useEffect(() => {
    const action = searchParams.get("action");
    const essayType = searchParams.get("essay_type");
    if (action !== "create") return;
    setShowCreate(true);
    if (essayType && essayTypeOptions.some((option) => option.value === essayType)) {
      applyEssayTypeTemplate(essayType as EssayType);
    }
  }, [searchParams]);

  useEffect(() => {
    if (profile?.essays_onboarding_seen === false) {
      setShowOnboarding(true);
    }
  }, [profile?.essays_onboarding_seen]);

  useEffect(() => {
    if (!demoPlaying) return;
    const timer = setInterval(() => {
      setDemoSeconds((prev) => {
        if (prev >= DEMO_DURATION_SECONDS) {
          setDemoPlaying(false);
          return DEMO_DURATION_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [demoPlaying]);

  useEffect(() => {
    if (!showCreate) return;
    if (!requireSupplementalFields) return;
    if (universitiesLoaded) return;
    void loadUniversities();
  }, [showCreate, requireSupplementalFields, universitiesLoaded]);

  useEffect(() => {
    if (!showCreate) return;
    if (!requireSupplementalFields) return;
    if (!universitySearch.trim() && universitiesLoaded) return;
    const timer = setTimeout(() => {
      void loadUniversities(universitySearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [universitySearch, showCreate, requireSupplementalFields, universitiesLoaded]);

  const sortedUniversities = useMemo(
    () => [...universities].sort((a, b) => a.name.localeCompare(b.name)),
    [universities],
  );

  function applyEssayTypeTemplate(nextType: EssayType) {
    const template = getEssayDraftTemplate(nextType);
    setForm((prev) => {
      const previousTemplate = getEssayDraftTemplate(prev.essay_type);
      const shouldReplaceTitle = !prev.title.trim() || prev.title === previousTemplate.title;
      const shouldReplacePromptTitle = !prev.prompt_title.trim() || prev.prompt_title === previousTemplate.promptTitle;
      const shouldReplacePromptText = !prev.prompt_text.trim() || prev.prompt_text === previousTemplate.promptText;
      const shouldReplaceTarget = !prev.target_word_count.trim() || prev.target_word_count === previousTemplate.targetWordCount;

      return {
        ...prev,
        essay_type: nextType,
        university: nextType === "supplemental_essay" ? prev.university : "",
        title: shouldReplaceTitle ? template.title : prev.title,
        prompt_title: shouldReplacePromptTitle ? template.promptTitle : prev.prompt_title,
        prompt_text: shouldReplacePromptText ? template.promptText : prev.prompt_text,
        target_word_count: shouldReplaceTarget ? template.targetWordCount : prev.target_word_count,
      };
    });
  }

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
      clearSessionCaches([SESSION_CACHE_KEYS.dashboard, SESSION_CACHE_KEYS.essays]);
      setShowCreate(false);
      const template = getEssayDraftTemplate("personal_statement");
      setForm({
        title: template.title,
        essay_type: "personal_statement",
        university: "",
        prompt_title: template.promptTitle,
        prompt_text: template.promptText,
        target_word_count: template.targetWordCount,
      });
      router.push(`/essays/${created.id}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to create essay.");
    } finally {
      setSaving(false);
    }
  }

  async function markOnboardingSeen() {
    const token = getToken();
    if (!token) return;
    setSavingOnboarding(true);
    try {
      await apiFetch("/api/auth/profile/", { method: "PATCH", body: JSON.stringify({ essays_onboarding_seen: true }) }, token);
      await refreshSession();
      setShowOnboarding(false);
      setDemoPlaying(false);
      setDemoSeconds(0);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to save onboarding state.");
    } finally {
      setSavingOnboarding(false);
    }
  }

  async function handleSkip() {
    await markOnboardingSeen();
  }

  async function handleWatchDemo() {
    if (!demoPlaying) {
      setDemoSeconds(0);
      setDemoPlaying(true);
    }
  }

  const demoProgress = Math.round((demoSeconds / DEMO_DURATION_SECONDS) * 100);

  return (
    <ProtectedPage>
      <AppShell title="Essays" subtitle="Essay Manager: one essay -> many versions">
        {showOnboarding ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-3xl rounded-3xl border-2 border-black bg-white p-6 shadow-2xl">
              <h3 className="text-2xl font-black">Essay Workspace Demo</h3>
              <p className="mt-2 text-sm text-black/65">
                Short guided intro before you start. Demo can be longer than 10 seconds and is adaptive.
              </p>

              <div className="mt-4 rounded-2xl border-2 border-black bg-[#DAF5F0] p-4">
                <p className="text-sm font-semibold">What you will see:</p>
                <ul className="mt-2 grid gap-1 text-sm text-black/80">
                  <li>1. Git-like versions for each essay.</li>
                  <li>2. Workspace flow: manager → editor → compare.</li>
                  <li>3. Score/AI placeholders and university linkage direction.</li>
                </ul>
                <p className="mt-4 text-sm text-black/65">Demo length: ~{DEMO_DURATION_SECONDS}s (adjustable).</p>
                <div className="mt-2">
                  <Progress value={demoProgress} variant="primary" className="h-3" />
                </div>
                <p className="mt-2 text-xs text-black/60">
                  {demoPlaying
                    ? `Playing... ${demoSeconds}s / ${DEMO_DURATION_SECONDS}s`
                    : demoSeconds >= DEMO_DURATION_SECONDS
                      ? "Demo completed."
                      : "Ready to start demo."}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => void handleWatchDemo()} disabled={savingOnboarding || demoPlaying || demoSeconds >= DEMO_DURATION_SECONDS}>
                  {demoPlaying ? "Playing..." : demoSeconds >= DEMO_DURATION_SECONDS ? "Demo completed" : "Watch demo"}
                </Button>
                <Button variant="outline" onClick={() => void handleSkip()} disabled={savingOnboarding}>
                  {savingOnboarding ? <Spinner size="sm" /> : null}
                  <span>Skip</span>
                </Button>
                {demoSeconds >= DEMO_DURATION_SECONDS ? (
                  <Button variant="secondary" onClick={() => void markOnboardingSeen()} disabled={savingOnboarding}>
                    Continue to Essay Manager
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-black/10 bg-white/70 px-5 py-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-black/45">Workspace</p>
              <p className="mt-1 text-sm text-black/65">Manage drafts like GitHub: each essay keeps its own version history.</p>
            </div>
            <Button onClick={() => setShowCreate((prev) => !prev)}>{showCreate ? "Close" : "+ New Essay"}</Button>
          </div>

          {showCreate ? (
            <div className="rounded-[24px] border border-black/10 bg-[#FFF9E8] p-5">
              <div className="max-w-3xl">
                <CardTitle className="text-xl">Create New Essay</CardTitle>
                <p className="mt-1 text-sm text-black/65">Start a fresh draft without wrapping the form in another heavy card.</p>
              </div>

              <form onSubmit={createEssay} className="mt-5 grid gap-4">
                <label className="text-sm text-black/70">
                  Essay type
                  <select
                    value={form.essay_type}
                    onChange={(event) => applyEssayTypeTemplate(event.target.value as EssayType)}
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
                    className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  />
                </label>

                {requireSupplementalFields ? (
                  <>
                    <label className="text-sm text-black/70">
                      Search university
                      <input
                        value={universitySearch}
                        onChange={(event) => setUniversitySearch(event.target.value)}
                        placeholder="Start typing: Boston, Purdue, NYU..."
                        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                      />
                    </label>

                    <label className="text-sm text-black/70">
                      University
                      <select
                        value={form.university}
                        onChange={(event) => setForm((prev) => ({ ...prev, university: event.target.value }))}
                        disabled={universitiesLoading}
                        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                      >
                        {universitiesLoading ? <option value="">Loading...</option> : null}
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
                        placeholder="Example: Why this university?"
                        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                      />
                    </label>

                    <label className="text-sm text-black/70">
                      Prompt text
                      <textarea
                        rows={3}
                        value={form.prompt_text}
                        onChange={(event) => setForm((prev) => ({ ...prev, prompt_text: event.target.value }))}
                        placeholder="Example: Explain why this university is a strong academic, personal, and community fit for you."
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

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button type="submit" disabled={saving} className="min-w-[180px]">
                    {saving ? <Spinner size="sm" /> : null}
                    <span>{saving ? "Creating..." : "Create Essay"}</span>
                  </Button>
                  <p className="text-sm text-black/55">The draft opens immediately in the editor after creation.</p>
                </div>
              </form>
            </div>
          ) : null}

          {!loading && !essays.length ? (
            <div className="rounded-[24px] border border-dashed border-black/20 bg-white/75 px-5 py-6">
              <p className="text-sm font-semibold text-black">No essays yet.</p>
              <p className="mt-1 text-sm text-black/65">Start with a personal statement or create a university-specific draft.</p>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <Card key={`essay-sk-${idx}`} className="p-4 shadow-none">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                    <Skeleton className="mt-3 h-4 w-full" />
                  </Card>
                ))
              : essays.map((essay) => (
                  <Link key={essay.id} href={`/essays/${essay.id}`}>
                    <Card className="card-shadow-hover h-full p-4 shadow-none">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="max-w-[15rem] text-base leading-snug tracking-[-0.02em]">
                          {essay.title}
                        </CardTitle>
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
                      <p className="mt-3 text-xs text-black/55">
                        Last edited:{" "}
                        {essay.last_edited_at
                          ? formatDateTimeShort(essay.last_edited_at)
                          : "-"}
                      </p>
                    </Card>
                  </Link>
                ))}
          </div>

          {statusText ? <p className="text-sm text-black/65">{statusText}</p> : null}
        </section>
      </AppShell>
    </ProtectedPage>
  );
}

export default function EssaysPage() {
  return (
    <Suspense fallback={null}>
      <EssaysPageContent />
    </Suspense>
  );
}
