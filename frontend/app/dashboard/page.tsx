"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, CircleAlert, CircleCheck, FileText, GraduationCap, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DashboardExportCard, DashboardSnapshotCard } from "@/components/dashboard/dashboard-snapshot-card";
import { ProgressBlockCard } from "@/components/dashboard/progress-block-card";
import { SharePreviewToast } from "@/components/dashboard/share-preview-toast";
import { ProtectedPage } from "@/components/protected-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNTRY_FLAG_MAP } from "@/app/dashboard/constants";
import { buildDashboardProgress } from "@/app/dashboard/progress";
import { captureDashboardBlob, copyImageToClipboard, downloadImageBlob } from "@/app/dashboard/share-dashboard";
import type {
  ApplicationItem,
  CommonAppProgress,
  DashboardCachePayload,
  DocumentItem,
  EssayItem,
  IntroAnswers,
  IntroStorage,
  Profile,
  StudentUniversity,
  Task,
} from "@/app/dashboard/types";
import {
  admissionsScore,
  buildAdmissionsScoreBreakdown,
  buildInitialAcademicTests,
  buildInitialLanguageTests,
  normalizeGpaFromQuiz,
} from "@/app/dashboard/utils";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { readStoredIntroQuiz } from "@/lib/intro-quiz";
import { isProfileReadyForDashboard } from "@/lib/onboarding-gate";
import { formatDateShort, formatDateShortNoYear } from "@/lib/date-format";
import { readSessionCache, SESSION_CACHE_KEYS, SESSION_CACHE_TTLS, writeSessionCache } from "@/lib/session-cache";

