"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/locale-provider";
import { getToken } from "@/lib/auth";
import {
  INTRO_QUIZ_COMPLETED_STORAGE_KEY,
  INTRO_QUIZ_LINKED_STORAGE_KEY,
  hasPendingStoredIntroQuiz,
  readStoredIntroQuiz,
  syncStoredIntroQuizToProfile,
  writeStoredIntroQuiz,
} from "@/lib/intro-quiz";
import { resolvePostAuthDestination } from "@/lib/onboarding-gate";
import { getProductCopy } from "@/lib/product-copy";
import { DeepWorkflowTheme } from "@/components/deep-workflow-theme";

type IntroAnswers = {
  country: string;
  schoolLevel: string;
  intakeYear: string;
  major: string;
  gpaScale: string;
  gpaValue: string;
  tests: string[];
  shortlistSize: string;
};

const totalSteps = 7;

const initialAnswers: IntroAnswers = {
  country: "",
  schoolLevel: "",
  intakeYear: "",
  major: "",
  gpaScale: "",
  gpaValue: "",
  tests: [],
  shortlistSize: "",
};

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

              const next = noTestsOption && current.includes(noTestsOption) ? [] : [...current];
              onChange(next.includes(option) ? next.filter((item) => item !== option) : [...next, option]);
            }}
            className={`rounded-2xl border-2 px-4 py-4 text-left text-base font-semibold transition ${
              selected ? "border-black bg-[#DAF5F0] shadow-[0_4px_0_#000]" : "border-black/20 bg-white hover:border-black"
            }`}
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
  const copy = getProductCopy(locale).introQuiz;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<IntroAnswers>(initialAnswers);
  const [isAuthed, setIsAuthed] = useState(false);
  const [syncingProfile, setSyncingProfile] = useState(false);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsAuthed(Boolean(getToken()));
    try {
      const linked = localStorage.getItem(INTRO_QUIZ_LINKED_STORAGE_KEY) === "1";
      if (linked) {
        const token = getToken();
        if (token) {
          void resolvePostAuthDestination(token).then((destination) => {
            if (!cancelled) {
              router.replace(destination);
            }
          });
        } else {
          router.replace("/register");
        }
        return;
      }
      const parsed = readStoredIntroQuiz() as { step: number; answers: IntroAnswers } | null;
      if (!parsed) return;
      if (parsed.answers) setAnswers({ ...initialAnswers, ...parsed.answers });
      if (typeof parsed.step === "number") setStep(Math.min(Math.max(parsed.step, 0), totalSteps));
    } catch {
      // ignore invalid local data
    }
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    writeStoredIntroQuiz({ step, answers });
  }, [step, answers]);

  useEffect(() => {
    if (step < totalSteps) return;
    localStorage.setItem(INTRO_QUIZ_COMPLETED_STORAGE_KEY, "1");
  }, [step]);

  const progress = useMemo(() => Math.round((Math.min(step, totalSteps) / totalSteps) * 100), [step]);

  function isCurrentStepValid() {
    if (step === 0) return Boolean(answers.country);
    if (step === 1) return Boolean(answers.schoolLevel);
    if (step === 2) return Boolean(answers.intakeYear);
    if (step === 3) return Boolean(answers.major);
    if (step === 4) {
      if (!answers.gpaScale) return false;
      if (answers.gpaScale === copy.gpaScaleOptions[copy.gpaScaleOptions.length - 1]) return true;
      return Boolean(answers.gpaValue);
    }
    if (step === 5) return answers.tests.length > 0;
    if (step === 6) return Boolean(answers.shortlistSize);
    return true;
  }

  async function handleAuthedContinue() {
    const token = getToken();
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

  async function handleContinueToAuth(path: "/register" | "/login") {
    if (syncingProfile) return;
    window.location.assign(path);
  }

  return (
    <DeepWorkflowTheme>
      <main className="theme-workflow min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <Card className="p-5 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-white"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              disabled={step === 0}
              aria-label={copy.back}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Progress value={progress} variant="primary" className="h-4" />
            <span className="w-12 text-right text-sm font-bold">{progress}%</span>
          </div>

          <div className="mb-7 grid gap-4 rounded-2xl border-2 border-black/15 bg-white p-4 md:grid-cols-[120px_1fr]">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-black bg-[#DAF5F0] text-4xl">🎓</div>
            <div className="rounded-2xl border-2 border-black/15 bg-[#F8F9FA] px-4 py-3">
              <p className="text-base font-bold">{copy.greetingTitle}</p>
              <p className="mt-1 text-sm text-black/70">{copy.greetingBody}</p>
            </div>
          </div>

          <p className="text-sm font-semibold text-black/55">
            {copy.step} {Math.min(step + 1, totalSteps)} {copy.of} {totalSteps}
          </p>
          <h1 className="mt-1 text-3xl font-black leading-tight md:text-4xl">
            {step < totalSteps ? copy.steps[step].title : copy.completeTitle}
          </h1>
          <p className="mt-2 text-base text-black/65">
            {step < totalSteps ? copy.steps[step].subtitle : copy.completeSubtitle}
          </p>

          <div className="mt-7 space-y-4">
            {step === 0 ? (
              <OptionGrid
                options={copy.countryOptions}
                value={answers.country}
                onChange={(next) => setAnswers((prev) => ({ ...prev, country: String(next) }))}
              />
            ) : null}
            {step === 1 ? (
              <OptionGrid
                options={copy.schoolLevelOptions}
                value={answers.schoolLevel}
                onChange={(next) => setAnswers((prev) => ({ ...prev, schoolLevel: String(next) }))}
              />
            ) : null}
            {step === 2 ? (
              <OptionGrid
                options={copy.intakeOptions}
                value={answers.intakeYear}
                onChange={(next) => setAnswers((prev) => ({ ...prev, intakeYear: String(next) }))}
              />
            ) : null}
            {step === 3 ? (
              <OptionGrid
                options={copy.majorOptions}
                value={answers.major}
                onChange={(next) => setAnswers((prev) => ({ ...prev, major: String(next) }))}
              />
            ) : null}

            {step === 4 ? (
              <>
                <OptionGrid
                  options={copy.gpaScaleOptions}
                  value={answers.gpaScale}
                  onChange={(next) => setAnswers((prev) => ({ ...prev, gpaScale: String(next), gpaValue: "" }))}
                />
                {answers.gpaScale && answers.gpaScale !== copy.gpaScaleOptions[copy.gpaScaleOptions.length - 1] ? (
                  <div className="rounded-2xl border-2 border-black/15 bg-white p-4">
                    <label className="mb-2 block text-sm font-semibold">{copy.enterValue}</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={answers.gpaScale.includes("4.0") ? 4 : answers.gpaScale.includes("5.0") ? 5 : 100}
                      value={answers.gpaValue}
                      onChange={(event) => setAnswers((prev) => ({ ...prev, gpaValue: event.target.value }))}
                      className="h-11 w-full rounded-xl border-2 border-black px-3"
                      placeholder={
                        answers.gpaScale.includes("Процент") || answers.gpaScale.includes("Percentage")
                          ? copy.valuePercentExample
                          : copy.valueGpaExample
                      }
                    />
                  </div>
                ) : null}
              </>
            ) : null}

            {step === 5 ? (
              <OptionGrid
                options={copy.testOptions}
                value={answers.tests}
                multi
                noTestsOption={copy.noTestsOption}
                onChange={(next) => setAnswers((prev) => ({ ...prev, tests: next as string[] }))}
              />
            ) : null}
            {step === 6 ? (
              <OptionGrid
                options={copy.shortlistOptions}
                value={answers.shortlistSize}
                onChange={(next) => setAnswers((prev) => ({ ...prev, shortlistSize: String(next) }))}
              />
            ) : null}

            {step >= totalSteps ? (
              <div className="rounded-2xl border-2 border-black bg-[#DAF5F0] p-5">
                <div className="mb-3 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-1 text-sm font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  {copy.profileReady}
                </div>
                <p className="text-sm text-black/75">
                  {copy.summaryCountry}: <b>{answers.country || copy.unknownValue}</b> · {copy.summaryLevel}: <b>{answers.schoolLevel || copy.unknownValue}</b> · {copy.summaryMajor}: <b>{answers.major || copy.unknownValue}</b>
                </p>
                <p className="mt-1 text-sm text-black/75">
                  {copy.summaryPlan}: <b>{answers.intakeYear || copy.unknownValue}</b> · {copy.summaryShortlist}: <b>{answers.shortlistSize || copy.unknownValue}</b>
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {isAuthed ? (
                    <button
                      type="button"
                      onClick={() => void handleAuthedContinue()}
                      disabled={syncingProfile}
                      className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-black bg-[#FFDB58] px-5 text-sm font-semibold transition hover:-translate-y-0.5"
                    >
                      {syncingProfile ? copy.saving : copy.goToDashboard}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleContinueToAuth("/register")}
                        className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-black bg-[#FFDB58] px-5 text-sm font-semibold transition hover:-translate-y-0.5"
                      >
                        {copy.createAccount}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleContinueToAuth("/login")}
                        className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-black bg-white px-5 text-sm font-semibold transition hover:bg-black/5"
                      >
                        {copy.login}
                      </button>
                    </>
                  )}
                </div>
                {statusText ? <p className="mt-3 text-sm text-red-600">{statusText}</p> : null}
              </div>
            ) : null}
          </div>

          {step < totalSteps ? (
            <div className="mt-8 flex items-center justify-between border-t-2 border-black/10 pt-4">
              <p className="text-xs text-black/60">{copy.answersSaved}</p>
              <Button variant="primary" size="lg" disabled={!isCurrentStepValid()} onClick={() => setStep((prev) => Math.min(prev + 1, totalSteps))}>
                {copy.next}
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
      </main>
    </DeepWorkflowTheme>
  );
}
