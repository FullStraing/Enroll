import type { AcademicTestType, LanguageTestType } from "@/app/dashboard/types";

export const introQuizStorageKey = "enroll_intro_quiz_v1";
export const DASHBOARD_CACHE_KEY = "enroll_dashboard_cache_v1";
export const DASHBOARD_CACHE_TTL_MS = 60_000;

export const ACADEMIC_TEST_OPTIONS: readonly AcademicTestType[] = ["SAT", "ACT"] as const;
export const LANGUAGE_TEST_OPTIONS: readonly LanguageTestType[] = ["IELTS", "TOEFL", "DET", "PTE", "Cambridge"] as const;
export const AP_SCORE_OPTIONS = ["5", "4", "3", "2", "1"] as const;
export const AP_EXAM_OPTIONS = [
  "AP 2-D Art and Design",
  "AP 3-D Art and Design",
  "AP African American Studies",
  "AP Art History",
  "AP Biology",
  "AP Calculus AB",
  "AP Calculus BC",
  "AP Chemistry",
  "AP Chinese Language and Culture",
  "AP Comparative Government and Politics",
  "AP Computer Science A",
  "AP Computer Science Principles",
  "AP Drawing",
  "AP English Language and Composition",
  "AP English Literature and Composition",
  "AP Environmental Science",
  "AP European History",
  "AP French Language and Culture",
  "AP German Language and Culture",
  "AP Human Geography",
  "AP Italian Language and Culture",
  "AP Japanese Language and Culture",
  "AP Latin",
  "AP Macroeconomics",
  "AP Microeconomics",
  "AP Music Theory",
  "AP Physics 1: Algebra-Based",
  "AP Physics 2: Algebra-Based",
  "AP Physics C: Electricity and Magnetism",
  "AP Physics C: Mechanics",
  "AP Precalculus",
  "AP Psychology",
  "AP Research",
  "AP Seminar",
  "AP Spanish Language and Culture",
  "AP Spanish Literature and Culture",
  "AP Statistics",
  "AP Studio Art",
  "AP United States Government and Politics",
  "AP United States History",
  "AP World History: Modern",
] as const;

export const SCHOOL_LEVEL_OPTIONS = ["9", "10", "11", "12", "Gap Year", "College"];
export const INTAKE_OPTIONS = ["2026", "2027", "2028", "2029+"];
export const GPA_SCALE_OPTIONS = ["4.0", "5.0", "Percent"];
export const COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "Kyrgyzstan",
  "Kazakhstan",
  "Uzbekistan",
  "Russia",
  "Ukraine",
  "Turkey",
  "India",
];

export const COUNTRY_FLAG_MAP: Record<string, string> = {
  "United States": "\u{1F1FA}\u{1F1F8}",
  Canada: "\u{1F1E8}\u{1F1E6}",
  Kyrgyzstan: "\u{1F1F0}\u{1F1EC}",
  Kazakhstan: "\u{1F1F0}\u{1F1FF}",
  Uzbekistan: "\u{1F1FA}\u{1F1FF}",
  Russia: "\u{1F1F7}\u{1F1FA}",
  Ukraine: "\u{1F1FA}\u{1F1E6}",
  Turkey: "\u{1F1F9}\u{1F1F7}",
  India: "\u{1F1EE}\u{1F1F3}",
};

export const TEST_SCORE_RULES = {
  SAT: { min: 400, max: 1600, step: "10", placeholder: "1400", hint: "400-1600" },
  ACT: { min: 1, max: 36, step: "1", placeholder: "32", hint: "1-36" },
  IELTS: { min: 0, max: 9, step: "0.5", placeholder: "7.5", hint: "0-9, step 0.5" },
  TOEFL: { min: 0, max: 120, step: "1", placeholder: "105", hint: "0-120" },
  DET: { min: 10, max: 160, step: "5", placeholder: "145", hint: "10-160, step 5" },
  PTE: { min: 10, max: 90, step: "1", placeholder: "76", hint: "10-90" },
  Cambridge: { min: 80, max: 230, step: "1", placeholder: "190", hint: "80-230" },
} as const;

export const MODAL_FIELD_CLASS =
  "mt-2 h-12 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-base text-black outline-none transition placeholder:text-black/30 focus:border-black/35 focus:ring-0";

export const MODAL_REMOVE_BUTTON_CLASS =
  "rounded-full border border-black bg-white px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-black/5";
