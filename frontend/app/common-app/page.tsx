"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
        <option value="">Выбери</option>
        <option value="true">Да</option>
        <option value="false">Нет</option>
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
        placeholder="Значения через запятую"
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

export default function CommonAppPage() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [statusText, setStatusText] = useState("");
  const [progressData, setProgressData] = useState<CommonAppProgress | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, unknown>>({});

  async function loadData() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const progress = await apiFetch<CommonAppProgress>("/api/auth/common-app-progress/", { method: "GET" }, token);
      setProgressData(progress);
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
        setStatusText(error instanceof Error ? error.message : "Не удалось загрузить секции Common App.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function saveSubsection(section: Section, subsection: Subsection) {
    const token = getToken();
    if (!token) return;
    const payloadModel: Record<string, unknown> = {};
    const payloadJson: Record<string, unknown> = {};

    for (const field of subsection.fields) {
      if (field.readonly || field.bind === "user") continue;
      const key = `${section.key}.${subsection.key}.${field.id}`;
      const value = draftValues[key];
      if (field.bind === "model") payloadModel[field.path] = value;
      else payloadJson[field.path] = value;
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
      setStatusText(`Сохранено: ${section.title} / ${subsection.title}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось сохранить раздел.");
    } finally {
      setSavingKey("");
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Common Application" subtitle="Заполняй профиль по секциям с подсказками по каждому полю">
        <Card className="shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Общий прогресс</CardTitle>
              <CardDescription className="mt-2">
                Сначала заполни обязательные поля. В каждом подразделе есть пояснение, что означает поле.
              </CardDescription>
            </div>
            <Badge variant="primary">
              {loading || !progressData
                ? "0%"
                : `${progressData.overall.percent}% (${progressData.overall.completed_required}/${progressData.overall.required_total})`}
            </Badge>
          </div>
          <div className="mt-4">
            <Progress value={loading || !progressData ? 0 : progressData.overall.percent} variant="primary" className="h-3" />
          </div>
          {loading ? (
            <div className="mt-4">
              <Spinner size="md" label="Загружаем секции Common App..." />
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
                    {section.completed_required}/{section.required_total} обязательных полей заполнено
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
                              {field.readonly ? <span className="ml-1 text-xs text-black/45">(только чтение)</span> : null}
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
                        <span>Сохранить подраздел</span>
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
