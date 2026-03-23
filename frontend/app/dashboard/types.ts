import type { IntroAnswers as ProgressIntroAnswers } from "@/app/dashboard/progress";

export type Section = {
  key: string;
  title: string;
  completed_required: number;
  required_total: number;
  percent: number;
};

export type CommonAppProgress = {
  overall: {
    completed_required: number;
    required_total: number;
    percent: number;
  };
  sections: Section[];
};

export type AcademicTestType = "SAT" | "ACT";
export type LanguageTestType = "IELTS" | "TOEFL" | "DET" | "PTE" | "Cambridge";

export type DashboardSnapshotData = {
  academic_tests?: Array<{ type: AcademicTestType; score: string }>;
  language_tests?: Array<{ type: LanguageTestType; score: string }>;
  ap_scores?: Array<{ exam: string; score: string }>;
  displayed_university_ids?: number[];
};

export type Profile = {
  full_name?: string;
  username?: string;
  country?: string;
  intended_major?: string;
  graduation_year?: number | null;
  gpa?: string | number | null;
  sat_total?: number | null;
  toefl_total?: number | null;
  ielts_overall?: string | number | null;
  det_score?: number | null;
  budget_range?: string;
  activities?: string[];
  honors?: string[];
  common_app_profile?: {
    dashboard_snapshot?: DashboardSnapshotData;
    intro_quiz_completed?: boolean;
    intro_quiz_answers?: IntroAnswers;
  };
};

export type UniversityBrief = {
  id: number;
  name: string;
  main_deadline?: string | null;
};

export type StudentUniversity = {
  id: number;
  category?: string;
  status: string;
  progress_percent: number;
  deadline_override?: string | null;
  university: UniversityBrief;
};

export type Task = {
  id: number;
  title: string;
  due_date?: string | null;
  status: "planned" | "in_progress" | "done" | string;
};

export type DocumentItem = {
  id: number;
  type: string;
};

export type EssayItem = {
  id: number;
  title: string;
  essay_type: string;
  versions_count: number;
  latest_has_text?: boolean;
  latest_word_count?: number;
  last_edited_at?: string;
};

export type ApplicationItem = {
  id: number;
  deadline_date?: string | null;
  status: string;
  university?: {
    name?: string;
  };
  university_name?: string;
};

export type IntroAnswers = ProgressIntroAnswers & {
  schoolLevel?: string;
  gpaScale?: string;
  gpaValue?: string;
  shortlistSize?: string;
};

export type IntroStorage = {
  step?: number;
  answers?: IntroAnswers;
};

export type DashboardCachePayload = {
  cachedAt: number;
  profile: Profile | null;
  progressData: CommonAppProgress | null;
  myUniversities: StudentUniversity[];
  tasks: Task[];
  documents: DocumentItem[];
  essays: EssayItem[];
  applications: ApplicationItem[];
};

export type EditableFieldKey = "major" | "gpa" | "tests" | "intake" | "country" | "level";

export type EditProfileForm = {
  fullName: string;
  major: string;
  country: string;
  intakeYear: string;
  schoolLevel: string;
  gpaScale: string;
  gpaValue: string;
  academicTests: Array<{ type: AcademicTestType; score: string }>;
  languageTests: Array<{ type: LanguageTestType; score: string }>;
  apScores: Array<{ exam: string; score: string }>;
  activities: Array<{ title: string; description: string }>;
  honors: string[];
  selectedUniversityIds: number[];
};