function DashboardPageContent() {
  const router = useRouter();
  const dashboardShareRef = useRef<HTMLDivElement>(null);
  const dashboardExportRef = useRef<HTMLDivElement>(null);

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
  const [sharingDashboard, setSharingDashboard] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);
  const [sharePreviewVisible, setSharePreviewVisible] = useState(false);

  const applyDashboardData = useCallback((payload: Omit<DashboardCachePayload, "cachedAt">) => {
    setProfile(payload.profile);
    setProgressData(payload.progressData);
    setMyUniversities(payload.myUniversities);
    setTasks(payload.tasks);
    setDocuments(payload.documents);
    setEssays(payload.essays);
    setApplications(payload.applications);
    if (!readStoredIntroQuiz()?.answers && payload.profile?.common_app_profile?.intro_quiz_answers) {
      setQuizAnswers(payload.profile.common_app_profile.intro_quiz_answers);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    try {
      const parsed = readStoredIntroQuiz() as IntroStorage | null;
      if (parsed?.answers) {
        setQuizAnswers(parsed.answers);
      }
    } catch {
      // Ignore invalid local quiz payload.
    }

    const run = async () => {
      const { payload: cached, isFresh: isCacheFresh } = readSessionCache<Omit<DashboardCachePayload, "cachedAt">>(
        SESSION_CACHE_KEYS.dashboard,
        SESSION_CACHE_TTLS.dashboard,
        token,
      );

      if (cached) {
        applyDashboardData(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      if (isCacheFresh) {
        setStatusText("");
        return;
      }

      setStatusText("");
      try {
        const [profileResp, progressResp, universitiesResp, tasksResp, documentsResp, essaysResp, applicationsResp] = await Promise.all([
          apiFetch<Profile>("/api/auth/profile/", { method: "GET" }, token),
          apiFetch<CommonAppProgress>("/api/auth/common-app-progress/", { method: "GET" }, token),
          apiFetch<StudentUniversity[]>("/api/my-universities/", { method: "GET" }, token),
          apiFetch<Task[]>("/api/tasks/", { method: "GET" }, token),
          apiFetch<DocumentItem[]>("/api/documents/", { method: "GET" }, token),
          apiFetch<EssayItem[]>("/api/essays/", { method: "GET" }, token),
          apiFetch<ApplicationItem[]>("/api/applications/", { method: "GET" }, token),
        ]);

        applyDashboardData({
          profile: profileResp,
          progressData: progressResp,
          myUniversities: universitiesResp,
          tasks: tasksResp,
          documents: documentsResp,
          essays: essaysResp,
          applications: applicationsResp,
        });
        writeSessionCache(SESSION_CACHE_KEYS.dashboard, {
          profile: profileResp,
          progressData: progressResp,
          myUniversities: universitiesResp,
          tasks: tasksResp,
          documents: documentsResp,
          essays: essaysResp,
          applications: applicationsResp,
        }, token);
      } catch (error) {
        if (!cached) {
          setStatusText(error instanceof Error ? error.message : "Failed to load dashboard.");
        }
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [applyDashboardData]);

  useEffect(() => {
    if (loading || !profile || !progressData) return;
    writeSessionCache(SESSION_CACHE_KEYS.dashboard, {
      profile,
      progressData,
      myUniversities,
      tasks,
      documents,
      essays,
      applications,
    });
  }, [loading, profile, progressData, myUniversities, tasks, documents, essays, applications]);

  useEffect(() => {
    if (!sharePreviewUrl) return;
    return () => URL.revokeObjectURL(sharePreviewUrl);
  }, [sharePreviewUrl]);

  const profileReadyForDashboard = isProfileReadyForDashboard(profile);

  const profileMajor = profile?.intended_major || quizAnswers.major || "N/A";
  const profileCountry = profile?.country || quizAnswers.country || "N/A";
  const profileClass = quizAnswers.schoolLevel || "N/A";
  const intake = quizAnswers.intakeYear || "N/A";

  const normalizedGpa = useMemo(() => {
    const modelGpa = profile?.gpa != null ? Number(profile.gpa) : null;
    if (modelGpa != null && !Number.isNaN(modelGpa)) {
      return Math.max(0, Math.min(4, modelGpa));
    }
    return normalizeGpaFromQuiz(quizAnswers.gpaScale, quizAnswers.gpaValue);
  }, [profile?.gpa, quizAnswers.gpaScale, quizAnswers.gpaValue]);

  const gpaLabel =
    normalizedGpa == null
      ? "N/A"
      : quizAnswers.gpaScale?.includes("5.0")
        ? `${Number(quizAnswers.gpaValue || 0).toFixed(2)} / 5.0`
        : quizAnswers.gpaScale?.includes("Percent")
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
  const admissionsBreakdown = useMemo(
    () =>
      buildAdmissionsScoreBreakdown({
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

    return filtered[0] || null;
  }, [applications, tasks, myUniversities]);

  const latestEssay = essays[0] || null;
  const shareName = profile?.full_name || "Student";
  const shareCountry = profileCountry !== "N/A" ? `${COUNTRY_FLAG_MAP[profileCountry] || "\u{1F30D}"} ${profileCountry}` : "Country not set";
  const shareIntake = intake !== "N/A" ? `Applying for Fall ${intake}` : "Target intake not set";
  const activities = Array.isArray(profile?.activities) ? profile.activities.filter(Boolean).slice(0, 8) : [];
  const honors = Array.isArray(profile?.honors) ? profile.honors.filter(Boolean).slice(0, 6) : [];
  const selectedUniversityIds = profile?.common_app_profile?.dashboard_snapshot?.displayed_university_ids || [];
  const visibleSnapshotUniversities =
    selectedUniversityIds.length > 0
      ? selectedUniversityIds
          .map((id) => myUniversities.find((item) => item.id === id))
          .filter((item): item is StudentUniversity => Boolean(item))
      : myUniversities.slice(0, 6);
  const targetUniversityEntries = visibleSnapshotUniversities.slice(0, 7).map((item) => ({
    id: item.id,
    name: item.university.name,
    statusKey: item.status,
    status: item.status.replaceAll("_", " "),
  }));
  const shareAcademicTests = buildInitialAcademicTests(profile, quizAnswers).filter((item) => item.score.trim());
  const shareLanguageTests = buildInitialLanguageTests(profile, quizAnswers).filter((item) => item.score.trim());
  const primaryAcademicTest = shareAcademicTests[0] || null;
  const primaryLanguageTest = shareLanguageTests[0] || null;
  const academicStatLabel = primaryAcademicTest?.type || "Academic";
  const languageStatLabel = primaryLanguageTest?.type || "Language";
  const primaryAcademicLabel = primaryAcademicTest?.score?.trim() || "N/A";
  const primaryLanguageLabel = primaryLanguageTest?.score?.trim() || "N/A";
  const extraAcademicTests = primaryAcademicTest ? shareAcademicTests.slice(1) : shareAcademicTests;
  const extraLanguageTests = primaryLanguageTest ? shareLanguageTests.slice(1) : shareLanguageTests;
  const allTestLabels = [...extraAcademicTests, ...extraLanguageTests].map((item) => {
    const label = item.type === "DET" ? "Duolingo" : item.type;
    return `${label}\u00A0${item.score.trim().replace(/\s+/g, " ")}`;
  });
  const apLabels = (profile?.common_app_profile?.dashboard_snapshot?.ap_scores || [])
    .filter((item) => item.exam?.trim() && item.score?.trim())
    .map((item) => `${item.exam.replace(/^AP\s+/u, "").replace(/\s+/g, " ")}\u00A0${item.score.trim().replace(/\s+/g, " ")}`)
    .slice(0, 8);

  async function handleShareProfile() {
    const node = dashboardExportRef.current;
    if (!node) {
      setStatusText("Dashboard snapshot is not ready yet.");
      return;
    }

    setSharingDashboard(true);
    try {
      const blob = await captureDashboardBlob(node);
      const previewUrl = URL.createObjectURL(blob);

      setSharePreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return previewUrl;
      });
      setSharePreviewVisible(true);
      window.setTimeout(() => setSharePreviewVisible(false), 3400);

      try {
        const copied = await copyImageToClipboard(blob);
        if (copied) {
          setStatusText("Dashboard snapshot copied to clipboard.");
          return;
        }
        downloadImageBlob(blob);
        setStatusText("Clipboard image is not supported here. Downloaded a dashboard snapshot instead.");
      } catch {
        downloadImageBlob(blob);
        setStatusText("Clipboard access was blocked. Downloaded a dashboard snapshot instead.");
      }
    } catch {
      setStatusText("Unable to create a dashboard snapshot right now.");
    } finally {
      setSharingDashboard(false);
    }
  }

  async function handleSaveSnapshot() {
    const node = dashboardExportRef.current;
    if (!node) {
      setStatusText("Dashboard snapshot is not ready yet.");
      return;
    }

    setSavingSnapshot(true);
    try {
      const blob = await captureDashboardBlob(node);
      downloadImageBlob(blob);
      setStatusText("Dashboard snapshot saved as an image.");
    } catch {
      setStatusText("Unable to save the dashboard snapshot right now.");
    } finally {
      setSavingSnapshot(false);
    }
  }

  function handleOpenEdit() {
    router.push("/onboarding");
  }

  return (
    <ProtectedPage>
      <AppShell title="Dashboard" subtitle="Your admissions status, profile strength, and next action.">
        <div>
          <DashboardSnapshotCard
            snapshotRef={dashboardShareRef}
            shareName={shareName}
            shareCountry={shareCountry}
            shareIntake={shareIntake}
            profileMajor={profileMajor}
            gpaLabel={gpaLabel}
            academicStatLabel={academicStatLabel}
            primaryAcademicLabel={primaryAcademicLabel}
            languageStatLabel={languageStatLabel}
            primaryLanguageLabel={primaryLanguageLabel}
            allTestLabels={allTestLabels}
            apLabels={apLabels}
            profileClass={profileClass}
            activities={activities}
            honors={honors}
            targetUniversityEntries={targetUniversityEntries}
            loading={loading}
            admissions={admissions}
            admissionsBreakdown={admissionsBreakdown}
            sharingDashboard={sharingDashboard}
            savingSnapshot={savingSnapshot}
            onShare={handleShareProfile}
            onSaveImage={() => void handleSaveSnapshot()}
            onEdit={handleOpenEdit}
          />

          {!loading && profile && !profileReadyForDashboard ? (
            <Card className="mt-5 border border-black/10 bg-[#FFF9E8] shadow-none">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl">Finish your profile</CardTitle>
                  <p className="mt-1 text-sm text-black/65">
                    Add your key profile details to make the dashboard snapshot and recommendations more useful.
                  </p>
                </div>
                <Link href="/onboarding" className="inline-flex">
                  <Button>Edit Profile</Button>
                </Link>
              </div>
            </Card>
          ) : null}

          <div aria-hidden className="pointer-events-none fixed left-[-20000px] top-0 opacity-100">
            <DashboardExportCard
              snapshotRef={dashboardExportRef}
              shareName={shareName}
              shareCountry={shareCountry}
              shareIntake={shareIntake}
              profileMajor={profileMajor}
              gpaLabel={gpaLabel}
              academicStatLabel={academicStatLabel}
              primaryAcademicLabel={primaryAcademicLabel}
              languageStatLabel={languageStatLabel}
              primaryLanguageLabel={primaryLanguageLabel}
              allTestLabels={allTestLabels}
              apLabels={apLabels}
              profileClass={profileClass}
              activities={activities}
              honors={honors}
              targetUniversityEntries={targetUniversityEntries}
              loading={loading}
              admissions={admissions}
              admissionsBreakdown={admissionsBreakdown}
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Card className="border border-black/10 bg-white/90 shadow-none">
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

            <Card className="border border-black/10 bg-white/90 shadow-none">
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
            <Card className="border border-black/10 bg-white/90 shadow-none">
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
                <div className="rounded-2xl bg-[#DAF5F0]/22 p-4 ring-1 ring-black/8">
                  <p className="text-sm font-semibold">Start building your university list</p>
                  <p className="mt-1 text-sm text-black/65">Pick 5-8 universities to unlock better deadline and planning recommendations.</p>
                  <Link href="/applications" className="mt-3 inline-flex">
                    <Button size="sm">Build list</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {myUniversities.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-black/8">
                      <div>
                        <p className="text-sm font-semibold">{item.university.name}</p>
                        <p className="text-xs text-black/60">Status: {item.status.replaceAll("_", " ")}</p>
                      </div>
                      <Badge>{item.progress_percent}%</Badge>
                    </div>
                  ))}
                  {myUniversities.length > 5 ? <p className="text-xs text-black/60">+{myUniversities.length - 5} more in your list</p> : null}
                </div>
              )}
            </Card>

            <Card className="border border-black/10 bg-white/90 shadow-none">
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
                  <div className="rounded-xl bg-white p-3 ring-1 ring-black/8">
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
                <div className="rounded-2xl bg-[#FFF4CC]/22 p-4 ring-1 ring-black/8">
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
            <Card className="border border-black/10 bg-white/90 shadow-none">
              <CardDescription>Open tasks</CardDescription>
              {loading ? <Skeleton className="mt-2 h-7 w-14" /> : <p className="mt-2 text-2xl font-black">{tasks.filter((task) => task.status !== "done").length}</p>}
            </Card>
            <Card className="border border-black/10 bg-white/90 shadow-none">
              <CardDescription>Documents</CardDescription>
              {loading ? <Skeleton className="mt-2 h-7 w-14" /> : <p className="mt-2 text-2xl font-black">{documents.length}</p>}
            </Card>
            <Card className="border border-black/10 bg-white/90 shadow-none">
              <CardDescription>Applications</CardDescription>
              {loading ? <Skeleton className="mt-2 h-7 w-14" /> : <p className="mt-2 text-2xl font-black">{applications.length}</p>}
            </Card>
          </div>

          {statusText ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm text-black/70 ring-1 ring-black/10">
              <CircleAlert className="h-4 w-4" />
              {statusText}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#DAF5F0]/50 px-3 py-2 text-sm ring-1 ring-black/10">
              <CircleCheck className="h-4 w-4" />
              Dashboard is synced with your latest profile and application data.
            </div>
          )}
        </div>

        <SharePreviewToast imageUrl={sharePreviewUrl} visible={sharePreviewVisible} />
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

