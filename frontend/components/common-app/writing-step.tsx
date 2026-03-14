"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EssayRichEditor } from "@/components/essay-rich-editor";
import { LiveProgress, ProgressField, Step } from "@/lib/common-app-progress";

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

const PROMPT_COPY: Record<string, string> = {
  "Background, identity, interest, or talent":
    "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, share your story.",
  "Lessons from obstacles or failure":
    "The lessons we take from obstacles we encounter can shape later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?",
  "Questioned or challenged a belief or idea":
    "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
  "Unexpected gratitude or kindness":
    "Reflect on something someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?",
  "Accomplishment, event, or realization that sparked growth":
    "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
  "A topic, idea, or concept that fully engages you":
    "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?",
  "Topic of your choice":
    "Share an essay on any topic of your choice. It can be one you have already written, one that responds to a different prompt, or one of your own design.",
};

function htmlToText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(value: string): number {
  const text = htmlToText(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function getDraftKey(step: Step, fieldId: string): string {
  return `${step.section.key}.${step.subsection.key}.${fieldId}`;
}

export function WritingStep({
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

  const fieldById = (fieldId: string) => visibleFields.find((field) => field.id === fieldId) || null;
  const setFieldValue = (fieldId: string, next: unknown) => {
    const fieldKey = getDraftKey(currentStep, fieldId);
    setDraftValues((prev) => ({ ...prev, [fieldKey]: next }));
  };

  if (currentStep.subsection.key === "personal_essay") {
    const ackField = fieldById("personal_essay_acknowledged");
    const promptField = fieldById("personal_essay_prompt");
    const essayField = fieldById("personal_essay_content");
    const essayKey = essayField ? getDraftKey(currentStep, essayField.id) : "";
    const essayHtml = essayKey ? String(draftValues[essayKey] || "") : "";
    const selectedPrompt = promptField ? String(draftValues[getDraftKey(currentStep, promptField.id)] || "") : "";
    const wordCount = countWords(essayHtml);

    return (
      <Card className="shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardDescription>{currentStep.sectionTitle}</CardDescription>
            <CardTitle className="mt-1">{currentStep.subsectionTitle}</CardTitle>
          </div>
          <Badge variant={currentPercent === 100 ? "cyan" : "orange"}>{currentPercent}%</Badge>
        </div>

        <div className="mt-6 space-y-8">
          <div className="space-y-4 text-[15px] leading-8 text-black/82">
            <p>
              Some colleges require submission of the personal essay with your application. You submit a personal essay
              to any college, even if it is not required by that college.
            </p>
            <label className="flex items-start gap-3 rounded-2xl border border-black/15 bg-black/[0.02] px-4 py-3">
              <input
                type="checkbox"
                checked={Boolean(ackField && draftValues[getDraftKey(currentStep, ackField.id)])}
                onChange={(event) => setFieldValue("personal_essay_acknowledged", event.target.checked)}
                className="mt-1 h-5 w-5 rounded border border-black/30"
              />
              <span className="text-sm font-medium text-black/80">
                {ackField?.label}
                {ackField && isFieldRequired(currentStep, ackField) ? <span className="ml-1 text-red-600">*</span> : null}
              </span>
            </label>
          </div>

          <div className="rounded-2xl border border-dashed border-black/20 bg-black/[0.02] p-4">
            <p className="text-sm font-semibold text-black/75">College requirement sync</p>
            <p className="mt-2 text-sm leading-6 text-black/62">
              University-specific personal essay requirement mapping is not connected yet. We will attach this later to
              shortlist and application data instead of showing guessed values.
            </p>
          </div>

          {promptField ? (
            <section className="space-y-5">
              <div className="space-y-3 text-[15px] leading-8 text-black/82">
                <p>
                  The essay should help readers understand who you are beyond grades and scores. Choose the prompt that
                  best supports the story you want to tell.
                </p>
                <p className="text-black/70">
                  Keep the draft within the Common App range: minimum 250 words, maximum 650 words.
                </p>
              </div>

              <div className="space-y-3">
                {promptField.options?.map((option) => (
                  <label
                    key={option}
                    className="flex gap-3 rounded-2xl border border-black/15 px-4 py-4 text-sm leading-7 transition hover:bg-black/[0.02]"
                  >
                    <input
                      type="radio"
                      name="personal-essay-prompt"
                      checked={selectedPrompt === option}
                      onChange={() => setFieldValue(promptField.id, option)}
                      className="mt-1 h-5 w-5 border-black/30"
                    />
                    <span>{PROMPT_COPY[option] || option}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-black/55">
                  {selectedPrompt ? `Selected prompt: ${selectedPrompt}` : "Select one prompt before you continue."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFieldValue(promptField.id, "")}
                  disabled={!selectedPrompt}
                >
                  Clear answer
                </Button>
              </div>
            </section>
          ) : null}

          {essayField ? (
            <section className="space-y-3">
              <div className="space-y-2">
                <p className="text-base font-semibold text-black/84">
                  {essayField.label}
                  {isFieldRequired(currentStep, essayField) ? <span className="ml-1 text-red-600">*</span> : null}
                </p>
                <p className="text-sm leading-6 text-black/62">
                  Write directly here or paste a draft. This stays inside Common App for now and does not change the
                  separate Essays workspace.
                </p>
              </div>

              <EssayRichEditor
                content={essayHtml || "<p></p>"}
                placeholder="Draft your Common App personal essay here..."
                minimalToolbar
                onChange={(html) => setFieldValue(essayField.id, html)}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className={wordCount < 250 || wordCount > 650 ? "text-orange-700" : "text-black/65"}>
                  Min 250 / Max 650 words
                </span>
                <span className={wordCount > 650 ? "font-semibold text-red-700" : "text-black/65"}>{wordCount}/650</span>
              </div>
            </section>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
          <p className="text-xs text-black/55">{saving ? "Saving..." : statusText || "Changes save automatically."}</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onBack} disabled={currentStepIndex === 0 || saving}>
              Back
            </Button>
            <Button type="button" onClick={onContinue} disabled={saving}>
              {saving ? <Spinner size="sm" /> : null}
              <span>{currentStepIndex === totalSteps - 1 ? "Finish steps" : "Continue"}</span>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const infoField = fieldById("additional_information");
  const hasInfoField = fieldById("has_additional_information");
  const hasInfoValue = hasInfoField ? draftValues[getDraftKey(currentStep, hasInfoField.id)] : "";
  const infoValue = infoField ? String(draftValues[getDraftKey(currentStep, infoField.id)] || "") : "";
  const infoWordCount = infoValue.trim() ? infoValue.trim().split(/\s+/).length : 0;

  return (
    <Card className="shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardDescription>{currentStep.sectionTitle}</CardDescription>
          <CardTitle className="mt-1">{currentStep.subsectionTitle}</CardTitle>
        </div>
        <Badge variant={currentPercent === 100 ? "cyan" : "orange"}>{currentPercent}%</Badge>
      </div>

      <div className="mt-6 space-y-6">
        <div className="space-y-3 text-[15px] leading-8 text-black/82">
          <p>
            Use this section only if you need to explain context that is important for admissions review and does not fit
            naturally anywhere else in the application.
          </p>
          <p className="text-black/70">
            Do not repeat your personal essay. Keep the note factual, concise, and focused on missing context.
          </p>
        </div>

        {hasInfoField ? (
          <div className="space-y-3">
            {hasInfoField.options?.map((option) => (
              <label key={option} className="flex items-center gap-3 rounded-2xl border border-black/15 px-4 py-3 text-sm">
                <input
                  type="radio"
                  name="additional-information-toggle"
                  checked={hasInfoValue === option}
                  onChange={() => setFieldValue(hasInfoField.id, option)}
                  className="h-5 w-5 border-black/30"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        ) : null}

        {infoField ? (
          <section className="space-y-3">
            <label className="block text-sm text-black/80">
              <span className="inline-flex items-center gap-2 pb-2 text-[1.02rem] font-semibold">
                <span>
                  {infoField.label}
                  {isFieldRequired(currentStep, infoField) ? <span className="ml-1 text-red-600">*</span> : null}
                </span>
              </span>
              <textarea
                value={infoValue}
                disabled={hasInfoValue !== "Yes"}
                onChange={(event) => setFieldValue(infoField.id, event.target.value)}
                rows={10}
                className="mt-1 w-full resize-y rounded-2xl border border-black/20 bg-white px-4 py-3 text-sm leading-7 disabled:bg-black/[0.04]"
                placeholder="Add only context that is truly missing elsewhere in the application."
              />
            </label>
            <div className="text-right text-sm text-black/55">{infoWordCount} words</div>
          </section>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
        <p className="text-xs text-black/55">{saving ? "Saving..." : statusText || "Changes save automatically."}</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onBack} disabled={currentStepIndex === 0 || saving}>
            Back
          </Button>
          <Button type="button" onClick={onContinue} disabled={saving}>
            {saving ? <Spinner size="sm" /> : null}
            <span>{currentStepIndex === totalSteps - 1 ? "Finish steps" : "Continue"}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
