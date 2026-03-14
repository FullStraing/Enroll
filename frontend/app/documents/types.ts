export type DocumentType =
  | "transcript"
  | "resume"
  | "recommendation_letter"
  | "passport"
  | "test_score"
  | "financial"
  | "essay"
  | "other";

export type StudentUniversityOption = {
  id: number;
  category: "reach" | "target" | "safety";
  status: string;
  university: {
    id: number;
    name: string;
  };
};

export type LinkedUniversity = {
  id: number;
  category: string;
  status: string;
  university: {
    id: number;
    name: string;
  };
} | null;

export type DocumentItem = {
  id: number;
  title: string;
  type: DocumentType;
  type_label: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  download_url: string;
  student_university: LinkedUniversity;
  created_at: string;
  updated_at: string;
};

export type DocumentTypeMeta = {
  id: DocumentType;
  label: string;
  description: string;
};
