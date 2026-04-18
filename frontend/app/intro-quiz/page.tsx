"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { DeepWorkflowTheme } from "@/components/deep-workflow-theme";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getToken, hasStoredSession, refreshAccessToken } from "@/lib/auth";
import { getIntroQuizContent, getGpaScaleDetails, localizeIntroQuizAnswers } from "@/lib/intro-quiz-content";
import {
  INTRO_QUIZ_COMPLETED_STORAGE_KEY,
  INTRO_QUIZ_LINKED_STORAGE_KEY,
  hasPendingStoredIntroQuiz,
  readStoredIntroQuiz,
  type IntroQuizAnswers,
  syncStoredIntroQuizToProfile,
  writeStoredIntroQuiz,
} from "@/lib/intro-quiz";
import { resolvePostAuthDestination } from "@/lib/onboarding-gate";
import { cn } from "@/lib/utils";

const totalSteps = 7;

const initialAnswers: IntroQuizAnswers = {
  country: "",
  schoolLevel: "",
  intakeYear: "",
  major: "",
  gpaScale: "",
  gpaValue: "",
  tests: [],
  shortlistSize: "",
};

function sanitizeGpaInput(raw: string, max: number) {
  const normalized = raw.replace(",", ".");
  if (normalized === "") return "";
  if (!/^\d{0,3}(\.\d{0,2})?$/.test(normalized)) return null;
  const numeric = Number(normalized);
  if (!Number.isNaN(numeric) && numeric > max) {
    return null;
  }
  return normalized;
}

function normalizeGpaInput(raw: string, max: number, step: string) {
  if (!raw.trim()) return "";
  const numeric = Number(raw);
  if (Number.isNaN(numeric)) return "";

  const decimals = step.includes(".") ? step.split(".")[1]?.length ?? 0 : 0;
  const clamped = Math.max(0, Math.min(max, numeric));
  return String(Number(clamped.toFixed(decimals)));
}

