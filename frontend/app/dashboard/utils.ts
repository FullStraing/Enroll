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
} from "@/app/dashboard/types";

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
  if (scale.includes("Percent")) return Math.max(0, Math.min(100, numeric)) * 0.04;
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
}) {
  const readiness = input.commonAppPercent;
  const gpaScore = input.gpaNormalized4 == null ? 35 : toPercent((input.gpaNormalized4 / 4) * 100);
  const testScore = (() => {
    if (input.satTotal && input.satTotal > 0) {
      return toPercent(((input.satTotal - 900) / 700) * 100);
    }
    if ((input.tests || []).length > 0) {
      return 60;
    }
    return 20;
  })();
  const planningScore = toPercent(
    (input.universitiesCount >= 8 ? 100 : (input.universitiesCount / 8) * 100) * 0.6 +
      (input.hasMajor ? 100 : 0) * 0.2 +
      (input.hasIntake ? 100 : 0) * 0.2,
  );
  return toPercent(readiness * 0.45 + gpaScore * 0.25 + testScore * 0.2 + planningScore * 0.1);
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
  };
}

export function buildInitialEditForm(profile: Profile | null, quizAnswers: IntroAnswers): EditProfileForm {
  return {
    fullName: profile?.full_name || "",
    major: profile?.intended_major || quizAnswers.major || "",
    country: profile?.country || quizAnswers.country || "",
    intakeYear: quizAnswers.intakeYear || "",
    schoolLevel: quizAnswers.schoolLevel || "",
    gpaScale: quizAnswers.gpaScale || "4.0",
    gpaValue: quizAnswers.gpaValue || "",
    academicTests: buildInitialAcademicTests(profile, quizAnswers),
    languageTests: buildInitialLanguageTests(profile, quizAnswers),
    apScores: buildInitialApScores(profile),
    activities: buildInitialActivities(profile),
    honors: Array.isArray(profile?.honors) ? profile.honors.slice(0, 4) : [],
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

