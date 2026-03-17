export type TaskItem = {
  id: number;
  title: string;
  description: string;
  due_date: string | null;
  status: "planned" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  roadmap_stage?: {
    id: number;
    title: string;
  } | null;
  application?: {
    id: number;
    university_id: number | null;
    university_name: string;
    deadline_date: string | null;
    status: string;
  } | null;
};

export type ApplicationItem = {
  id: number;
  university_name?: string;
  deadline_date: string | null;
  status: string;
  university?: {
    id: number;
    name: string;
  } | null;
};

export type MyUniversityItem = {
  id: number;
  university?: {
    id: number;
    name: string;
  } | null;
};

export type DuePreset = "today" | "tomorrow" | "none" | "custom";
