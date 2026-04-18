import {
  ACADEMIC_TEST_OPTIONS,
  LANGUAGE_TEST_OPTIONS,
  TEST_SCORE_RULES,
} from "@/app/dashboard/constants";
import type {
  AcademicTestType,
  EditProfileForm,
  IntroAnswers,
  Profile,
  StudentUniversity,
} from "@/app/dashboard/types";
import { getDashboardCopy } from "@/lib/dashboard-copy";
import { getIntroQuizAnswersFromProfile } from "@/lib/intro-quiz";
import type { Locale } from "@/lib/i18n";

export function buildInitialAcademicTests(profile: Profile | null, quizAnswers: IntroAnswers): EditProfileForm["academicTests"] {
  const snapshot = profile?.common_app_profile?.dashboard_snapshot?.academic_tests || [];
  const tests: EditProfileForm["academicTests"] = snapshot
    .filter((test): test is { type: AcademicTestType; score: string } =>
      (ACADEMIC_TEST_OPTIONS as readonly string[]).includes(test.type),
    )
    .slice(0, 2);

  if (profile?.sat_total && !tests.some((item) => item.type === "SAT")) {
    tests.unshift({ type: "SAT", score: String(profile.sat_total) });
  }

  if (tests.length > 0) return tests;

  return (quizAnswers.tests || [])
    .filter((test): test is AcademicTestType => (ACADEMIC_TEST_OPTIONS as readonly string[]).includes(test))
    .map((test) => ({ type: test, score: "" }));
}

export function buildInitialLanguageTests(profile: Profile | null, quizAnswers: IntroAnswers): EditProfileForm["languageTests"] {
  const snapshot = profile?.common_app_profile?.dashboard_snapshot?.language_tests || [];
  const tests: EditProfileForm["languageTests"] = snapshot
    .filter((test): test is EditProfileForm["languageTests"][number] =>
      (LANGUAGE_TEST_OPTIONS as readonly string[]).includes(test.type),
    )
    .slice(0, 5);

  if (profile?.toefl_total && !tests.some((item) => item.type === "TOEFL")) {
    tests.push({ type: "TOEFL", score: String(profile.toefl_total) });
  }
  if (profile?.ielts_overall && !tests.some((item) => item.type === "IELTS")) {
    tests.push({ type: "IELTS", score: String(profile.ielts_overall) });
  }
  if (profile?.det_score && !tests.some((item) => item.type === "DET")) {
    tests.push({ type: "DET", score: String(profile.det_score) });
  }

  if (tests.length > 0) return tests;

  return (quizAnswers.tests || [])
    .filter((test): test is EditProfileForm["languageTests"][number]["type"] =>
      (LANGUAGE_TEST_OPTIONS as readonly string[]).includes(test),
    )
    .map((test) => ({ type: test, score: "" }));
}

export function buildInitialApScores(profile: Profile | null): EditProfileForm["apScores"] {
  return (profile?.common_app_profile?.dashboard_snapshot?.ap_scores || []).slice(0, 8);
}

export function buildInitialActivities(profile: Profile | null): EditProfileForm["activities"] {
  const values = Array.isArray(profile?.activities) ? profile.activities : [];
  return values.slice(0, 6).map((activity) => ({ title: activity, description: "" }));
}

export function buildInitialSelectedUniversityIds(profile: Profile | null, universities: StudentUniversity[]) {
  const snapshotIds = profile?.common_app_profile?.dashboard_snapshot?.displayed_university_ids || [];
  const availableIds = new Set(universities.map((item) => item.id));
  const validSnapshotIds = snapshotIds.filter((id) => availableIds.has(id)).slice(0, 7);

  if (validSnapshotIds.length > 0) {
    return validSnapshotIds;
  }

  return universities.slice(0, 6).map((item) => item.id);
}

export function toPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function sanitizeScoreInput(raw: string) {
  if (raw === "") return "";
  if (!/^\d*\.?\d*$/.test(raw)) return null;
  return raw;
}

export function normalizeScoreOnCommit(raw: string, config: { min: number; max: number; step: string }) {
  if (raw.trim() === "") return "";
  const numeric = Number(raw);
  if (Number.isNaN(numeric)) return "";
  const step = Number(config.step);
  const clamped = Math.max(config.min, Math.min(config.max, numeric));
  const normalized = step < 1 ? Math.round(clamped / step) * step : Math.round(clamped / Math.max(step, 1)) * Math.max(step, 1);
  const decimals = step < 1 ? String(config.step).split(".")[1]?.length || 1 : 0;
  return String(Number(normalized.toFixed(decimals)));
}

