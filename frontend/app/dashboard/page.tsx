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

type EditProfileForm = {
  fullName: string;
  major: string;
  country: string;
  intakeYear: string;
  schoolLevel: string;
  gpaScale: string;
  gpaValue: string;
  tests: Array<{ type: "SAT" | "TOEFL" | "IELTS" | "DET"; score: string }>;
  activities: Array<{ title: string; description: string }>;
  honors: string[];
};

const TEST_OPTIONS = ["SAT", "TOEFL", "IELTS", "DET"] as const;
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

function buildInitialTests(profile: Profile | null, quizAnswers: IntroAnswers): EditProfileForm["tests"] {
  const tests: EditProfileForm["tests"] = [];

  if (profile?.sat_total) tests.push({ type: "SAT", score: String(profile.sat_total) });
  if (profile?.toefl_total) tests.push({ type: "TOEFL", score: String(profile.toefl_total) });
  if (profile?.ielts_overall) tests.push({ type: "IELTS", score: String(profile.ielts_overall) });
  if (profile?.det_score) tests.push({ type: "DET", score: String(profile.det_score) });

  if (tests.length > 0) return tests;

  return (quizAnswers.tests || [])
    .filter((test): test is (typeof TEST_OPTIONS)[number] => (TEST_OPTIONS as readonly string[]).includes(test))
    .map((test) => ({ type: test, score: "" }));
}

function buildInitialActivities(profile: Profile | null): EditProfileForm["activities"] {
  const values = Array.isArray(profile?.activities) ? profile.activities : [];
  return values.slice(0, 6).map((activity) => ({ title: activity, description: "" }));
}

function toPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
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
    tests: [],
    activities: [],
    honors: [],
  });
  const dashboardShareRef = useRef<HTMLDivElement | null>(null);

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
  const testsLabel = profile?.sat_total
    ? `SAT ${profile.sat_total}`
    : profile?.toefl_total
      ? `TOEFL ${profile.toefl_total}`
      : profile?.ielts_overall
        ? `IELTS ${profile.ielts_overall}`
        : (quizAnswers.tests || []).length > 0
          ? quizAnswers.tests!.join(", ")
          : "No tests yet";

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
      tests: buildInitialTests(profile, quizAnswers),
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

  function updateTestRow(index: number, patch: Partial<EditProfileForm["tests"][number]>) {
    setEditForm((prev) => ({
      ...prev,
      tests: prev.tests.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function addTestRow() {
    setEditForm((prev) => {
      if (prev.tests.length >= 4) return prev;
      const usedTypes = new Set(prev.tests.map((item) => item.type));
      const nextType = TEST_OPTIONS.find((option) => !usedTypes.has(option)) || "SAT";
      return {
        ...prev,
        tests: [...prev.tests, { type: nextType, score: "" }],
      };
    });
  }

  function removeTestRow(index: number) {
    setEditForm((prev) => ({
      ...prev,
      tests: prev.tests.filter((_, itemIndex) => itemIndex !== index),
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
      const getTestScore = (type: (typeof TEST_OPTIONS)[number]) => {
        const match = editForm.tests.find((item) => item.type === type && item.score.trim());
        if (!match) return null;
        const numeric = Number(match.score);
        return Number.isNaN(numeric) ? null : numeric;
      };

      const satNumber = getTestScore("SAT");
      const toeflNumber = getTestScore("TOEFL");
      const ieltsNumber = getTestScore("IELTS");
      const detNumber = getTestScore("DET");
      const cleanActivities = editForm.activities
        .map((item) => [item.title.trim(), item.description.trim()].filter(Boolean).join(" — "))
        .filter(Boolean);
      const cleanHonors = editForm.honors.map((item) => item.trim()).filter(Boolean);

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
        tests: editForm.tests.map((item) => item.type),
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
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">SAT</p>
                        <p className="mt-1 text-lg font-black text-black">{profile?.sat_total || "N/A"}</p>
                      </div>
                      <div className="border-r border-black/8 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Duolingo</p>
                        <p className="mt-1 text-lg font-black text-black">{profile?.det_score || "N/A"}</p>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Level</p>
                        <p className="mt-1 text-lg font-black text-black">{profileClass}</p>
                      </div>
                    </div>
                  </div>

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
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
            <div className="mx-auto my-8 w-full max-w-5xl rounded-3xl border-2 border-black bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFDF8_100%)] p-5 shadow-[0_10px_0_0_rgba(0,0,0,1)]">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/50">Quick edit</p>
                  <h3 className="text-2xl font-black">Update your profile snapshot</h3>
                  <p className="mt-1 text-sm text-black/65">
                    Edit your profile in blocks, not one long form.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <section className="rounded-2xl border border-[#63CDB8]/35 bg-[#DAF5F0]/35 p-4">
                  <div className="mb-3">
                    <span className="inline-flex rounded-full border border-[#63CDB8]/45 bg-white px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-black/60">
                      Basic Info
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm">
                      <span className="text-xs uppercase tracking-wide text-black/50">Name</span>
                      <input
                        value={editForm.fullName}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, fullName: event.target.value }))}
                        placeholder="Emirlan Togolokov"
                        className="mt-2 w-full rounded-xl border border-[#63CDB8]/30 bg-white px-3 py-2"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="text-xs uppercase tracking-wide text-black/50">Country</span>
                      <select
                        value={editForm.country}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, country: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-[#63CDB8]/30 bg-white px-3 py-2"
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
                        className="mt-2 w-full rounded-xl border border-[#63CDB8]/30 bg-white px-3 py-2"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="text-xs uppercase tracking-wide text-black/50">Target intake</span>
                      <select
                        value={editForm.intakeYear}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, intakeYear: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-[#63CDB8]/30 bg-white px-3 py-2"
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
                        className="mt-2 w-full rounded-xl border border-[#63CDB8]/30 bg-white px-3 py-2"
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

                <section className="rounded-2xl border border-[#E7B77C]/35 bg-[#F8D6B3]/30 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full border border-[#E7B77C]/45 bg-white px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-black/60">
                      Stats
                    </span>
                    <button
                      type="button"
                      onClick={addTestRow}
                      disabled={editForm.tests.length >= 4}
                      className="rounded-full border border-black bg-white px-3 py-1 text-sm font-semibold hover:bg-[#FFF4CC] disabled:opacity-40"
                    >
                      + Add test
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
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
                        className="mt-2 w-full rounded-xl border border-[#E7B77C]/30 bg-white px-3 py-2"
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
                        className="mt-2 w-full rounded-xl border border-[#E7B77C]/30 bg-white px-3 py-2"
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {editForm.tests.length ? (
                      editForm.tests.map((test, index) => (
                        <div key={`${test.type}-${index}`} className="grid gap-3 rounded-2xl border border-[#E7B77C]/30 bg-white p-3 md:grid-cols-[0.95fr_1fr_auto]">
                          <label className="text-sm">
                            <span className="text-xs uppercase tracking-wide text-black/50">Test type</span>
                            <select
                              value={test.type}
                              onChange={(event) => updateTestRow(index, { type: event.target.value as EditProfileForm["tests"][number]["type"] })}
                              className="mt-2 w-full rounded-xl border border-[#E7B77C]/30 bg-white px-3 py-2"
                            >
                              {TEST_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-sm">
                            <span className="text-xs uppercase tracking-wide text-black/50">Score</span>
                            <input
                              value={test.score}
                              onChange={(event) => updateTestRow(index, { score: event.target.value })}
                              placeholder="1400"
                              className="mt-2 w-full rounded-xl border border-[#E7B77C]/30 bg-white px-3 py-2"
                            />
                          </label>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeTestRow(index)}
                              className="rounded-full border border-black bg-white px-3 py-2 text-sm font-semibold hover:bg-[#FFF4CC]"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-black/15 bg-white px-4 py-5 text-sm text-black/50">
                        No tests added yet.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-[#E0B94B]/35 bg-[#FFF4CC]/45 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full border border-[#E0B94B]/45 bg-white px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-black/60">
                      Activities
                    </span>
                    <button
                      type="button"
                      onClick={addActivityRow}
                      disabled={editForm.activities.length >= 6}
                      className="rounded-full border border-black bg-white px-3 py-1 text-sm font-semibold hover:bg-[#FFF7D9] disabled:opacity-40"
                    >
                      + Add activity
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {editForm.activities.length ? (
                      editForm.activities.map((activity, index) => (
                        <div key={index} className="grid gap-3 rounded-2xl border border-[#E0B94B]/25 bg-white p-3 md:grid-cols-[1fr_1.2fr_auto]">
                          <label className="text-sm">
                            <span className="text-xs uppercase tracking-wide text-black/50">Title</span>
                            <input
                              value={activity.title}
                              onChange={(event) => updateActivityRow(index, { title: event.target.value })}
                              placeholder="Founder — Robotics Club"
                              className="mt-2 w-full rounded-xl border border-[#E0B94B]/25 bg-white px-3 py-2"
                            />
                          </label>
                          <label className="text-sm">
                            <span className="text-xs uppercase tracking-wide text-black/50">Description</span>
                            <input
                              value={activity.description}
                              onChange={(event) => updateActivityRow(index, { description: event.target.value })}
                              placeholder="One-line context"
                              className="mt-2 w-full rounded-xl border border-[#E0B94B]/25 bg-white px-3 py-2"
                            />
                          </label>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeActivityRow(index)}
                              className="rounded-full border border-black bg-white px-3 py-2 text-sm font-semibold hover:bg-[#FFF7D9]"
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

                <section className="rounded-2xl border border-[#A9C973]/35 bg-[#E8F4CF]/45 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full border border-[#A9C973]/45 bg-white px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-black/60">
                      Honors
                    </span>
                    <button
                      type="button"
                      onClick={addHonorRow}
                      disabled={editForm.honors.length >= 4}
                      className="rounded-full border border-black bg-white px-3 py-1 text-sm font-semibold hover:bg-[#F4FBEB] disabled:opacity-40"
                    >
                      + Add honor
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {editForm.honors.length ? (
                      editForm.honors.map((honor, index) => (
                        <div key={index} className="grid gap-3 rounded-2xl border border-[#A9C973]/25 bg-white p-3 md:grid-cols-[1fr_auto]">
                          <label className="text-sm">
                            <span className="text-xs uppercase tracking-wide text-black/50">Title</span>
                            <input
                              value={honor}
                              onChange={(event) => updateHonorRow(index, event.target.value)}
                              placeholder="Math Olympiad participant"
                              className="mt-2 w-full rounded-xl border border-[#A9C973]/25 bg-white px-3 py-2"
                            />
                          </label>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeHonorRow(index)}
                              className="rounded-full border border-black bg-white px-3 py-2 text-sm font-semibold hover:bg-[#F4FBEB]"
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

                <section className="rounded-2xl border border-[#8FB7F1]/35 bg-[#EEF5FF] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full border border-[#8FB7F1]/45 bg-white px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-black/60">
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
                      className="rounded-full border border-black bg-white px-3 py-1 text-sm font-semibold hover:bg-[#F3F8FF]"
                    >
                      Edit universities
                    </button>
                  </div>

                  <div className="grid gap-2">
                    {targetUniversityEntries.length ? (
                      targetUniversityEntries.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#8FB7F1]/25 bg-white px-3 py-2">
                          <span className="text-sm font-semibold text-black">{item.name}</span>
                          <span className="rounded-full border border-[#8FB7F1]/20 bg-[#F5F8FC] px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-black/60">
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

              <div className="mt-5 flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
                  Cancel
                </Button>
                <Button onClick={() => void saveEditableProfile()} disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save changes"}
                </Button>
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
