import { apiFetch } from "@/lib/api";

export type IntroQuizAnswers = {
  country?: string;
  schoolLevel?: string;
  intakeYear?: string;
  major?: string;
  gpaScale?: string;
  gpaValue?: string;
  tests?: string[];
  shortlistSize?: string;
};

export type IntroQuizStorage = {
  step?: number;
  answers?: IntroQuizAnswers;
};

type IntroQuizProfileLike = {
  common_app_profile?: {
    intro_quiz_answers?: IntroQuizAnswers | null;
  } | null;
} | null | undefined;

export const INTRO_QUIZ_STORAGE_KEY = "enroll_intro_quiz_v1";
export const INTRO_QUIZ_COMPLETED_STORAGE_KEY = "enroll_intro_quiz_done";
export const INTRO_QUIZ_LINKED_STORAGE_KEY = "enroll_intro_quiz_linked";
export const INTRO_QUIZ_LINKED_COOKIE_KEY = "enroll_intro_quiz_linked";

const COUNTRY_MAP: Record<string, string> = {
  Kyrgyzstan: "Kyrgyzstan",
  Кыргызстан: "Kyrgyzstan",
  Kazakhstan: "Kazakhstan",
  Казахстан: "Kazakhstan",
  Uzbekistan: "Uzbekistan",
  Узбекистан: "Uzbekistan",
  Russia: "Russia",
  Россия: "Russia",
  Ukraine: "Ukraine",
  Украина: "Ukraine",
  Turkey: "Turkey",
  Турция: "Turkey",
  India: "India",
  Индия: "India",
  "Another country": "",
  "Другая страна": "",
};

const SCHOOL_LEVEL_MAP: Record<string, string> = {
  "9th grade": "9",
  "9 класс": "9",
  "10th grade": "10",
  "10 класс": "10",
  "11th grade": "11",
  "11 класс": "11",
  "12th grade": "12",
  "12 класс": "12",
  "Gap year": "Gap Year",
  "Already in college": "College",
  "Уже в колледже": "College",
};

const INTAKE_MAP: Record<string, string> = {
  "Not sure yet": "",
  "Ещё не решил": "",
};

const MAJOR_MAP: Record<string, string> = {
  "Not decided yet": "",
  "Ещё не определился": "",
};

function normalizeGpa(scale?: string, raw?: string) {
  if (!scale || !raw) return null;
  const numeric = Number(raw);
  if (Number.isNaN(numeric)) return null;
  if (scale.includes("4.0")) return Math.max(0, Math.min(4, numeric));
  if (scale.includes("5.0")) return Math.max(0, Math.min(5, numeric)) * (4 / 5);
  if (scale.includes("Percent") || scale.includes("Процент")) return Math.max(0, Math.min(100, numeric)) * 0.04;
  return null;
}

function normalizeAnswers(answers: IntroQuizAnswers): IntroQuizAnswers {
  return {
    country: answers.country ? COUNTRY_MAP[answers.country] ?? answers.country : "",
    schoolLevel: answers.schoolLevel ? SCHOOL_LEVEL_MAP[answers.schoolLevel] ?? answers.schoolLevel : "",
    intakeYear: answers.intakeYear ? INTAKE_MAP[answers.intakeYear] ?? answers.intakeYear : "",
    major: answers.major ? MAJOR_MAP[answers.major] ?? answers.major : "",
    gpaScale: answers.gpaScale || "",
    gpaValue: answers.gpaValue || "",
    tests: Array.isArray(answers.tests) ? answers.tests.filter(Boolean) : [],
    shortlistSize: answers.shortlistSize || "",
  };
}

export function getIntroQuizAnswersFromProfile(profile: IntroQuizProfileLike): IntroQuizAnswers {
  return profile?.common_app_profile?.intro_quiz_answers || {};
}

export function resolveIntroQuizAnswers({
  stored,
  profile,
}: {
  stored?: IntroQuizAnswers | null;
  profile?: IntroQuizProfileLike;
}): IntroQuizAnswers {
  const storedAnswers = stored || {};
  if (Object.keys(storedAnswers).length > 0) {
    return storedAnswers;
  }
  return getIntroQuizAnswersFromProfile(profile);
}

export function readStoredIntroQuiz(): IntroQuizStorage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(INTRO_QUIZ_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IntroQuizStorage;
  } catch {
    return null;
  }
}

export function writeStoredIntroQuiz(payload: IntroQuizStorage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INTRO_QUIZ_STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredIntroQuizProgress() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(INTRO_QUIZ_STORAGE_KEY);
  window.localStorage.removeItem(INTRO_QUIZ_COMPLETED_STORAGE_KEY);
}

export function isIntroQuizLinked() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(INTRO_QUIZ_LINKED_STORAGE_KEY) === "1";
}

export function hasPendingStoredIntroQuiz() {
  if (typeof window === "undefined") return false;
  const payload = readStoredIntroQuiz();
  const completed = window.localStorage.getItem(INTRO_QUIZ_COMPLETED_STORAGE_KEY) === "1";
  return !isIntroQuizLinked() && completed && Boolean(payload?.answers);
}

export function markIntroQuizLinked() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INTRO_QUIZ_LINKED_STORAGE_KEY, "1");
  document.cookie = `${INTRO_QUIZ_LINKED_COOKIE_KEY}=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function syncIntroQuizToProfilePatch(answers: IntroQuizAnswers) {
  const normalized = normalizeAnswers(answers);
  return {
    country: normalized.country || "",
    intended_major: normalized.major || "",
    gpa: normalizeGpa(normalized.gpaScale, normalized.gpaValue),
    target_country: "USA",
    common_app_profile: {
      intro_quiz_completed: true,
      intro_quiz_answers: normalized,
    },
  };
}

export async function syncStoredIntroQuizToProfile(token: string) {
  if (!token || isIntroQuizLinked()) return false;
  const payload = readStoredIntroQuiz();
  const answers = payload?.answers;
  const completed = typeof window !== "undefined" && window.localStorage.getItem(INTRO_QUIZ_COMPLETED_STORAGE_KEY) === "1";

  if (!answers || !completed) return false;

  await apiFetch(
    "/api/auth/profile/",
    {
      method: "PATCH",
      body: JSON.stringify(syncIntroQuizToProfilePatch(answers)),
    },
    token,
  );

  clearStoredIntroQuizProgress();
  markIntroQuizLinked();
  return true;
}
