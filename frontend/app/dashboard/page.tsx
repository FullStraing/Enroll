"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, CircleAlert, CircleCheck, FileText, GraduationCap, Share2, Target, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProgressBlockCard } from "@/components/dashboard/progress-block-card";
import { SharePreviewToast } from "@/components/dashboard/share-preview-toast";
import { ProtectedPage } from "@/components/protected-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { buildDashboardProgress, type IntroAnswers as ProgressIntroAnswers } from "@/app/dashboard/progress";
import { captureDashboardBlob, copyImageToClipboard } from "@/app/dashboard/share-dashboard";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDateShort, formatDateShortNoYear } from "@/lib/date-format";

type Section = {
  key: string;
  title: string;
  completed_required: number;
  required_total: number;
  percent: number;
};

type CommonAppProgress = {
  overall: {
    completed_required: number;
    required_total: number;
    percent: number;
  };
  sections: Section[];
};

type Profile = {
  full_name?: string;
  username?: string;
  country?: string;
  intended_major?: string;
  graduation_year?: number | null;
  gpa?: string | number | null;
  sat_total?: number | null;
  toefl_total?: number | null;
  ielts_overall?: string | number | null;
  det_score?: number | null;
  budget_range?: string;
  activities?: string[];
  honors?: string[];
  common_app_profile?: {
    dashboard_snapshot?: {
      academic_tests?: Array<{ type: AcademicTestType; score: string }>;
      language_tests?: Array<{ type: LanguageTestType; score: string }>;
      ap_scores?: Array<{ exam: string; score: string }>;
    };
  };
};

type UniversityBrief = {
  id: number;
  name: string;
  main_deadline?: string | null;
};

type StudentUniversity = {
  id: number;
  category?: string;
  status: string;
  progress_percent: number;
  deadline_override?: string | null;
  university: UniversityBrief;
};

type Task = {
  id: number;
  title: string;
  due_date?: string | null;
  status: "planned" | "in_progress" | "done" | string;
};

type DocumentItem = {
  id: number;
  type: string;
};

type EssayItem = {
  id: number;
  title: string;
  essay_type: string;
  versions_count: number;
  latest_has_text?: boolean;
  latest_word_count?: number;
  last_edited_at?: string;
};

type ApplicationItem = {
  id: number;
  deadline_date?: string | null;
  status: string;
  university?: {
    name?: string;
  };
  university_name?: string;
};

type IntroAnswers = ProgressIntroAnswers & {
  schoolLevel?: string;
  gpaScale?: string;
  gpaValue?: string;
  shortlistSize?: string;
};

type IntroStorage = {
  step?: number;
  answers?: IntroAnswers;
};

const introQuizStorageKey = "enroll_intro_quiz_v1";
type EditableFieldKey = "major" | "gpa" | "tests" | "intake" | "country" | "level";

type AcademicTestType = "SAT" | "ACT";
type LanguageTestType = "IELTS" | "TOEFL" | "DET" | "PTE" | "Cambridge";

type EditProfileForm = {
  fullName: string;
  major: string;
  country: string;
  intakeYear: string;
  schoolLevel: string;
  gpaScale: string;
  gpaValue: string;
  academicTests: Array<{ type: AcademicTestType; score: string }>;
  languageTests: Array<{ type: LanguageTestType; score: string }>;
  apScores: Array<{ exam: string; score: string }>;
  activities: Array<{ title: string; description: string }>;
  honors: string[];
};

