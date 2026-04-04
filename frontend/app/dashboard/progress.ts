import { getDashboardCopy } from "@/lib/dashboard-copy";
import type { Locale } from "@/lib/i18n";

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
  id: number;
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
  continueHref: string;
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
  continueHref: string,
): ProgressBlock {
  const completed = conditions.filter((condition) => condition.done).length;
  return {
    key,
    title,
    percent: roundPercent(completed, conditions.length),
    completed,
    total: conditions.length,
    summary,
    continueHref,
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
  locale?: Locale;
}) {
  const locale = input.locale || "en";
  const copy = getDashboardCopy(locale).progress;
  const explicitNoTests = hasExplicitNoTests(input.quizAnswers, input.profile);
  const hasAnyTestScore =
    hasValue(input.profile?.sat_total) ||
    hasValue(input.profile?.toefl_total) ||
    hasValue(input.profile?.ielts_overall) ||
    hasValue(input.profile?.det_score);

  const profileConditions: ProgressCondition[] = [
    { label: copy.conditions.gpa, done: hasValue(input.profile?.gpa) },
    { label: copy.conditions.intendedMajor, done: hasValue(input.profile?.intended_major) || hasValue(input.quizAnswers.major) },
    { label: copy.conditions.graduationYear, done: hasValue(input.profile?.graduation_year) },
    { label: copy.conditions.targetIntake, done: hasValue(input.quizAnswers.intakeYear) },
    { label: copy.conditions.country, done: hasValue(input.profile?.country) || hasValue(input.quizAnswers.country) },
    { label: copy.conditions.budget, done: hasValue(input.profile?.budget_range) },
    { label: copy.conditions.testsOrNoTests, done: hasAnyTestScore || explicitNoTests },
  ];
  const profileContinueHref =
    !profileConditions[0].done ? "/dashboard?edit=gpa" :
    !profileConditions[1].done ? "/dashboard?edit=major" :
    !profileConditions[2].done ? "/dashboard?edit=graduationYear" :
    !profileConditions[3].done ? "/dashboard?edit=intake" :
    !profileConditions[4].done ? "/dashboard?edit=country" :
    !profileConditions[5].done ? "/dashboard?edit=budget" :
    !profileConditions[6].done ? "/dashboard?edit=tests" :
    "/dashboard";

  const universitiesCount = input.universities.length;
  const universitiesConditions: ProgressCondition[] = [
    { label: copy.conditions.atLeastOneUniversity, done: universitiesCount >= 1 },
    { label: copy.conditions.atLeastTenUniversities, done: universitiesCount >= 10 },
    { label: copy.conditions.safetySchool, done: input.universities.some((item) => item.category === "safety" || item.category === "likely") },
    { label: copy.conditions.targetSchool, done: input.universities.some((item) => item.category === "target") },
    { label: copy.conditions.reachSchool, done: input.universities.some((item) => item.category === "reach" || item.category === "high_reach") },
    { label: copy.conditions.allStatusesSet, done: universitiesCount > 0 && input.universities.every((item) => hasValue(item.status)) },
    {
      label: copy.conditions.allDeadlinesSet,
      done:
        universitiesCount > 0 &&
        input.universities.every((item) => hasValue(item.deadline_override) || hasValue(item.university?.main_deadline)),
    },
  ];
  const universitiesContinueHref =
    !universitiesConditions[0].done || !universitiesConditions[1].done ? "/universities?tab=discover" : "/universities?tab=my";

  const personalStatement = input.essays.find((essay) => essay.essay_type === "personal_statement");
  const essayConditions: ProgressCondition[] = [
    { label: copy.conditions.personalStatementCreated, done: Boolean(personalStatement) },
    { label: copy.conditions.personalStatementHasText, done: Boolean(personalStatement?.latest_has_text) },
    { label: copy.conditions.personalStatementWordCount, done: (personalStatement?.latest_word_count || 0) >= 500 },
    { label: copy.conditions.essayMultipleVersions, done: input.essays.some((essay) => essay.versions_count > 1) },
  ];
  const essaysContinueHref =
    !essayConditions[0].done
      ? "/essays?action=create&essay_type=personal_statement"
      : personalStatement
        ? `/essays/${personalStatement.id}`
        : "/essays";

  const requiredDocumentTypes = ["transcript", "resume", "recommendation_letter", "passport"];
  if (!explicitNoTests) {
    requiredDocumentTypes.push("test_score");
  }
  const documentsConditions = requiredDocumentTypes.map((type) => ({
    label: copy.documentTypes[type as keyof typeof copy.documentTypes] || type,
    done: input.documents.some((document) => document.type === type),
  }));
  const firstMissingDocumentType =
    requiredDocumentTypes.find((type) => !input.documents.some((document) => document.type === type)) || "transcript";
  const documentsContinueHref = `/documents?type=${encodeURIComponent(firstMissingDocumentType)}`;

  const sectionByKey = new Map(input.sections.map((section) => [section.key, section]));
  const isSectionComplete = (key: string) => (sectionByKey.get(key)?.percent || 0) >= 100;
  const applicationConditions: ProgressCondition[] = [
    { label: copy.conditions.profile, done: isSectionComplete("profile") },
    { label: copy.conditions.family, done: isSectionComplete("family") },
    { label: copy.conditions.education, done: isSectionComplete("education") },
    { label: copy.conditions.testing, done: isSectionComplete("testing") || explicitNoTests },
    { label: copy.conditions.activities, done: isSectionComplete("activities") },
    { label: copy.conditions.writing, done: isSectionComplete("writing") },
  ];
  const firstIncompleteApplicationSection = applicationConditions.find((condition) => !condition.done)?.label.toLowerCase() || "profile";
  const applicationsContinueHref = `/common-app?section=${encodeURIComponent(firstIncompleteApplicationSection)}`;

  const blocks: ProgressBlock[] = [
    finalizeBlock("profile", copy.titles.profile, profileConditions, copy.profileSummary, profileContinueHref),
    finalizeBlock("universities", copy.titles.universities, universitiesConditions, copy.universitiesSummary, universitiesContinueHref),
    finalizeBlock("essays", copy.titles.essays, essayConditions, copy.essaysSummary, essaysContinueHref),
    finalizeBlock("documents", copy.titles.documents, documentsConditions, copy.documentsSummary, documentsContinueHref),
    finalizeBlock("applications", copy.titles.applications, applicationConditions, copy.applicationsSummary, applicationsContinueHref),
  ];

  const overallPercent = Math.round(blocks.reduce((sum, block) => sum + block.percent, 0) / blocks.length);

  return {
    blocks,
    overallPercent,
  };
}
