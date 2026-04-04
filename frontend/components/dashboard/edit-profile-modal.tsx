"use client";

import { useRef, useState, type Dispatch, type ReactNode, type RefObject, type SetStateAction } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { statusSelectTone } from "@/app/universities/utils";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useBodyScrollLock } from "@/components/ui/use-body-scroll-lock";
import {
  AP_EXAM_OPTIONS,
  AP_SCORE_OPTIONS,
  ACADEMIC_TEST_OPTIONS,
  COUNTRY_OPTIONS,
  GPA_SCALE_OPTIONS,
  INTAKE_OPTIONS,
  LANGUAGE_TEST_OPTIONS,
  MODAL_FIELD_CLASS,
  MODAL_REMOVE_BUTTON_CLASS,
  SCHOOL_LEVEL_OPTIONS,
  TEST_SCORE_RULES,
} from "@/app/dashboard/constants";
import type { AcademicTestType, EditProfileForm, LanguageTestType, StudentUniversity } from "@/app/dashboard/types";
import { getDashboardCopy, translateDashboardStatus } from "@/lib/dashboard-copy";

type Props = {
  editModalRef: RefObject<HTMLDivElement>;
  editForm: EditProfileForm;
  savingEdit: boolean;
  autosaveStatus: "idle" | "saving" | "saved" | "error";
  gpaMax: number;
  gpaStep: string;
  onClose: () => void;
  onSave: () => void;
  setEditForm: Dispatch<SetStateAction<EditProfileForm>>;
  addAcademicTestRow: () => void;
  updateAcademicTestRow: (index: number, patch: Partial<EditProfileForm["academicTests"][number]>) => void;
  commitAcademicTestScore: (index: number) => void;
  removeAcademicTestRow: (index: number) => void;
  addLanguageTestRow: () => void;
  updateLanguageTestRow: (index: number, patch: Partial<EditProfileForm["languageTests"][number]>) => void;
  commitLanguageTestScore: (index: number) => void;
  removeLanguageTestRow: (index: number) => void;
  addApScoreRow: () => void;
  updateApScoreRow: (index: number, patch: Partial<EditProfileForm["apScores"][number]>) => void;
  removeApScoreRow: (index: number) => void;
  addActivityRow: () => void;
  updateActivityRow: (index: number, patch: Partial<EditProfileForm["activities"][number]>) => void;
  removeActivityRow: (index: number) => void;
  addHonorRow: () => void;
  updateHonorRow: (index: number, value: string) => void;
  removeHonorRow: (index: number) => void;
  sanitizeScoreInput: (raw: string) => string | null;
  onEditUniversities: () => void;
  myUniversities: StudentUniversity[];
  mode?: "modal" | "page";
  closeLabel?: string;
};

type SectionKey = "basic" | "stats" | "activities" | "honors" | "universities";

const SECTION_BUTTON_STYLES: Record<SectionKey, string> = {
  basic: "bg-[var(--enroll-cyan)]",
  stats: "bg-[var(--enroll-yellow-soft)]",
  activities: "bg-[var(--enroll-yellow)]",
  honors: "bg-[var(--enroll-yellow-soft)]",
  universities: "bg-[var(--enroll-cyan)]",
};

const SECTION_ORDER: SectionKey[] = ["basic", "stats", "activities", "honors", "universities"];

