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
import { DeepWorkflowTheme } from "@/components/deep-workflow-theme";
import { clearSessionCaches, readSessionCache, SESSION_CACHE_KEYS, SESSION_CACHE_TTLS, writeSessionCache } from "@/lib/session-cache";

type CommonAppCachePayload = {
  progressData: CommonAppProgress;
  draftValues: Record<string, unknown>;
};

function CommonAppPageContent() {
  const searchParams = useSearchParams();
  const STEP_STORAGE_KEY = "common_app.current_step_id";
  const SCROLL_STORAGE_KEY = "common_app.scroll_y";
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [cacheReady, setCacheReady] = useState(false);
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

  const liveProgress = useMemo(() => computeLiveProgress(progressData, draftValues), [progressData, draftValues]);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const { payload: cached, isFresh } = readSessionCache<CommonAppCachePayload>(
      SESSION_CACHE_KEYS.commonApp,
      SESSION_CACHE_TTLS.commonApp,
      token,
    );

    if (cached) {
      setProgressData(cached.progressData);
      setDraftValues(cached.draftValues);
      setLoading(false);
      setHydrated(true);
      setCacheReady(true);
      lastAutosavedPayloadRef.current = JSON.stringify(cached.draftValues);
    } else {
      setLoading(true);
    }

    if (isFresh) {
      setStatusText("");
      return;
    }

    try {
      const progress = await apiFetch<CommonAppProgress>("/api/auth/common-app-progress/", { method: "GET" }, token);
      const nextDrafts: Record<string, unknown> = {};

      for (const section of progress.sections) {
        for (const subsection of section.subsections) {
          for (const field of subsection.fields) {
            nextDrafts[`${section.key}.${subsection.key}.${field.id}`] = field.value;
          }
        }
      }

      setProgressData(progress);
      setDraftValues(nextDrafts);
      setStatusText("");
      lastAutosavedPayloadRef.current = JSON.stringify(nextDrafts);
      writeSessionCache(SESSION_CACHE_KEYS.commonApp, {
        progressData: progress,
        draftValues: nextDrafts,
      }, token);
      setCacheReady(true);
    } catch (error) {
      if (!cached) {
        setStatusText(error instanceof Error ? error.message : "Failed to load Common App sections.");
      }
    } finally {
      setLoading(false);
      setHydrated(true);
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
  }, [currentStep, loading]);

  useEffect(() => {
    const token = getToken();
    if (!token || loading || !hydrated || !cacheReady || !progressData) return;
    writeSessionCache(SESSION_CACHE_KEYS.commonApp, {
      progressData,
      draftValues,
    }, token);
  }, [cacheReady, draftValues, hydrated, loading, progressData]);

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

        clearSessionCaches([SESSION_CACHE_KEYS.dashboard]);
        setCacheReady(true);
        if (!silent) setStatusText(`Saved: ${currentStep.sectionTitle} / ${currentStep.subsectionTitle}`);
        return true;
      } catch (error) {
        setStatusText(error instanceof Error ? error.message : "Failed to save step.");
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
        setStatusText("Draft autosaved.");
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
      <AppShell title="Common Application" subtitle="Complete your application in guided steps.">
        <DeepWorkflowTheme>
          <div className="theme-workflow space-y-5">
            <Card className="shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Application readiness</CardTitle>
              <CardDescription className="mt-2">
                Step {Math.min(currentStepIndex + 1, Math.max(steps.length, 1))} of {Math.max(steps.length, 1)}
                {" · "}
                about {stepEstimatedMinutes} min
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
              <Card className="shadow-none">
                <Spinner size="md" label="Loading Common App steps..." />
              </Card>
            ) : null}

            {!loading && currentStep ? (
              <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
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
          </div>
        </DeepWorkflowTheme>
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
