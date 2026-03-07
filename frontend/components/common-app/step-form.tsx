"use client";

import { Step, ProgressField, LiveProgress } from "@/lib/common-app-progress";
import { FieldInput } from "@/components/common-app/field-input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
  const currentPercent =
    liveProgress?.subsections[`${currentStep.section.key}.${currentStep.subsection.key}`]?.percent ??
    currentStep.subsection.percent;

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
        {visibleFields.map((field) => {
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
                <div className="grid grid-cols-[140px_1fr] gap-2">
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
                <div className="grid grid-cols-[90px_1fr] gap-2">
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

          const fieldKey = `${currentStep.section.key}.${currentStep.subsection.key}.${field.id}`;
          const required = isFieldRequired(currentStep, field);
          return (
            <label key={field.id} className="block text-sm text-black/80">
              <span className="inline-flex items-center gap-2 pb-2 text-[1.02rem] font-semibold">
                <span>
                  {field.label}
                  {required ? <span className="ml-1 text-red-600">*</span> : null}
                  {field.readonly ? <span className="ml-1 text-xs text-black/45">(только чтение)</span> : null}
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
