"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProtectedPage } from "@/components/protected-page";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type FieldType = "text" | "number" | "boolean" | "list";

type ProgressField = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  readonly: boolean;
  help: string;
  bind: "model" | "json" | "user";
  path: string;
  value: string | number | boolean | string[] | null;
  filled: boolean;
};

type Subsection = {
  key: string;
  title: string;
  completed_required: number;
  required_total: number;
  percent: number;
  fields: ProgressField[];
};

type Section = {
  key: string;
  title: string;
  completed_required: number;
  required_total: number;
  percent: number;
  subsections: Subsection[];
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

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ProgressField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <select
        value={typeof value === "boolean" ? String(value) : ""}
        disabled={field.readonly}
        onChange={(event) => onChange(event.target.value === "true")}
        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
      >
        <option value="">Select</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        value={typeof value === "number" ? value : value || ""}
        disabled={field.readonly}
        onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))}
        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
      />
    );
  }

  if (field.type === "list") {
    const current = Array.isArray(value) ? value.join(", ") : "";
    return (
      <input
        value={current}
        disabled={field.readonly}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          )
        }
        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
        placeholder="Comma separated values"
      />
    );
  }

  return (
    <input
      value={typeof value === "string" ? value : value ?? ""}
      disabled={field.readonly}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
    />
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string>("");
  const [statusText, setStatusText] = useState("");
  const [stats, setStats] = useState<Stats>({ universities: 0, tasks: 0, documents: 0 });
  const [progressData, setProgressData] = useState<CommonAppProgress | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, unknown>>({});

  async function loadData() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [progress, universities, tasks, documents] = await Promise.all([
        apiFetch<CommonAppProgress>("/api/auth/common-app-progress/", { method: "GET" }, token),
        apiFetch<unknown[]>("/api/my-universities/", { method: "GET" }, token),
        apiFetch<unknown[]>("/api/tasks/", { method: "GET" }, token),
        apiFetch<unknown[]>("/api/documents/", { method: "GET" }, token),
      ]);
      setProgressData(progress);
      setStats({
        universities: universities.length,
        tasks: tasks.length,
        documents: documents.length,
      });

      const nextDrafts: Record<string, unknown> = {};
      for (const section of progress.sections) {
        for (const subsection of section.subsections) {
          for (const field of subsection.fields) {
            nextDrafts[`${section.key}.${subsection.key}.${field.id}`] = field.value;
          }
        }
      }
      setDraftValues(nextDrafts);
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to load dashboard progress.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const sectionCount = progressData?.sections.length || 0;
  const completedSections = useMemo(
    () => (progressData?.sections.filter((section) => section.percent === 100).length || 0),
    [progressData],
  );

  async function saveSubsection(section: Section, subsection: Subsection) {
    const token = getToken();
    if (!token) return;
    const payloadModel: Record<string, unknown> = {};
    const payloadJson: Record<string, unknown> = {};

    for (const field of subsection.fields) {
      if (field.readonly || field.bind === "user") continue;
      const key = `${section.key}.${subsection.key}.${field.id}`;
      const value = draftValues[key];
      if (field.bind === "model") {
        payloadModel[field.path] = value;
      } else {
        payloadJson[field.path] = value;
      }
    }

    setSavingKey(`${section.key}.${subsection.key}`);
    try {
      await apiFetch(
        "/api/auth/profile/",
        {
          method: "PATCH",
          body: JSON.stringify({
            ...payloadModel,
            common_app_profile: payloadJson,
          }),
        },
        token,
      );
      await loadData();
      setStatusText(`Saved: ${section.title} / ${subsection.title}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to save subsection.");
    } finally {
      setSavingKey("");
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Dashboard" subtitle="Common App profile completion and section-by-section progress">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardDescription>Common App completion</CardDescription>
            {loading || !progressData ? (
              <Skeleton className="mt-3 h-8 w-24" />
            ) : (
              <p className="mt-3 text-2xl font-semibold">
                {progressData.overall.percent}% ({progressData.overall.completed_required}/{progressData.overall.required_total})
              </p>
            )}
          </Card>
          <Card className="shadow-none">
            <CardDescription>Sections completed</CardDescription>
            {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-3 text-2xl font-semibold">{completedSections}/{sectionCount}</p>}
          </Card>
          <Card className="shadow-none">
            <CardDescription>Saved universities</CardDescription>
            {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-3 text-2xl font-semibold">{stats.universities}</p>}
          </Card>
          <Card className="shadow-none">
            <CardDescription>Tasks / Documents</CardDescription>
            {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-3 text-2xl font-semibold">{stats.tasks} / {stats.documents}</p>}
          </Card>
        </div>

        <Card className="mt-5 shadow-none">
          <CardTitle>Overall progress</CardTitle>
          <CardDescription className="mt-2">
            Fill each required field from Common App sections. You can save subsection-by-subsection.
          </CardDescription>
          <div className="mt-4">
            <Progress value={loading || !progressData ? 0 : progressData.overall.percent} variant="primary" className="h-3" />
          </div>
          {loading ? (
            <div className="mt-4">
              <Spinner size="md" label="Loading profile progress..." />
            </div>
          ) : null}
        </Card>

        <div className="mt-5 grid gap-4">
          {(progressData?.sections || []).map((section) => (
            <Card key={section.key} className="shadow-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {section.completed_required}/{section.required_total} required fields completed
                  </CardDescription>
                </div>
                <Badge variant={section.percent === 100 ? "cyan" : "orange"}>{section.percent}%</Badge>
              </div>
              <div className="mt-3">
                <Progress value={section.percent} variant={section.percent === 100 ? "cyan" : "primary"} className="h-3" />
              </div>

              <div className="mt-4 space-y-3">
                {section.subsections.map((subsection) => (
                  <details key={subsection.key} className="rounded-xl border border-black/10 bg-white p-3">
                    <summary className="cursor-pointer text-sm font-semibold">
                      {subsection.title} - {subsection.percent}%
                    </summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {subsection.fields.map((field) => {
                        const fieldKey = `${section.key}.${subsection.key}.${field.id}`;
                        return (
                          <label key={field.id} className="text-sm text-black/75">
                            <span className="font-semibold">
                              {field.label}
                              {field.required ? <span className="ml-1 text-red-600">*</span> : null}
                              {field.readonly ? <span className="ml-1 text-xs text-black/45">(readonly)</span> : null}
                            </span>
                            <FieldInput
                              field={field}
                              value={draftValues[fieldKey]}
                              onChange={(next) => setDraftValues((prev) => ({ ...prev, [fieldKey]: next }))}
                            />
                            <span className="mt-1 block text-xs text-black/55">{field.help}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        onClick={() => void saveSubsection(section, subsection)}
                        disabled={savingKey === `${section.key}.${subsection.key}`}
                      >
                        {savingKey === `${section.key}.${subsection.key}` ? <Spinner size="sm" /> : null}
                        <span>Save subsection</span>
                      </Button>
                    </div>
                  </details>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {statusText ? <p className="mt-4 text-sm text-black/70">{statusText}</p> : null}
      </AppShell>
    </ProtectedPage>
  );
}