export function formatTestDisplay(type: string, score: string | number | null | undefined) {
  if (score == null || score === "") return "N/A";
  return `${type} ${score}`;
}

export function normalizeGpaFromQuiz(scale?: string, raw?: string) {
  if (!scale || !raw) return null;
  const numeric = Number(raw);
  if (Number.isNaN(numeric)) return null;
  if (scale.includes("4.0")) return Math.max(0, Math.min(4, numeric));
  if (scale.includes("5.0")) return Math.max(0, Math.min(5, numeric)) * (4 / 5);
  if (scale.includes("Percent") || scale.includes("Процент")) return Math.max(0, Math.min(100, numeric)) * 0.04;
  return null;
}

export function admissionsScore(input: {
  commonAppPercent: number;
  gpaNormalized4: number | null;
  satTotal?: number | null;
  tests?: string[];
  universitiesCount: number;
  hasMajor: boolean;
  hasIntake: boolean;
  locale?: Locale;
}) {
  return buildAdmissionsScoreBreakdown(input).total;
}

export type AdmissionsScoreSegmentKey = "readiness" | "academics" | "tests" | "planning";

export type AdmissionsScoreBreakdownSegment = {
  key: AdmissionsScoreSegmentKey;
  label: string;
  weight: number;
  score: number;
  contribution: number;
  missingPoints: number;
  status: "Complete" | "Needs work" | "Missing";
  color: string;
  description: string;
  missingHint: string;
};

export type AdmissionsScoreBreakdown = {
  total: number;
  segments: AdmissionsScoreBreakdownSegment[];
};

function getSegmentStatus(score: number): AdmissionsScoreBreakdownSegment["status"] {
  if (score >= 85) return "Complete";
  if (score <= 30) return "Missing";
  return "Needs work";
}

function buildMissingHint(
  key: AdmissionsScoreSegmentKey,
  remainingPoints: number,
  status: AdmissionsScoreBreakdownSegment["status"],
  locale: Locale,
) {
  const copy = getDashboardCopy(locale).donut;
  if (status === "Complete" || remainingPoints <= 0) {
    return copy.complete;
  }

  switch (key) {
    case "readiness":
      return `${copy.missingHints.readiness}: +${remainingPoints} pts`;
    case "academics":
      return `${copy.missingHints.academics}: +${remainingPoints} pts`;
    case "tests":
      return `${copy.missingHints.tests}: +${remainingPoints} pts`;
    case "planning":
      return `${copy.missingHints.planning}: +${remainingPoints} pts`;
    default:
      return `${copy.missingHints.fallback}: +${remainingPoints} pts`;
  }
}

