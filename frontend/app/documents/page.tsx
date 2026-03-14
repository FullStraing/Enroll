"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, Link2, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "@/components/loader";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDateTimeShort } from "@/lib/date-format";

type StudentUniversityOption = {
  id: number;
  category: "reach" | "target" | "safety";
  status: string;
  university: {
    id: number;
    name: string;
  };
};

type LinkedUniversity = {
  id: number;
  category: string;
  status: string;
  university: {
    id: number;
    name: string;
  };
} | null;

type DocumentType =
  | "transcript"
  | "resume"
  | "recommendation_letter"
  | "passport"
  | "test_score"
  | "financial"
  | "essay"
  | "other";

type DocumentItem = {
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

type DocumentTypeMeta = {
  id: DocumentType;
  label: string;
  description: string;
};

const DOCUMENT_TYPES: DocumentTypeMeta[] = [
  { id: "transcript", label: "Transcript", description: "School transcript and academic records." },
  { id: "resume", label: "Resume", description: "Your activity list, honors, and profile summary." },
  { id: "recommendation_letter", label: "Recommendation Letters", description: "Teacher and counselor recommendation files." },
  { id: "passport", label: "Passport / ID", description: "Identity documents used during application." },
  { id: "test_score", label: "Test Scores", description: "SAT, TOEFL, IELTS, DET, and other score reports." },
  { id: "financial", label: "Financial Documents", description: "Bank statements, sponsor letters, and aid-related files." },
  { id: "essay", label: "Essay Attachments", description: "Static essay files you want to keep with your applications." },
  { id: "other", label: "Other", description: "Everything that does not fit standard admissions buckets." },
];

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / (1024 * 102.4)) / 10} MB`;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [studentUniversities, setStudentUniversities] = useState<StudentUniversityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusText, setStatusText] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "transcript" as DocumentType,
    student_university_id: "",
    file: null as File | null,
  });

  const groupedDocuments = useMemo(() => {
    const map = new Map<DocumentType, DocumentItem[]>();
    for (const meta of DOCUMENT_TYPES) {
      map.set(meta.id, []);
    }
    for (const item of documents) {
      map.get(item.type)?.push(item);
    }
    return map;
  }, [documents]);

  const readyCount = useMemo(
    () => DOCUMENT_TYPES.filter((meta) => (groupedDocuments.get(meta.id) || []).length > 0).length,
    [groupedDocuments],
  );

  const missingTypes = useMemo(
    () => DOCUMENT_TYPES.filter((meta) => (groupedDocuments.get(meta.id) || []).length === 0),
    [groupedDocuments],
  );

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const [documentsResp, universitiesResp] = await Promise.all([
        apiFetch<DocumentItem[]>("/api/documents/", { method: "GET" }, token),
        apiFetch<StudentUniversityOption[]>("/api/my-universities/", { method: "GET" }, token),
      ]);
      setDocuments(documentsResp);
      setStudentUniversities(universitiesResp);
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось загрузить документы.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;
    if (!form.file) {
      setStatusText("Выберите файл для загрузки.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("title", form.title.trim() || form.file.name);
      body.append("type", form.type);
      body.append("file", form.file);
      if (form.student_university_id) {
        body.append("student_university_id", form.student_university_id);
      }

      await apiFetch("/api/documents/", { method: "POST", body }, token);
      setForm({ title: "", type: "transcript", student_university_id: "", file: null });
      await loadData();
      setStatusText("Документ загружен.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось загрузить документ.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(documentId: number) {
    const token = getToken();
    if (!token) return;

    setDeletingId(documentId);
    try {
      await apiFetch(`/api/documents/${documentId}/`, { method: "DELETE" }, token);
      await loadData();
      setStatusText("Документ удалён.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось удалить документ.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Documents" subtitle="Store the files you need for applications and keep document readiness clear.">
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <div className="space-y-5">
            <Card className="shadow-none">
              <CardTitle className="text-lg">Upload document</CardTitle>
              <CardDescription className="mt-2">
                Keep transcripts, resume, passport, recommendation letters, and other admissions files in one place.
              </CardDescription>

              <form onSubmit={handleUpload} className="mt-4 grid gap-3">
                <label className="text-sm text-black/70">
                  Title
                  <input
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Resume v2"
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2"
                  />
                </label>

                <label className="text-sm text-black/70">
                  Document type
                  <select
                    value={form.type}
                    onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as DocumentType }))}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2"
                  >
                    {DOCUMENT_TYPES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-black/70">
                  Link to university
                  <select
                    value={form.student_university_id}
                    onChange={(event) => setForm((prev) => ({ ...prev, student_university_id: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2"
                  >
                    <option value="">No university link</option>
                    {studentUniversities.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.university.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-black/70">
                  File
                  <input
                    type="file"
                    onChange={(event) => setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-[#DAF5F0] file:px-3 file:py-2 file:font-semibold"
                  />
                </label>

                <Button type="submit" disabled={uploading} className="mt-1 gap-2">
                  {uploading ? <Loader size="sm" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload document"}
                </Button>
              </form>
            </Card>

            <Card className="shadow-none">
              <CardTitle className="text-lg">Readiness</CardTitle>
              <CardDescription className="mt-2">
                Quick view of which standard admissions document groups are already covered.
              </CardDescription>

              {loading ? (
                <div className="mt-4 grid gap-2">
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                </div>
              ) : (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-black/15 bg-[#DAF5F0] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">Prepared</p>
                      <p className="mt-2 text-2xl font-black text-black">
                        {readyCount} / {DOCUMENT_TYPES.length}
                      </p>
                      <p className="mt-1 text-xs text-black/55">Standard document groups already have at least one file.</p>
                    </div>
                    <div className="rounded-2xl border border-black/15 bg-[#FFF4CC] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">Still missing</p>
                      <p className="mt-2 text-2xl font-black text-black">{missingTypes.length}</p>
                      <p className="mt-1 text-xs text-black/55">
                        {missingTypes.length ? missingTypes.map((item) => item.label).join(", ") : "All default groups are covered."}
                      </p>
                    </div>
                  </div>

                  {studentUniversities.length ? (
                    <div className="mt-4 rounded-2xl border border-black/15 bg-white px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">Admissions workflow</p>
                      <p className="mt-2 text-sm text-black/70">
                        Link documents to universities when relevant so you can tell which files are ready for each application.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            {loading ? (
              <div className="grid gap-4">
                <Skeleton className="h-40 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
              </div>
            ) : (
              DOCUMENT_TYPES.map((group) => {
                const items = groupedDocuments.get(group.id) || [];
                return (
                  <Card key={group.id} className="shadow-none">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{group.label}</CardTitle>
                        <CardDescription className="mt-1">{group.description}</CardDescription>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          items.length ? "border-black bg-[#DAF5F0]" : "border-black/15 bg-white text-black/55"
                        }`}
                      >
                        {items.length ? `${items.length} uploaded` : "Missing"}
                      </span>
                    </div>

                    {items.length ? (
                      <div className="mt-4 grid gap-3">
                        {items.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-black/15 bg-white px-4 py-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-black/55" />
                                  <p className="truncate text-sm font-semibold text-black">{item.title}</p>
                                </div>
                                <p className="mt-1 text-sm text-black/60">{item.file_name || "Uploaded file"}</p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-black/55">
                                  <span className="rounded-full border border-black/10 bg-black/[0.02] px-2 py-1">
                                    {formatFileSize(item.file_size)}
                                  </span>
                                  <span className="rounded-full border border-black/10 bg-black/[0.02] px-2 py-1">
                                    {item.mime_type || "Unknown type"}
                                  </span>
                                  <span className="rounded-full border border-black/10 bg-black/[0.02] px-2 py-1">
                                    Updated {formatDateTimeShort(item.updated_at)}
                                  </span>
                                  {item.student_university?.university?.name ? (
                                    <span className="rounded-full border border-black/10 bg-[#FFF4CC] px-2 py-1 text-black">
                                      <Link2 className="mr-1 inline h-3 w-3" />
                                      {item.student_university.university.name}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <a href={item.download_url} target="_blank" rel="noreferrer">
                                  <Button size="sm" variant="outline" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Download
                                  </Button>
                                </a>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2 text-rose-700 hover:bg-rose-50"
                                  onClick={() => void handleDelete(item.id)}
                                  disabled={deletingId === item.id}
                                >
                                  {deletingId === item.id ? <Loader size="sm" /> : <Trash2 className="h-4 w-4" />}
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-4 text-sm text-black/60">
                        No files uploaded in this group yet. Use the upload form to add one.
                      </div>
                    )}
                  </Card>
                );
              })
            )}

            {statusText ? (
              <div className="rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm text-black/70">{statusText}</div>
            ) : null}
          </div>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
