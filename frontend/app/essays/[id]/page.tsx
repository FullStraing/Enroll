"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Bot, Focus, GitCompare, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useBodyScrollLock } from "@/components/ui/use-body-scroll-lock";
import { formatDateTimeShort } from "@/lib/date-format";

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

type CompareResponse = {
  essay_id: number;
  from_version: { id: number; version_number: number; label: string };
  to_version: { id: number; version_number: number; label: string };
  rows: DiffRow[];
};

type CompareDisplayRow = {
  kind: DiffRow["kind"] | "ellipsis";
  left: string;
  right: string;
  unchangedCount?: number;
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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function compressDiffRows(rows: DiffRow[], contextLines = 1): CompareDisplayRow[] {
  const output: CompareDisplayRow[] = [];
  let index = 0;

  while (index < rows.length) {
    if (rows[index].kind !== "same") {
      output.push(rows[index]);
      index += 1;
      continue;
    }

    let end = index;
    while (end < rows.length && rows[end].kind === "same") end += 1;
    const runLength = end - index;
    if (runLength <= contextLines * 2 + 1) {
      for (let i = index; i < end; i += 1) output.push(rows[i]);
    } else {
      for (let i = index; i < index + contextLines; i += 1) output.push(rows[i]);
      output.push({
        kind: "ellipsis",
        left: "",
        right: "",
        unchangedCount: runLength - contextLines * 2,
      });
      for (let i = end - contextLines; i < end; i += 1) output.push(rows[i]);
    }
    index = end;
  }

  return output;
}

function markChangedWords(base: string, compare: string) {
  const compareWords = new Set(compare.split(/\s+/).filter(Boolean).map((item) => item.toLowerCase()));
  return base.split(/(\s+)/).map((token, index) => {
    const clean = token.trim().toLowerCase();
    if (!clean || compareWords.has(clean)) return <span key={`wd-${index}`}>{token}</span>;
    return (
      <span key={`wd-${index}`} className="rounded bg-black/10 px-0.5">
        {token}
      </span>
    );
  });
}

function getWordTargetState(wordCount: number, target: number) {
  if (!target) return { label: "No target", hint: "Set target to enable guidance.", variant: "default" as const, progress: 0 };

  const delta = wordCount - target;
  const progress = Math.min(100, Math.round((wordCount / target) * 100));
  if (wordCount === 0) {
    return {
      label: "Start writing",
      hint: "No content yet.",
      variant: "default" as const,
      progress: 0,
    };
  }
  if (Math.abs(delta) <= 25) {
    return {
      label: "On target",
      hint: `Great range: ${wordCount}/${target}.`,
      variant: "cyan" as const,
      progress,
    };
  }
  if (delta < 0) {
    return {
      label: "Below target",
      hint: `${Math.abs(delta)} words left to reach target.`,
      variant: "orange" as const,
      progress,
    };
  }
  return {
    label: "Over target",
    hint: `Over by ${delta} words. Consider trimming.`,
    variant: "primary" as const,
    progress,
  };
}

function versionSuffix(version: EssayVersion): string {
  if (version.status === "final") return "Final";
  if (version.status === "ai_improved") return "AI edit";
  if (version.status === "revised") return "Revision";
  return "Draft";
}

function getSavedAgoLabel(lastSavedAt: Date | null) {
  if (!lastSavedAt) return "Not saved yet";
  const diffMs = Date.now() - lastSavedAt.getTime();
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 5) return "Auto saved just now";
  if (seconds < 60) return `Auto saved ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `Auto saved ${minutes}m ago`;
}

function buildStructureHelper(text: string) {
  const normalized = text.toLowerCase();
  const sections = [
    {
      key: "hook",
      label: "Hook",
      found: /^(.*[!?])|i\s+remember|i\s+still|when\s+i\s+was/.test(normalized),
    },
    {
      key: "conflict",
      label: "Conflict",
      found: /challenge|struggle|difficult|problem|failed|obstacle/.test(normalized),
    },
    {
      key: "growth",
      label: "Growth",
      found: /learned|improved|grew|realized|developed|changed/.test(normalized),
    },
    {
      key: "impact",
      label: "Impact",
      found: /impact|contribute|community|helped|led|result/.test(normalized),
    },
  ];
  return sections;
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
  const [createVersionOpen, setCreateVersionOpen] = useState(false);
  const [deleteConfirmVersionId, setDeleteConfirmVersionId] = useState<number | null>(null);
  const [compareLeftId, setCompareLeftId] = useState<number | null>(null);
  const [compareRightId, setCompareRightId] = useState<number | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useBodyScrollLock(compareOpen || createVersionOpen);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "retrying" | "saved" | "error">("idle");
  const [statusText, setStatusText] = useState("");
  const [compareRows, setCompareRows] = useState<DiffRow[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [aiPanelVisible, setAiPanelVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("essay_ai_panel_visible") !== "0";
  });
  const [focusMode, setFocusMode] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [savedAgoLabel, setSavedAgoLabel] = useState("Not saved yet");
  const autosaveSeqRef = useRef(0);

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
  useEffect(() => {
    if (!selectedVersion) return;
    if (loadedVersionId === selectedVersion.id) return;
    setEditorContent(selectedVersion.content || "<p></p>");
    setLoadedVersionId(selectedVersion.id);
    setEditorPlainText(htmlToText(selectedVersion.content || ""));
    setLastSavedAt(selectedVersion.updated_at ? new Date(selectedVersion.updated_at) : null);
    setSaveState("idle");
  }, [selectedVersion, loadedVersionId]);

  const persistVersion = useCallback(async (payload: { label: string; content: string; source: "user" | "ai"; status?: EssayVersion["status"] }, retries = 3) => {
    if (!selectedVersion) throw new Error("No selected version.");
    const token = getToken();
    if (!token) throw new Error("Missing auth token.");

    for (let attempt = 0; attempt < retries; attempt += 1) {
      try {
        if (attempt > 0) {
          setSaveState("retrying");
          await wait(500 * 2 ** (attempt - 1));
        }
        const updated = await apiFetch<EssayVersion>(
          `/api/essay-versions/${selectedVersion.id}/`,
          { method: "PUT", body: JSON.stringify(payload) },
          token,
        );
        return updated;
      } catch (error) {
        if (attempt === retries - 1) throw error;
      }
    }
    throw new Error("Failed to save version.");
  }, [selectedVersion]);

  useEffect(() => {
    if (!selectedVersion) return;
    if (editorContent === selectedVersion.content) return;
    const currentSeq = ++autosaveSeqRef.current;
    let cancelled = false;

    const timer = setTimeout(async () => {
      setSaveState("saving");
      try {
        const updated = await persistVersion({
          label: selectedVersion.label,
          content: editorContent,
          source: selectedVersion.source,
          status: selectedVersion.status,
        });
        if (cancelled || currentSeq !== autosaveSeqRef.current) return;
        setVersions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSaveState("saved");
        setLastSavedAt(new Date());
      } catch {
        if (cancelled || currentSeq !== autosaveSeqRef.current) return;
        setSaveState("error");
        setStatusText("Autosave failed after retries. Click Save now.");
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [editorContent, selectedVersion, persistVersion]);

  async function createVersion(event: FormEvent): Promise<boolean> {
    event.preventDefault();
    const token = getToken();
    if (!token || !essayId) return false;
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
      return true;
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to create version.");
      return false;
    } finally {
      setCreatingVersion(false);
    }
  }

  async function saveNow() {
    if (!selectedVersion) return;
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const updated = await persistVersion({
        label: selectedVersion.label,
        content: editorContent,
        source: selectedVersion.source,
        status: selectedVersion.status,
      });
      setVersions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSaveState("saved");
      setLastSavedAt(new Date());
      setStatusText("Saved.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to save version.");
      setSaveState("error");
    } finally {
      setSaving(false);
    }
  }

  async function restoreVersion(version: EssayVersion) {
    setSelectedVersionId(version.id);
    setLoadedVersionId(null);
    setStatusText(`Loaded v${version.version_number}.`);
  }

  async function deleteVersion(version: EssayVersion) {
    const token = getToken();
    if (!token) return;

    try {
      await apiFetch(`/api/essay-versions/${version.id}/`, { method: "DELETE" }, token);
      const remaining = versions.filter((item) => item.id !== version.id);
      setVersions(remaining);

      if (selectedVersionId === version.id) {
        const fallback = remaining[0] || null;
        setSelectedVersionId(fallback?.id || null);
        setLoadedVersionId(null);
      }

      if (compareLeftId === version.id) {
        setCompareLeftId(remaining[1]?.id || remaining[0]?.id || null);
      }
      if (compareRightId === version.id) {
        setCompareRightId(remaining[0]?.id || null);
      }

      setStatusText(`Deleted v${version.version_number}.`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to delete version.");
    } finally {
      setDeleteConfirmVersionId(null);
    }
  }

  const wordCount = useMemo(() => {
    const normalized = editorPlainText.trim();
    if (!normalized) return 0;
    return normalized.split(/\s+/).length;
  }, [editorPlainText]);

  useEffect(() => {
    setSavedAgoLabel(getSavedAgoLabel(lastSavedAt));
    const timer = window.setInterval(() => {
      setSavedAgoLabel(getSavedAgoLabel(lastSavedAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lastSavedAt]);

  useEffect(() => {
    async function loadCompare() {
      const token = getToken();
      if (!token || !essayId || !compareLeftId || !compareRightId) return;
      setCompareLoading(true);
      try {
        const data = await apiFetch<CompareResponse>(
          `/api/essays/${essayId}/compare/?from_version=${compareLeftId}&to_version=${compareRightId}`,
          { method: "GET" },
          token,
        );
        setCompareRows(data.rows || []);
      } catch {
        const left = htmlToText(versions.find((item) => item.id === compareLeftId)?.content || "");
        const right = htmlToText(versions.find((item) => item.id === compareRightId)?.content || "");
        setCompareRows(buildDiffRows(left, right));
      } finally {
        setCompareLoading(false);
      }
    }
    void loadCompare();
  }, [essayId, compareLeftId, compareRightId, versions]);
  const wordTargetState = useMemo(
    () => getWordTargetState(wordCount, essay?.target_word_count || 0),
    [wordCount, essay?.target_word_count],
  );

  function toggleAiPanel() {
    setAiPanelVisible((prev) => {
      const next = !prev;
      window.localStorage.setItem("essay_ai_panel_visible", next ? "1" : "0");
      return next;
    });
  }

  const workspaceGridClass = focusMode ? "grid grid-cols-1" : "grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]";
  const structureHelper = useMemo(() => buildStructureHelper(editorPlainText), [editorPlainText]);
  const [compareMode, setCompareMode] = useState<"side" | "inline">("side");
  const compareDisplayRows = useMemo(() => compressDiffRows(compareRows, 1), [compareRows]);
  const compareLeftVersion = useMemo(
    () => versions.find((item) => item.id === compareLeftId) || null,
    [versions, compareLeftId],
  );
  const compareRightVersion = useMemo(
    () => versions.find((item) => item.id === compareRightId) || null,
    [versions, compareRightId],
  );
  const deleteConfirmVersion = useMemo(
    () => versions.find((item) => item.id === deleteConfirmVersionId) || null,
    [versions, deleteConfirmVersionId],
  );

  return (
    <ProtectedPage>
      <AppShell
        title={essay ? `Essay Workspace - ${essay.title}` : "Essay Workspace"}
        subtitle="Versions + Editor"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-black/70">
            <Sparkles className="h-4 w-4" />
            Keep writing focus: tools open on demand.
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCompareOpen(true)} disabled={versions.length < 2}>
              <GitCompare className="h-4 w-4" />
              <span>Compare versions</span>
            </Button>
            <Button variant="outline" size="sm" onClick={toggleAiPanel}>
              <Bot className="h-4 w-4" />
              <span>AI Assistant</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFocusMode((prev) => !prev)}>
              <Focus className="h-4 w-4" />
              <span>{focusMode ? "Exit focus" : "Focus mode"}</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className={workspaceGridClass}>
            {!focusMode ? (
              <Card className="shadow-none">
                <Skeleton className="h-72 w-full" />
              </Card>
            ) : null}
            <Card className="shadow-none">
              <Skeleton className="h-72 w-full" />
            </Card>
          </div>
        ) : !essay ? (
          <Card className="shadow-none">
            <p className="text-sm text-black/70">Essay not found.</p>
            <Link href="/essays" className="mt-3 inline-block text-sm underline">
              Back to essays
            </Link>
          </Card>
        ) : (
          <div className={workspaceGridClass}>
            {!focusMode ? (
              <Card className="shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>Versions</CardTitle>
                  <Badge>{versions.length}</Badge>
                </div>
                <div className="mt-3 grid gap-2">
                  {versions.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-2 ${
                        selectedVersionId === item.id ? "border-black bg-[#FFDB58]/30" : "border-black/15 bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedVersionId(item.id)}
                        className="block w-full text-left text-sm"
                      >
                        <p className="font-semibold">
                          v{item.version_number} {versionSuffix(item)}
                        </p>
                        <p className="text-xs text-black/60">{formatDateTimeShort(item.updated_at)}</p>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-black/10 pt-3">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedVersion && !selectedVersion.is_latest ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void restoreVersion(selectedVersion)}
                        disabled={creatingVersion}
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Restore selected</span>
                      </Button>
                    ) : null}
                    {selectedVersion ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirmVersionId(selectedVersion.id)}
                        disabled={creatingVersion || versions.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete selected</span>
                      </Button>
                    ) : null}
                  </div>
                  <Button size="sm" onClick={() => setCreateVersionOpen(true)} disabled={creatingVersion}>
                    {creatingVersion ? <Spinner size="sm" /> : null}
                    <span>{creatingVersion ? "Creating..." : "Create new version"}</span>
                  </Button>
                </div>
              </Card>
            ) : null}

            <div className="min-w-0 w-full">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">{essay.title}</h2>
                  <p className="mt-1 text-sm text-black/65">{essay.university_detail?.name || "General essay"}</p>
                  {essay.prompt_title ? <p className="mt-1 text-sm text-black/75">Prompt: {essay.prompt_title}</p> : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-black/60">{saveState === "error" ? "Autosave failed" : savedAgoLabel}</span>
                  <div className="flex items-center gap-2">
                  <Badge variant="cyan">Words: {wordCount}</Badge>
                  <Badge>Target: {essay.target_word_count}</Badge>
                  <Badge variant={wordTargetState.variant}>{wordTargetState.label}</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
                {structureHelper.map((item) => (
                  <Badge key={item.key} variant={item.found ? "cyan" : "default"}>
                    {item.label}: {item.found ? "detected" : "missing"}
                  </Badge>
                ))}
              </div>

              <div className="mt-3">
                <EssayRichEditor
                  content={editorContent}
                  stickyToolbar
                  minimalToolbar
                  editable={Boolean(selectedVersion)}
                  onChange={(html, text) => {
                    setEditorContent(html);
                    setEditorPlainText(text);
                  }}
                />
              </div>

              <div className="mt-3 rounded-xl border border-black/10 bg-white p-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <p className="font-semibold">Word target guidance</p>
                  <p className="text-black/65">{wordCount}/{essay.target_word_count}</p>
                </div>
                <div className="mt-2">
                  <Progress value={wordTargetState.progress} variant={wordTargetState.variant === "cyan" ? "cyan" : "primary"} className="h-3" />
                </div>
                <p className="mt-2 text-xs text-black/70">{wordTargetState.hint}</p>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="text-black/65">
                  Word count: {wordCount} / {essay.target_word_count} | Essay Score: coming soon
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={saveNow} disabled={saving}>
                    {saving ? <Spinner size="sm" /> : null}
                    <span>{saving ? "Saving..." : "Save now"}</span>
                  </Button>
                </div>
              </div>
            </div>

          </div>
        )}

        {aiPanelVisible && !loading && essay ? (
          <div className="fixed inset-y-20 right-4 z-40 w-[min(380px,92vw)] rounded-2xl border-2 border-black bg-white p-4 shadow-[0_8px_0_#000]">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-4 w-4" />
                AI Assistant
              </CardTitle>
              <Button size="sm" variant="outline" onClick={toggleAiPanel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 rounded-xl border border-black/15 bg-[#DAF5F0]/40 p-3 text-sm text-black/75">
              AI actions are hidden by default and open only on demand.
              <ul className="mt-2 list-disc pl-5">
                <li>Create draft (Hook / Conflict / Growth / Impact)</li>
                <li>Selection-based improvements</li>
                <li>Admissions-style review</li>
              </ul>
            </div>
          </div>
        ) : null}

        {compareOpen && !loading && essay ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl border-2 border-black bg-white p-4 shadow-[0_8px_0_#000]">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GitCompare className="h-4 w-4" />
                  Compare versions
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setCompareOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                <select
                  value={compareLeftId || ""}
                  onChange={(event) => setCompareLeftId(Number(event.target.value))}
                  className="rounded-xl border border-black/20 bg-white px-2 py-2 text-sm"
                >
                  {versions.map((item) => (
                    <option key={`left-${item.id}`} value={item.id}>
                      v{item.version_number} {versionSuffix(item)}
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
                      v{item.version_number} {versionSuffix(item)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={compareMode === "side" ? "primary" : "outline"}
                    onClick={() => setCompareMode("side")}
                  >
                    Side by side
                  </Button>
                  <Button
                    size="sm"
                    variant={compareMode === "inline" ? "primary" : "outline"}
                    onClick={() => setCompareMode("inline")}
                  >
                    Inline
                  </Button>
                </div>
                <p className="text-xs text-black/60">Green = added text, Red = removed text.</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {compareLeftVersion && !compareLeftVersion.is_latest ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void restoreVersion(compareLeftVersion)}
                    disabled={creatingVersion}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Restore v{compareLeftVersion.version_number}</span>
                  </Button>
                ) : null}
                {compareRightVersion && !compareRightVersion.is_latest ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void restoreVersion(compareRightVersion)}
                    disabled={creatingVersion}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Restore v{compareRightVersion.version_number}</span>
                  </Button>
                ) : null}
              </div>
              <div className="mt-3 max-h-[60vh] space-y-2 overflow-auto rounded-xl border border-black/10 bg-white p-3 text-xs">
                {compareLoading ? <p className="text-black/60">Loading diff...</p> : null}
                {compareMode === "side" ? (
                  <div className="grid grid-cols-[1fr_1fr] gap-2">
                    <div className="rounded-lg border border-black/10 bg-black/[0.02] px-2 py-1 font-semibold">OLD VERSION</div>
                    <div className="rounded-lg border border-black/10 bg-black/[0.02] px-2 py-1 font-semibold">NEW VERSION</div>
                    {compareDisplayRows.map((row, index) => {
                      if (row.kind === "ellipsis") {
                        return (
                          <div key={`diff-${index}`} className="col-span-2 rounded-lg border border-black/10 px-2 py-1 text-black/55">
                            ... {row.unchangedCount} lines unchanged ...
                          </div>
                        );
                      }
                      return (
                        <div key={`diff-${index}`} className="contents">
                          <div
                            className={`rounded-lg border px-2 py-1 ${
                              row.kind === "removed" || row.kind === "changed"
                                ? "border-rose-300 bg-rose-50"
                                : "border-black/10 bg-white"
                            }`}
                          >
                            {row.left || <span className="text-black/35">(empty)</span>}
                          </div>
                          <div
                            className={`rounded-lg border px-2 py-1 ${
                              row.kind === "added" || row.kind === "changed"
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-black/10 bg-white"
                            }`}
                          >
                            {row.right || <span className="text-black/35">(empty)</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {compareDisplayRows.map((row, index) => {
                      if (row.kind === "ellipsis") {
                        return (
                          <div key={`diff-inline-${index}`} className="rounded-lg border border-black/10 px-2 py-1 text-black/55">
                            ... {row.unchangedCount} lines unchanged ...
                          </div>
                        );
                      }
                      if (row.kind === "same") {
                        return (
                          <div key={`diff-inline-${index}`} className="rounded-lg border border-black/10 bg-white px-2 py-1 text-black/70">
                            {row.right || "(empty)"}
                          </div>
                        );
                      }
                      if (row.kind === "added") {
                        return (
                          <div key={`diff-inline-${index}`} className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1">
                            <span className="mr-1 font-semibold text-emerald-700">+</span>
                            {row.right || "(empty)"}
                          </div>
                        );
                      }
                      if (row.kind === "removed") {
                        return (
                          <div key={`diff-inline-${index}`} className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-1">
                            <span className="mr-1 font-semibold text-rose-700">-</span>
                            {row.left || "(empty)"}
                          </div>
                        );
                      }
                      return (
                        <div key={`diff-inline-${index}`} className="space-y-1 rounded-lg border border-black/10 bg-white px-2 py-2">
                          <div className="rounded border border-rose-300 bg-rose-50 px-2 py-1">
                            <span className="mr-1 font-semibold text-rose-700">-</span>
                            {markChangedWords(row.left || "(empty)", row.right || "")}
                          </div>
                          <div className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1">
                            <span className="mr-1 font-semibold text-emerald-700">+</span>
                            {markChangedWords(row.right || "(empty)", row.left || "")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {createVersionOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
              onSubmit={async (event) => {
                const ok = await createVersion(event);
                if (ok) setCreateVersionOpen(false);
              }}
              className="w-full max-w-md rounded-2xl border-2 border-black bg-white p-4 shadow-[0_8px_0_#000]"
            >
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">Create new version</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={() => setCreateVersionOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 grid gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-black/60">
                  Version label
                  <input
                    value={newVersionLabel}
                    onChange={(event) => setNewVersionLabel(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm"
                    placeholder="Revision label"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-black/60">
                  Version status
                  <select
                    className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm"
                    value={newVersionStatus}
                    onChange={(event) => setNewVersionStatus(event.target.value as EssayVersion["status"])}
                  >
                    <option value="draft">draft</option>
                    <option value="revised">revised</option>
                    <option value="ai_improved">ai_improved</option>
                    <option value="final">final</option>
                  </select>
                </label>
                <Button type="submit" disabled={creatingVersion}>
                  {creatingVersion ? <Spinner size="sm" /> : null}
                  <span>{creatingVersion ? "Creating..." : "Create version"}</span>
                </Button>
              </div>
            </form>
          </div>
        ) : null}

        <ConfirmDialog
          open={Boolean(deleteConfirmVersion)}
          title="Delete version"
          description={
            deleteConfirmVersion
              ? `Remove v${deleteConfirmVersion.version_number} ${versionSuffix(deleteConfirmVersion)} from this essay history.`
              : ""
          }
          note="This deletes only the selected version. Other versions stay unchanged."
          confirmLabel="Delete version"
          cancelLabel="Cancel"
          tone="warning"
          confirmIcon={<Trash2 className="h-4 w-4" />}
          confirmDisabled={creatingVersion || versions.length <= 1}
          onCancel={() => setDeleteConfirmVersionId(null)}
          onConfirm={() => {
            if (!deleteConfirmVersion) return;
            void deleteVersion(deleteConfirmVersion);
          }}
        />

        {statusText ? <p className="mt-4 text-sm text-black/65">{statusText}</p> : null}
      </AppShell>
    </ProtectedPage>
  );
}
