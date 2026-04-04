"use client";

import { CommonAppProgress, LiveProgress, Step } from "@/lib/common-app-progress";

type Props = {
  progressData: CommonAppProgress | null;
  currentStep: Step;
  sectionStartIndexes: Record<string, number>;
  subsectionStepIndexes: Record<string, number>;
  liveProgress: LiveProgress | null;
  onSelectStep: (index: number) => void;
};

export function SectionNav({
  progressData,
  currentStep,
  sectionStartIndexes,
  subsectionStepIndexes,
  liveProgress,
  onSelectStep,
}: Props) {
  return (
    <div className="mt-1 space-y-1">
      {(progressData?.sections || []).map((section) => {
        const startIndex = sectionStartIndexes[section.key] ?? 0;
        const active = currentStep.section.key === section.key;
        const sectionPercent = liveProgress?.sections[section.key]?.percent ?? section.percent;
        return (
          <div key={section.key} className="rounded-xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)]/85">
            <button
              type="button"
              onClick={() => onSelectStep(startIndex)}
              className={`flex w-full items-center justify-between px-3 py-3 text-left text-base transition ${
                active ? "font-semibold" : "hover:bg-black/[0.03]"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span className="text-base">{active ? "▾" : "›"}</span>
                <span>{section.title}</span>
              </span>
              {sectionPercent === 100 ? (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--enroll-surface-border-strong)] bg-[var(--enroll-cyan)] text-[11px] font-bold text-[var(--enroll-fg)]">
                  ✓
                </span>
              ) : (
                <span className="h-4 w-4 rounded-full border border-dashed border-[var(--enroll-surface-border-strong)]" />
              )}
            </button>

            {active ? (
              <div className="space-y-1 border-t border-[var(--enroll-surface-border)] px-2 pb-2 pt-2">
                {section.subsections.map((subsection) => {
                  const stepIndex = subsectionStepIndexes[`${section.key}.${subsection.key}`] ?? startIndex;
                  const isCurrent = currentStep.subsection.key === subsection.key;
                  const subsectionPercent =
                    liveProgress?.subsections[`${section.key}.${subsection.key}`]?.percent ?? subsection.percent;
                  return (
                    <button
                      key={subsection.key}
                      type="button"
                      onClick={() => onSelectStep(stepIndex)}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition ${
                        isCurrent ? "bg-[color-mix(in_srgb,var(--enroll-fg)_10%,transparent)] font-semibold" : "hover:bg-black/[0.05]"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        {subsectionPercent === 100 ? (
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--enroll-surface-border-strong)] bg-[var(--enroll-cyan)] text-[10px] font-bold text-[var(--enroll-fg)]">
                            ✓
                          </span>
                        ) : (
                          <span className="h-3 w-3 rounded-full border border-dashed border-[var(--enroll-surface-border-strong)]" />
                        )}
                        <span>{subsection.title}</span>
                      </span>
                      <span className="text-xs text-[var(--enroll-muted)]">{subsectionPercent}%</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
