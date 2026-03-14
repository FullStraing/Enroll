"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  buildSectionStartIndexes,
  buildSteps,
  buildSubsectionStepIndexes,
  CommonAppProgress,
  computeLiveProgress,
  getDraftKey,
  isFieldRequired,
  isFieldVisible,
  ProgressField,
} from "@/lib/common-app-progress";
import { SectionNav } from "@/components/common-app/section-nav";
import { StepForm } from "@/components/common-app/step-form";

function CommonAppPageContent() {
  const searchParams = useSearchParams();
  const STEP_STORAGE_KEY = "common_app.current_step_id";
  const SCROLL_STORAGE_KEY = "common_app.scroll_y";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [progressData, setProgressData] = useState<CommonAppProgress | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, unknown>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutosavedPayloadRef = useRef<string>("");
  const restoredStepIdRef = useRef<string | null>(null);
  const restoredScrollYRef = useRef<number | null>(null);
  const hasRestoredStepRef = useRef(false);
  const hasRestoredScrollRef = useRef(false);

  const steps = useMemo(() => buildSteps(progressData), [progressData]);
  const sectionStartIndexes = useMemo(() => buildSectionStartIndexes(progressData), [progressData]);
  const subsectionStepIndexes = useMemo(() => buildSubsectionStepIndexes(progressData), [progressData]);
  const currentStep = steps[currentStepIndex] || null;

  const visibleFields = useMemo(() => {
    if (!currentStep) return [];
    return currentStep.subsection.fields.filter((field) => isFieldVisible(draftValues, currentStep, field));
  }, [currentStep, draftValues]);

  const stepEstimatedMinutes = useMemo(() => {
    if (!currentStep) return 1;
    const requiredCount = visibleFields.filter((field) => isFieldRequired(draftValues, currentStep, field)).length;
    return Math.max(1, Math.ceil(requiredCount / 2));
  }, [currentStep, draftValues, visibleFields]);

  const liveProgress = useMemo(
    () => computeLiveProgress(progressData, draftValues),
    [progressData, draftValues],
  );

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    restoredStepIdRef.current = window.localStorage.getItem(STEP_STORAGE_KEY);
    const storedScroll = window.localStorage.getItem(SCROLL_STORAGE_KEY);
    if (storedScroll) {
      const parsed = Number(storedScroll);
      if (Number.isFinite(parsed)) restoredScrollYRef.current = parsed;
    }
  }, []);

  useEffect(() => {
    if (!steps.length || hasRestoredStepRef.current) return;
    const sectionParam = searchParams.get("section");
    if (sectionParam && sectionStartIndexes[sectionParam] != null) {
      setCurrentStepIndex(sectionStartIndexes[sectionParam]);
      hasRestoredStepRef.current = true;
      return;
    }
    const restoredStepId = restoredStepIdRef.current;
    if (restoredStepId) {
      const restoredIndex = steps.findIndex((step) => step.id === restoredStepId);
      if (restoredIndex >= 0) setCurrentStepIndex(restoredIndex);
    }
    hasRestoredStepRef.current = true;
  }, [searchParams, sectionStartIndexes, steps]);

  useEffect(() => {
    if (!steps.length) return;
    if (currentStepIndex > steps.length - 1) setCurrentStepIndex(steps.length - 1);
  }, [steps, currentStepIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!currentStep) return;
    window.localStorage.setItem(STEP_STORAGE_KEY, currentStep.id);
  }, [currentStep]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      window.localStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (loading || hasRestoredScrollRef.current) return;
    const y = restoredScrollYRef.current;
    if (y === null) {
      hasRestoredScrollRef.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      window.scrollTo({ top: y, behavior: "auto" });
      hasRestoredScrollRef.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loading, currentStep]);

  const saveStep = useCallback(
    async (silent = false) => {
      if (!currentStep) return false;
      const token = getToken();
      if (!token) return false;
      const payloadModel: Record<string, unknown> = {};
      const payloadJson: Record<string, unknown> = {};

      for (const field of currentStep.subsection.fields) {
        if (!isFieldVisible(draftValues, currentStep, field)) continue;
        if (field.readonly || field.bind === "user") continue;
        const key = getDraftKey(currentStep, field.id);
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
        if (!silent) setStatusText(`Сохранено: ${currentStep.sectionTitle} / ${currentStep.subsectionTitle}`);
        return true;
      } catch (error) {
        setStatusText(error instanceof Error ? error.message : "Не удалось сохранить шаг.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [currentStep, draftValues],
  );

  useEffect(() => {
    if (!currentStep || loading) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      const subset: Record<string, unknown> = {};
      for (const field of currentStep.subsection.fields) {
        if (!isFieldVisible(draftValues, currentStep, field) || field.readonly || field.bind === "user") continue;
        subset[getDraftKey(currentStep, field.id)] = draftValues[getDraftKey(currentStep, field.id)];
      }
      const signature = JSON.stringify({ step: currentStep.id, subset });
      if (signature === lastAutosavedPayloadRef.current) return;
      const ok = await saveStep(true);
      if (ok) {
        lastAutosavedPayloadRef.current = signature;
        setStatusText("Черновик сохранен автоматически");
      }
    }, 700);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [currentStep, draftValues, loading, saveStep]);

  const handleContinue = async () => {
    const ok = await saveStep();
    if (!ok) return;
    await loadData();
    if (currentStepIndex < steps.length - 1) setCurrentStepIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStepIndex > 0) setCurrentStepIndex((prev) => prev - 1);
  };

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
                : `${liveProgress?.overall.percent ?? progressData.overall.percent}% (${liveProgress?.overall.completed ?? progressData.overall.completed_required}/${liveProgress?.overall.total ?? progressData.overall.required_total})`}
            </Badge>
          </div>
          <div className="mt-4">
            <Progress
              value={loading || !progressData ? 0 : (liveProgress?.overall.percent ?? progressData.overall.percent)}
              variant="primary"
              className="h-3"
            />
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
              <SectionNav
                progressData={progressData}
                currentStep={currentStep}
                sectionStartIndexes={sectionStartIndexes}
                subsectionStepIndexes={subsectionStepIndexes}
                liveProgress={liveProgress}
                onSelectStep={setCurrentStepIndex}
              />
            </Card>
            <StepForm
              currentStep={currentStep}
              visibleFields={visibleFields as ProgressField[]}
              draftValues={draftValues}
              isFieldRequired={(step, field) => isFieldRequired(draftValues, step, field)}
              setDraftValues={setDraftValues}
              saving={saving}
              statusText={statusText}
              onBack={handleBack}
              onContinue={handleContinue}
              currentStepIndex={currentStepIndex}
              totalSteps={steps.length}
              liveProgress={liveProgress}
            />
          </div>
        ) : null}
      </AppShell>
    </ProtectedPage>
  );
}

export default function CommonAppPage() {
  return (
    <Suspense fallback={null}>
      <CommonAppPageContent />
    </Suspense>
  );
}
