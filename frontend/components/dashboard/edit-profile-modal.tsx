import type { Dispatch, RefObject, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
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
import type {
  AcademicTestType,
  EditProfileForm,
  LanguageTestType,
} from "@/app/dashboard/types";

type Props = {
  editModalRef: RefObject<HTMLDivElement>;
  editForm: EditProfileForm;
  savingEdit: boolean;
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
  targetUniversityEntries: Array<{ id: number; name: string; status: string }>;
};

export function EditProfileModal({
  editModalRef,
  editForm,
  savingEdit,
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
  targetUniversityEntries,
}: Props) {
  return (
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
                        placeholder="Founder вЂ” Robotics Club"
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
                      <button type="button" onClick={() => removeActivityRow(index)} className={MODAL_REMOVE_BUTTON_CLASS}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-black/15 bg-white px-4 py-5 text-sm text-black/50">Add up to 6 activities.</p>
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
                      <button type="button" onClick={() => removeHonorRow(index)} className={MODAL_REMOVE_BUTTON_CLASS}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-black/15 bg-white px-4 py-5 text-sm text-black/50">Add up to 4 honors.</p>
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
                onClick={onEditUniversities}
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
                <p className="rounded-2xl border border-dashed border-black/15 bg-white px-4 py-5 text-sm text-black/50">No universities added yet.</p>
              )}
            </div>
          </section>
        </div>

        <div className="fixed bottom-4 left-1/2 z-10 w-[min(960px,calc(100vw-32px))] -translate-x-1/2 rounded-[24px] border-2 border-black bg-white px-4 py-3 shadow-[0_8px_0_0_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-black/60">Changes update your dashboard snapshot immediately after save.</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose} disabled={savingEdit}>
                Close
              </Button>
              <Button onClick={onSave} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
