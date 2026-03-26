"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { EditProfileModal } from "@/components/dashboard/edit-profile-modal";
import { ProtectedPage } from "@/components/protected-page";
import { Skeleton } from "@/components/ui/skeleton";
import { TEST_SCORE_RULES } from "@/app/dashboard/constants";
import type {
  AcademicTestType,
  EditProfileForm,
  IntroAnswers,
  IntroStorage,
  LanguageTestType,
  Profile,
  StudentUniversity,
} from "@/app/dashboard/types";
import {
  buildEmptyEditForm,
  buildInitialEditForm,
  normalizeAcademicTestsForSave,
  normalizeLanguageTestsForSave,
  normalizeScoreOnCommit,
  sanitizeScoreInput,
} from "@/app/dashboard/utils";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { readStoredIntroQuiz, writeStoredIntroQuiz } from "@/lib/intro-quiz";
import { clearSessionCaches, SESSION_CACHE_KEYS, writeSessionCache } from "@/lib/session-cache";

function LoadingState() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-[640px] w-full rounded-[28px]" />
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const editPageRef = useRef<HTMLDivElement>(null);
  const lastSavedEditSignatureRef = useRef("");

  const [loading, setLoading] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [statusText, setStatusText] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<IntroAnswers>({});
  const [myUniversities, setMyUniversities] = useState<StudentUniversity[]>([]);
  const [editForm, setEditForm] = useState<EditProfileForm>(buildEmptyEditForm());

  const editFormSignature = useMemo(() => JSON.stringify(editForm), [editForm]);
  const gpaMax = editForm.gpaScale === "5.0" ? 5 : editForm.gpaScale === "Percent" ? 100 : 4;
  const gpaStep = editForm.gpaScale === "Percent" ? "1" : "0.01";

  const loadWorkspace = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setStatusText("");

    let storedQuiz: IntroAnswers = {};
    try {
      const parsed = readStoredIntroQuiz() as IntroStorage | null;
      storedQuiz = parsed?.answers || {};
      setQuizAnswers(storedQuiz);
    } catch {
      storedQuiz = {};
    }

    try {
      const [profileResp, universitiesResp] = await Promise.all([
        apiFetch<Profile>("/api/auth/profile/", { method: "GET" }, token),
        apiFetch<StudentUniversity[]>("/api/my-universities/", { method: "GET" }, token),
      ]);

      const initialForm = buildInitialEditForm(profileResp, storedQuiz, universitiesResp);
      setMyUniversities(universitiesResp);
      setEditForm(initialForm);
      lastSavedEditSignatureRef.current = JSON.stringify(initialForm);
      setAutosaveStatus("idle");
      writeSessionCache(SESSION_CACHE_KEYS.onboarding, initialForm, token);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    const token = getToken();
    if (!token || loading) return;
    writeSessionCache(SESSION_CACHE_KEYS.onboarding, editForm, token);
  }, [editForm, loading]);

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
      const nextType: AcademicTestType = usedTypes.has("SAT") ? "ACT" : "SAT";
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
      const nextType = (["IELTS", "TOEFL", "DET", "PTE", "Cambridge"] as LanguageTestType[]).find((option) => !usedTypes.has(option)) || "IELTS";
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
      return {
        ...prev,
        apScores: [...prev.apScores, { exam: "AP Calculus AB", score: "5" }],
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
      return { ...prev, activities: [...prev.activities, { title: "", description: "" }] };
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
      return { ...prev, honors: [...prev.honors, ""] };
    });
  }

  function removeHonorRow(index: number) {
    setEditForm((prev) => ({
      ...prev,
      honors: prev.honors.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  const saveEditableProfile = useCallback(
    async (options?: { autosave?: boolean; form?: EditProfileForm }) => {
      const token = getToken();
      if (!token) return;
      const autosave = options?.autosave ?? false;
      const form = options?.form ?? editForm;

      setSavingEdit(true);
      setAutosaveStatus(autosave ? "saving" : "idle");
      try {
        const gpaNumber = form.gpaValue ? Number(form.gpaValue) : null;
        const normalizedAcademicTests = normalizeAcademicTestsForSave(form.academicTests);
        const normalizedLanguageTests = normalizeLanguageTestsForSave(form.languageTests);

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

        const cleanActivities = form.activities
          .map((item) => [item.title.trim(), item.description.trim()].filter(Boolean).join(" - "))
          .filter(Boolean);
        const cleanHonors = form.honors.map((item) => item.trim()).filter(Boolean);
        const cleanAcademicTests = normalizedAcademicTests.map((item) => ({ type: item.type, score: item.score.trim() })).filter((item) => item.score);
        const cleanLanguageTests = normalizedLanguageTests.map((item) => ({ type: item.type, score: item.score.trim() })).filter((item) => item.score);
        const cleanApScores = form.apScores.map((item) => ({ exam: item.exam.trim(), score: item.score.trim() })).filter((item) => item.exam && item.score);

        const payload: Partial<Profile> = {
          full_name: form.fullName || "",
          intended_major: form.major || "",
          country: form.country || "",
          gpa: gpaNumber == null || Number.isNaN(gpaNumber) ? null : gpaNumber,
          sat_total: getAcademicScore("SAT"),
          toefl_total: getLanguageScore("TOEFL"),
          ielts_overall: getLanguageScore("IELTS"),
          det_score: getLanguageScore("DET"),
          activities: cleanActivities,
          honors: cleanHonors,
          common_app_profile: {
            dashboard_snapshot: {
              academic_tests: cleanAcademicTests,
              language_tests: cleanLanguageTests,
              ap_scores: cleanApScores,
              displayed_university_ids: form.selectedUniversityIds.slice(0, 7),
            },
          },
        };

        await apiFetch("/api/auth/profile/", { method: "PATCH", body: JSON.stringify(payload) }, token);
        lastSavedEditSignatureRef.current = JSON.stringify(form);

        const nextAnswers: IntroAnswers = {
          ...quizAnswers,
          major: form.major || undefined,
          country: form.country || undefined,
          intakeYear: form.intakeYear || undefined,
          schoolLevel: form.schoolLevel || undefined,
          gpaScale: form.gpaScale || undefined,
          gpaValue: form.gpaValue || undefined,
          tests: [...form.academicTests, ...form.languageTests].map((item) => item.type),
        };
        setQuizAnswers(nextAnswers);
        writeStoredIntroQuiz({ step: 6, answers: nextAnswers });
        writeSessionCache(SESSION_CACHE_KEYS.onboarding, form, token);
        clearSessionCaches([SESSION_CACHE_KEYS.dashboard, SESSION_CACHE_KEYS.activities, SESSION_CACHE_KEYS.settings]);
        await refreshSession();

        if (autosave) {
          setAutosaveStatus("saved");
        } else {
          setStatusText("Profile updated.");
        }
      } catch (error) {
        if (autosave) {
          setAutosaveStatus("error");
        } else {
          setStatusText(error instanceof Error ? error.message : "Unable to save profile changes.");
        }
      } finally {
        setSavingEdit(false);
      }
    },
    [editForm, quizAnswers, refreshSession],
  );

  useEffect(() => {
    if (loading || savingEdit) return;
    if (editFormSignature === lastSavedEditSignatureRef.current) return;

    const timeoutId = window.setTimeout(() => {
      void saveEditableProfile({ autosave: true, form: editForm });
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [editForm, editFormSignature, loading, saveEditableProfile, savingEdit]);

  return (
    <ProtectedPage>
      <AppShell title="Edit Profile">
        {loading ? (
          <LoadingState />
        ) : (
          <div className="grid gap-4">
            {statusText ? (
              <div className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm text-black/70 ring-1 ring-black/10">
                <CircleAlert className="h-4 w-4" />
                {statusText}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-1 text-sm text-black/60">
                <CircleCheck className="h-4 w-4" />
                Changes here update your dashboard snapshot automatically.
              </div>
            )}

            <EditProfileModal
              mode="page"
              closeLabel="Back to dashboard"
              editModalRef={editPageRef}
              editForm={editForm}
              savingEdit={savingEdit}
              autosaveStatus={autosaveStatus}
              gpaMax={gpaMax}
              gpaStep={gpaStep}
              onClose={() => router.push("/dashboard")}
              onSave={() => void saveEditableProfile()}
              setEditForm={setEditForm}
              addAcademicTestRow={addAcademicTestRow}
              updateAcademicTestRow={updateAcademicTestRow}
              commitAcademicTestScore={commitAcademicTestScore}
              removeAcademicTestRow={removeAcademicTestRow}
              addLanguageTestRow={addLanguageTestRow}
              updateLanguageTestRow={updateLanguageTestRow}
              commitLanguageTestScore={commitLanguageTestScore}
              removeLanguageTestRow={removeLanguageTestRow}
              addApScoreRow={addApScoreRow}
              updateApScoreRow={updateApScoreRow}
              removeApScoreRow={removeApScoreRow}
              addActivityRow={addActivityRow}
              updateActivityRow={updateActivityRow}
              removeActivityRow={removeActivityRow}
              addHonorRow={addHonorRow}
              updateHonorRow={updateHonorRow}
              removeHonorRow={removeHonorRow}
              sanitizeScoreInput={sanitizeScoreInput}
              onEditUniversities={() => router.push("/universities")}
              myUniversities={myUniversities}
            />
          </div>
        )}
      </AppShell>
    </ProtectedPage>
  );
}
