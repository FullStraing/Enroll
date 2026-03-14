type ProgressCondition = {
  label: string;
  done: boolean;
};

export type DashboardProfile = {
  country?: string;
  graduation_year?: number | null;
  intended_major?: string;
  gpa?: string | number | null;
  sat_total?: number | null;
  toefl_total?: number | null;
  ielts_overall?: string | number | null;
  det_score?: number | null;
  budget_range?: string;
};

export type DashboardUniversity = {
  status?: string;
  category?: string;
  deadline_override?: string | null;
  university?: {
    main_deadline?: string | null;
  };
};

export type DashboardEssay = {
  essay_type: string;
  versions_count: number;
  latest_has_text?: boolean;
  latest_word_count?: number;
};

export type DashboardDocument = {
  type: string;
};

export type DashboardSection = {
  key: string;
  title: string;
  percent: number;
};

export type IntroAnswers = {
  country?: string;
  intakeYear?: string;
  major?: string;
  tests?: string[];
};

export type ProgressBlock = {
  key: "profile" | "universities" | "essays" | "documents" | "applications";
  title: string;
  percent: number;
  completed: number;
  total: number;
  summary: string;
};

function hasValue(value: unknown) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

function roundPercent(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

function finalizeBlock(
  key: ProgressBlock["key"],
  title: string,
  conditions: ProgressCondition[],
  summary: string,
): ProgressBlock {
  const completed = conditions.filter((condition) => condition.done).length;
  return {
    key,
    title,
    percent: roundPercent(completed, conditions.length),
    completed,
    total: conditions.length,
    summary,
  };
}

export function hasExplicitNoTests(quizAnswers: IntroAnswers, profile?: DashboardProfile | null) {
  const hasAnySavedScore =
    hasValue(profile?.sat_total) ||
    hasValue(profile?.toefl_total) ||
    hasValue(profile?.ielts_overall) ||
    hasValue(profile?.det_score);

  return Array.isArray(quizAnswers.tests) && quizAnswers.tests.length === 0 && !hasAnySavedScore;
}

export function buildDashboardProgress(input: {
  profile: DashboardProfile | null;
  quizAnswers: IntroAnswers;
  universities: DashboardUniversity[];
  essays: DashboardEssay[];
  documents: DashboardDocument[];
  sections: DashboardSection[];
}) {
  const explicitNoTests = hasExplicitNoTests(input.quizAnswers, input.profile);
  const hasAnyTestScore =
    hasValue(input.profile?.sat_total) ||
    hasValue(input.profile?.toefl_total) ||
    hasValue(input.profile?.ielts_overall) ||
    hasValue(input.profile?.det_score);

  const profileConditions: ProgressCondition[] = [
    { label: "GPA", done: hasValue(input.profile?.gpa) },
    { label: "Intended major", done: hasValue(input.profile?.intended_major) || hasValue(input.quizAnswers.major) },
    { label: "Graduation year", done: hasValue(input.profile?.graduation_year) },
    { label: "Target intake", done: hasValue(input.quizAnswers.intakeYear) },
    { label: "Country", done: hasValue(input.profile?.country) || hasValue(input.quizAnswers.country) },
    { label: "Budget", done: hasValue(input.profile?.budget_range) },
    { label: "Tests or no-tests", done: hasAnyTestScore || explicitNoTests },
  ];

  const universitiesCount = input.universities.length;
  const universitiesConditions: ProgressCondition[] = [
    { label: "At least 1 university", done: universitiesCount >= 1 },
    { label: "At least 6 universities", done: universitiesCount >= 6 },
    { label: "Has a safety school", done: input.universities.some((item) => item.category === "safety") },
    { label: "Has a target school", done: input.universities.some((item) => item.category === "target") },
    { label: "Has a reach school", done: input.universities.some((item) => item.category === "reach") },
    { label: "All statuses set", done: universitiesCount > 0 && input.universities.every((item) => hasValue(item.status)) },
    {
      label: "All deadlines set",
      done:
        universitiesCount > 0 &&
        input.universities.every((item) => hasValue(item.deadline_override) || hasValue(item.university?.main_deadline)),
    },
  ];

  const personalStatement = input.essays.find((essay) => essay.essay_type === "personal_statement");
  const essayConditions: ProgressCondition[] = [
    { label: "Personal statement created", done: Boolean(personalStatement) },
    { label: "Personal statement has text", done: Boolean(personalStatement?.latest_has_text) },
    { label: "Personal statement draft is 500+ words", done: (personalStatement?.latest_word_count || 0) >= 500 },
    { label: "At least one essay has multiple versions", done: input.essays.some((essay) => essay.versions_count > 1) },
  ];

  const requiredDocumentTypes = ["transcript", "resume", "recommendation_letter", "passport"];
  if (!explicitNoTests) {
    requiredDocumentTypes.push("test_score");
  }
  const documentsConditions = requiredDocumentTypes.map((type) => ({
    label: type,
    done: input.documents.some((document) => document.type === type),
  }));

  const sectionByKey = new Map(input.sections.map((section) => [section.key, section]));
  const isSectionComplete = (key: string) => (sectionByKey.get(key)?.percent || 0) >= 100;
  const applicationConditions: ProgressCondition[] = [
    { label: "Profile", done: isSectionComplete("profile") },
    { label: "Family", done: isSectionComplete("family") },
    { label: "Education", done: isSectionComplete("education") },
    { label: "Testing", done: isSectionComplete("testing") || explicitNoTests },
    { label: "Activities", done: isSectionComplete("activities") },
    { label: "Writing", done: isSectionComplete("writing") },
  ];

  const blocks: ProgressBlock[] = [
    finalizeBlock("profile", "Profile", profileConditions, "Core student profile fields"),
    finalizeBlock("universities", "Universities", universitiesConditions, "Balanced and deadline-ready shortlist"),
    finalizeBlock("essays", "Essays", essayConditions, "Personal statement drafting progress"),
    finalizeBlock("documents", "Documents", documentsConditions, "Required admissions files uploaded"),
    finalizeBlock("applications", "Applications", applicationConditions, "Common App section completion"),
  ];

  const overallPercent = Math.round(blocks.reduce((sum, block) => sum + block.percent, 0) / blocks.length);

  return {
    blocks,
    overallPercent,
  };
}
