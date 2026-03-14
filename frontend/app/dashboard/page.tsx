"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { CalendarClock, CircleAlert, CircleCheck, FileText, Flag, GraduationCap, Sparkles, Target, Trophy, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProgressBlockCard } from "@/components/dashboard/progress-block-card";
import { ProtectedPage } from "@/components/protected-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { buildDashboardProgress, type IntroAnswers as ProgressIntroAnswers } from "@/app/dashboard/progress";
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
type EditableFieldKey = "major" | "gpa" | "tests" | "intake" | "country" | "level" | "budget" | "graduationYear";

type EditProfileForm = {
  major: string;
  country: string;
  intakeYear: string;
  schoolLevel: string;
  graduationYear: string;
  budget: string;
  gpaScale: string;
  gpaValue: string;
  satTotal: string;
  tests: string[];
};

const TEST_OPTIONS = ["SAT", "ACT", "TOEFL", "IELTS", "DET"];
const SCHOOL_LEVEL_OPTIONS = ["9", "10", "11", "12", "Gap Year", "College"];
const INTAKE_OPTIONS = ["2026", "2027", "2028", "2029+"];
const GPA_SCALE_OPTIONS = ["4.0", "5.0", "Percent"];
const BUDGET_OPTIONS = [
  { value: "low", label: "Low budget" },
  { value: "medium", label: "Medium budget" },
  { value: "high", label: "High budget" },
  { value: "full_pay", label: "Full pay" },
];
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

