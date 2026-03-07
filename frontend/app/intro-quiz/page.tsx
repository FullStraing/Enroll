"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getToken } from "@/lib/auth";

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

const storageKey = "enroll_intro_quiz_v1";
const completedStorageKey = "enroll_intro_quiz_done";
const completedCookieKey = "enroll_intro_quiz_done";
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

const countryOptions = ["Кыргызстан", "Казахстан", "Узбекистан", "Россия", "Украина", "Турция", "Индия", "Другая страна"];
const schoolLevelOptions = ["9 класс", "10 класс", "11 класс", "12 класс", "Gap year", "Уже в колледже"];
const intakeOptions = ["2027", "2028", "2029+", "Еще не решил"];
const majorOptions = [
  "Computer Science",
  "Business / Economics",
  "Engineering",
  "Biology / Medicine",
  "Social Sciences",
  "Arts / Design",
  "Еще не определился",
];
const gpaScaleOptions = ["GPA 4.0 (unweighted)", "GPA 5.0 / локальная шкала", "Проценты", "Еще не знаю"];
const testOptions = ["SAT", "ACT", "TOEFL", "IELTS", "Duolingo English Test", "Пока без тестов"];
const shortlistOptions = ["3", "5", "8", "10+", "Не знаю"];

function OptionGrid({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: string[];
  value: string | string[];
  onChange: (next: string | string[]) => void;
  multi?: boolean;
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
              if (option === "Пока без тестов") {
                onChange(current.includes(option) ? [] : [option]);
                return;
              }
              const next = current.includes("Пока без тестов") ? [] : [...current];
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
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<IntroAnswers>(initialAnswers);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    setIsAuthed(Boolean(getToken()));
    try {
      const done = localStorage.getItem(completedStorageKey) === "1";
      if (done) {
        router.replace("/dashboard");
        return;
      }
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { step: number; answers: IntroAnswers };
      if (parsed?.answers) setAnswers({ ...initialAnswers, ...parsed.answers });
      if (typeof parsed?.step === "number") setStep(Math.min(Math.max(parsed.step, 0), totalSteps));
    } catch {
      // ignore invalid local data
    }
  }, [router]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ step, answers }));
  }, [step, answers]);

  useEffect(() => {
    if (step < totalSteps) return;
    localStorage.setItem(completedStorageKey, "1");
    document.cookie = `${completedCookieKey}=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }, [step]);

  const progress = useMemo(() => Math.round((Math.min(step, totalSteps) / totalSteps) * 100), [step]);

  function isCurrentStepValid() {
    if (step === 0) return Boolean(answers.country);
    if (step === 1) return Boolean(answers.schoolLevel);
    if (step === 2) return Boolean(answers.intakeYear);
    if (step === 3) return Boolean(answers.major);
    if (step === 4) {
      if (!answers.gpaScale) return false;
      if (answers.gpaScale === "Еще не знаю") return true;
      return Boolean(answers.gpaValue);
    }
    if (step === 5) return answers.tests.length > 0;
    if (step === 6) return Boolean(answers.shortlistSize);
    return true;
  }

  function stepTitle() {
    if (step === 0) return "В какой стране вы учитесь сейчас?";
    if (step === 1) return "В каком вы сейчас классе?";
    if (step === 2) return "Когда планируете начать учебу в США?";
    if (step === 3) return "Какой major вас интересует?";
    if (step === 4) return "Какой у вас текущий GPA / средний балл?";
    if (step === 5) return "Какие тесты уже есть или планируете сдавать?";
    if (step === 6) return "Сколько университетов добавить в шортлист на старте?";
    return "Готово! Ваш стартовый профиль собран.";
  }

  function stepSubtitle() {
    if (step === 4) return "Выберите шкалу, чтобы корректно сравнивать результаты без искажений.";
    if (step === 5) return "Можно выбрать несколько вариантов.";
    if (step === 7) return "Дальше вы получите персональный стартовый план подачи.";
    return "Ответ займет 5-10 секунд.";
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <Card className="p-5 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-white"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              disabled={step === 0}
              aria-label="Назад"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Progress value={progress} variant="primary" className="h-4" />
            <span className="w-12 text-right text-sm font-bold">{progress}%</span>
          </div>

          <div className="mb-7 grid gap-4 rounded-2xl border-2 border-black/15 bg-white p-4 md:grid-cols-[120px_1fr]">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-black bg-[#DAF5F0] text-4xl">🎓</div>
            <div className="rounded-2xl border-2 border-black/15 bg-[#F8F9FA] px-4 py-3">
              <p className="text-base font-bold">Привет! Я Enroll Buddy.</p>
              <p className="mt-1 text-sm text-black/70">Соберем стартовый профиль и сразу покажем ваш next step.</p>
            </div>
          </div>

          <p className="text-sm font-semibold text-black/55">Шаг {Math.min(step + 1, totalSteps)} из {totalSteps}</p>
          <h1 className="mt-1 text-3xl font-black leading-tight md:text-4xl">{stepTitle()}</h1>
          <p className="mt-2 text-base text-black/65">{stepSubtitle()}</p>

          <div className="mt-7 space-y-4">
            {step === 0 ? <OptionGrid options={countryOptions} value={answers.country} onChange={(next) => setAnswers((prev) => ({ ...prev, country: String(next) }))} /> : null}
            {step === 1 ? <OptionGrid options={schoolLevelOptions} value={answers.schoolLevel} onChange={(next) => setAnswers((prev) => ({ ...prev, schoolLevel: String(next) }))} /> : null}
            {step === 2 ? <OptionGrid options={intakeOptions} value={answers.intakeYear} onChange={(next) => setAnswers((prev) => ({ ...prev, intakeYear: String(next) }))} /> : null}
            {step === 3 ? <OptionGrid options={majorOptions} value={answers.major} onChange={(next) => setAnswers((prev) => ({ ...prev, major: String(next) }))} /> : null}

            {step === 4 ? (
              <>
                <OptionGrid options={gpaScaleOptions} value={answers.gpaScale} onChange={(next) => setAnswers((prev) => ({ ...prev, gpaScale: String(next), gpaValue: "" }))} />
                {answers.gpaScale && answers.gpaScale !== "Еще не знаю" ? (
                  <div className="rounded-2xl border-2 border-black/15 bg-white p-4">
                    <label className="mb-2 block text-sm font-semibold">Введите значение</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={answers.gpaScale.includes("4.0") ? 4 : answers.gpaScale.includes("5.0") ? 5 : 100}
                      value={answers.gpaValue}
                      onChange={(event) => setAnswers((prev) => ({ ...prev, gpaValue: event.target.value }))}
                      className="h-11 w-full rounded-xl border-2 border-black px-3"
                      placeholder={answers.gpaScale.includes("Проценты") ? "Например: 87" : "Например: 3.7"}
                    />
                  </div>
                ) : null}
              </>
            ) : null}

            {step === 5 ? <OptionGrid options={testOptions} value={answers.tests} multi onChange={(next) => setAnswers((prev) => ({ ...prev, tests: next as string[] }))} /> : null}
            {step === 6 ? <OptionGrid options={shortlistOptions} value={answers.shortlistSize} onChange={(next) => setAnswers((prev) => ({ ...prev, shortlistSize: String(next) }))} /> : null}

            {step >= totalSteps ? (
              <div className="rounded-2xl border-2 border-black bg-[#DAF5F0] p-5">
                <div className="mb-3 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-1 text-sm font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  Профиль собран
                </div>
                <p className="text-sm text-black/75">
                  Страна: <b>{answers.country || "N/A"}</b> · Класс: <b>{answers.schoolLevel || "N/A"}</b> · Major: <b>{answers.major || "N/A"}</b>
                </p>
                <p className="mt-1 text-sm text-black/75">
                  План старта: <b>{answers.intakeYear || "N/A"}</b> · Шортлист: <b>{answers.shortlistSize || "N/A"}</b>
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {isAuthed ? (
                    <Link
                      href="/dashboard"
                      className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-black bg-[#FFDB58] px-5 text-sm font-semibold transition hover:-translate-y-0.5"
                    >
                      Перейти в Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/register"
                        className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-black bg-[#FFDB58] px-5 text-sm font-semibold transition hover:-translate-y-0.5"
                      >
                        Создать аккаунт
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-black bg-white px-5 text-sm font-semibold transition hover:bg-black/5"
                      >
                        Войти
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {step < totalSteps ? (
            <div className="mt-8 flex items-center justify-between border-t-2 border-black/10 pt-4">
              <p className="text-xs text-black/60">Ответы сохраняются локально, можно продолжить позже.</p>
              <Button variant="primary" size="lg" disabled={!isCurrentStepValid()} onClick={() => setStep((prev) => Math.min(prev + 1, totalSteps))}>
                Далее
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
