export const MAX_DOCUMENT_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_USER = 15;

export const DOCUMENT_TYPES = [
  { id: "transcript", label: "Transcript", description: "School transcript and academic records." },
  { id: "resume", label: "Resume", description: "Your activity list, honors, and profile summary." },
  { id: "recommendation_letter", label: "Recommendation Letters", description: "Teacher and counselor recommendation files." },
  { id: "passport", label: "Passport / ID", description: "Identity documents used during application." },
  { id: "test_score", label: "Test Scores", description: "SAT, TOEFL, IELTS, DET, and other score reports." },
  { id: "financial", label: "Financial Documents", description: "Bank statements, sponsor letters, and aid-related files." },
  { id: "essay", label: "Essay Attachments", description: "Static essay files you want to keep with your applications." },
  { id: "other", label: "Other", description: "Everything that does not fit standard admissions buckets." },
] as const;