const sectionEstimateMinutes: Record<string, number> = {
  profile: 4,
  family: 4,
  education: 7,
  testing: 3,
  activities: 6,
  writing: 5,
};

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
  const [editForm, setEditForm] = useState<EditProfileForm>({
    major: "",
    country: "",
    intakeYear: "",
    schoolLevel: "",
    graduationYear: "",
    budget: "",
    gpaScale: "4.0",
    gpaValue: "",
    satTotal: "",
    tests: [],
  });

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

  const nextStep = useMemo(() => {
    if (progressData) {
      const firstIncomplete = progressData.sections.find((section) => section.percent < 100);
      if (firstIncomplete) {
        return {
          label: `Complete ${firstIncomplete.title}`,
          eta: sectionEstimateMinutes[firstIncomplete.key] || 4,
          href: "/common-app",
        };
      }
    }
    if (myUniversities.length === 0) {
      return { label: "Build your university list", eta: 5, href: "/applications" };
    }
    if (essays.length === 0) {
      return { label: "Start your personal essay", eta: 12, href: "/essays" };
    }
    return { label: "Review upcoming deadlines", eta: 2, href: "/calendar" };
  }, [progressData, myUniversities.length, essays.length]);

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

  async function handleShareProfile() {
    const title = "My Enroll Admissions Profile";
    const text = `Major: ${profileMajor}\nGPA: ${gpaLabel}\nTests: ${testsLabel}\nTarget intake: ${intake}\nAdmissions score: ${admissions}/100\nUniversities: ${
      targetUniversities.length ? targetUniversities.join(", ") : "Not selected yet"
    }`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatusText("Profile summary copied to clipboard.");
    } catch {
      setStatusText("Unable to share profile right now.");
    }
  }

  useEffect(() => {
    setEditForm({
      major: profile?.intended_major || quizAnswers.major || "",
      country: profile?.country || quizAnswers.country || "",
      intakeYear: quizAnswers.intakeYear || "",
      schoolLevel: quizAnswers.schoolLevel || "",
      graduationYear: profile?.graduation_year ? String(profile.graduation_year) : "",
      budget: profile?.budget_range || "",
      gpaScale: quizAnswers.gpaScale || "4.0",
      gpaValue: quizAnswers.gpaValue || "",
      satTotal: profile?.sat_total ? String(profile.sat_total) : "",
      tests: Array.isArray(quizAnswers.tests) ? quizAnswers.tests : [],
    });
  }, [profile?.budget_range, profile?.country, profile?.graduation_year, profile?.intended_major, profile?.sat_total, quizAnswers]);

  useEffect(() => {
    const editParam = searchParams.get("edit");
    if (!editParam) return;
    const allowed = new Set<EditableFieldKey>(["major", "gpa", "tests", "intake", "country", "level", "budget", "graduationYear"]);
    if (!allowed.has(editParam as EditableFieldKey)) return;
    setEditHint(editParam as EditableFieldKey);
    setEditOpen(true);
  }, [searchParams]);

  function openEditMenu(field: EditableFieldKey) {
    setEditHint(field);
    setEditOpen(true);
  }

  function toggleEditTest(test: string) {
    setEditForm((prev) => {
      const exists = prev.tests.includes(test);
      return {
        ...prev,
        tests: exists ? prev.tests.filter((item) => item !== test) : [...prev.tests, test],
      };
    });
  }

  async function saveEditableProfile() {
    const token = getToken();
    if (!token) return;
    setSavingEdit(true);
    try {
      const gpaNumber = editForm.gpaValue ? Number(editForm.gpaValue) : null;
      const satNumber = editForm.satTotal ? Number(editForm.satTotal) : null;

      const payload: Partial<Profile> = {
        intended_major: editForm.major || "",
        country: editForm.country || "",
        graduation_year: editForm.graduationYear ? Number(editForm.graduationYear) : null,
        budget_range: editForm.budget || "",
        gpa: gpaNumber == null || Number.isNaN(gpaNumber) ? null : gpaNumber,
        sat_total: satNumber == null || Number.isNaN(satNumber) ? null : satNumber,
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
        tests: editForm.tests,
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

  return (
    <ProtectedPage>
      <AppShell title="Dashboard" subtitle="Your admissions status, profile strength, and next action.">
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-[#DAF5F0]/35">
            <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full border-2 border-black/10 bg-[#FFDB58]/20" />
            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-1 text-sm font-semibold">
                <UserRound className="h-4 w-4" />
                Admissions Profile
              </div>
              <CardTitle className="text-2xl">Your shareable profile snapshot</CardTitle>
              <CardDescription className="mt-1">This is the profile summary students usually compare with each other.</CardDescription>

              <div className="mt-5 grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-black/15 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-black/50">Major</p>
                    <p className="mt-1 text-base font-bold">{profileMajor}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => openEditMenu("major")}>
                      Change
                    </Button>
                  </div>
                  <div className="rounded-xl border border-black/15 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-black/50">GPA</p>
                    <p className="mt-1 text-base font-bold">{gpaLabel}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => openEditMenu("gpa")}>
                      Change
                    </Button>
                  </div>
                  <div className="rounded-xl border border-black/15 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-black/50">SAT / Test status</p>
                    <p className="mt-1 text-base font-bold">{testsLabel}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => openEditMenu("tests")}>
                      Change
                    </Button>
                  </div>
                  <div className="rounded-xl border border-black/15 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-black/50">Target intake</p>
                    <p className="mt-1 text-base font-bold">Fall {intake}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => openEditMenu("intake")}>
                      Change
                    </Button>
                  </div>
                  <div className="rounded-xl border border-black/15 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-black/50">Country</p>
                    <p className="mt-1 text-base font-bold">{profileCountry}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => openEditMenu("country")}>
                      Change
                    </Button>
                  </div>
                  <div className="rounded-xl border border-black/15 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-black/50">Current level</p>
                    <p className="mt-1 text-base font-bold">{profileClass}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => openEditMenu("level")}>
                      Change
                    </Button>
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
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-black/15 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-black/50">Target universities</p>
                {loading ? (
                  <Skeleton className="mt-2 h-5 w-2/3" />
                ) : targetUniversities.length ? (
                  <p className="mt-1 text-sm font-semibold">{targetUniversities.join(" - ")}</p>
                ) : (
                  <p className="mt-1 text-sm text-black/65">No universities selected yet.</p>
                )}
              </div>

              <div className="mt-5 flex items-center gap-2">
                <Button onClick={handleShareProfile} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Share my profile
                </Button>
                <Link href="/common-app">
                  <Button variant="secondary">Edit profile</Button>
                </Link>
              </div>
            </div>
          </Card>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
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
                <CardDescription>Next step</CardDescription>
                {loading ? <Skeleton className="mt-2 h-6 w-40" /> : <p className="mt-2 text-xl font-black">{nextStep.label}</p>}
                <p className="mt-1 text-sm text-black/65">Estimated time: {nextStep.eta} minutes</p>
              </div>
              <Flag className="h-6 w-6 text-black/60" />
            </div>
            <Link href={nextStep.href} className="mt-4 inline-flex">
              <Button>Continue application</Button>
            </Link>
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

        {editOpen ? (
          <div className="fixed inset-0 z-50 bg-black/40 p-4">
            <div className="mx-auto mt-8 w-full max-w-3xl rounded-3xl border-2 border-black bg-white p-5 shadow-[0_10px_0_0_rgba(0,0,0,1)]">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/50">Quick edit</p>
                  <h3 className="text-2xl font-black">Update your profile snapshot</h3>
                  <p className="mt-1 text-sm text-black/65">
                    Duolingo-style fast update. Change values and keep your dashboard share-ready.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="rounded-xl border border-black/15 bg-black/[0.02] p-3 text-sm">
                  <span className="text-xs uppercase tracking-wide text-black/50">Major</span>
                  <input
                    value={editForm.major}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, major: event.target.value }))}
                    placeholder="Computer Science"
                    className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  />
                </label>

                <label className="rounded-xl border border-black/15 bg-black/[0.02] p-3 text-sm">
                  <span className="text-xs uppercase tracking-wide text-black/50">Country</span>
                  <select
                    value={editForm.country}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, country: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  >
                    <option value="">Select country</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-xl border border-black/15 bg-black/[0.02] p-3 text-sm">
                  <span className="text-xs uppercase tracking-wide text-black/50">Target intake</span>
                  <select
                    value={editForm.intakeYear}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, intakeYear: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  >
                    <option value="">Select intake year</option>
                    {INTAKE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-xl border border-black/15 bg-black/[0.02] p-3 text-sm">
                  <span className="text-xs uppercase tracking-wide text-black/50">Current level</span>
                  <select
                    value={editForm.schoolLevel}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, schoolLevel: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  >
                    <option value="">Select current level</option>
                    {SCHOOL_LEVEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-xl border border-black/15 bg-black/[0.02] p-3 text-sm">
                  <span className="text-xs uppercase tracking-wide text-black/50">Graduation year</span>
                  <input
                    type="number"
                    min={new Date().getFullYear() - 1}
                    max={new Date().getFullYear() + 8}
                    value={editForm.graduationYear}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, graduationYear: event.target.value }))}
                    placeholder={String(new Date().getFullYear())}
                    className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  />
                </label>

                <label className="rounded-xl border border-black/15 bg-black/[0.02] p-3 text-sm">
                  <span className="text-xs uppercase tracking-wide text-black/50">Budget</span>
                  <select
                    value={editForm.budget}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, budget: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  >
                    <option value="">Select budget</option>
                    {BUDGET_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-xl border border-black/15 bg-black/[0.02] p-3 text-sm">
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
                    className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  >
                    {GPA_SCALE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-xl border border-black/15 bg-black/[0.02] p-3 text-sm">
                  <span className="text-xs uppercase tracking-wide text-black/50">GPA value</span>
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
                    className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  />
                  <p className="mt-1 text-xs text-black/60">
                    {editForm.gpaScale === "Percent" ? "Expected range: 0-100%" : `Expected range: 0-${gpaMax}`}
                  </p>
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="rounded-xl border border-black/15 bg-black/[0.02] p-3 text-sm">
                  <span className="text-xs uppercase tracking-wide text-black/50">SAT total</span>
                  <input
                    type="number"
                    value={editForm.satTotal}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, satTotal: event.target.value }))}
                    placeholder="1450"
                    className="mt-2 w-full rounded-xl border border-black/20 bg-white px-3 py-2"
                  />
                </label>

                <div className="rounded-xl border border-black/15 bg-black/[0.02] p-3 text-sm">
                  <span className="text-xs uppercase tracking-wide text-black/50">Test status</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TEST_OPTIONS.map((test) => (
                      <button
                        key={test}
                        type="button"
                        onClick={() => toggleEditTest(test)}
                        className={`rounded-xl border-2 px-3 py-1 text-sm font-semibold transition ${
                          editForm.tests.includes(test) ? "border-black bg-[#FFDB58]/70" : "border-black/20 bg-white"
                        }`}
                      >
                        {test}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {editHint ? (
                <p className="mt-3 text-xs text-black/60">
                  You opened this panel from: <span className="font-semibold uppercase">{editHint}</span>
                </p>
              ) : null}

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
