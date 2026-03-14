"use client";

import { Step, ProgressField, LiveProgress } from "@/lib/common-app-progress";
import { FieldInput } from "@/components/common-app/field-input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { WritingStep } from "@/components/common-app/writing-step";

type Props = {
  currentStep: Step;
  visibleFields: ProgressField[];
  draftValues: Record<string, unknown>;
  isFieldRequired: (step: Step, field: ProgressField) => boolean;
  setDraftValues: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
  saving: boolean;
  statusText: string;
  onBack: () => void;
  onContinue: () => void;
  currentStepIndex: number;
  totalSteps: number;
  liveProgress: LiveProgress | null;
};

type FieldBlock =
  | { type: "plain"; key: string; fields: ProgressField[] }
  | { type: "group"; key: string; title: string; fields: ProgressField[] };

export function StepForm({
  currentStep,
  visibleFields,
  draftValues,
  isFieldRequired,
  setDraftValues,
  saving,
  statusText,
  onBack,
  onContinue,
  currentStepIndex,
  totalSteps,
  liveProgress,
}: Props) {
  if (currentStep.section.key === "writing") {
    return (
      <WritingStep
        currentStep={currentStep}
        visibleFields={visibleFields}
        draftValues={draftValues}
        isFieldRequired={isFieldRequired}
        setDraftValues={setDraftValues}
        saving={saving}
        statusText={statusText}
        onBack={onBack}
        onContinue={onContinue}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        liveProgress={liveProgress}
      />
    );
  }

  const currentPercent =
    liveProgress?.subsections[`${currentStep.section.key}.${currentStep.subsection.key}`]?.percent ??
    currentStep.subsection.percent;

  const getRepeatGroupMeta = (field: ProgressField): { key: string; title: string } | null => {
    const courseMatch = field.id.match(/^course_(\d+)_/);
    if (courseMatch) return { key: `course_${courseMatch[1]}`, title: `Course ${courseMatch[1]}` };

    const collegeMatch = field.id.match(/^college_(\d+)_/);
    if (collegeMatch) return { key: `college_${collegeMatch[1]}`, title: `College ${collegeMatch[1]}` };

    const siblingMatch = field.id.match(/^sibling(\d+)_/);
    if (siblingMatch) return { key: `sibling_${siblingMatch[1]}`, title: `Sibling ${siblingMatch[1]}` };

    const schoolMatch = field.id.match(/^other_school_(\d+)_/);
    if (schoolMatch) return { key: `other_school_${schoolMatch[1]}`, title: `Secondary/High School ${schoolMatch[1]}` };

    const honorMatch = field.id.match(/^honor_(\d+)_/);
    if (honorMatch) return { key: `honor_${honorMatch[1]}`, title: `Honors ${honorMatch[1]}` };

    const activityMatch = field.id.match(/^activity_(\d+)_/);
    if (activityMatch) return { key: `activity_${activityMatch[1]}`, title: `Activity ${activityMatch[1]}` };

    const cboMatch = field.id.match(/^cbo_(\d+)_/);
    if (cboMatch) return { key: `cbo_${cboMatch[1]}`, title: `Counselor/Advisor/Mentor ${cboMatch[1]}` };

    return null;
  };

  const renderField = (field: ProgressField) => {
    if (currentStep.subsection.key === "contact_details" && field.id === "preferred_phone_country_code") {
      const numberField = visibleFields.find((item) => item.id === "preferred_phone_number");
      if (!numberField) return null;
      const codeKey = `${currentStep.section.key}.${currentStep.subsection.key}.${field.id}`;
      const numberKey = `${currentStep.section.key}.${currentStep.subsection.key}.${numberField.id}`;
      const required = isFieldRequired(currentStep, numberField);
      return (
        <label key={field.id} className="block text-sm text-black/80">
          <span className="inline-flex items-center gap-2 pb-2 text-[1.02rem] font-semibold">
            <span>
              {numberField.label}
              {required ? <span className="ml-1 text-red-600">*</span> : null}
            </span>
            <span
              title={numberField.help}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/30 text-xs text-black/60"
            >
              ?
            </span>
          </span>
          <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
            <FieldInput
              field={field}
              value={draftValues[codeKey]}
              onChange={(next) => setDraftValues((prev) => ({ ...prev, [codeKey]: next }))}
            />
            <FieldInput
              field={numberField}
              value={draftValues[numberKey]}
              onChange={(next) => setDraftValues((prev) => ({ ...prev, [numberKey]: next }))}
            />
          </div>
          <span className="mt-1 block text-xs text-black/55">{numberField.help}</span>
        </label>
      );
    }

    if (currentStep.subsection.key === "contact_details" && field.id === "preferred_phone_number") return null;

    if (currentStep.subsection.key === "contact_details" && field.id === "alternate_phone_country_code") {
      const numberField = visibleFields.find((item) => item.id === "alternate_phone_number");
      if (!numberField) return null;
      const codeKey = `${currentStep.section.key}.${currentStep.subsection.key}.${field.id}`;
      const numberKey = `${currentStep.section.key}.${currentStep.subsection.key}.${numberField.id}`;
      const required = isFieldRequired(currentStep, numberField);
      return (
        <label key={field.id} className="block text-sm text-black/80">
          <span className="inline-flex items-center gap-2 pb-2 text-[1.02rem] font-semibold">
            <span>
              {numberField.label}
              {required ? <span className="ml-1 text-red-600">*</span> : null}
            </span>
            <span
              title={numberField.help}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/30 text-xs text-black/60"
            >
              ?
            </span>
          </span>
          <div className="grid gap-2 sm:grid-cols-[90px_1fr]">
            <FieldInput
              field={field}
              value={draftValues[codeKey]}
              onChange={(next) => setDraftValues((prev) => ({ ...prev, [codeKey]: next }))}
            />
            <FieldInput
              field={numberField}
              value={draftValues[numberKey]}
              onChange={(next) => setDraftValues((prev) => ({ ...prev, [numberKey]: next }))}
            />
          </div>
          <span className="mt-1 block text-xs text-black/55">{numberField.help}</span>
        </label>
      );
    }

    if (currentStep.subsection.key === "contact_details" && field.id === "alternate_phone_number") return null;

    const cboPhoneMatch =
      currentStep.subsection.key === "community_based_orgs"
        ? field.id.match(/^cbo_(\d+)_phone_country_code$/)
        : null;
    if (cboPhoneMatch) {
      const idx = cboPhoneMatch[1];
      const numberField = visibleFields.find((item) => item.id === `cbo_${idx}_phone_number`);
      const extensionField = visibleFields.find((item) => item.id === `cbo_${idx}_phone_extension`);
      if (!numberField || !extensionField) return null;
      const codeKey = `${currentStep.section.key}.${currentStep.subsection.key}.${field.id}`;
      const numberKey = `${currentStep.section.key}.${currentStep.subsection.key}.${numberField.id}`;
      const extKey = `${currentStep.section.key}.${currentStep.subsection.key}.${extensionField.id}`;
      return (
        <label key={field.id} className="block text-sm text-black/80">
          <span className="inline-flex items-center gap-2 pb-2 text-[1.02rem] font-semibold">
            <span>Phone</span>
            <span
              title={field.help}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/30 text-xs text-black/60"
            >
              ?
            </span>
          </span>
          <div className="grid gap-2 sm:grid-cols-[110px_1fr_120px]">
            <FieldInput
              field={field}
              value={draftValues[codeKey]}
              onChange={(next) => setDraftValues((prev) => ({ ...prev, [codeKey]: next }))}
            />
            <FieldInput
              field={numberField}
              value={draftValues[numberKey]}
              onChange={(next) => setDraftValues((prev) => ({ ...prev, [numberKey]: next }))}
            />
            <FieldInput
              field={extensionField}
              value={draftValues[extKey]}
              onChange={(next) => setDraftValues((prev) => ({ ...prev, [extKey]: next }))}
            />
          </div>
          <span className="mt-1 block text-xs text-black/55">Phone includes country code, number, and extension (if applicable).</span>
        </label>
      );
    }
    if (currentStep.subsection.key === "community_based_orgs" && field.id.match(/^cbo_(\d+)_phone_number$/)) return null;
    if (currentStep.subsection.key === "community_based_orgs" && field.id.match(/^cbo_(\d+)_phone_extension$/)) return null;

    const fieldKey = `${currentStep.section.key}.${currentStep.subsection.key}.${field.id}`;
    const required = isFieldRequired(currentStep, field);

    return (
      <label key={field.id} className="block text-sm text-black/80">
        <span className="inline-flex items-center gap-2 pb-2 text-[1.02rem] font-semibold">
          <span>
            {field.label}
            {required ? <span className="ml-1 text-red-600">*</span> : null}
            {field.readonly ? <span className="ml-1 text-xs text-black/45">(read-only)</span> : null}
          </span>
          <span
            title={field.help}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/30 text-xs text-black/60"
          >
            ?
          </span>
        </span>
        <FieldInput
          field={field}
          value={draftValues[fieldKey]}
          onChange={(next) => setDraftValues((prev) => ({ ...prev, [fieldKey]: next }))}
          onClear={() =>
            setDraftValues((prev) => ({
              ...prev,
              [fieldKey]: field.type === "list" ? [] : "",
            }))
          }
        />
      </label>
    );
  };

  const groupedSubsections = new Set([
    "current_year_courses",
    "colleges_universities",
    "other_schools",
    "sibling",
    "honors",
    "community_based_orgs",
    "activities",
  ]);
  const blocks: FieldBlock[] = [];

  if (!groupedSubsections.has(currentStep.subsection.key)) {
    blocks.push({ type: "plain", key: "plain-0", fields: visibleFields });
  } else {
    let plainBuffer: ProgressField[] = [];
    let currentGroup: { key: string; title: string; fields: ProgressField[] } | null = null;

    const flushPlain = () => {
      if (!plainBuffer.length) return;
      blocks.push({ type: "plain", key: `plain-${blocks.length}`, fields: plainBuffer });
      plainBuffer = [];
    };

    const flushGroup = () => {
      if (!currentGroup) return;
      blocks.push({ type: "group", key: currentGroup.key, title: currentGroup.title, fields: currentGroup.fields });
      currentGroup = null;
    };

    for (const field of visibleFields) {
      const meta = getRepeatGroupMeta(field);
      if (!meta) {
        flushGroup();
        plainBuffer.push(field);
        continue;
      }
      flushPlain();
      if (!currentGroup || currentGroup.key !== meta.key) {
        flushGroup();
        currentGroup = { key: meta.key, title: meta.title, fields: [field] };
      } else {
        currentGroup.fields.push(field);
      }
    }

    flushGroup();
    flushPlain();
  }

  return (
    <Card className="shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardDescription>{currentStep.sectionTitle}</CardDescription>
          <CardTitle className="mt-1">{currentStep.subsectionTitle}</CardTitle>
        </div>
        <Badge variant={currentPercent === 100 ? "cyan" : "orange"}>{currentPercent}%</Badge>
      </div>

      <div className="mt-6 space-y-5">
        {blocks.map((block) => {
          if (block.type === "plain") {
            return (
              <div key={block.key} className="space-y-5">
                {block.fields.map((field) => renderField(field))}
              </div>
            );
          }

          return (
            <div key={block.key} className="rounded-2xl border border-black/15 bg-white/50 p-4 sm:p-5">
              <div className="mb-4 border-b border-black/10 pb-2">
                <p className="text-sm font-semibold tracking-wide text-black/70">{block.title}</p>
              </div>
              <div className="space-y-5">{block.fields.map((field) => renderField(field))}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
        <p className="text-xs text-black/55">{saving ? "Сохраняем..." : statusText || "Изменения сохраняются автоматически"}</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onBack} disabled={currentStepIndex === 0 || saving}>
            Назад
          </Button>
          <Button type="button" onClick={onContinue} disabled={saving}>
            {saving ? <Spinner size="sm" /> : null}
            <span>{currentStepIndex === totalSteps - 1 ? "Завершить шаги" : "Continue"}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
