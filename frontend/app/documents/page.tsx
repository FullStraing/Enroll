"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { DOCUMENT_TYPES, MAX_DOCUMENTS_PER_USER } from "@/app/documents/constants";
import type { DocumentItem, DocumentType, StudentUniversityOption } from "@/app/documents/types";
import { DocumentGroupSection } from "@/components/documents/document-group-section";
import { RenameDocumentDialog } from "@/components/documents/rename-document-dialog";
import { UploadPanel } from "@/components/documents/upload-panel";
import { RuntimeNotice } from "@/components/runtime-notice";
import {
  clearSessionCaches,
  readSessionCache,
  SESSION_CACHE_KEYS,
  SESSION_CACHE_TTLS,
  writeSessionCache,
} from "@/lib/session-cache";
import { fetchRuntimeConfig, type RuntimeConfig } from "@/lib/runtime-config";

type DocumentsCachePayload = {
  documents: DocumentItem[];
  studentUniversities: StudentUniversityOption[];
};

function DocumentsPageContent() {
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [studentUniversities, setStudentUniversities] = useState<StudentUniversityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [cacheReady, setCacheReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [renamingDocument, setRenamingDocument] = useState<DocumentItem | null>(null);
  const [statusText, setStatusText] = useState("");
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | null>(null);

  const requestedDocumentType = useMemo(() => {
    const value = searchParams.get("type");
    return DOCUMENT_TYPES.some((item) => item.id === value) ? (value as DocumentType) : "transcript";
  }, [searchParams]);

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

    const { payload: cached, isFresh } = readSessionCache<DocumentsCachePayload>(SESSION_CACHE_KEYS.documents, SESSION_CACHE_TTLS.documents, token);
    if (cached) {
      setDocuments(cached.documents);
      setStudentUniversities(cached.studentUniversities);
      setLoading(false);
      setHydrated(true);
      setCacheReady(true);
    } else {
      setLoading(true);
    }

    if (isFresh) {
      setStatusText("");
      return;
    }

    try {
      const [documentsResp, universitiesResp] = await Promise.all([
        apiFetch<DocumentItem[]>("/api/documents/", { method: "GET" }, token),
        apiFetch<StudentUniversityOption[]>("/api/my-universities/", { method: "GET" }, token),
      ]);
      setDocuments(documentsResp);
      setStudentUniversities(universitiesResp);
      setStatusText("");
      writeSessionCache(SESSION_CACHE_KEYS.documents, {
        documents: documentsResp,
        studentUniversities: universitiesResp,
      }, token);
      setCacheReady(true);
    } catch (error) {
      if (!cached) {
        setStatusText(error instanceof Error ? error.message : "Failed to load documents.");
      }
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;
    void fetchRuntimeConfig()
      .then((config) => {
        if (!cancelled) setRuntimeConfig(config);
      })
      .catch(() => {
        if (!cancelled) setRuntimeConfig(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token || loading || !hydrated || !cacheReady) return;
    writeSessionCache(SESSION_CACHE_KEYS.documents, {
      documents,
      studentUniversities,
    }, token);
  }, [cacheReady, hydrated, loading, documents, studentUniversities]);

  async function handleUpload(payload: {
    title: string;
    type: DocumentType;
    studentUniversityId: string;
    files: File[];
  }) {
    if (runtimeConfig?.features.file_uploads_enabled === false) {
      setStatusText("Document uploads are temporarily unavailable.");
      return;
    }
    const token = getToken();
    if (!token) return;

    setUploading(true);
    try {
      const createdDocuments: DocumentItem[] = [];
      for (let index = 0; index < payload.files.length; index += 1) {
        const file = payload.files[index];
        const body = new FormData();
        const title = payload.files.length === 1 && payload.title.trim() ? payload.title.trim() : file.name;
        body.append("title", title);
        body.append("type", payload.type);
        body.append("file", file);
        if (payload.studentUniversityId) {
          body.append("student_university_id", payload.studentUniversityId);
        }
        const created = await apiFetch<DocumentItem>("/api/documents/", { method: "POST", body }, token);
        createdDocuments.push(created);
      }

      setDocuments((prev) => {
        const nextDocuments = [...createdDocuments, ...prev];
        writeSessionCache(SESSION_CACHE_KEYS.documents, {
          documents: nextDocuments,
          studentUniversities,
        }, token);
        return nextDocuments;
      });
      setHydrated(true);
      setCacheReady(true);
      clearSessionCaches([SESSION_CACHE_KEYS.dashboard]);
      setStatusText(payload.files.length === 1 ? "Document uploaded." : `${payload.files.length} documents uploaded.`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to upload document.");
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
      setDocuments((prev) => {
        const nextDocuments = prev.filter((item) => item.id !== documentId);
        writeSessionCache(SESSION_CACHE_KEYS.documents, {
          documents: nextDocuments,
          studentUniversities,
        }, token);
        return nextDocuments;
      });
      setHydrated(true);
      setCacheReady(true);
      clearSessionCaches([SESSION_CACHE_KEYS.dashboard]);
      setStatusText("Document deleted.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to delete document.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRename(title: string) {
    const token = getToken();
    if (!token || !renamingDocument) return;

    setRenaming(true);
    try {
      const renamed = await apiFetch<DocumentItem>(
        `/api/documents/${renamingDocument.id}/`,
        { method: "PATCH", body: JSON.stringify({ title: title.trim() }) },
        token,
      );
      setDocuments((prev) => {
        const nextDocuments = prev.map((item) => (item.id === renamed.id ? renamed : item));
        writeSessionCache(SESSION_CACHE_KEYS.documents, {
          documents: nextDocuments,
          studentUniversities,
        }, token);
        return nextDocuments;
      });
      setHydrated(true);
      setCacheReady(true);
      clearSessionCaches([SESSION_CACHE_KEYS.dashboard]);
      setRenamingDocument(null);
      setStatusText("Document renamed.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to rename document.");
    } finally {
      setRenaming(false);
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Documents" subtitle="Application files in one place.">
        {runtimeConfig?.features.file_uploads_enabled === false ? (
          <div className="mb-5">
            <RuntimeNotice message="Document uploads are temporarily unavailable. Existing files stay available for viewing, renaming, and deleting." />
          </div>
        ) : null}
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <div className="min-w-0 space-y-5">
            <UploadPanel
              documentTypes={DOCUMENT_TYPES}
              studentUniversities={studentUniversities}
              currentDocumentCount={documents.length}
              initialType={requestedDocumentType}
              uploading={uploading}
              uploadsEnabled={runtimeConfig?.features.file_uploads_enabled !== false}
              uploadUnavailableMessage="Uploads are temporarily disabled while we stabilize storage."
              onUpload={handleUpload}
              onError={setStatusText}
            />

            <Card className="shadow-none">
              <CardTitle className="text-lg">Readiness</CardTitle>
              <CardDescription className="mt-2 hidden text-sm sm:block">
                Quick view of what is already covered.
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
                      <p className="mt-1 text-xs text-black/55">Document groups with at least one file.</p>
                    </div>
                    <div className="rounded-2xl border border-black/15 bg-[#FFF4CC] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">Still missing</p>
                      <p className="mt-2 text-2xl font-black text-black">{missingTypes.length}</p>
                      <p className="mt-1 text-xs text-black/55">
                        {missingTypes.length ? missingTypes.map((item) => item.label).join(", ") : "All default groups are covered."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-black/15 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">Storage</p>
                    <p className="mt-2 text-sm text-black/70">
                      {documents.length} of {MAX_DOCUMENTS_PER_USER} document slots used.
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>

          <div className="min-w-0 space-y-5">
            {loading ? (
              <div className="grid gap-4">
                <Skeleton className="h-40 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
              </div>
            ) : (
              DOCUMENT_TYPES.map((group) => (
                <DocumentGroupSection
                  key={group.id}
                  group={group}
                  items={groupedDocuments.get(group.id) || []}
                  deletingId={deletingId}
                  onDelete={handleDelete}
                  onRename={setRenamingDocument}
                />
              ))
            )}

            {statusText ? (
              <div className="rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm text-black/70">{statusText}</div>
            ) : null}
          </div>
        </div>

        <RenameDocumentDialog
          document={renamingDocument}
          saving={renaming}
          onClose={() => setRenamingDocument(null)}
          onSave={handleRename}
        />
      </AppShell>
    </ProtectedPage>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={null}>
      <DocumentsPageContent />
    </Suspense>
  );
}
