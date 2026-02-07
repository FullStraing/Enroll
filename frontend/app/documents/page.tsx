"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/loader";

type Application = {
  id: number;
  university_name?: string;
  university?: {
    id: number;
    name: string;
  } | null;
};

type DocumentItem = {
  id: number;
  title: string;
  type: "essay" | "resume" | "recommendation_notes" | "other";
};

type DocumentVersion = {
  id: number;
  version_number: number;
  content: string;
  created_by: "user" | "ai";
  created_at: string;
};

const docTypes: DocumentItem["type"][] = ["essay", "resume", "recommendation_notes", "other"];

export default function DocumentsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [docForm, setDocForm] = useState({ title: "", type: "essay" as DocumentItem["type"], application_id: "" });
  const [versionForm, setVersionForm] = useState({ created_by: "user" as "user" | "ai", content: "" });

  const loadDocuments = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [apps, docs] = await Promise.all([
        apiFetch<Application[]>("/api/applications/", { method: "GET" }, token),
        apiFetch<DocumentItem[]>("/api/documents/", { method: "GET" }, token),
      ]);
      setApplications(apps);
      setDocuments(docs);
      if (docs.length && !selectedDocumentId) setSelectedDocumentId(docs[0].id);
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось загрузить документы.");
    } finally {
      setLoading(false);
    }
  }, [selectedDocumentId]);

  async function loadVersions(documentId: number) {
    const token = getToken();
    if (!token) return;
    try {
      const data = await apiFetch<DocumentVersion[]>(`/api/documents/${documentId}/versions/`, { method: "GET" }, token);
      setVersions(data);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось загрузить версии.");
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (!selectedDocumentId) {
      setVersions([]);
      return;
    }
    void loadVersions(selectedDocumentId);
  }, [selectedDocumentId]);

  async function createDocument(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;
    if (!docForm.title.trim()) {
      setStatusText("Введите название документа.");
      return;
    }
    setSavingDoc(true);
    try {
      const payload: Record<string, unknown> = {
        title: docForm.title.trim(),
        type: docForm.type,
      };
      if (docForm.application_id) payload.application_id = Number(docForm.application_id);
      await apiFetch("/api/documents/", { method: "POST", body: JSON.stringify(payload) }, token);
      setDocForm({ title: "", type: "essay", application_id: "" });
      await loadDocuments();
      setStatusText("Документ создан.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось создать документ.");
    } finally {
      setSavingDoc(false);
    }
  }

  async function createVersion(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token || !selectedDocumentId) return;
    if (!versionForm.content.trim()) {
      setStatusText("Добавьте текст версии.");
      return;
    }
    setSavingVersion(true);
    try {
      await apiFetch(
        `/api/documents/${selectedDocumentId}/versions/`,
        { method: "POST", body: JSON.stringify({ content: versionForm.content, created_by: versionForm.created_by }) },
        token,
      );
      setVersionForm((prev) => ({ ...prev, content: "" }));
      await loadVersions(selectedDocumentId);
      setStatusText("Новая версия сохранена.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось сохранить версию.");
    } finally {
      setSavingVersion(false);
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Документы" subtitle="Структурируй документы и историю версий.">
        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Новый документ</h2>
            <form onSubmit={createDocument} className="mt-4 grid gap-3">
              <label className="text-sm text-white/70">
                Название
                <input
                  value={docForm.title}
                  onChange={(event) => setDocForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                />
              </label>
              <label className="text-sm text-white/70">
                Тип
                <select
                  value={docForm.type}
                  onChange={(event) => setDocForm((prev) => ({ ...prev, type: event.target.value as DocumentItem["type"] }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  {docTypes.map((value) => (
                    <option key={value} value={value} className="bg-[#0b1020]">
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-white/70">
                Привязать к заявке
                <select
                  value={docForm.application_id}
                  onChange={(event) => setDocForm((prev) => ({ ...prev, application_id: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <option value="" className="bg-[#0b1020]">Без заявки</option>
                  {applications.map((item) => (
                    <option key={item.id} value={item.id} className="bg-[#0b1020]">
                      {item.university?.name || item.university_name || `Application #${item.id}`}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={savingDoc}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-70"
              >
                {savingDoc ? <Loader size="sm" /> : null}
                <span>{savingDoc ? "Сохраняем..." : "Создать документ"}</span>
              </button>
            </form>

            <h3 className="mt-7 text-sm font-semibold uppercase tracking-wide text-white/65">Документы</h3>
            {loading ? (
              <div className="mt-3 grid gap-2">
                <div className="h-10 animate-pulse rounded-xl bg-white/10" />
                <div className="h-10 animate-pulse rounded-xl bg-white/10" />
              </div>
            ) : documents.length ? (
              <div className="mt-3 grid gap-2">
                {documents.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedDocumentId(item.id)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${selectedDocumentId === item.id ? "border-blue-400/70 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-white/60">{item.type}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/70">Документов пока нет.</p>
            )}
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Версии документа</h2>
            {selectedDocumentId ? (
              <form onSubmit={createVersion} className="mt-4 grid gap-3">
                <label className="text-sm text-white/70">
                  Кто создал
                  <select
                    value={versionForm.created_by}
                    onChange={(event) => setVersionForm((prev) => ({ ...prev, created_by: event.target.value as "user" | "ai" }))}
                    className="mt-1 w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <option value="user" className="bg-[#0b1020]">user</option>
                    <option value="ai" className="bg-[#0b1020]">ai</option>
                  </select>
                </label>
                <label className="text-sm text-white/70">
                  Контент версии
                  <textarea
                    value={versionForm.content}
                    onChange={(event) => setVersionForm((prev) => ({ ...prev, content: event.target.value }))}
                    rows={8}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  />
                </label>
                <button
                  type="submit"
                  disabled={savingVersion}
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-70"
                >
                  {savingVersion ? <Loader size="sm" /> : null}
                  <span>{savingVersion ? "Сохраняем..." : "Добавить версию"}</span>
                </button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-white/70">Выберите документ слева, чтобы работать с версиями.</p>
            )}

            {versions.length ? (
              <div className="mt-5 overflow-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-white/70">
                    <tr>
                      <th className="px-3 py-2">Версия</th>
                      <th className="px-3 py-2">Кто</th>
                      <th className="px-3 py-2">Дата</th>
                      <th className="px-3 py-2">Контент</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((version) => (
                      <tr key={version.id} className="border-t border-white/10 align-top">
                        <td className="px-3 py-2">v{version.version_number}</td>
                        <td className="px-3 py-2">{version.created_by}</td>
                        <td className="px-3 py-2">{new Date(version.created_at).toLocaleString("ru-RU")}</td>
                        <td className="max-w-[560px] px-3 py-2 text-white/80">{version.content}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : selectedDocumentId ? (
              <p className="mt-4 text-sm text-white/70">Версий пока нет.</p>
            ) : null}
          </section>

          {statusText ? <p className="xl:col-span-2 text-sm text-white/70">{statusText}</p> : null}
        </div>
      </AppShell>
    </ProtectedPage>
  );
}

