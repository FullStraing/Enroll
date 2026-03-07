export type FieldType = "text" | "number" | "boolean" | "list" | "choice" | "date";

export type FieldCondition = {
  field_id: string;
  equals?: string | number | boolean | null;
  in?: Array<string | number | boolean>;
};

export type ProgressField = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  readonly: boolean;
  help: string;
  bind: "model" | "json" | "user";
  path: string;
  value: string | number | boolean | string[] | null;
  filled: boolean;
  options?: string[];
  visible?: boolean;
  ui?: string | null;
  clearable?: boolean;
  searchable?: boolean;
  show_if?: FieldCondition | null;
  required_if?: FieldCondition | null;
};

export type Subsection = {
  key: string;
  title: string;
  completed_required: number;
  required_total: number;
  percent: number;
  fields: ProgressField[];
};

export type Section = {
  key: string;
  title: string;
  completed_required: number;
  required_total: number;
  percent: number;
  subsections: Subsection[];
};

export type CommonAppProgress = {
  overall: {
    completed_required: number;
    required_total: number;
    percent: number;
  };
  sections: Section[];
};

export type Step = {
  id: string;
  sectionTitle: string;
  subsectionTitle: string;
  section: Section;
  subsection: Subsection;
};

export type LiveProgress = {
  overall: { percent: number; completed: number; total: number };
  sections: Record<string, { percent: number; completed: number; total: number }>;
  subsections: Record<string, { percent: number; completed: number; total: number }>;
};

export function buildSteps(progressData: CommonAppProgress | null): Step[] {
  if (!progressData) return [];
  return progressData.sections.flatMap((section) =>
    section.subsections.map((subsection) => ({
      id: `${section.key}.${subsection.key}`,
      sectionTitle: section.title,
      subsectionTitle: subsection.title,
      section,
      subsection,
    })),
  );
}

export function buildSectionStartIndexes(progressData: CommonAppProgress | null): Record<string, number> {
  const map: Record<string, number> = {};
  let cursor = 0;
  for (const section of progressData?.sections || []) {
    map[section.key] = cursor;
    cursor += section.subsections.length;
  }
  return map;
}

export function buildSubsectionStepIndexes(progressData: CommonAppProgress | null): Record<string, number> {
  const map: Record<string, number> = {};
  let cursor = 0;
  for (const section of progressData?.sections || []) {
    for (const subsection of section.subsections) {
      map[`${section.key}.${subsection.key}`] = cursor;
      cursor += 1;
    }
  }
  return map;
}

export function getDraftKey(step: Step, fieldId: string): string {
  return `${step.section.key}.${step.subsection.key}.${fieldId}`;
}

export function matchesCondition(
  draftValues: Record<string, unknown>,
  step: Step,
  condition?: FieldCondition | null,
): boolean {
  if (!condition) return true;
  const key = getDraftKey(step, condition.field_id);
  const current = draftValues[key];
  if (condition.in && condition.in.length) return condition.in.includes(current as never);
  return current === condition.equals;
}

export function isFieldVisible(
  draftValues: Record<string, unknown>,
  step: Step,
  field: ProgressField,
): boolean {
  return matchesCondition(draftValues, step, field.show_if);
}

export function isFieldRequired(
  draftValues: Record<string, unknown>,
  step: Step,
  field: ProgressField,
): boolean {
  if (field.required_if) return matchesCondition(draftValues, step, field.required_if);
  return field.required;
}

function isFilledValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return true;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
}

export function computeLiveProgress(
  progressData: CommonAppProgress | null,
  draftValues: Record<string, unknown>,
): LiveProgress | null {
  if (!progressData) return null;

  const sectionsMap: Record<string, { percent: number; completed: number; total: number }> = {};
  const subsectionsMap: Record<string, { percent: number; completed: number; total: number }> = {};
  let totalRequired = 0;
  let totalCompleted = 0;

  for (const section of progressData.sections) {
    let sectionRequired = 0;
    let sectionCompleted = 0;

    for (const subsection of section.subsections) {
      const stepRef: Step = {
        id: `${section.key}.${subsection.key}`,
        sectionTitle: section.title,
        subsectionTitle: subsection.title,
        section,
        subsection,
      };
      let subRequired = 0;
      let subCompleted = 0;

      for (const field of subsection.fields) {
        if (!isFieldVisible(draftValues, stepRef, field)) continue;
        if (!isFieldRequired(draftValues, stepRef, field)) continue;
        subRequired += 1;
        sectionRequired += 1;
        totalRequired += 1;

        const key = getDraftKey(stepRef, field.id);
        if (isFilledValue(draftValues[key])) {
          subCompleted += 1;
          sectionCompleted += 1;
          totalCompleted += 1;
        }
      }

      const subPercent = subRequired ? Math.floor((subCompleted / subRequired) * 100) : 100;
      subsectionsMap[`${section.key}.${subsection.key}`] = {
        percent: subPercent,
        completed: subCompleted,
        total: subRequired,
      };
    }

    const sectionPercent = sectionRequired ? Math.floor((sectionCompleted / sectionRequired) * 100) : 100;
    sectionsMap[section.key] = {
      percent: sectionPercent,
      completed: sectionCompleted,
      total: sectionRequired,
    };
  }

  const overallPercent = totalRequired ? Math.floor((totalCompleted / totalRequired) * 100) : 100;
  return {
    overall: {
      percent: overallPercent,
      completed: totalCompleted,
      total: totalRequired,
    },
    sections: sectionsMap,
    subsections: subsectionsMap,
  };
}

