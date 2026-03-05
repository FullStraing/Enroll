"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Bot, GitCompare, PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { EssayRichEditor } from "@/components/essay-rich-editor";

type Essay = {
  id: number;
  title: string;
  essay_type: string;
  university_detail?: {
    id: number;
    name: string;
  } | null;
  prompt_title: string;
  prompt_text: string;
  target_word_count: number;
};

type EssayVersion = {
  id: number;
  essay: number;
  version_number: number;
  label: string;
  content: string;
  source: "user" | "ai";
  status: "draft" | "revised" | "ai_improved" | "final";
  is_latest: boolean;
  created_at: string;
  updated_at: string;
};

type DiffRow = {
  kind: "same" | "added" | "removed" | "changed";
  left: string;
  right: string;
};

function buildDiffRows(leftText: string, rightText: string): DiffRow[] {
  const leftLines = leftText.split("\n");
  const rightLines = rightText.split("\n");
  const max = Math.max(leftLines.length, rightLines.length);
  const rows: DiffRow[] = [];
  for (let index = 0; index < max; index += 1) {
    const left = leftLines[index] || "";
    const right = rightLines[index] || "";
    if (left && right && left === right) rows.push({ kind: "same", left, right });
    else if (!left && right) rows.push({ kind: "added", left: "", right });
    else if (left && !right) rows.push({ kind: "removed", left, right: "" });
    else rows.push({ kind: "changed", left, right });
  }
  return rows;
}