export function buildAdmissionsScoreBreakdown(input: {
  commonAppPercent: number;
  gpaNormalized4: number | null;
  satTotal?: number | null;
  tests?: string[];
  universitiesCount: number;
  hasMajor: boolean;
  hasIntake: boolean;
  locale?: Locale;
}): AdmissionsScoreBreakdown {
  const locale = input.locale || "en";
  const copy = getDashboardCopy(locale).donut;
  const readiness = toPercent(input.commonAppPercent);
  const academics = input.gpaNormalized4 == null ? 35 : toPercent((input.gpaNormalized4 / 4) * 100);
  const tests = (() => {
    if (input.satTotal && input.satTotal > 0) {
      return toPercent(((input.satTotal - 900) / 700) * 100);
    }
    if ((input.tests || []).length > 0) {
      return 60;
    }
    return 20;
  })();
  const planning = toPercent(
    (input.universitiesCount >= 8 ? 100 : (input.universitiesCount / 8) * 100) * 0.6 +
      (input.hasMajor ? 100 : 0) * 0.2 +
      (input.hasIntake ? 100 : 0) * 0.2,
  );

  const segments: AdmissionsScoreBreakdownSegment[] = [
    (() => {
      const status = getSegmentStatus(readiness);
      const contribution = toPercent(readiness * 0.45);
      const remainingPoints = Math.max(0, 45 - contribution);
      return {
      key: "readiness",
      label: copy.labels.readiness,
      weight: 45,
      score: readiness,
      contribution,
      missingPoints: remainingPoints,
      status,
      color: "#FFDB58",
      description: copy.descriptions.readiness,
      missingHint: buildMissingHint("readiness", remainingPoints, status, locale),
      };
    })(),
    (() => {
      const status = getSegmentStatus(academics);
      const contribution = toPercent(academics * 0.25);
      const remainingPoints = Math.max(0, 25 - contribution);
      return {
      key: "academics",
      label: copy.labels.academics,
      weight: 25,
      score: academics,
      contribution,
      missingPoints: remainingPoints,
      status,
      color: "#8AD7C9",
      description: copy.descriptions.academics,
      missingHint: buildMissingHint("academics", remainingPoints, status, locale),
      };
    })(),
    (() => {
      const status = getSegmentStatus(tests);
      const contribution = toPercent(tests * 0.2);
      const remainingPoints = Math.max(0, 20 - contribution);
      return {
      key: "tests",
      label: copy.labels.tests,
      weight: 20,
      score: tests,
      contribution,
      missingPoints: remainingPoints,
      status,
      color: "#FFB36A",
      description: copy.descriptions.tests,
      missingHint: buildMissingHint("tests", remainingPoints, status, locale),
      };
    })(),
    (() => {
      const status = getSegmentStatus(planning);
      const contribution = toPercent(planning * 0.1);
      const remainingPoints = Math.max(0, 10 - contribution);
      return {
      key: "planning",
      label: copy.labels.planning,
      weight: 10,
      score: planning,
      contribution,
      missingPoints: remainingPoints,
      status,
      color: "#A9B8FF",
      description: copy.descriptions.planning,
      missingHint: buildMissingHint("planning", remainingPoints, status, locale),
      };
    })(),
  ];

  return {
    total: toPercent(segments.reduce((sum, segment) => sum + segment.contribution, 0)),
    segments,
  };
}

export function buildEmptyEditForm(): EditProfileForm {
  return {
    fullName: "",
    major: "",
    country: "",
    intakeYear: "",
    schoolLevel: "",
    gpaScale: "4.0",
    gpaValue: "",
    academicTests: [],
    languageTests: [],
    apScores: [],
    activities: [],
    honors: [],
    selectedUniversityIds: [],
  };
}

export function buildInitialEditForm(profile: Profile | null, quizAnswers: IntroAnswers, universities: StudentUniversity[]): EditProfileForm {
  const resolvedQuizAnswers =
    Object.keys(quizAnswers || {}).length > 0 ? quizAnswers : getIntroQuizAnswersFromProfile(profile);
  const normalizedQuizScale =
    resolvedQuizAnswers.gpaScale?.includes("5.0")
      ? "5.0"
      : resolvedQuizAnswers.gpaScale?.includes("Percent") || resolvedQuizAnswers.gpaScale?.includes("Процент")
        ? "Percent"
        : "4.0";

  return {
    fullName: profile?.full_name || "",
    major: profile?.intended_major || resolvedQuizAnswers.major || "",
    country: profile?.country || resolvedQuizAnswers.country || "",
    intakeYear: resolvedQuizAnswers.intakeYear || "",
    schoolLevel: resolvedQuizAnswers.schoolLevel || "",
    gpaScale: resolvedQuizAnswers.gpaScale ? normalizedQuizScale : "4.0",
    gpaValue: resolvedQuizAnswers.gpaValue || "",
    academicTests: buildInitialAcademicTests(profile, resolvedQuizAnswers),
    languageTests: buildInitialLanguageTests(profile, resolvedQuizAnswers),
    apScores: buildInitialApScores(profile),
    activities: buildInitialActivities(profile),
    honors: Array.isArray(profile?.honors) ? profile.honors.slice(0, 4) : [],
    selectedUniversityIds: buildInitialSelectedUniversityIds(profile, universities),
  };
}

export function normalizeAcademicTestsForSave(tests: EditProfileForm["academicTests"]) {
  return tests.map((item) => ({
    ...item,
    score: normalizeScoreOnCommit(item.score, TEST_SCORE_RULES[item.type]),
  }));
}

export function normalizeLanguageTestsForSave(tests: EditProfileForm["languageTests"]) {
  return tests.map((item) => ({
    ...item,
    score: normalizeScoreOnCommit(item.score, TEST_SCORE_RULES[item.type]),
  }));
}