const ACADEMIC_TEST_OPTIONS = ["SAT", "ACT"] as const;
const LANGUAGE_TEST_OPTIONS = ["IELTS", "TOEFL", "DET", "PTE", "Cambridge"] as const;
const AP_SCORE_OPTIONS = ["5", "4", "3", "2", "1"] as const;
const AP_EXAM_OPTIONS = [
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
const SCHOOL_LEVEL_OPTIONS = ["9", "10", "11", "12", "Gap Year", "College"];
const INTAKE_OPTIONS = ["2026", "2027", "2028", "2029+"];
const GPA_SCALE_OPTIONS = ["4.0", "5.0", "Percent"];
const COUNTRY_OPTIONS = [
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

const COUNTRY_FLAG_MAP: Record<string, string> = {
  "United States": "🇺🇸",
  Canada: "🇨🇦",
  Kyrgyzstan: "🇰🇬",
  Kazakhstan: "🇰🇿",
  Uzbekistan: "🇺🇿",
  Russia: "🇷🇺",
  Ukraine: "🇺🇦",
  Turkey: "🇹🇷",
  India: "🇮🇳",
};

const TEST_SCORE_RULES = {
  SAT: { min: 400, max: 1600, step: "10", placeholder: "1400", hint: "400-1600" },
  ACT: { min: 1, max: 36, step: "1", placeholder: "32", hint: "1-36" },
  IELTS: { min: 0, max: 9, step: "0.5", placeholder: "7.5", hint: "0-9, step 0.5" },
  TOEFL: { min: 0, max: 120, step: "1", placeholder: "105", hint: "0-120" },
  DET: { min: 10, max: 160, step: "5", placeholder: "145", hint: "10-160, step 5" },
  PTE: { min: 10, max: 90, step: "1", placeholder: "76", hint: "10-90" },
  Cambridge: { min: 80, max: 230, step: "1", placeholder: "190", hint: "80-230" },
} as const;

const MODAL_FIELD_CLASS =
  "mt-2 h-12 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-base text-black outline-none transition placeholder:text-black/30 focus:border-black/35 focus:ring-0";

const MODAL_REMOVE_BUTTON_CLASS =
  "rounded-full border border-black bg-white px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-black/5";

function buildInitialAcademicTests(profile: Profile | null, quizAnswers: IntroAnswers): EditProfileForm["academicTests"] {
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

function buildInitialLanguageTests(profile: Profile | null, quizAnswers: IntroAnswers): EditProfileForm["languageTests"] {
  const snapshot = profile?.common_app_profile?.dashboard_snapshot?.language_tests || [];
  const tests: EditProfileForm["languageTests"] = snapshot
    .filter((test): test is { type: LanguageTestType; score: string } =>
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
    .filter((test): test is LanguageTestType => (LANGUAGE_TEST_OPTIONS as readonly string[]).includes(test))
    .map((test) => ({ type: test, score: "" }));
}

function buildInitialApScores(profile: Profile | null): EditProfileForm["apScores"] {
  return (profile?.common_app_profile?.dashboard_snapshot?.ap_scores || []).slice(0, 8);
}

function buildInitialActivities(profile: Profile | null): EditProfileForm["activities"] {
  const values = Array.isArray(profile?.activities) ? profile.activities : [];
  return values.slice(0, 6).map((activity) => ({ title: activity, description: "" }));
}

function toPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function sanitizeScoreInput(raw: string) {
  if (raw === "") return "";
  if (!/^\d*\.?\d*$/.test(raw)) return null;
  return raw;
}

function normalizeScoreOnCommit(raw: string, config: { min: number; max: number; step: string }) {
  if (raw.trim() === "") return "";
  const numeric = Number(raw);
  if (Number.isNaN(numeric)) return "";
  const step = Number(config.step);
  const clamped = Math.max(config.min, Math.min(config.max, numeric));
  const normalized = step < 1 ? Math.round(clamped / step) * step : Math.round(clamped / Math.max(step, 1)) * Math.max(step, 1);
  const decimals = step < 1 ? String(config.step).split(".")[1]?.length || 1 : 0;
  return String(Number(normalized.toFixed(decimals)));
}

function formatTestDisplay(type: string, score: string | number | null | undefined) {
  if (score == null || score === "") return "N/A";
  return `${type} ${score}`;
}

function normalizeGpaFromQuiz(scale?: string, raw?: string) {
  if (!scale || !raw) return null;
  const numeric = Number(raw);
  if (Number.isNaN(numeric)) return null;
  if (scale.includes("4.0")) return Math.max(0, Math.min(4, numeric));
  if (scale.includes("5.0")) return Math.max(0, Math.min(5, numeric)) * (4 / 5);
  if (scale.includes("Проценты")) return Math.max(0, Math.min(100, numeric)) * 0.04;
  return null;
}

function admissionsScore(input: {
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

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [progressData, setProgressData] = useState<CommonAppProgress | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myUniversities, setMyUniversities] = useState<StudentUniversity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [essays, setEssays] = useState<EssayItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<IntroAnswers>({});
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editHint, setEditHint] = useState<EditableFieldKey | null>(null);
  const [sharingDashboard, setSharingDashboard] = useState(false);
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);
  const [sharePreviewVisible, setSharePreviewVisible] = useState(false);
  const [editForm, setEditForm] = useState<EditProfileForm>({
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
  });
  const dashboardShareRef = useRef<HTMLDivElement | null>(null);
  const editModalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    try {
      const raw = window.localStorage.getItem(introQuizStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as IntroStorage;
        if (parsed?.answers) {
          setQuizAnswers(parsed.answers);
        }
      }
    } catch {
      // Ignore invalid local quiz payload.
    }

    const run = async () => {
      setLoading(true);
      setStatusText("");
      try {
        const [profileResp, progress, universitiesResp, tasksResp, documentsResp, essaysResp, applicationsResp] = await Promise.all([
          apiFetch<Profile>("/api/auth/profile/", { method: "GET" }, token),
          apiFetch<CommonAppProgress>("/api/auth/common-app-progress/", { method: "GET" }, token),
          apiFetch<StudentUniversity[]>("/api/my-universities/", { method: "GET" }, token),
          apiFetch<Task[]>("/api/tasks/", { method: "GET" }, token),
          apiFetch<DocumentItem[]>("/api/documents/", { method: "GET" }, token),
          apiFetch<EssayItem[]>("/api/essays/", { method: "GET" }, token),
          apiFetch<ApplicationItem[]>("/api/applications/", { method: "GET" }, token),
        ]);

        setProfile(profileResp);
        setProgressData(progress);
        setMyUniversities(universitiesResp);
        setTasks(tasksResp);
        setDocuments(documentsResp);
        setEssays(essaysResp);
        setApplications(applicationsResp);
      } catch (error) {
        setStatusText(error instanceof Error ? error.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const profileMajor = profile?.intended_major || quizAnswers.major || "N/A";
  const profileCountry = profile?.country || quizAnswers.country || "N/A";
  const profileClass = quizAnswers.schoolLevel || "N/A";
  const intake = quizAnswers.intakeYear || "N/A";
  const shareAcademicTests = buildInitialAcademicTests(profile, quizAnswers);
  const shareLanguageTests = buildInitialLanguageTests(profile, quizAnswers);
  const primaryAcademicTest = shareAcademicTests.find((item) => item.score.trim()) || null;
  const primaryLanguageTest = shareLanguageTests.find((item) => item.score.trim()) || null;
  const shareApScores = buildInitialApScores(profile).filter((item) => item.exam && item.score);
  const primaryAcademicLabel = primaryAcademicTest ? formatTestDisplay(primaryAcademicTest.type, primaryAcademicTest.score) : "N/A";
  const primaryLanguageLabel = primaryLanguageTest ? formatTestDisplay(primaryLanguageTest.type === "DET" ? "DET" : primaryLanguageTest.type, primaryLanguageTest.score) : "N/A";

  const normalizedGpa = useMemo(() => {
    const modelGpa = profile?.gpa != null ? Number(profile.gpa) : null;
    if (modelGpa != null && !Number.isNaN(modelGpa)) {
      return Math.max(0, Math.min(4, modelGpa));
    }
    return normalizeGpaFromQuiz(quizAnswers.gpaScale, quizAnswers.gpaValue);
  }, [profile?.gpa, quizAnswers.gpaScale, quizAnswers.gpaValue]);

  const gpaLabel = normalizedGpa == null
    ? "N/A"
    : quizAnswers.gpaScale?.includes("5.0")
      ? `${Number(quizAnswers.gpaValue || 0).toFixed(2)} / 5.0`
      : quizAnswers.gpaScale?.includes("Проценты")
        ? `${Number(quizAnswers.gpaValue || 0).toFixed(0)}%`
        : `${normalizedGpa.toFixed(2)} / 4.0`;

  const admissions = useMemo(
    () =>
      admissionsScore({
        commonAppPercent: progressData?.overall.percent || 0,
        gpaNormalized4: normalizedGpa,
        satTotal: profile?.sat_total,
        tests: quizAnswers.tests,
        universitiesCount: myUniversities.length,
        hasMajor: profileMajor !== "N/A",
        hasIntake: intake !== "N/A",
      }),
    [progressData?.overall.percent, normalizedGpa, profile?.sat_total, quizAnswers.tests, myUniversities.length, profileMajor, intake],
  );

  const dashboardProgress = useMemo(
    () =>
      buildDashboardProgress({
        profile,
        quizAnswers,
        universities: myUniversities,
        essays,
        documents,
        sections: progressData?.sections || [],
      }),
    [profile, quizAnswers, myUniversities, essays, documents, progressData?.sections],
  );

  const nearestDeadline = useMemo(() => {
    const candidates: { date: string; label: string }[] = [];

    for (const application of applications) {
      if (application.deadline_date) {
        candidates.push({
          date: application.deadline_date,
          label: `${application.university?.name || application.university_name || "Application"} - ${application.status}`,
        });
      }
    }

    for (const task of tasks) {
      if (task.due_date && task.status !== "done") {
        candidates.push({ date: task.due_date, label: task.title });
      }
    }

    for (const item of myUniversities) {
      if (item.university?.main_deadline) {
        candidates.push({ date: item.university.main_deadline, label: item.university.name });
      }
    }

    const now = Date.now();
    const filtered = candidates
      .map((item) => ({ ...item, ts: new Date(item.date).getTime() }))
      .filter((item) => !Number.isNaN(item.ts) && item.ts >= now)
      .sort((a, b) => a.ts - b.ts);

    if (!filtered.length) return null;
    return filtered[0];
  }, [applications, tasks, myUniversities]);

  const latestEssay = essays[0] || null;
  const targetUniversities = myUniversities.slice(0, 4).map((item) => item.university.name);
  const shareName = profile?.full_name || "Student";
  const shareCountry = profileCountry !== "N/A" ? `${COUNTRY_FLAG_MAP[profileCountry] || "🌍"} ${profileCountry}` : "Country not set";
  const shareIntake = intake !== "N/A" ? `Applying for Fall ${intake}` : "Target intake not set";
  const activities = Array.isArray(profile?.activities) ? profile.activities.filter(Boolean).slice(0, 8) : [];
  const targetUniversityEntries = myUniversities.slice(0, 6).map((item) => ({
    id: item.id,
    name: item.university.name,
    status: item.status.replaceAll("_", " "),
  }));

  async function handleShareProfile() {
    const node = dashboardShareRef.current;
    if (!node) {
      setStatusText("Dashboard snapshot is not ready yet.");
      return;
    }

    setSharingDashboard(true);
    try {
      const blob = await captureDashboardBlob(node);
      const copied = await copyImageToClipboard(blob);
      const previewUrl = URL.createObjectURL(blob);

      setSharePreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return previewUrl;
      });
      setSharePreviewVisible(true);
      window.setTimeout(() => setSharePreviewVisible(false), 2600);

      if (copied) {
        setStatusText("Dashboard snapshot copied to clipboard.");
      } else {
        const link = document.createElement("a");
        link.href = previewUrl;
        link.download = "enroll-dashboard.png";
        link.click();
        setStatusText("Clipboard image is not supported here. Downloaded a dashboard snapshot instead.");
      }
    } catch {
      setStatusText("Unable to create a dashboard snapshot right now.");
    } finally {
      setSharingDashboard(false);
    }
  }

  useEffect(() => {
    if (!sharePreviewUrl) return;
    return () => URL.revokeObjectURL(sharePreviewUrl);
  }, [sharePreviewUrl]);

  useEffect(() => {
    setEditForm({
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
    });
  }, [profile, quizAnswers]);

  useEffect(() => {
    const editParam = searchParams.get("edit");
    if (!editParam) return;
    const allowed = new Set<EditableFieldKey>(["major", "gpa", "tests", "intake", "country", "level"]);
    if (!allowed.has(editParam as EditableFieldKey)) return;
    setEditHint(editParam as EditableFieldKey);
    setEditOpen(true);
  }, [searchParams]);

  function updateAcademicTestRow(index: number, patch: Partial<EditProfileForm["academicTests"][number]>) {
    setEditForm((prev) => ({
      ...prev,
      academicTests: prev.academicTests.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function commitAcademicTestScore(index: number) {
    setEditForm((prev) => ({
      ...prev,
      academicTests: prev.academicTests.map((item, itemIndex) =>
        itemIndex === index ? { ...item, score: normalizeScoreOnCommit(item.score, TEST_SCORE_RULES[item.type]) } : item,
      ),
    }));
  }

  function addAcademicTestRow() {
    setEditForm((prev) => {
      if (prev.academicTests.length >= 2) return prev;
      const usedTypes = new Set(prev.academicTests.map((item) => item.type));
      const nextType = ACADEMIC_TEST_OPTIONS.find((option) => !usedTypes.has(option)) || "SAT";
      return {
        ...prev,
        academicTests: [...prev.academicTests, { type: nextType, score: "" }],
      };
    });
  }

  function removeAcademicTestRow(index: number) {
    setEditForm((prev) => ({
      ...prev,
      academicTests: prev.academicTests.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateLanguageTestRow(index: number, patch: Partial<EditProfileForm["languageTests"][number]>) {
    setEditForm((prev) => ({
      ...prev,
      languageTests: prev.languageTests.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function commitLanguageTestScore(index: number) {
    setEditForm((prev) => ({
      ...prev,
      languageTests: prev.languageTests.map((item, itemIndex) =>
        itemIndex === index ? { ...item, score: normalizeScoreOnCommit(item.score, TEST_SCORE_RULES[item.type]) } : item,
      ),
    }));
  }

  function addLanguageTestRow() {
    setEditForm((prev) => {
      if (prev.languageTests.length >= 5) return prev;
      const usedTypes = new Set(prev.languageTests.map((item) => item.type));
      const nextType = LANGUAGE_TEST_OPTIONS.find((option) => !usedTypes.has(option)) || "IELTS";
      return {
        ...prev,
        languageTests: [...prev.languageTests, { type: nextType, score: "" }],
      };
    });
  }

  function removeLanguageTestRow(index: number) {
    setEditForm((prev) => ({
      ...prev,
      languageTests: prev.languageTests.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateApScoreRow(index: number, patch: Partial<EditProfileForm["apScores"][number]>) {
    setEditForm((prev) => ({
      ...prev,
      apScores: prev.apScores.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function addApScoreRow() {
    setEditForm((prev) => {
      if (prev.apScores.length >= 8) return prev;
      const usedExams = new Set(prev.apScores.map((item) => item.exam));
      const nextExam = AP_EXAM_OPTIONS.find((option) => !usedExams.has(option)) || AP_EXAM_OPTIONS[0];
      return {
        ...prev,
        apScores: [...prev.apScores, { exam: nextExam, score: "5" }],
      };
    });
  }

  function removeApScoreRow(index: number) {
    setEditForm((prev) => ({
      ...prev,
      apScores: prev.apScores.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateActivityRow(index: number, patch: Partial<EditProfileForm["activities"][number]>) {
    setEditForm((prev) => ({
      ...prev,
      activities: prev.activities.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function addActivityRow() {
    setEditForm((prev) => {
      if (prev.activities.length >= 6) return prev;
      return {
        ...prev,
        activities: [...prev.activities, { title: "", description: "" }],
      };
    });
  }

  function removeActivityRow(index: number) {
    setEditForm((prev) => ({
      ...prev,
      activities: prev.activities.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateHonorRow(index: number, value: string) {
    setEditForm((prev) => ({
      ...prev,
      honors: prev.honors.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  }

  function addHonorRow() {
    setEditForm((prev) => {
      if (prev.honors.length >= 4) return prev;
      return {
        ...prev,
        honors: [...prev.honors, ""],
      };
    });
  }

  function removeHonorRow(index: number) {
    setEditForm((prev) => ({
      ...prev,
      honors: prev.honors.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function saveEditableProfile() {
    const token = getToken();
    if (!token) return;
    setSavingEdit(true);
    try {
      const gpaNumber = editForm.gpaValue ? Number(editForm.gpaValue) : null;
      const normalizedAcademicTests = editForm.academicTests.map((item) => ({
        ...item,
        score: normalizeScoreOnCommit(item.score, TEST_SCORE_RULES[item.type]),
      }));
      const normalizedLanguageTests = editForm.languageTests.map((item) => ({
        ...item,
        score: normalizeScoreOnCommit(item.score, TEST_SCORE_RULES[item.type]),
      }));
      const getAcademicScore = (type: AcademicTestType) => {
        const match = normalizedAcademicTests.find((item) => item.type === type && item.score.trim());
        if (!match) return null;
        const numeric = Number(match.score);
        return Number.isNaN(numeric) ? null : numeric;
      };
      const getLanguageScore = (type: LanguageTestType) => {
        const match = normalizedLanguageTests.find((item) => item.type === type && item.score.trim());
        if (!match) return null;
        const numeric = Number(match.score);
        return Number.isNaN(numeric) ? null : numeric;
      };

      const satNumber = getAcademicScore("SAT");
      const toeflNumber = getLanguageScore("TOEFL");
      const ieltsNumber = getLanguageScore("IELTS");
      const detNumber = getLanguageScore("DET");
      const cleanActivities = editForm.activities
        .map((item) => [item.title.trim(), item.description.trim()].filter(Boolean).join(" — "))
        .filter(Boolean);
      const cleanHonors = editForm.honors.map((item) => item.trim()).filter(Boolean);
      const cleanAcademicTests = normalizedAcademicTests
        .map((item) => ({ type: item.type, score: item.score.trim() }))
        .filter((item) => item.score);
      const cleanLanguageTests = normalizedLanguageTests
        .map((item) => ({ type: item.type, score: item.score.trim() }))
        .filter((item) => item.score);
      const cleanApScores = editForm.apScores
        .map((item) => ({ exam: item.exam.trim(), score: item.score.trim() }))
        .filter((item) => item.exam && item.score);

      const payload: Partial<Profile> = {
        full_name: editForm.fullName || "",
        intended_major: editForm.major || "",
        country: editForm.country || "",
        gpa: gpaNumber == null || Number.isNaN(gpaNumber) ? null : gpaNumber,
        sat_total: satNumber == null || Number.isNaN(satNumber) ? null : satNumber,
        toefl_total: toeflNumber == null || Number.isNaN(toeflNumber) ? null : toeflNumber,
        ielts_overall: ieltsNumber == null || Number.isNaN(ieltsNumber) ? null : ieltsNumber,
        det_score: detNumber == null || Number.isNaN(detNumber) ? null : detNumber,
        activities: cleanActivities,
        honors: cleanHonors,
        common_app_profile: {
          dashboard_snapshot: {
            academic_tests: cleanAcademicTests,
            language_tests: cleanLanguageTests,
            ap_scores: cleanApScores,
          },
        },
      };

      const updatedProfile = await apiFetch<Profile>("/api/auth/profile/", { method: "PATCH", body: JSON.stringify(payload) }, token);
      setProfile((prev) => ({ ...(prev || {}), ...updatedProfile }));

      const nextAnswers: IntroAnswers = {
        ...quizAnswers,
        major: editForm.major || undefined,
        country: editForm.country || undefined,
        intakeYear: editForm.intakeYear || undefined,
        schoolLevel: editForm.schoolLevel || undefined,
        gpaScale: editForm.gpaScale || undefined,
        gpaValue: editForm.gpaValue || undefined,
        tests: [...editForm.academicTests, ...editForm.languageTests].map((item) => item.type),
      };
      setQuizAnswers(nextAnswers);
      window.localStorage.setItem(introQuizStorageKey, JSON.stringify({ step: 6, answers: nextAnswers }));
      setStatusText("Profile snapshot updated.");
      setEditOpen(false);
      if (searchParams.get("edit")) {
        router.replace("/dashboard");
      }
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Unable to save profile changes.");
    } finally {
      setSavingEdit(false);
    }
  }

  const gpaMax = editForm.gpaScale === "5.0" ? 5 : editForm.gpaScale === "Percent" ? 100 : 4;
  const gpaStep = editForm.gpaScale === "Percent" ? "1" : "0.01";

  useEffect(() => {
    if (!editOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editOpen]);

  useEffect(() => {
    if (!editOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!editModalRef.current) return;
      if (editModalRef.current.contains(event.target as Node)) return;
      if (savingEdit) return;
      setEditOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [editOpen, savingEdit]);

  return (
    <ProtectedPage>
      <AppShell title="Dashboard" subtitle="Your admissions status, profile strength, and next action.">
        <div ref={dashboardShareRef}>
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-[#DAF5F0]/35">
            <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full border-2 border-black/10 bg-[#FFDB58]/20" />
            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-1 text-sm font-semibold">
                Shareable Dashboard Snapshot
              </div>
              <CardTitle className="text-2xl">Profile snapshot worth sharing</CardTitle>
              <CardDescription className="mt-1">A clean admissions card with your profile, activities, and current university list.</CardDescription>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-2xl border border-black/15 bg-white p-5">
                  <div>
                    <h2 className="text-3xl font-black tracking-[-0.04em] text-black">{shareName}</h2>
                    <p className="mt-2 text-base font-semibold text-black/70">{shareCountry}</p>
                    <p className="mt-1 text-base font-semibold text-black/70">{shareIntake}</p>
                    <p className="mt-4 text-lg font-bold text-black">Major: {profileMajor}</p>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-2xl border border-black/12">
                    <div className="grid grid-cols-2 border-b border-black/8 md:grid-cols-4">
                      <div className="border-r border-black/8 px-4 py-3 md:last:border-r">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">GPA</p>
                        <p className="mt-1 text-lg font-black text-black">{gpaLabel}</p>
                      </div>
                      <div className="border-r border-black/8 px-4 py-3 md:last:border-r">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Academic</p>
                        <p className="mt-1 text-lg font-black text-black">{primaryAcademicLabel}</p>
                      </div>
                      <div className="border-r border-black/8 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Language</p>
                        <p className="mt-1 text-lg font-black text-black">{primaryLanguageLabel}</p>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Level</p>
                        <p className="mt-1 text-lg font-black text-black">{profileClass}</p>
                      </div>
                    </div>
                  </div>

                  {(shareAcademicTests.length > 1 || shareLanguageTests.length > 1 || shareApScores.length > 0) ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-black/10 bg-[#FFFDF8] p-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Academic Tests</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {shareAcademicTests.length ? (
                            shareAcademicTests.filter((item) => item.score.trim()).map((item) => (
                              <span key={`${item.type}-${item.score}`} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-bold text-black/75">
                                {formatTestDisplay(item.type, item.score)}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-black/50">N/A</span>
                          )}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-black/10 bg-[#FFFDF8] p-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Language Tests</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {shareLanguageTests.length ? (
                            shareLanguageTests.filter((item) => item.score.trim()).map((item) => (
                              <span key={`${item.type}-${item.score}`} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-bold text-black/75">
                                {formatTestDisplay(item.type === "DET" ? "DET" : item.type, item.score)}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-black/50">N/A</span>
                          )}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-black/10 bg-[#FFFDF8] p-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">AP Exams</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {shareApScores.length ? (
                            shareApScores.slice(0, 4).map((item) => (
                              <span key={`${item.exam}-${item.score}`} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-bold text-black/75">
                                {item.exam.replace("AP ", "")}: {item.score}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-black/50">None</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-black/10 bg-[#F5F8FC] p-4">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-black/45">Activities</p>
                      {activities.length ? (
                        <ul className="mt-3 grid gap-2">
                          {activities.map((activity) => (
                            <li key={activity} className="text-sm font-semibold text-black/80">
                              • {activity}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-black/55">No activities added yet.</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-[#FFF9E8] p-4">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-black/45">Target Universities</p>
                      {targetUniversityEntries.length ? (
                        <ul className="mt-3 grid gap-2">
                          {targetUniversityEntries.map((item) => (
                            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-semibold text-black">{item.name}</span>
                              <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-black/60">
                                {item.status}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-black/55">No universities selected yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/15 bg-white p-4">
                  <div className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#FFDB58]/40 px-3 py-1 text-sm font-semibold">
                    <Trophy className="h-4 w-4" />
                    Admissions Score
                  </div>
                  <div className="mt-4 flex items-center justify-center">
                    {loading ? (
                      <Skeleton className="h-36 w-36 rounded-full" />
                    ) : (
                      <CircularProgress value={admissions} size={150} fillColor="#FFDB58" trackColor="#E6EAEE" />
                    )}
                  </div>
                  <p className="mt-3 text-center text-sm text-black/65">
                    Score improves when profile completeness, tests, and university planning improve.
                  </p>
                  <div className="mt-5 grid gap-2">
                    <Button onClick={handleShareProfile} className="gap-2" disabled={sharingDashboard}>
                      <Share2 className="h-4 w-4" />
                      {sharingDashboard ? "Preparing image..." : "Share dashboard"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditHint(null);
                        setEditOpen(true);
                      }}
                    >
                      Edit profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardDescription>Overall progress</CardDescription>
                {loading ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-2 text-3xl font-black">{dashboardProgress.overallPercent}%</p>}
                <p className="mt-1 text-xs text-black/60">
                  {dashboardProgress.blocks.reduce((sum, block) => sum + block.completed, 0)}/
                  {dashboardProgress.blocks.reduce((sum, block) => sum + block.total, 0)} completed across all blocks
                </p>
              </div>
              <Target className="h-6 w-6 text-black/60" />
            </div>
            <Progress value={loading ? 0 : dashboardProgress.overallPercent} className="mt-4 h-3" />
            <div className="mt-3 flex items-center justify-between text-xs text-black/60">
              <span>Blocks tracked: {dashboardProgress.blocks.length}/5</span>
              <Link href="/common-app" className="font-semibold text-black underline">
                Open form
              </Link>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardDescription>Next deadline</CardDescription>
                {loading ? (
                  <Skeleton className="mt-2 h-6 w-36" />
                ) : nearestDeadline ? (
                  <>
                    <p className="mt-2 text-xl font-black">{formatDateShortNoYear(nearestDeadline.date)}</p>
                    <p className="mt-1 text-sm text-black/65">{nearestDeadline.label}</p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-xl font-black">No upcoming date</p>
                    <p className="mt-1 text-sm text-black/65">Add universities and deadlines to activate this card.</p>
                  </>
                )}
              </div>
              <CalendarClock className="h-6 w-6 text-black/60" />
            </div>
            <Link href="/calendar" className="mt-4 inline-flex">
              <Button variant="secondary">Open calendar</Button>
            </Link>
          </Card>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-36 w-full rounded-2xl" />)
            : dashboardProgress.blocks.map((block) => <ProgressBlockCard key={block.key} block={block} />)}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Universities
              </CardTitle>
              <Badge variant="cyan">{myUniversities.length}</Badge>
            </div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : myUniversities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/25 p-4">
                <p className="text-sm font-semibold">Start building your university list</p>
                <p className="mt-1 text-sm text-black/65">Pick 5-8 universities to unlock better deadline and planning recommendations.</p>
                <Link href="/applications" className="mt-3 inline-flex">
                  <Button size="sm">Build list</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {myUniversities.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-black/15 bg-white p-3">
                    <div>
                      <p className="text-sm font-semibold">{item.university.name}</p>
                      <p className="text-xs text-black/60">Status: {item.status.replaceAll("_", " ")}</p>
                    </div>
                    <Badge>{item.progress_percent}%</Badge>
                  </div>
                ))}
                {myUniversities.length > 5 ? (
                  <p className="text-xs text-black/60">+{myUniversities.length - 5} more in your list</p>
                ) : null}
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Essays
              </CardTitle>
              <Badge variant="orange">{essays.length}</Badge>
            </div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : latestEssay ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-black/15 bg-white p-3">
                  <p className="text-sm font-semibold">{latestEssay.title}</p>
                  <p className="mt-1 text-xs text-black/60">
                    Versions: {latestEssay.versions_count} · Last edited: {latestEssay.last_edited_at ? formatDateShort(latestEssay.last_edited_at) : "N/A"}
                  </p>
                </div>
                <Link href="/essays" className="inline-flex">
                  <Button size="sm">Continue essays</Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-black/25 p-4">
                <p className="text-sm font-semibold">Personal essay: not started</p>
                <p className="mt-1 text-sm text-black/65">Create your first draft to start version tracking.</p>
                <Link href="/essays" className="mt-3 inline-flex">
                  <Button size="sm">Start essay</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Card className="shadow-none">
            <CardDescription>Open tasks</CardDescription>
            {loading ? <Skeleton className="mt-2 h-7 w-14" /> : <p className="mt-2 text-2xl font-black">{tasks.filter((task) => task.status !== "done").length}</p>}
          </Card>
          <Card className="shadow-none">
            <CardDescription>Documents</CardDescription>
            {loading ? <Skeleton className="mt-2 h-7 w-14" /> : <p className="mt-2 text-2xl font-black">{documents.length}</p>}
          </Card>
          <Card className="shadow-none">
            <CardDescription>Applications</CardDescription>
            {loading ? <Skeleton className="mt-2 h-7 w-14" /> : <p className="mt-2 text-2xl font-black">{applications.length}</p>}
          </Card>
        </div>

        {statusText ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black/70">
            <CircleAlert className="h-4 w-4" />
            {statusText}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-black/15 bg-[#DAF5F0]/50 px-3 py-2 text-sm">
            <CircleCheck className="h-4 w-4" />
            Dashboard is synced with your latest profile and application data.
          </div>
        )}
        </div>

        <SharePreviewToast imageUrl={sharePreviewUrl} visible={sharePreviewVisible} />

        {editOpen ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 px-4 py-6">
            <div ref={editModalRef} className="mx-auto my-4 w-full max-w-5xl rounded-[32px] border-2 border-black bg-[#FFFDF8] p-6 pb-32 shadow-[0_12px_0_0_rgba(0,0,0,1)]">
              <div className="mb-5 rounded-[28px] border-2 border-black bg-white p-5 shadow-[0_5px_0_rgba(0,0,0,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex rounded-full border border-black bg-[#FFDB58] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-black">
                      Quick edit
                    </span>
                    <h3 className="mt-2 text-4xl font-black tracking-[-0.05em] text-black">Update your profile snapshot</h3>
                    <p className="mt-2 max-w-2xl text-sm text-black/65">
                      Edit your profile in blocks, keep it share-ready, and make the card look like a real admissions snapshot.
                    </p>
                  </div>
                  <div className="rounded-2xl border-2 border-black bg-[#DAF5F0] px-4 py-3 text-right shadow-[0_4px_0_#000]">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/40">Sections</p>
                    <p className="mt-1 text-lg font-black text-black">5 blocks</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5">
                <section className="rounded-[28px] border border-black/12 bg-white shadow-[0_5px_0_rgba(0,0,0,0.04)]">
                  <div className="rounded-t-[26px] border-b border-black/10 bg-[#DAF5F0] px-5 py-4">
                    <span className="inline-flex rounded-full border border-black/15 bg-white px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-black/65">
                      Basic Info
                    </span>
                  </div>
                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    <label className="text-sm">
                      <span className="text-xs uppercase tracking-wide text-black/50">Name</span>
                      <input
                        value={editForm.fullName}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, fullName: event.target.value }))}
                        placeholder="Emirlan Togolokov"
                        className={MODAL_FIELD_CLASS}
                      />
                    </label>
                    <label className="text-sm">
                      <span className="text-xs uppercase tracking-wide text-black/50">Country</span>
                      <select
                        value={editForm.country}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, country: event.target.value }))}
                        className={MODAL_FIELD_CLASS}
                      >
                        <option value="">Select country</option>
                        {COUNTRY_OPTIONS.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      <span className="text-xs uppercase tracking-wide text-black/50">Major</span>
                      <input
                        value={editForm.major}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, major: event.target.value }))}
                        placeholder="Computer Science"
                        className={MODAL_FIELD_CLASS}
                      />
                    </label>
                    <label className="text-sm">
                      <span className="text-xs uppercase tracking-wide text-black/50">Target intake</span>
                      <select
                        value={editForm.intakeYear}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, intakeYear: event.target.value }))}
                        className={MODAL_FIELD_CLASS}
                      >
                        <option value="">Select intake year</option>
                        {INTAKE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      <span className="text-xs uppercase tracking-wide text-black/50">Current level</span>
                      <select
                        value={editForm.schoolLevel}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, schoolLevel: event.target.value }))}
                        className={MODAL_FIELD_CLASS}
                      >
                        <option value="">Select current level</option>
                        {SCHOOL_LEVEL_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                <section className="rounded-[28px] border border-black/12 bg-white shadow-[0_5px_0_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between gap-3 rounded-t-[26px] border-b border-black/10 bg-[#F8D6B3] px-5 py-4">
                    <span className="inline-flex rounded-full border border-black/15 bg-white px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-black/65">
                      Stats
                    </span>
                    <p className="text-sm font-semibold text-black/55">Academic, language, and AP scores</p>
                  </div>

                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    <label className="text-sm">
                      <span className="text-xs uppercase tracking-wide text-black/50">GPA scale</span>
                      <select
                        value={editForm.gpaScale}
                        onChange={(event) =>
                          setEditForm((prev) => {
                            const nextScale = event.target.value;
                            const nextMax = nextScale === "5.0" ? 5 : nextScale === "Percent" ? 100 : 4;
                            const current = Number(prev.gpaValue);
                            const nextValue =
                              prev.gpaValue && !Number.isNaN(current) ? String(Math.max(0, Math.min(nextMax, current))) : prev.gpaValue;
                            return { ...prev, gpaScale: nextScale, gpaValue: nextValue };
                          })
                        }
                        className={MODAL_FIELD_CLASS}
                      >
                        {GPA_SCALE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm">
                      <span className="text-xs uppercase tracking-wide text-black/50">GPA</span>
                      <input
                        type="number"
                        step={gpaStep}
                        min={0}
                        max={gpaMax}
                        value={editForm.gpaValue}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw === "") {
                            setEditForm((prev) => ({ ...prev, gpaValue: "" }));
                            return;
                          }
                          const numeric = Number(raw);
                          if (Number.isNaN(numeric)) return;
                          const clamped = Math.max(0, Math.min(gpaMax, numeric));
                          setEditForm((prev) => ({ ...prev, gpaValue: String(clamped) }));
                        }}
                        placeholder={editForm.gpaScale === "Percent" ? "0-100%" : `0-${gpaMax}`}
                        className={MODAL_FIELD_CLASS}
                      />
                    </label>
                    
                    <div className="md:col-span-2">
                      <div className="mt-1 grid gap-4">
                        <div className="rounded-[22px] border border-black/12 bg-[#FFFDF8] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black uppercase tracking-[0.14em] text-black/50">Academic Tests</p>
                              <p className="mt-1 text-sm text-black/55">SAT and ACT stay together.</p>
                            </div>
                            <button
                              type="button"
                              onClick={addAcademicTestRow}
                              disabled={editForm.academicTests.length >= 2}
                              className="rounded-full border-2 border-black bg-white px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[#FFF4CC] disabled:opacity-40"
                            >
                              + Add test
                            </button>
                          </div>
                          <div className="grid gap-3">
                            {editForm.academicTests.length ? (
                              editForm.academicTests.map((test, index) => (
                                <div key={`${test.type}-${index}`} className="grid gap-3 rounded-[20px] border border-black/10 bg-white p-4 md:grid-cols-[0.9fr_1fr_auto]">
                                  <label className="text-sm">
                                    <span className="text-xs uppercase tracking-wide text-black/50">Test type</span>
                                    <select
                                      value={test.type}
                                      onChange={(event) => updateAcademicTestRow(index, { type: event.target.value as AcademicTestType })}
                                      className={MODAL_FIELD_CLASS}
                                    >
                                      {ACADEMIC_TEST_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className="text-sm">
                                    <span className="text-xs uppercase tracking-wide text-black/50">Score</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={test.score}
                                      onChange={(event) => {
                                        const nextValue = sanitizeScoreInput(event.target.value);
                                        if (nextValue == null) return;
                                        updateAcademicTestRow(index, { score: nextValue });
                                      }}
                                      onBlur={() => commitAcademicTestScore(index)}
                                      placeholder={TEST_SCORE_RULES[test.type].placeholder}
                                      className={MODAL_FIELD_CLASS}
                                    />
                                    <p className="mt-1 text-xs text-black/45">{TEST_SCORE_RULES[test.type].hint}</p>
                                  </label>
                                  <div className="flex items-end">
                                    <button type="button" onClick={() => removeAcademicTestRow(index)} className={MODAL_REMOVE_BUTTON_CLASS}>
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="rounded-2xl border border-dashed border-black/15 bg-white px-4 py-5 text-sm text-black/50">
                                Add SAT or ACT.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-black/12 bg-[#FFFDF8] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black uppercase tracking-[0.14em] text-black/50">Language Tests</p>
                              <p className="mt-1 text-sm text-black/55">IELTS, TOEFL, Duolingo, PTE, Cambridge.</p>
                            </div>
                            <button
                              type="button"
                              onClick={addLanguageTestRow}
                              disabled={editForm.languageTests.length >= 5}
                              className="rounded-full border-2 border-black bg-white px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[#FFF4CC] disabled:opacity-40"
                            >
                              + Add test
                            </button>
                          </div>
                          <div className="grid gap-3">
                            {editForm.languageTests.length ? (
                              editForm.languageTests.map((test, index) => (
                                <div key={`${test.type}-${index}`} className="grid gap-3 rounded-[20px] border border-black/10 bg-white p-4 md:grid-cols-[0.9fr_1fr_auto]">
                                  <label className="text-sm">
                                    <span className="text-xs uppercase tracking-wide text-black/50">Test type</span>
                                    <select
                                      value={test.type}
                                      onChange={(event) => updateLanguageTestRow(index, { type: event.target.value as LanguageTestType })}
                                      className={MODAL_FIELD_CLASS}
                                    >
                                      {LANGUAGE_TEST_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                          {option === "DET" ? "Duolingo English Test" : option}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className="text-sm">
                                    <span className="text-xs uppercase tracking-wide text-black/50">Score</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={test.score}
                                      onChange={(event) => {
                                        const nextValue = sanitizeScoreInput(event.target.value);
                                        if (nextValue == null) return;
                                        updateLanguageTestRow(index, { score: nextValue });
                                      }}
                                      onBlur={() => commitLanguageTestScore(index)}
                                      placeholder={TEST_SCORE_RULES[test.type].placeholder}
                                      className={MODAL_FIELD_CLASS}
                                    />
                                    <p className="mt-1 text-xs text-black/45">{TEST_SCORE_RULES[test.type].hint}</p>
                                  </label>
                                  <div className="flex items-end">
                                    <button type="button" onClick={() => removeLanguageTestRow(index)} className={MODAL_REMOVE_BUTTON_CLASS}>
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="rounded-2xl border border-dashed border-black/15 bg-white px-4 py-5 text-sm text-black/50">
                                Add one or more language exams if you have them.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-black/12 bg-[#FFFDF8] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black uppercase tracking-[0.14em] text-black/50">AP Exams</p>
                              <p className="mt-1 text-sm text-black/55">Pick the exam and the real AP score from 1 to 5.</p>
                            </div>
                            <button
                              type="button"
                              onClick={addApScoreRow}
                              disabled={editForm.apScores.length >= 8}
                              className="rounded-full border-2 border-black bg-white px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[#FFF4CC] disabled:opacity-40"
                            >
                              + Add AP
                            </button>
                          </div>
                          <div className="grid gap-3">
                            {editForm.apScores.length ? (
                              editForm.apScores.map((item, index) => (
                                <div key={`${item.exam}-${index}`} className="grid gap-3 rounded-[20px] border border-black/10 bg-white p-4 md:grid-cols-[1.4fr_0.45fr_auto]">
                                  <label className="text-sm">
                                    <span className="text-xs uppercase tracking-wide text-black/50">Exam</span>
                                    <select
                                      value={item.exam}
                                      onChange={(event) => updateApScoreRow(index, { exam: event.target.value })}
                                      className={MODAL_FIELD_CLASS}
                                    >
                                      {AP_EXAM_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className="text-sm">
                                    <span className="text-xs uppercase tracking-wide text-black/50">Score</span>
                                    <select
                                      value={item.score}
                                      onChange={(event) => updateApScoreRow(index, { score: event.target.value })}
                                      className={MODAL_FIELD_CLASS}
                                    >
                                      {AP_SCORE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <div className="flex items-end">
                                    <button type="button" onClick={() => removeApScoreRow(index)} className={MODAL_REMOVE_BUTTON_CLASS}>
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="rounded-2xl border border-dashed border-black/15 bg-white px-4 py-5 text-sm text-black/50">
                                Add AP exams only if you actually took them.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-black/12 bg-white shadow-[0_5px_0_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between gap-3 rounded-t-[26px] border-b border-black/10 bg-[#FFDB58] px-5 py-4">
                    <span className="inline-flex rounded-full border border-black/15 bg-white px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-black/65">
                      Activities
                    </span>
                    <button
                      type="button"
                      onClick={addActivityRow}
                      disabled={editForm.activities.length >= 6}
                      className="rounded-full border-2 border-black bg-white px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[#FFF4CC] disabled:opacity-40"
                    >
                      + Add activity
                    </button>
                  </div>

                  <div className="grid gap-3 p-5">
                    {editForm.activities.length ? (
                      editForm.activities.map((activity, index) => (
                        <div key={index} className="grid gap-3 rounded-[22px] border border-black/12 bg-[#FFFDF8] p-4 md:grid-cols-[1fr_1.2fr_auto]">
                          <label className="text-sm">
                            <span className="text-xs uppercase tracking-wide text-black/50">Title</span>
                            <input
                              value={activity.title}
                              onChange={(event) => updateActivityRow(index, { title: event.target.value })}
                              placeholder="Founder — Robotics Club"
                              className={MODAL_FIELD_CLASS}
                            />
                          </label>
                          <label className="text-sm">
                            <span className="text-xs uppercase tracking-wide text-black/50">Description</span>
                            <input
                              value={activity.description}
                              onChange={(event) => updateActivityRow(index, { description: event.target.value })}
                              placeholder="One-line context"
                              className={MODAL_FIELD_CLASS}
                            />
                          </label>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeActivityRow(index)}
                              className={MODAL_REMOVE_BUTTON_CLASS}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-black/15 bg-white px-4 py-5 text-sm text-black/50">
                        Add up to 6 activities.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-[28px] border border-black/12 bg-white shadow-[0_5px_0_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between gap-3 rounded-t-[26px] border-b border-black/10 bg-[#FFF4CC] px-5 py-4">
                    <span className="inline-flex rounded-full border border-black/15 bg-white px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-black/65">
                      Honors
                    </span>
                    <button
                      type="button"
                      onClick={addHonorRow}
                      disabled={editForm.honors.length >= 4}
                      className="rounded-full border-2 border-black bg-white px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[#FFF4CC] disabled:opacity-40"
                    >
                      + Add honor
                    </button>
                  </div>

                  <div className="grid gap-3 p-5">
                    {editForm.honors.length ? (
                      editForm.honors.map((honor, index) => (
                        <div key={index} className="grid gap-3 rounded-[22px] border border-black/12 bg-[#FFFDF8] p-4 md:grid-cols-[1fr_auto]">
                          <label className="text-sm">
                            <span className="text-xs uppercase tracking-wide text-black/50">Title</span>
                            <input
                              value={honor}
                              onChange={(event) => updateHonorRow(index, event.target.value)}
                              placeholder="Math Olympiad participant"
                              className={MODAL_FIELD_CLASS}
                            />
                          </label>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeHonorRow(index)}
                              className={MODAL_REMOVE_BUTTON_CLASS}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-black/15 bg-white px-4 py-5 text-sm text-black/50">
                        Add up to 4 honors.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-[28px] border border-black/12 bg-white shadow-[0_5px_0_rgba(0,0,0,0.04)]">
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-t-[26px] border-b border-black/10 bg-[#DAF5F0] px-5 py-4">
                    <div>
                      <span className="inline-flex rounded-full border border-black/15 bg-white px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-black/65">
                        Universities
                      </span>
                      <p className="mt-1 text-sm text-black/55">Keep university editing on the dedicated page.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditOpen(false);
                        router.push("/universities");
                      }}
                      className="rounded-full border-2 border-black bg-white px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[#FFF4CC]"
                    >
                      Edit universities
                    </button>
                  </div>

                  <div className="grid gap-2 p-5 pt-0">
                    {targetUniversityEntries.length ? (
                      targetUniversityEntries.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 rounded-[22px] border border-black/12 bg-[#FFFDF8] px-4 py-3">
                          <span className="text-sm font-semibold text-black">{item.name}</span>
                          <span className="rounded-full border border-black/10 bg-[#F5F8FC] px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-black/60">
                            {item.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-black/15 bg-white px-4 py-5 text-sm text-black/50">
                        No universities added yet.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <div className="fixed bottom-4 left-1/2 z-10 w-[min(960px,calc(100vw-32px))] -translate-x-1/2 rounded-[24px] border-2 border-black bg-white px-4 py-3 shadow-[0_8px_0_0_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-black/60">Changes update your dashboard snapshot immediately after save.</p>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
                      Close
                    </Button>
                    <Button onClick={() => void saveEditableProfile()} disabled={savingEdit}>
                      {savingEdit ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </AppShell>
    </ProtectedPage>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}