function htmlToText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function EssayWorkspacePage() {
  const params = useParams<{ id: string }>();
  const essayId = Number(params.id);
  const [essay, setEssay] = useState<Essay | null>(null);
  const [versions, setVersions] = useState<EssayVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorPlainText, setEditorPlainText] = useState("");
  const [loadedVersionId, setLoadedVersionId] = useState<number | null>(null);
  const [newVersionLabel, setNewVersionLabel] = useState("Revision");
  const [newVersionStatus, setNewVersionStatus] = useState<EssayVersion["status"]>("revised");
  const [compareLeftId, setCompareLeftId] = useState<number | null>(null);
  const [compareRightId, setCompareRightId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [statusText, setStatusText] = useState("");
  const [aiPanelVisible, setAiPanelVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("essay_ai_panel_visible") !== "0";
  });

  const loadWorkspace = useCallback(async () => {
    const token = getToken();
    if (!token || !essayId) return;
    setLoading(true);
    try {
      const [essayData, versionData] = await Promise.all([
        apiFetch<Essay>(`/api/essays/${essayId}/`, { method: "GET" }, token),
        apiFetch<EssayVersion[]>(`/api/essays/${essayId}/versions/`, { method: "GET" }, token),
      ]);
      setEssay(essayData);
      setVersions(versionData);
      const first = versionData[0] || null;
      setSelectedVersionId(first?.id || null);
      setEditorContent(first?.content || "<p></p>");
      setEditorPlainText(htmlToText(first?.content || ""));
      setLoadedVersionId(first?.id || null);
      setCompareLeftId(versionData[1]?.id || first?.id || null);
      setCompareRightId(first?.id || null);
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to load workspace.");
    } finally {
      setLoading(false);
    }
  }, [essayId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const selectedVersion = useMemo(
    () => versions.find((item) => item.id === selectedVersionId) || null,
    [versions, selectedVersionId],
  );
  const selectedIsLatest = Boolean(selectedVersion?.is_latest);

  useEffect(() => {
    if (!selectedVersion) return;
    if (loadedVersionId === selectedVersion.id) return;
    setEditorContent(selectedVersion.content || "<p></p>");
    setLoadedVersionId(selectedVersion.id);
    setEditorPlainText(htmlToText(selectedVersion.content || ""));
    setSaveState("idle");
  }, [selectedVersion, loadedVersionId]);

  useEffect(() => {
    if (!selectedVersion) return;
    if (!selectedIsLatest) return;
    if (editorContent === selectedVersion.content) return;
    const token = getToken();
    if (!token) return;

    const timer = setTimeout(async () => {
      setSaveState("saving");
      try {
        const updated = await apiFetch<EssayVersion>(
          `/api/essay-versions/${selectedVersion.id}/`,
          { method: "PUT", body: JSON.stringify({ label: selectedVersion.label, content: editorContent, source: selectedVersion.source }) },
          token,
        );
        setVersions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [editorContent, selectedVersion, selectedIsLatest]);

  async function createVersion(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token || !essayId) return;
    setCreatingVersion(true);
    try {
      const created = await apiFetch<EssayVersion>(
        `/api/essays/${essayId}/versions/`,
        {
          method: "POST",
          body: JSON.stringify({
            label: newVersionLabel.trim() || "Revision",
            content: editorContent,
            status: newVersionStatus,
          }),
        },
        token,
      );
      const nextVersions = [created, ...versions];
      setVersions(nextVersions);
      setSelectedVersionId(created.id);
      setLoadedVersionId(created.id);
      setNewVersionStatus("revised");
      setCompareRightId(created.id);
      setStatusText("New version created.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to create version.");
    } finally {
      setCreatingVersion(false);
    }
  }

  async function saveNow() {
    if (!selectedVersion) return;
    if (!selectedIsLatest) {
      setStatusText("This version is read-only. Create a new version to edit.");
      return;
    }
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const updated = await apiFetch<EssayVersion>(
        `/api/essay-versions/${selectedVersion.id}/`,
        { method: "PUT", body: JSON.stringify({ label: selectedVersion.label, content: editorContent, source: selectedVersion.source }) },
        token,
      );
      setVersions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSaveState("saved");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to save version.");
      setSaveState("error");
    } finally {
      setSaving(false);
    }
  }

  async function updateLatestVersionMeta(field: "status" | "label", value: string) {
    if (!selectedVersion || !selectedIsLatest) return;
    const token = getToken();
    if (!token) return;
    try {
      const payload = {
        label: field === "label" ? value : selectedVersion.label,
        content: editorContent,
        source: selectedVersion.source,
        status: field === "status" ? value : selectedVersion.status,
      };
      const updated = await apiFetch<EssayVersion>(
        `/api/essay-versions/${selectedVersion.id}/`,
        { method: "PUT", body: JSON.stringify(payload) },
        token,
      );
      setVersions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setStatusText("Version metadata updated.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to update version metadata.");
    }
  }

  const wordCount = useMemo(() => {
    const normalized = editorPlainText.trim();
    if (!normalized) return 0;
    return normalized.split(/\s+/).length;
  }, [editorPlainText]);

  const diffRows = useMemo(() => {
    const left = htmlToText(versions.find((item) => item.id === compareLeftId)?.content || "");
    const right = htmlToText(versions.find((item) => item.id === compareRightId)?.content || "");
    return buildDiffRows(left, right);
  }, [compareLeftId, compareRightId, versions]);

  function toggleAiPanel() {
    setAiPanelVisible((prev) => {
      const next = !prev;
      window.localStorage.setItem("essay_ai_panel_visible", next ? "1" : "0");
      return next;
    });
  }

  const gridClass = aiPanelVisible
    ? "grid gap-4 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_420px]"
    : "grid gap-4 lg:grid-cols-[260px_1fr]";

  const rightPanel = (
    <Card className="shadow-none">
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Mentor
        </CardTitle>
        <Badge variant="cyan">Phase 5</Badge>
      </div>
      <div className="mt-3 rounded-xl border border-black/15 bg-[#DAF5F0]/40 p-3 text-sm text-black/75">
        AI actions are not enabled yet. In next phase this panel will run:
        <ul className="mt-2 list-disc pl-5">
          <li>Create draft (Hook / Conflict / Growth / Impact)</li>
          <li>Selection-based improvements</li>
          <li>Admissions-style review</li>
        </ul>
      </div>

      <div className="mt-4 border-t border-black/10 pt-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitCompare className="h-4 w-4" />
          Compare versions
        </CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <select
            value={compareLeftId || ""}
            onChange={(event) => setCompareLeftId(Number(event.target.value))}
            className="rounded-xl border border-black/20 bg-white px-2 py-2 text-sm"
          >
            {versions.map((item) => (
              <option key={`left-${item.id}`} value={item.id}>
                v{item.version_number} {item.label || "Draft"}
              </option>
            ))}
          </select>
          <select
            value={compareRightId || ""}
            onChange={(event) => setCompareRightId(Number(event.target.value))}
            className="rounded-xl border border-black/20 bg-white px-2 py-2 text-sm"
          >
            {versions.map((item) => (
              <option key={`right-${item.id}`} value={item.id}>
                v{item.version_number} {item.label || "Draft"}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 max-h-[420px] space-y-2 overflow-auto rounded-xl border border-black/10 bg-white p-3 text-xs">
          {diffRows.map((row, index) => (
            <div
              key={`diff-${index}`}
              className={`rounded-lg border px-2 py-1 ${
                row.kind === "added"
                  ? "border-emerald-200 bg-emerald-50"
                  : row.kind === "removed"
                    ? "border-rose-200 bg-rose-50"
                    : row.kind === "changed"
                      ? "border-amber-200 bg-amber-50"
                      : "border-black/10 bg-white"
              }`}
            >
              <p className="font-semibold uppercase text-[10px] text-black/50">
                {row.kind === "same" ? "=" : row.kind === "added" ? "+" : row.kind === "removed" ? "-" : "~"}
              </p>
              {row.kind !== "added" ? <p className="text-black/70">{row.left || "(empty)"}</p> : null}
              {row.kind !== "removed" ? <p className="text-black">{row.right || "(empty)"}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  return (
    <ProtectedPage>
      <AppShell
        title={essay ? `Essay Workspace - ${essay.title}` : "Essay Workspace"}
        subtitle="Versions (left) + Editor (center) + Compare mode (no AI yet)"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-black/70">
            <Sparkles className="h-4 w-4" />
            Right panel is a placeholder for upcoming AI actions.
          </div>
          <Button variant="outline" size="sm" onClick={toggleAiPanel}>
            {aiPanelVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            <span>{aiPanelVisible ? "Hide AI panel" : "Show AI panel"}</span>
          </Button>
        </div>

        {loading ? (
          <div className={gridClass}>
            <Card className="shadow-none"><Skeleton className="h-72 w-full" /></Card>
            <Card className="shadow-none"><Skeleton className="h-72 w-full" /></Card>
            {aiPanelVisible ? <Card className="shadow-none"><Skeleton className="h-72 w-full" /></Card> : null}
          </div>
        ) : !essay ? (
          <Card className="shadow-none">
            <p className="text-sm text-black/70">Essay not found.</p>
            <Link href="/essays" className="mt-3 inline-block text-sm underline">
              Back to essays
            </Link>
          </Card>
        ) : (
          <div className={gridClass}>
            <Card className="shadow-none">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Versions</CardTitle>
                <Badge>{versions.length}</Badge>
              </div>
              <div className="mt-3 grid gap-2">
                {versions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedVersionId(item.id)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm ${
                      selectedVersionId === item.id
                        ? "border-black bg-[#FFDB58]/40"
                        : "border-black/15 bg-white hover:bg-black/[0.03]"
                    }`}
                  >
                    <p className="font-semibold">v{item.version_number} {item.label || "Draft"}</p>
                    <p className="text-xs text-black/60">status: {item.status}</p>
                    <p className="text-xs text-black/60">{new Date(item.updated_at).toLocaleString("ru-RU")}</p>
                  </button>
                ))}
              </div>

              <form onSubmit={createVersion} className="mt-4 grid gap-2 border-t border-black/10 pt-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-black/60">Create new version</label>
                <input
                  value={newVersionLabel}
                  onChange={(event) => setNewVersionLabel(event.target.value)}
                  className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm"
                  placeholder="Revision label"
                />
                <select
                  className="rounded-xl border border-black/20 bg-white px-3 py-2 text-sm"
                  value={newVersionStatus}
                  onChange={(event) => setNewVersionStatus(event.target.value as EssayVersion["status"])}
                >
                  <option value="draft">Status: draft</option>
                  <option value="revised">Status: revised</option>
                  <option value="ai_improved">Status: ai_improved</option>
                  <option value="final">Status: final</option>
                </select>
                <Button type="submit" disabled={creatingVersion}>
                  {creatingVersion ? <Spinner size="sm" /> : null}
                  <span>{creatingVersion ? "Creating..." : "Create version"}</span>
                </Button>
              </form>
            </Card>

            <Card className="shadow-none">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{essay.title}</CardTitle>
                  <p className="mt-1 text-sm text-black/65">{essay.university_detail?.name || "General essay"}</p>
                  {essay.prompt_title ? <p className="mt-1 text-sm text-black/75">Prompt: {essay.prompt_title}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">Words: {wordCount}</Badge>
                  <Badge>Target: {essay.target_word_count}</Badge>
                  {selectedVersion ? <Badge>{selectedVersion.status}</Badge> : null}
                </div>
              </div>

              {selectedVersion ? (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-black/60">
                    Version label
                    <input
                      value={selectedVersion.label}
                      onChange={(event) => {
                        const value = event.target.value;
                        setVersions((prev) =>
                          prev.map((item) => (item.id === selectedVersion.id ? { ...item, label: value } : item)),
                        );
                      }}
                      onBlur={(event) => void updateLatestVersionMeta("label", event.target.value)}
                      disabled={!selectedIsLatest}
                      className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-wide text-black/60">
                    Version status
                    <select
                      value={selectedVersion.status}
                      onChange={(event) => {
                        const value = event.target.value as EssayVersion["status"];
                        setVersions((prev) =>
                          prev.map((item) => (item.id === selectedVersion.id ? { ...item, status: value } : item)),
                        );
                        void updateLatestVersionMeta("status", value);
                      }}
                      disabled={!selectedIsLatest}
                      className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
                    >
                      <option value="draft">draft</option>
                      <option value="revised">revised</option>
                      <option value="ai_improved">ai_improved</option>
                      <option value="final">final</option>
                    </select>
                  </label>
                </div>
              ) : null}

              <div className="mt-4">
                <EssayRichEditor
                  content={editorContent}
                  editable={selectedIsLatest}
                  onChange={(html, text) => {
                    setEditorContent(html);
                    setEditorPlainText(text);
                  }}
                />
              </div>
              {!selectedIsLatest ? (
                <p className="mt-2 text-xs text-amber-700">Read-only version. Create a new version to continue editing.</p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="text-black/65">
                  Word count: {wordCount} / {essay.target_word_count} | Essay Score: coming soon
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-black/60">
                    {saveState === "saving"
                      ? "Autosaving..."
                      : saveState === "saved"
                        ? "Saved"
                        : saveState === "error"
                          ? "Autosave failed"
                          : "Idle"}
                  </span>
                  <Button size="sm" onClick={saveNow} disabled={saving}>
                    {saving ? <Spinner size="sm" /> : null}
                    <span>{saving ? "Saving..." : "Save now"}</span>
                  </Button>
                </div>
              </div>
            </Card>

            {aiPanelVisible ? <div className="hidden xl:block">{rightPanel}</div> : null}
          </div>
        )}

        {aiPanelVisible && !loading && essay ? (
          <details className="mt-4 rounded-2xl border border-black/15 bg-white p-3 xl:hidden">
            <summary className="cursor-pointer text-sm font-semibold">AI Mentor & Compare (mobile)</summary>
            <div className="mt-3">{rightPanel}</div>
          </details>
        ) : null}

        {statusText ? <p className="mt-4 text-sm text-black/65">{statusText}</p> : null}
      </AppShell>
    </ProtectedPage>
  );
}
