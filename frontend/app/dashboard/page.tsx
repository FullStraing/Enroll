"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, CircleAlert, CircleCheck, FileText, GraduationCap, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DashboardExportCard, DashboardSnapshotCard } from "@/components/dashboard/dashboard-snapshot-card";
import { ProgressBlockCard } from "@/components/dashboard/progress-block-card";
import { SharePreviewToast } from "@/components/dashboard/share-preview-toast";
import { useLocale } from "@/components/locale-provider";
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
import { formatPlanLabel, getAiUsage, getUniversityUsage } from "@/lib/account-plan";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getDashboardCopy, translateDashboardStatus } from "@/lib/dashboard-copy";
import { readStoredIntroQuiz, resolveIntroQuizAnswers } from "@/lib/intro-quiz";
import { isProfileReadyForDashboard } from "@/lib/onboarding-gate";
import { formatDateShort, formatDateShortNoYear } from "@/lib/date-format";
import { readSessionCache, SESSION_CACHE_KEYS, SESSION_CACHE_TTLS, writeSessionCache } from "@/lib/session-cache";

function DashboardPageContent() {
  const { locale } = useLocale();
  const copy = getDashboardCopy(locale);
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
    const storedQuiz = readStoredIntroQuiz()?.answers;
    setQuizAnswers(resolveIntroQuizAnswers({ stored: storedQuiz, profile: payload.profile }));
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
          setStatusText(error instanceof Error ? error.message : copy.statusText.dashboardLoadFailed);
        }
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [applyDashboardData, copy.statusText.dashboardLoadFailed]);

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
        : quizAnswers.gpaScale?.includes("Percent") || quizAnswers.gpaScale?.includes("Процент")
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
        locale,
      }),
    [progressData?.overall.percent, normalizedGpa, profile?.sat_total, quizAnswers.tests, myUniversities.length, profileMajor, intake, locale],
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
        locale,
      }),
    [progressData?.overall.percent, normalizedGpa, profile?.sat_total, quizAnswers.tests, myUniversities.length, profileMajor, intake, locale],
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
        locale,
      }),
    [profile, quizAnswers, myUniversities, essays, documents, progressData?.sections, locale],
  );

  const nearestDeadline = useMemo(() => {
    const candidates: { date: string; label: string }[] = [];

    for (const application of applications) {
      if (application.deadline_date) {
        candidates.push({
          date: application.deadline_date,
          label: `${application.university?.name || application.university_name || copy.progress.applications} - ${translateDashboardStatus(locale, application.status)}`,
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
  }, [applications, tasks, myUniversities, copy.progress.applications, locale]);

  const latestEssay = essays[0] || null;
  const shareName = profile?.full_name || (locale === "ru" ? "Студент" : "Student");
  const shareCountry = profileCountry !== "N/A" ? `${COUNTRY_FLAG_MAP[profileCountry] || "\u{1F30D}"} ${profileCountry}` : copy.snapshot.countryNotSet;
  const shareIntake = intake !== "N/A" ? `${copy.snapshot.applyingForFall} ${intake}` : copy.snapshot.targetIntakeNotSet;
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
    status: translateDashboardStatus(locale, item.status),
  }));
  const shareAcademicTests = buildInitialAcademicTests(profile, quizAnswers).filter((item) => item.score.trim());
  const shareLanguageTests = buildInitialLanguageTests(profile, quizAnswers).filter((item) => item.score.trim());
  const planLabel = formatPlanLabel(profile?.account_plan);
  const universityUsage = getUniversityUsage(profile);
  const aiUsage = getAiUsage(profile);
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
      setStatusText(copy.statusText.snapshotNotReady);
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
          setStatusText(copy.statusText.snapshotCopied);
          return;
        }
        downloadImageBlob(blob);
        setStatusText(copy.statusText.clipboardUnsupported);
      } catch {
        downloadImageBlob(blob);
        setStatusText(copy.statusText.clipboardBlocked);
      }
    } catch {
      setStatusText(copy.statusText.snapshotCreateFailed);
    } finally {
      setSharingDashboard(false);
    }
  }

  async function handleSaveSnapshot() {
    const node = dashboardExportRef.current;
    if (!node) {
      setStatusText(copy.statusText.snapshotNotReady);
      return;
    }

    setSavingSnapshot(true);
    try {
      const blob = await captureDashboardBlob(node);
      downloadImageBlob(blob);
      setStatusText(copy.statusText.snapshotSaved);
    } catch {
      setStatusText(copy.statusText.snapshotSaveFailed);
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
        <div className="text-[var(--enroll-fg)] dark:[&_*]:text-[var(--enroll-fg)]">
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
            <Card className="mt-5 border border-[var(--enroll-surface-border)] bg-[color-mix(in_srgb,var(--enroll-yellow)_22%,var(--enroll-surface-elevated))] shadow-none">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl">{copy.progress.finishProfile}</CardTitle>
                  <p className="mt-1 text-sm text-[var(--enroll-muted)]">
                    {copy.progress.finishProfileBody}
                  </p>
                </div>
                <Link href="/onboarding" className="inline-flex">
                  <Button>{copy.progress.editProfile}</Button>
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

          <div className="mt-5 grid gap-4 lg:grid-cols-2 text-[var(--enroll-fg)]">
            <Card className="border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardDescription>{copy.progress.overallProgress}</CardDescription>
                  {loading ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-2 text-3xl font-black text-[var(--enroll-fg)]">{dashboardProgress.overallPercent}%</p>}
                  <p className="mt-1 text-xs text-[var(--enroll-muted)]">
                    {dashboardProgress.blocks.reduce((sum, block) => sum + block.completed, 0)}/
                    {dashboardProgress.blocks.reduce((sum, block) => sum + block.total, 0)} {copy.progress.sectionsCompleteSuffix}
                  </p>
                </div>
                <Target className="h-6 w-6 text-[var(--enroll-muted)]" />
              </div>
              <Progress value={loading ? 0 : dashboardProgress.overallPercent} className="mt-4 h-3" />
              <div className="mt-3 flex items-center justify-between text-xs text-[var(--enroll-muted)]">
                <span>{copy.progress.blocksTracked}: {dashboardProgress.blocks.length}/5</span>
                <Link href="/common-app" className="font-semibold text-[var(--enroll-fg)] underline">
                  {copy.progress.openForm}
                </Link>
              </div>
            </Card>

            <Card className="border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardDescription>{copy.progress.nextDeadline}</CardDescription>
                  {loading ? (
                    <Skeleton className="mt-2 h-6 w-36" />
                  ) : nearestDeadline ? (
                    <>
                      <p className="mt-2 text-xl font-black">{formatDateShortNoYear(nearestDeadline.date)}</p>
                      <p className="mt-1 text-sm text-[var(--enroll-muted)]">{nearestDeadline.label}</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-xl font-black">{copy.progress.noUpcomingDate}</p>
                      <p className="mt-1 text-sm text-[var(--enroll-muted)]">{copy.progress.activateDeadlineCard}</p>
                    </>
                  )}
                </div>
                <CalendarClock className="h-6 w-6 text-[var(--enroll-muted)]" />
              </div>
              <Link href="/calendar" className="mt-4 inline-flex">
                <Button variant="secondary">{copy.progress.openCalendar}</Button>
              </Link>
            </Card>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-36 w-full rounded-2xl" />)
              : dashboardProgress.blocks.map((block) => <ProgressBlockCard key={block.key} block={block} />)}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2 text-[var(--enroll-fg)]">
            <Card className="border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] shadow-none">
              <div className="mb-3 flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  {copy.progress.universities}
                </CardTitle>
                <Badge variant="cyan">
                  {universityUsage.maxCount > 0 ? `${universityUsage.used}/${universityUsage.maxCount}` : myUniversities.length}
                </Badge>
              </div>
              {!loading ? (
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--enroll-muted)]">
                  <Badge>{planLabel}</Badge>
                  <span>
                    {universityUsage.maxCount > 0
                      ? locale === "ru"
                        ? `${universityUsage.used} из ${universityUsage.maxCount} университетов занято`
                        : `${universityUsage.used} of ${universityUsage.maxCount} universities used`
                      : "N/A"}
                  </span>
                </div>
              ) : null}
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : myUniversities.length === 0 ? (
                <div className="rounded-2xl bg-[var(--enroll-cyan)]/18 p-4 ring-1 ring-[var(--enroll-surface-border)]">
                  <p className="text-sm font-semibold">{copy.progress.buildUniversityListTitle}</p>
                  <p className="mt-1 text-sm text-[var(--enroll-muted)]">{copy.progress.buildUniversityListBody}</p>
                  <Link href="/applications" className="mt-3 inline-flex">
                    <Button size="sm">{copy.progress.buildList}</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {myUniversities.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-[var(--enroll-surface-elevated)] p-3 ring-1 ring-[var(--enroll-surface-border)]">
                      <div>
                        <p className="text-sm font-semibold">{item.university.name}</p>
                        <p className="text-xs text-[var(--enroll-muted)]">{copy.progress.status}: {translateDashboardStatus(locale, item.status)}</p>
                      </div>
                      <Badge>{item.progress_percent}%</Badge>
                    </div>
                  ))}
                  {myUniversities.length > 5 ? <p className="text-xs text-[var(--enroll-muted)]">+{myUniversities.length - 5} {copy.snapshot.more}</p> : null}
                </div>
              )}
            </Card>

            <Card className="border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] shadow-none">
              <div className="mb-3 flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {copy.progress.essays}
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
                  <div className="rounded-xl bg-[var(--enroll-surface-elevated)] p-3 ring-1 ring-[var(--enroll-surface-border)]">
                    <p className="text-sm font-semibold">{latestEssay.title}</p>
                    <p className="mt-1 text-xs text-[var(--enroll-muted)]">
                      {locale === "ru" ? "Версии" : "Versions"}: {latestEssay.versions_count} · {locale === "ru" ? "Обновлено" : "Last edited"}: {latestEssay.last_edited_at ? formatDateShort(latestEssay.last_edited_at) : "N/A"}
                    </p>
                  </div>
                  <Link href="/essays" className="inline-flex">
                    <Button size="sm">{copy.progress.continueEssays}</Button>
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl bg-[color-mix(in_srgb,var(--enroll-yellow)_18%,var(--enroll-surface-elevated))] p-4 ring-1 ring-[var(--enroll-surface-border)]">
                  <p className="text-sm font-semibold">{copy.progress.personalEssayNotStarted}</p>
                  <p className="mt-1 text-sm text-[var(--enroll-muted)]">{copy.progress.personalEssayNotStartedBody}</p>
                  <Link href="/essays" className="mt-3 inline-flex">
                    <Button size="sm">{copy.progress.startEssay}</Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 text-[var(--enroll-fg)]">
            <Card className="border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] shadow-none">
              <CardDescription>{copy.progress.openTasks}</CardDescription>
              {loading ? <Skeleton className="mt-2 h-7 w-14" /> : <p className="mt-2 text-2xl font-black">{tasks.filter((task) => task.status !== "done").length}</p>}
            </Card>
            <Card className="border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] shadow-none">
              <CardDescription>{copy.progress.documents}</CardDescription>
              {loading ? <Skeleton className="mt-2 h-7 w-14" /> : <p className="mt-2 text-2xl font-black">{documents.length}</p>}
            </Card>
            <Card className="border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] shadow-none">
              <CardDescription>{copy.progress.applications}</CardDescription>
              {loading ? <Skeleton className="mt-2 h-7 w-14" /> : <p className="mt-2 text-2xl font-black">{applications.length}</p>}
            </Card>
            <Card className="border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] shadow-none">
              <CardDescription>{locale === "ru" ? "План и лимиты" : "Plan & limits"}</CardDescription>
              {loading ? (
                <Skeleton className="mt-2 h-7 w-28" />
              ) : (
                <>
                  <p className="mt-2 text-2xl font-black">{planLabel}</p>
                  <p className="mt-1 text-xs text-[var(--enroll-muted)]">
                    {universityUsage.maxCount > 0
                      ? locale === "ru"
                        ? `Университеты: ${universityUsage.used}/${universityUsage.maxCount}`
                        : `Universities: ${universityUsage.used}/${universityUsage.maxCount}`
                      : locale === "ru"
                        ? "Университеты: N/A"
                        : "Universities: N/A"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--enroll-muted)]">
                    {aiUsage.monthlyLimit > 0
                      ? locale === "ru"
                        ? `AI в этом месяце: ${aiUsage.usedThisMonth}/${aiUsage.monthlyLimit}`
                        : `AI this month: ${aiUsage.usedThisMonth}/${aiUsage.monthlyLimit}`
                      : locale === "ru"
                        ? "AI в этом месяце: N/A"
                        : "AI this month: N/A"}
                  </p>
                </>
              )}
            </Card>
          </div>

          {statusText ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--enroll-surface-elevated)] px-3 py-2 text-sm text-[var(--enroll-muted)] ring-1 ring-[var(--enroll-surface-border)]">
              <CircleAlert className="h-4 w-4" />
              {statusText}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--enroll-cyan)]/30 px-3 py-2 text-sm text-[var(--enroll-fg)] ring-1 ring-[var(--enroll-surface-border)]">
              <CircleCheck className="h-4 w-4" />
              {locale === "ru" ? "Дашборд синхронизирован с последними данными профиля и заявок." : "Dashboard is synced with your latest profile and application data."}
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