function OptionGrid({
  options,
  value,
  onChange,
  multi = false,
  noTestsOption,
}: {
  options: string[];
  value: string | string[];
  onChange: (next: string | string[]) => void;
  multi?: boolean;
  noTestsOption?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const selected = multi ? (value as string[]).includes(option) : value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => {
              if (!multi) {
                onChange(option);
                return;
              }

              const current = value as string[];
              if (option === noTestsOption) {
                onChange(current.includes(option) ? [] : [option]);
                return;
              }

              const next = noTestsOption && current.includes(noTestsOption)
                ? []
                : [...current];
              onChange(next.includes(option) ? next.filter((item) => item !== option) : [...next, option]);
            }}
            className={cn(
              "surface-panel rounded-2xl border px-4 py-4 text-left text-base font-semibold text-[var(--enroll-fg)] transition",
              "hover:-translate-y-0.5 hover:border-[var(--enroll-surface-border-strong)]",
              selected && "border-[var(--enroll-yellow)] bg-[color-mix(in_srgb,var(--enroll-yellow)_18%,var(--enroll-surface-elevated))] text-[var(--enroll-fg)] ring-1 ring-[var(--enroll-yellow)] shadow-[0_4px_0_var(--enroll-strong-shadow)]",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function IntroQuizPage() {
  const { locale } = useLocale();
  const copy = getIntroQuizContent(locale);
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<IntroQuizAnswers>(initialAnswers);
  const [isAuthed, setIsAuthed] = useState(false);
  const [syncingProfile, setSyncingProfile] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [progressReady, setProgressReady] = useState(false);

  const resolveSessionToken = useCallback(async () => {
    const token = getToken();
    if (token) {
      return token;
    }

    if (!hasStoredSession()) {
      return "";
    }

    try {
      return await refreshAccessToken();
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    setIsAuthed(hasStoredSession());

    try {
      const linked = localStorage.getItem(INTRO_QUIZ_LINKED_STORAGE_KEY) === "1";
      if (linked) {
        void resolveSessionToken().then((token) => {
          if (!cancelled && token) {
            void resolvePostAuthDestination(token).then((destination) => {
              if (!cancelled) {
                router.replace(destination);
              }
            });
            return;
          }

          if (!cancelled) {
            router.replace("/register");
          }
        });
        return;
      }

      const parsed = readStoredIntroQuiz();
      if (parsed?.answers) {
        setAnswers(localizeIntroQuizAnswers({ ...initialAnswers, ...parsed.answers }, locale));
      }
      if (typeof parsed?.step === "number") {
        setStep(Math.min(Math.max(parsed.step, 0), totalSteps));
      }
    } catch {
      setAnswers(initialAnswers);
    } finally {
      if (!cancelled) {
        setProgressReady(true);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [locale, resolveSessionToken, router]);

  useEffect(() => {
    if (!progressReady) return;
    setAnswers((current) => localizeIntroQuizAnswers(current, locale));
  }, [locale, progressReady]);

  useEffect(() => {
    if (!progressReady) return;
    writeStoredIntroQuiz({ step, answers });
  }, [answers, progressReady, step]);

  useEffect(() => {
    if (!progressReady || step < totalSteps) return;
    localStorage.setItem(INTRO_QUIZ_COMPLETED_STORAGE_KEY, "1");
  }, [progressReady, step]);

  const progress = useMemo(
    () => Math.round((Math.min(step, totalSteps) / totalSteps) * 100),
    [step],
  );
  const currentStep = copy.steps[Math.min(step, totalSteps - 1)];
  const gpaDetails = getGpaScaleDetails(answers.gpaScale, locale);

  function isCurrentStepValid() {
    if (step === 0) return Boolean(answers.country);
    if (step === 1) return Boolean(answers.schoolLevel);
    if (step === 2) return Boolean(answers.intakeYear);
    if (step === 3) return Boolean(answers.major);
    if (step === 4) {
      if (!answers.gpaScale || !gpaDetails) return false;
      return gpaDetails.requiresValue ? Boolean(answers.gpaValue) : true;
    }
    if (step === 5) return Array.isArray(answers.tests) && answers.tests.length > 0;
    if (step === 6) return Boolean(answers.shortlistSize);
    return true;
  }

  async function handleAuthedContinue() {
    const token = await resolveSessionToken();
    if (!token) return;

    setSyncingProfile(true);
    setStatusText("");
    try {
      await syncStoredIntroQuizToProfile(token);
      if (!hasPendingStoredIntroQuiz()) {
        window.location.assign(await resolvePostAuthDestination(token));
      }
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : copy.saveError);
    } finally {
      setSyncingProfile(false);
      if (!hasPendingStoredIntroQuiz()) {
        setStatusText("");
      }
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  function handleGpaValueChange(raw: string) {
    if (!gpaDetails?.requiresValue) return;
    const nextValue = sanitizeGpaInput(raw, gpaDetails.max);
    if (nextValue == null) return;
    setAnswers((prev) => ({ ...prev, gpaValue: nextValue }));
  }

  function handleContinueToAuth(path: "/register" | "/login") {
    if (syncingProfile) return;
    window.location.assign(path);
  }

  return (
    <DeepWorkflowTheme>
      <main className="min-h-screen px-4 py-6 md:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="rounded-[28px] p-5 md:p-8">
            <div className="mb-8 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBack}
                aria-label={copy.back}
                className="h-12 w-12 rounded-2xl px-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Progress value={progress} variant="primary" className="h-4 flex-1 rounded-full" />
              <span className="w-14 text-right text-sm font-black text-[var(--enroll-fg)]">{progress}%</span>
            </div>

            <div className="space-y-6">
              {step < totalSteps ? (
                <>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--enroll-muted-strong)]">
                      {copy.step} {step + 1} {copy.of} {totalSteps}
                    </p>
                    <div className="space-y-2">
                      <h1 className="text-3xl font-black leading-tight text-[var(--enroll-fg)] md:text-5xl">
                        {currentStep.title}
                      </h1>
                      {currentStep.subtitle ? (
                        <p className="max-w-2xl text-base text-[var(--enroll-muted-strong)] md:text-lg">
                          {currentStep.subtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {step === 0 ? (
                      <OptionGrid
                        options={copy.countryOptions}
                        value={answers.country || ""}
                        onChange={(next) => setAnswers((prev) => ({ ...prev, country: String(next) }))}
                      />
                    ) : null}
                    {step === 1 ? (
                      <OptionGrid
                        options={copy.schoolLevelOptions}
                        value={answers.schoolLevel || ""}
                        onChange={(next) => setAnswers((prev) => ({ ...prev, schoolLevel: String(next) }))}
                      />
                    ) : null}
                    {step === 2 ? (
                      <OptionGrid
                        options={copy.intakeOptions}
                        value={answers.intakeYear || ""}
                        onChange={(next) => setAnswers((prev) => ({ ...prev, intakeYear: String(next) }))}
                      />
                    ) : null}
                    {step === 3 ? (
                      <OptionGrid
                        options={copy.majorOptions}
                        value={answers.major || ""}
                        onChange={(next) => setAnswers((prev) => ({ ...prev, major: String(next) }))}
                      />
                    ) : null}
                    {step === 4 ? (
                      <>
                        <OptionGrid
                          options={copy.gpaScaleOptions}
                          value={answers.gpaScale || ""}
                          onChange={(next) =>
                            setAnswers((prev) => ({
                              ...prev,
                              gpaScale: String(next),
                              gpaValue: "",
                            }))}
                        />
                        {gpaDetails?.requiresValue ? (
                          <div className="surface-inset rounded-2xl p-4 md:p-5">
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <label htmlFor="intro-quiz-gpa" className="text-sm font-semibold text-[var(--enroll-fg)]">
                                {copy.enterValue}
                              </label>
                              <span className="text-xs font-medium text-[var(--enroll-muted)]">
                                {copy.gpaInputHint}
                              </span>
                            </div>
                            <input
                              id="intro-quiz-gpa"
                              type="text"
                              inputMode="decimal"
                              value={answers.gpaValue || ""}
                              onChange={(event) => handleGpaValueChange(event.target.value)}
                              onBlur={() => {
                                if (!gpaDetails?.requiresValue) return;
                                setAnswers((prev) => ({
                                  ...prev,
                                  gpaValue: normalizeGpaInput(prev.gpaValue || "", gpaDetails.max, gpaDetails.step),
                                }));
                              }}
                              className="h-12 w-full rounded-2xl border border-[var(--enroll-surface-border-strong)] bg-[var(--enroll-surface-elevated)] px-4 text-base font-semibold text-[var(--enroll-fg)] outline-none focus:border-[var(--enroll-strong-border)] focus:ring-2 focus:ring-[var(--enroll-primary-ring)]"
                              placeholder={gpaDetails.placeholder}
                              aria-describedby="intro-quiz-gpa-hint"
                            />
                            <p id="intro-quiz-gpa-hint" className="mt-2 text-sm text-[var(--enroll-muted)]">
                              0-{gpaDetails.max}
                            </p>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                    {step === 5 ? (
                      <OptionGrid
                        options={copy.testOptions}
                        value={answers.tests || []}
                        multi
                        noTestsOption={copy.noTestsOption}
                        onChange={(next) => setAnswers((prev) => ({ ...prev, tests: next as string[] }))}
                      />
                    ) : null}
                    {step === 6 ? (
                      <OptionGrid
                        options={copy.shortlistOptions}
                        value={answers.shortlistSize || ""}
                        onChange={(next) => setAnswers((prev) => ({ ...prev, shortlistSize: String(next) }))}
                      />
                    ) : null}
                  </div>

                  <div className="flex justify-end border-t border-[var(--enroll-surface-border)] pt-6">
                    <Button
                      variant="primary"
                      size="lg"
                      disabled={!isCurrentStepValid()}
                      onClick={() => setStep((prev) => Math.min(prev + 1, totalSteps))}
                    >
                      {copy.next}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-5 rounded-[24px] border border-[var(--enroll-surface-border-strong)] bg-[var(--enroll-cyan)]/50 p-5 md:p-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--enroll-surface-border-strong)] bg-[var(--enroll-surface-elevated)] px-3 py-1.5 text-sm font-semibold text-[var(--enroll-fg)]">
                    <CheckCircle2 className="h-4 w-4" />
                    {copy.profileReady}
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-black text-[var(--enroll-fg)] md:text-4xl">{copy.completeTitle}</h1>
                    <p className="max-w-2xl text-base text-[var(--enroll-muted-strong)]">{copy.completeSubtitle}</p>
                  </div>
                  <div className="surface-inset rounded-2xl p-4 text-sm text-[var(--enroll-muted-strong)]">
                    <p>
                      {copy.summaryCountry}: <b>{answers.country || copy.unknownValue}</b> • {copy.summaryLevel}:{" "}
                      <b>{answers.schoolLevel || copy.unknownValue}</b> • {copy.summaryMajor}:{" "}
                      <b>{answers.major || copy.unknownValue}</b>
                    </p>
                    <p className="mt-2">
                      {copy.summaryPlan}: <b>{answers.intakeYear || copy.unknownValue}</b> • {copy.summaryShortlist}:{" "}
                      <b>{answers.shortlistSize || copy.unknownValue}</b>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {isAuthed ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        disabled={syncingProfile}
                        onClick={() => void handleAuthedContinue()}
                      >
                        {syncingProfile ? copy.saving : copy.goToDashboard}
                      </Button>
                    ) : (
                      <>
                        <Button type="button" variant="primary" size="lg" onClick={() => handleContinueToAuth("/register")}>
                          {copy.createAccount}
                        </Button>
                        <Button type="button" variant="outline" size="lg" onClick={() => handleContinueToAuth("/login")}>
                          {copy.login}
                        </Button>
                      </>
                    )}
                  </div>
                  {statusText ? <p className="text-sm font-medium text-red-500">{statusText}</p> : null}
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </DeepWorkflowTheme>
  );
}