function SectionToggle({ open, onToggle, showLabel, hideLabel }: { open: boolean; onToggle: () => void; showLabel: string; hideLabel: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[var(--enroll-yellow-soft)]"
    >
      {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      {open ? hideLabel : showLabel}
    </button>
  );
}

export function EditProfileModal(props: Props) {
  const { locale } = useLocale();
  const copy = getDashboardCopy(locale).modal;
  const {
    editModalRef,
    editForm,
    savingEdit,
    autosaveStatus,
    gpaMax,
    gpaStep,
    onClose,
    onSave,
    setEditForm,
    addAcademicTestRow,
    updateAcademicTestRow,
    commitAcademicTestScore,
    removeAcademicTestRow,
    addLanguageTestRow,
    updateLanguageTestRow,
    commitLanguageTestScore,
    removeLanguageTestRow,
    addApScoreRow,
    updateApScoreRow,
    removeApScoreRow,
    addActivityRow,
    updateActivityRow,
    removeActivityRow,
    addHonorRow,
    updateHonorRow,
    removeHonorRow,
    sanitizeScoreInput,
    onEditUniversities,
    myUniversities,
    mode = "modal",
    closeLabel = "Close",
  } = props;

  const isPageMode = mode === "page";
  useBodyScrollLock(!isPageMode);
  const sectionLabels: Record<SectionKey, string> = {
    basic: copy.basicInfo,
    stats: copy.stats,
    activities: copy.activities,
    honors: copy.honors,
    universities: copy.universities,
  };
  const sectionBadge = isPageMode ? copy.pageBadge : copy.quickEditBadge;
  const heading = isPageMode ? copy.pageHeading : copy.modalHeading;
  const description = isPageMode
    ? copy.pageDescription
    : copy.modalDescription;

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    basic: true,
    stats: true,
    activities: true,
    honors: true,
    universities: true,
  });
  const [activeSection, setActiveSection] = useState<SectionKey>("basic");
  const sectionRefs = {
    basic: useRef<HTMLElement>(null),
    stats: useRef<HTMLElement>(null),
    activities: useRef<HTMLElement>(null),
    honors: useRef<HTMLElement>(null),
    universities: useRef<HTMLElement>(null),
  };

  function toggleSection(key: SectionKey) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function jumpToSection(key: SectionKey) {
    if (isPageMode) {
      setActiveSection(key);
      return;
    }
    const node = sectionRefs[key].current;
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderPageModeStepActions(): ReactNode {
    if (!isPageMode) return null;
    const sectionIndex = SECTION_ORDER.indexOf(activeSection);
    const previousSection = sectionIndex > 0 ? SECTION_ORDER[sectionIndex - 1] : null;
    const nextSection = sectionIndex < SECTION_ORDER.length - 1 ? SECTION_ORDER[sectionIndex + 1] : null;

    return (
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        {previousSection ? (
          <Button variant="outline" onClick={() => setActiveSection(previousSection)} className="w-full sm:w-auto">
            <ChevronLeft className="h-4 w-4" />
            {copy.back}
          </Button>
        ) : null}
        {nextSection ? (
          <Button onClick={() => setActiveSection(nextSection)} className="w-full sm:w-auto">
            {copy.continue}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={onSave} disabled={savingEdit} className="w-full sm:w-auto">
            {savingEdit ? copy.saving : copy.saveProfile}
          </Button>
        )}
      </div>
    );
  }

  function renderPageModeSectionToolbar(section: SectionKey): ReactNode {
    if (!isPageMode || activeSection !== section) return null;

    if (section === "activities") {
      return (
        <div className="flex flex-col gap-3 rounded-[18px] bg-[var(--enroll-yellow-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[var(--enroll-muted-strong)]">{copy.activitiesHint}</p>
          <Button
            type="button"
            variant="outline"
            onClick={addActivityRow}
            disabled={editForm.activities.length >= 6}
            className="w-full sm:w-auto"
          >
            + {copy.addActivity}
          </Button>
        </div>
      );
    }

    if (section === "honors") {
      return (
        <div className="flex flex-col gap-3 rounded-[18px] bg-[var(--enroll-yellow-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[var(--enroll-muted-strong)]">{copy.honorsHint}</p>
          <Button
            type="button"
            variant="outline"
            onClick={addHonorRow}
            disabled={editForm.honors.length >= 4}
            className="w-full sm:w-auto"
          >
            + {copy.addHonor}
          </Button>
        </div>
      );
    }

    if (section === "universities") {
      return (
        <div className="flex flex-col gap-3 rounded-[18px] bg-[var(--enroll-cyan)]/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--enroll-muted-strong)]">{copy.universitiesHint}</p>
            <p className="mt-1 text-xs text-[var(--enroll-muted)]">{copy.universitiesHintSecondary}</p>
          </div>
          <Button type="button" variant="outline" onClick={onEditUniversities} className="w-full sm:w-auto">
            {copy.editUniversities}
          </Button>
        </div>
      );
    }

    return null;
  }

  function toggleUniversitySelection(universityId: number) {
    setEditForm((prev) => {
      const alreadySelected = prev.selectedUniversityIds.includes(universityId);
      if (alreadySelected) {
        return {
          ...prev,
          selectedUniversityIds: prev.selectedUniversityIds.filter((id) => id !== universityId),
        };
      }
      if (prev.selectedUniversityIds.length >= 7) {
        return prev;
      }
      return {
        ...prev,
        selectedUniversityIds: [...prev.selectedUniversityIds, universityId],
      };
    });
  }

  const content = (
      <div
        ref={editModalRef}
        className={`mx-auto flex w-full max-w-5xl flex-col overflow-hidden bg-[var(--enroll-surface-elevated)] p-4 sm:rounded-[32px] sm:p-6 ${
          isPageMode
            ? "min-h-[calc(100dvh-220px)] rounded-none border-0 bg-transparent p-0 shadow-none sm:p-0"
            : "h-[calc(100dvh-16px)] rounded-[24px] border-2 border-[var(--enroll-strong-border)] shadow-[0_12px_0_0_rgba(0,0,0,1)] sm:h-[calc(100dvh-32px)]"
        }`}
      >
        <div
          className={`mb-4 shrink-0 ${
            isPageMode
              ? "rounded-[20px] bg-transparent p-0 sm:mb-4"
              : "rounded-[22px] border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] p-4 shadow-[0_5px_0_rgba(0,0,0,0.06)] sm:mb-5 sm:rounded-[28px] sm:p-5"
          }`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              {isPageMode ? (
                <>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--enroll-muted)]">
                    {copy.stepOf} {SECTION_ORDER.indexOf(activeSection) + 1} {copy.of} {SECTION_ORDER.length}
                  </p>
                  <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[var(--enroll-fg)] sm:text-3xl">{sectionLabels[activeSection]}</h3>
                </>
              ) : (
                <>
                  <span className="inline-flex rounded-full border border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow)] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--enroll-fg)]">
                    {sectionBadge}
                  </span>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[var(--enroll-fg)] sm:text-4xl">{heading}</h3>
                  <p className="mt-2 max-w-2xl text-sm text-[var(--enroll-muted-strong)]">{description}</p>
                </>
              )}
            </div>
            <div className="flex w-full max-w-none flex-wrap justify-start gap-2 md:max-w-[420px] md:justify-end">
              {SECTION_ORDER.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => jumpToSection(key)}
                  className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                    isPageMode
                      ? activeSection === key
                        ? `border-2 border-[var(--enroll-strong-border)] text-[var(--enroll-fg)] ${SECTION_BUTTON_STYLES[key]}`
                        : "border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] text-[var(--enroll-muted)] hover:border-[var(--enroll-strong-border)]/25 hover:text-[var(--enroll-fg)]"
                      : `border-2 border-[var(--enroll-strong-border)] text-[var(--enroll-fg)] shadow-[0_3px_0_#000] hover:-translate-y-0.5 ${SECTION_BUTTON_STYLES[key]}`
                  }`}
                >
                  {sectionLabels[key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`grid min-h-0 flex-1 gap-4 ${isPageMode ? "" : "overflow-y-auto pr-1 sm:gap-5"}`}>
          {!isPageMode || activeSection === "basic" ? (
          <section ref={sectionRefs.basic} className={`rounded-[28px] bg-[var(--enroll-surface-elevated)] ${isPageMode ? "border border-[var(--enroll-surface-border)] shadow-none" : "border border-[var(--enroll-surface-border)] shadow-[0_5px_0_rgba(0,0,0,0.04)]"}`}>
            <div className={`${isPageMode ? "hidden" : "flex flex-col items-start gap-3 rounded-t-[26px] border-b border-[var(--enroll-surface-border)] bg-[var(--enroll-cyan)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"}`}>
              <span className="inline-flex rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-[var(--enroll-muted-strong)]">
                {copy.basicInfo}
              </span>
              {!isPageMode ? <SectionToggle open={openSections.basic} onToggle={() => toggleSection("basic")} showLabel={copy.show} hideLabel={copy.hide} /> : null}
            </div>
            {openSections.basic || isPageMode ? (
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.name}</span>
                  <input
                    value={editForm.fullName}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, fullName: event.target.value }))}
                    placeholder={copy.placeholders.fullName}
                    className={MODAL_FIELD_CLASS}
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.country}</span>
                  <Select
                    value={editForm.country}
                    onChange={(value) => setEditForm((prev) => ({ ...prev, country: value }))}
                    className={MODAL_FIELD_CLASS}
                    options={[
                      { value: "", label: copy.placeholders.selectCountry },
                      ...COUNTRY_OPTIONS.map((country) => ({ value: country, label: country })),
                    ]}
                    ariaLabel={copy.labels.country}
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.major}</span>
                  <input
                    value={editForm.major}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, major: event.target.value }))}
                    placeholder={copy.placeholders.major}
                    className={MODAL_FIELD_CLASS}
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.targetIntake}</span>
                  <Select
                    value={editForm.intakeYear}
                    onChange={(value) => setEditForm((prev) => ({ ...prev, intakeYear: value }))}
                    className={MODAL_FIELD_CLASS}
                    options={[
                      { value: "", label: copy.placeholders.selectIntakeYear },
                      ...INTAKE_OPTIONS.map((option) => ({ value: option, label: option })),
                    ]}
                    ariaLabel={copy.labels.targetIntake}
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.currentLevel}</span>
                  <Select
                    value={editForm.schoolLevel}
                    onChange={(value) => setEditForm((prev) => ({ ...prev, schoolLevel: value }))}
                    className={MODAL_FIELD_CLASS}
                    options={[
                      { value: "", label: copy.placeholders.selectCurrentLevel },
                      ...SCHOOL_LEVEL_OPTIONS.map((option) => ({ value: option, label: option })),
                    ]}
                    ariaLabel={copy.labels.currentLevel}
                  />
                </label>
              </div>
            ) : null}
          </section>
          ) : null}

          {!isPageMode || activeSection === "stats" ? (
          <section ref={sectionRefs.stats} className={`rounded-[28px] bg-[var(--enroll-surface-elevated)] ${isPageMode ? "border border-[var(--enroll-surface-border)] shadow-none" : "border border-[var(--enroll-surface-border)] shadow-[0_5px_0_rgba(0,0,0,0.04)]"}`}>
            <div className={`${isPageMode ? "hidden" : "flex flex-col items-start gap-3 rounded-t-[26px] border-b border-[var(--enroll-surface-border)] bg-[var(--enroll-yellow-soft)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-[var(--enroll-muted-strong)]">
                  {copy.stats}
                </span>
                <p className="text-sm font-semibold text-[var(--enroll-muted)]">{copy.academicScores}</p>
              </div>
              {!isPageMode ? <SectionToggle open={openSections.stats} onToggle={() => toggleSection("stats")} showLabel={copy.show} hideLabel={copy.hide} /> : null}
            </div>
            {openSections.stats || isPageMode ? (
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.gpaScale}</span>
                  <Select
                    value={editForm.gpaScale}
                    onChange={(nextScale) =>
                      setEditForm((prev) => {
                        const nextMax = nextScale === "5.0" ? 5 : nextScale === "Percent" ? 100 : 4;
                        const current = Number(prev.gpaValue);
                        const nextValue =
                          prev.gpaValue && !Number.isNaN(current) ? String(Math.max(0, Math.min(nextMax, current))) : prev.gpaValue;
                        return { ...prev, gpaScale: nextScale, gpaValue: nextValue };
                      })
                    }
                    className={MODAL_FIELD_CLASS}
                    options={GPA_SCALE_OPTIONS.map((option) => ({ value: option, label: option }))}
                    ariaLabel={copy.labels.gpaScale}
                  />
                </label>

                <label className="text-sm">
                  <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.gpa}</span>
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
                    <div className="rounded-[22px] border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--enroll-muted)]">{copy.academicTests}</p>
                          <p className="mt-1 text-sm text-[var(--enroll-muted)]">{copy.academicTestsHint}</p>
                        </div>
                        <button
                          type="button"
                          onClick={addAcademicTestRow}
                          disabled={editForm.academicTests.length >= 2}
                          className="rounded-full border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[var(--enroll-yellow-soft)] disabled:opacity-40"
                        >
                          + {copy.addTest}
                        </button>
                      </div>
                      <div className="grid gap-3">
                        {editForm.academicTests.length ? (
                          editForm.academicTests.map((test, index) => (
                            <div key={`${test.type}-${index}`} className="grid gap-3 rounded-[20px] border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] p-4 md:grid-cols-[0.9fr_1fr_auto]">
                              <label className="text-sm">
                                <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.testType}</span>
                                <Select
                                  value={test.type}
                                  onChange={(value) => updateAcademicTestRow(index, { type: value as AcademicTestType })}
                                  className={MODAL_FIELD_CLASS}
                                  options={ACADEMIC_TEST_OPTIONS.map((option) => ({ value: option, label: option }))}
                                  ariaLabel={copy.academicTests}
                                />
                              </label>
                              <label className="text-sm">
                                <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.score}</span>
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
                                <p className="mt-1 text-xs text-[var(--enroll-muted)]">{TEST_SCORE_RULES[test.type].hint}</p>
                              </label>
                              <div className="flex items-end">
                                <button type="button" onClick={() => removeAcademicTestRow(index)} className={MODAL_REMOVE_BUTTON_CLASS}>
                                  {copy.remove}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-2xl border border-dashed border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-5 text-sm text-[var(--enroll-muted)]">
                            {copy.emptyAcademicTests}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--enroll-muted)]">{copy.languageTests}</p>
                          <p className="mt-1 text-sm text-[var(--enroll-muted)]">{copy.languageTestsHint}</p>
                        </div>
                        <button
                          type="button"
                          onClick={addLanguageTestRow}
                          disabled={editForm.languageTests.length >= 5}
                          className="rounded-full border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[var(--enroll-yellow-soft)] disabled:opacity-40"
                        >
                          + {copy.addTest}
                        </button>
                      </div>
                      <div className="grid gap-3">
                        {editForm.languageTests.length ? (
                          editForm.languageTests.map((test, index) => (
                            <div key={`${test.type}-${index}`} className="grid gap-3 rounded-[20px] border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] p-4 md:grid-cols-[0.9fr_1fr_auto]">
                              <label className="text-sm">
                                <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.testType}</span>
                                <Select
                                  value={test.type}
                                  onChange={(value) => updateLanguageTestRow(index, { type: value as LanguageTestType })}
                                  className={MODAL_FIELD_CLASS}
                                  options={LANGUAGE_TEST_OPTIONS.map((option) => ({
                                    value: option,
                                    label: option === "DET" ? "Duolingo English Test" : option,
                                  }))}
                                  ariaLabel={copy.languageTests}
                                />
                              </label>
                              <label className="text-sm">
                                <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.score}</span>
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
                                <p className="mt-1 text-xs text-[var(--enroll-muted)]">{TEST_SCORE_RULES[test.type].hint}</p>
                              </label>
                              <div className="flex items-end">
                                <button type="button" onClick={() => removeLanguageTestRow(index)} className={MODAL_REMOVE_BUTTON_CLASS}>
                                  {copy.remove}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-2xl border border-dashed border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-5 text-sm text-[var(--enroll-muted)]">
                            {copy.emptyLanguageTests}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--enroll-muted)]">{copy.apExams}</p>
                          <p className="mt-1 text-sm text-[var(--enroll-muted)]">{copy.apExamsHint}</p>
                        </div>
                        <button
                          type="button"
                          onClick={addApScoreRow}
                          disabled={editForm.apScores.length >= 8}
                          className="rounded-full border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[var(--enroll-yellow-soft)] disabled:opacity-40"
                        >
                          + {copy.addAp}
                        </button>
                      </div>
                      <div className="grid gap-3">
                        {editForm.apScores.length ? (
                          editForm.apScores.map((item, index) => (
                            <div key={`${item.exam}-${index}`} className="grid gap-3 rounded-[20px] border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] p-4 md:grid-cols-[1.4fr_0.45fr_auto]">
                              <label className="text-sm">
                                <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.exam}</span>
                                <Select
                                  value={item.exam}
                                  onChange={(value) => updateApScoreRow(index, { exam: value })}
                                  className={MODAL_FIELD_CLASS}
                                  options={AP_EXAM_OPTIONS.map((option) => ({ value: option, label: option }))}
                                  ariaLabel={copy.labels.exam}
                                />
                              </label>
                              <label className="text-sm">
                                <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.score}</span>
                                <Select
                                  value={item.score}
                                  onChange={(value) => updateApScoreRow(index, { score: value })}
                                  className={MODAL_FIELD_CLASS}
                                  options={AP_SCORE_OPTIONS.map((option) => ({ value: option, label: option }))}
                                  ariaLabel={copy.labels.score}
                                />
                              </label>
                              <div className="flex items-end">
                                <button type="button" onClick={() => removeApScoreRow(index)} className={MODAL_REMOVE_BUTTON_CLASS}>
                                  {copy.remove}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-2xl border border-dashed border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-5 text-sm text-[var(--enroll-muted)]">
                            {copy.emptyApExams}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
          ) : null}

          {!isPageMode || activeSection === "activities" ? (
          <section ref={sectionRefs.activities} className={`rounded-[28px] bg-[var(--enroll-surface-elevated)] ${isPageMode ? "border border-[var(--enroll-surface-border)] shadow-none" : "border border-[var(--enroll-surface-border)] shadow-[0_5px_0_rgba(0,0,0,0.04)]"}`}>
            <div className={`${isPageMode ? "hidden" : "flex items-center justify-between gap-3 rounded-t-[26px] border-b border-[var(--enroll-surface-border)] bg-[var(--enroll-yellow)] px-5 py-4"}`}>
              <span className="inline-flex rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-[var(--enroll-muted-strong)]">
                {copy.activities}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={addActivityRow}
                  disabled={editForm.activities.length >= 6}
                  className="rounded-full border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[var(--enroll-yellow-soft)] disabled:opacity-40"
                >
                  + {copy.addActivity}
                </button>
                {!isPageMode ? <SectionToggle open={openSections.activities} onToggle={() => toggleSection("activities")} showLabel={copy.show} hideLabel={copy.hide} /> : null}
              </div>
            </div>
            {openSections.activities || isPageMode ? (
              <div className="grid gap-3 p-5">
                {renderPageModeSectionToolbar("activities")}
                {editForm.activities.length ? (
                  editForm.activities.map((activity, index) => (
                    <div key={index} className="grid gap-3 rounded-[22px] border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] p-4 md:grid-cols-[1fr_1.2fr_auto]">
                      <label className="text-sm">
                        <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.title}</span>
                        <input
                          value={activity.title}
                          onChange={(event) => updateActivityRow(index, { title: event.target.value })}
                          placeholder={copy.placeholders.activityTitle}
                          className={MODAL_FIELD_CLASS}
                        />
                      </label>
                      <label className="text-sm">
                        <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.description}</span>
                        <input
                          value={activity.description}
                          onChange={(event) => updateActivityRow(index, { description: event.target.value })}
                          placeholder={copy.placeholders.activityDescription}
                          className={MODAL_FIELD_CLASS}
                        />
                      </label>
                      <div className="flex items-end">
                        <button type="button" onClick={() => removeActivityRow(index)} className={MODAL_REMOVE_BUTTON_CLASS}>
                          {copy.remove}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-5 text-sm text-[var(--enroll-muted)]">{copy.emptyActivities}</p>
                )}
              </div>
            ) : null}
          </section>
          ) : null}

          {!isPageMode || activeSection === "honors" ? (
          <section ref={sectionRefs.honors} className={`rounded-[28px] bg-[var(--enroll-surface-elevated)] ${isPageMode ? "border border-[var(--enroll-surface-border)] shadow-none" : "border border-[var(--enroll-surface-border)] shadow-[0_5px_0_rgba(0,0,0,0.04)]"}`}>
            <div className={`${isPageMode ? "hidden" : "flex items-center justify-between gap-3 rounded-t-[26px] border-b border-[var(--enroll-surface-border)] bg-[var(--enroll-yellow-soft)] px-5 py-4"}`}>
              <span className="inline-flex rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-[var(--enroll-muted-strong)]">
                {copy.honors}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={addHonorRow}
                  disabled={editForm.honors.length >= 4}
                  className="rounded-full border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[var(--enroll-yellow-soft)] disabled:opacity-40"
                >
                  + {copy.addHonor}
                </button>
                {!isPageMode ? <SectionToggle open={openSections.honors} onToggle={() => toggleSection("honors")} showLabel={copy.show} hideLabel={copy.hide} /> : null}
              </div>
            </div>
            {openSections.honors || isPageMode ? (
              <div className="grid gap-3 p-5">
                {renderPageModeSectionToolbar("honors")}
                {editForm.honors.length ? (
                  editForm.honors.map((honor, index) => (
                    <div key={index} className="grid gap-3 rounded-[22px] border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] p-4 md:grid-cols-[1fr_auto]">
                      <label className="text-sm">
                        <span className="text-xs uppercase tracking-wide text-[var(--enroll-muted)]">{copy.labels.title}</span>
                        <input
                          value={honor}
                          onChange={(event) => updateHonorRow(index, event.target.value)}
                          placeholder={copy.placeholders.honor}
                          className={MODAL_FIELD_CLASS}
                        />
                      </label>
                      <div className="flex items-end">
                        <button type="button" onClick={() => removeHonorRow(index)} className={MODAL_REMOVE_BUTTON_CLASS}>
                          {copy.remove}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-5 text-sm text-[var(--enroll-muted)]">{copy.emptyHonors}</p>
                )}
              </div>
            ) : null}
          </section>
          ) : null}

          {!isPageMode || activeSection === "universities" ? (
          <section ref={sectionRefs.universities} className={`rounded-[28px] bg-[var(--enroll-surface-elevated)] ${isPageMode ? "border border-[var(--enroll-surface-border)] shadow-none" : "border border-[var(--enroll-surface-border)] shadow-[0_5px_0_rgba(0,0,0,0.04)]"}`}>
            <div className={`${isPageMode ? "hidden" : "mb-3 flex flex-col items-start gap-3 rounded-t-[26px] border-b border-[var(--enroll-surface-border)] bg-[var(--enroll-cyan)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"}`}>
              <div>
                <span className="inline-flex rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1 text-sm font-black uppercase tracking-[0.14em] text-[var(--enroll-muted-strong)]">
                  {copy.universities}
                </span>
                <p className="mt-1 text-sm text-[var(--enroll-muted)]">{copy.universitiesHint}</p>
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
                <button
                  type="button"
                  onClick={onEditUniversities}
                  className="rounded-full border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[var(--enroll-yellow-soft)]"
                >
                  {copy.editUniversities}
                </button>
                {!isPageMode ? <SectionToggle open={openSections.universities} onToggle={() => toggleSection("universities")} showLabel={copy.show} hideLabel={copy.hide} /> : null}
              </div>
            </div>

            {openSections.universities || isPageMode ? (
              <div className={`grid gap-3 ${isPageMode ? "p-5" : "p-5 pt-0"}`}>
                {renderPageModeSectionToolbar("universities")}
                <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-3 text-sm">
                  <p className="font-semibold text-[var(--enroll-fg)]">{copy.selectedForSnapshot}</p>
                  <span className="rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-yellow-soft)] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--enroll-muted-strong)]">
                    {editForm.selectedUniversityIds.length}/7
                  </span>
                </div>

                {myUniversities.length ? (
                  myUniversities.map((item) => {
                    const selected = editForm.selectedUniversityIds.includes(item.id);
                    const selectionLocked = !selected && editForm.selectedUniversityIds.length >= 7;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleUniversitySelection(item.id)}
                        disabled={selectionLocked}
                        className={`grid gap-3 rounded-[22px] border px-4 py-3 text-left transition ${
                          selected ? "border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow-soft)] shadow-[0_4px_0_rgba(0,0,0,0.06)]" : "border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)]"
                        } ${selectionLocked ? "opacity-45" : "hover:-translate-y-0.5 hover:border-[var(--enroll-strong-border)]/25"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--enroll-fg)]">{item.university.name}</p>
                            <p className="mt-1 text-xs text-[var(--enroll-muted)]">
                              {selected ? copy.shownInSnapshot : copy.tapToInclude}
                            </p>
                          </div>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--enroll-muted-strong)] ${statusSelectTone(
                              item.status as never,
                            )}`}
                          >
                            {translateDashboardStatus(locale, item.status)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-[var(--enroll-muted)]">
                            {selected ? `${copy.position} ${editForm.selectedUniversityIds.indexOf(item.id) + 1}` : copy.notSelected}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
                              selected ? "border-[var(--enroll-strong-border)] bg-[var(--enroll-cyan)] text-[var(--enroll-fg)]" : "border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] text-[var(--enroll-muted)]"
                            }`}
                          >
                            {selected ? copy.selected : copy.select}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="rounded-2xl border border-dashed border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-5 text-sm text-[var(--enroll-muted)]">{copy.noUniversitiesAdded}</p>
                )}
              </div>
            ) : null}
          </section>
          ) : null}
        </div>

        <div className={`mt-4 shrink-0 bg-[var(--enroll-surface-elevated)] px-4 py-3 ${isPageMode ? "rounded-[24px] border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-5 py-4 shadow-none" : "rounded-[24px] border-2 border-[var(--enroll-strong-border)] shadow-[0_8px_0_0_rgba(0,0,0,1)]"} sm:mt-5`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-[var(--enroll-muted)]">{copy.autosaveLead}</p>
              <p className="text-xs font-semibold text-[var(--enroll-muted)]">
                {autosaveStatus === "saving" && copy.autosaving}
                {autosaveStatus === "saved" && copy.autosaved}
                {autosaveStatus === "error" && copy.autosaveFailed}
                {autosaveStatus === "idle" && copy.autosaveOn}
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
              {isPageMode ? renderPageModeStepActions() : null}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button variant="outline" onClick={onClose} disabled={savingEdit} className="w-full sm:w-auto">
                  {closeLabel === "Close" ? copy.close : closeLabel}
                </Button>
                <Button onClick={onSave} disabled={savingEdit} className="w-full sm:w-auto">
                  {savingEdit ? copy.saving : copy.saveChanges}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  if (isPageMode) {
    return content;
  }

  return <div className="fixed inset-0 z-50 overflow-hidden bg-black/35 p-2 sm:p-4">{content}</div>;
}



