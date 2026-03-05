"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FieldType = "text" | "number" | "boolean" | "list" | "choice" | "date";

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
  options?: string[];
  visible?: boolean;
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

type Step = {
  id: string;
  sectionTitle: string;
  subsectionTitle: string;
  section: Section;
  subsection: Subsection;
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

  if (field.type === "date") {
    return (
      <input
        type="date"
        value={typeof value === "string" ? value : ""}
        disabled={field.readonly}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
      />
    );
  }

  if (field.type === "choice") {
    const options = field.options || [];
    const isYesNo = options.length === 2 && options.includes("Yes") && options.includes("No");
    if (isYesNo) {
      return (
        <div className="mt-2 space-y-2">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-black/80">
              <input
                type="radio"
                name={`${field.path}-${field.id}`}
                checked={value === option}
                disabled={field.readonly}
                onChange={() => onChange(option)}
                className="h-4 w-4 border-black/30"
              />
              <span>{option === "Yes" ? "Да" : "Нет"}</span>
            </label>
          ))}
        </div>
      );
    }
    return (
      <select
        value={typeof value === "string" ? value : ""}
        disabled={field.readonly}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
      >
        <option value="">Выбери</option>
        {(field.options || []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
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
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [progressData, setProgressData] = useState<CommonAppProgress | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, unknown>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutosavedPayloadRef = useRef<string>("");

  const steps = useMemo<Step[]>(() => {
    if (!progressData) return [];
    return progressData.sections.flatMap((section) =>
      section.subsections.map((subsection) => ({
        id: `${section.key}.${subsection.key}`,
        sectionTitle: section.title,
        subsectionTitle: subsection.title,
        section,
        subsection,
      })),
    );
  }, [progressData]);

  const currentStep = steps[currentStepIndex] || null;
  const visibleFields = useMemo(
    () => currentStep?.subsection.fields.filter((field) => field.visible !== false) || [],
    [currentStep],
  );

  const stepEstimatedMinutes = useMemo(() => {
    const requiredCount = visibleFields.filter((field) => field.required).length;
    return Math.max(1, Math.ceil(requiredCount / 2));
  }, [visibleFields]);

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
      lastAutosavedPayloadRef.current = JSON.stringify(nextDrafts);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось загрузить секции Common App.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!steps.length) return;
    if (currentStepIndex > steps.length - 1) setCurrentStepIndex(steps.length - 1);
  }, [steps, currentStepIndex]);

  const saveStep = useCallback(async (step: Step, silent = false) => {
    const token = getToken();
    if (!token) return false;
    const payloadModel: Record<string, unknown> = {};
    const payloadJson: Record<string, unknown> = {};

    for (const field of step.subsection.fields) {
      if (field.visible === false) continue;
      if (field.readonly || field.bind === "user") continue;
      const key = `${step.section.key}.${step.subsection.key}.${field.id}`;
      const value = draftValues[key];
      if (field.bind === "model") payloadModel[field.path] = value;
      else payloadJson[field.path] = value;
    }

    setSaving(true);
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
      if (!silent) setStatusText(`Сохранено: ${step.sectionTitle} / ${step.subsectionTitle}`);
      return true;
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось сохранить шаг.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [draftValues]);

  useEffect(() => {
    if (!currentStep || loading) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      const subset: Record<string, unknown> = {};
      for (const field of currentStep.subsection.fields) {
        if (field.visible === false || field.readonly || field.bind === "user") continue;
        const key = `${currentStep.section.key}.${currentStep.subsection.key}.${field.id}`;
        subset[key] = draftValues[key];
      }
      const signature = JSON.stringify({ step: currentStep.id, subset });
      if (signature === lastAutosavedPayloadRef.current) return;
      const ok = await saveStep(currentStep, true);
      if (ok) {
        lastAutosavedPayloadRef.current = signature;
        setStatusText("Черновик сохранен автоматически");
      }
    }, 700);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [draftValues, currentStep, loading, saveStep]);

  async function handleContinue() {
    if (!currentStep) return;
    const ok = await saveStep(currentStep);
    if (!ok) return;
    await loadData();
    if (currentStepIndex < steps.length - 1) setCurrentStepIndex((prev) => prev + 1);
  }

  async function handleBack() {
    if (currentStepIndex > 0) setCurrentStepIndex((prev) => prev - 1);
  }

  return (
    <ProtectedPage>
      <AppShell title="Common Application" subtitle="Заполняй заявку пошагово, как onboarding">
        <Card className="shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Application readiness</CardTitle>
              <CardDescription className="mt-2">
                Шаг {Math.min(currentStepIndex + 1, Math.max(steps.length, 1))} из {Math.max(steps.length, 1)}
                {" · "}
                примерно {stepEstimatedMinutes} мин
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
        </Card>

        {loading ? (
          <Card className="mt-5 shadow-none">
            <Spinner size="md" label="Загружаем шаги Common App..." />
          </Card>
        ) : null}

        {!loading && currentStep ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr]">
            <Card className="h-fit shadow-none">
              <CardTitle>Шаги</CardTitle>
              <div className="mt-3 space-y-2">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStepIndex(index)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      index === currentStepIndex
                        ? "border-black bg-white font-semibold"
                        : "border-black/10 bg-white/70 hover:border-black/30"
                    }`}
                  >
                    <p className="text-xs text-black/55">{step.sectionTitle}</p>
                    <p>{step.subsectionTitle}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="shadow-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardDescription>{currentStep.sectionTitle}</CardDescription>
                  <CardTitle className="mt-1">{currentStep.subsectionTitle}</CardTitle>
                </div>
                <Badge variant={currentStep.subsection.percent === 100 ? "cyan" : "orange"}>
                  {currentStep.subsection.percent}%
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {visibleFields.map((field) => {
                  const fieldKey = `${currentStep.section.key}.${currentStep.subsection.key}.${field.id}`;
                  return (
                    <label key={field.id} className="text-sm text-black/80">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <span>
                          {field.label}
                          {field.required ? <span className="ml-1 text-red-600">*</span> : null}
                          {field.readonly ? <span className="ml-1 text-xs text-black/45">(только чтение)</span> : null}
                        </span>
                        <span
                          title={field.help}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/30 text-xs text-black/60"
                        >
                          ?
                        </span>
                      </span>
                      <FieldInput
                        field={field}
                        value={draftValues[fieldKey]}
                        onChange={(next) => setDraftValues((prev) => ({ ...prev, [fieldKey]: next }))}
                      />
                    </label>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
                <p className="text-xs text-black/55">{saving ? "Сохраняем..." : statusText || "Изменения сохраняются автоматически"}</p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => void handleBack()} disabled={currentStepIndex === 0 || saving}>
                    Назад
                  </Button>
                  <Button type="button" onClick={() => void handleContinue()} disabled={saving}>
                    {saving ? <Spinner size="sm" /> : null}
                    <span>{currentStepIndex === steps.length - 1 ? "Завершить шаги" : "Continue"}</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </AppShell>
    </ProtectedPage>
  );
}
