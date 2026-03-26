"use client";

import { useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const POST_TYPE_OPTIONS = [
  { value: "question", label: "Question" },
  { value: "experience", label: "Experience" },
  { value: "guide", label: "Guide" },
  { value: "accepted_profile", label: "Accepted profile" },
  { value: "deadline_update", label: "Deadline update" },
] as const;

const POST_TYPE_HINTS: Record<string, string> = {
  question: "What are you stuck on right now?",
  experience: "What worked or failed for you that others should know?",
  guide: "Share a reusable process, checklist, or framework.",
  accepted_profile: "Share the context behind an admit result, not private data.",
  deadline_update: "Post concrete changes or reminders people can act on.",
};

export function CommunityPostComposer({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (payload: { post_type: string; title: string; body: string }) => Promise<void>;
}) {
  const [postType, setPostType] = useState<string>("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const helper = useMemo(() => POST_TYPE_HINTS[postType] || POST_TYPE_HINTS.question, [postType]);

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    await onSubmit({ post_type: postType, title: title.trim(), body: body.trim() });
    setTitle("");
    setBody("");
    setPostType("question");
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div className="min-w-[220px] md:max-w-[240px]">
            <Select
              value={postType}
              onChange={setPostType}
              options={POST_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              ariaLabel="Post type"
              className="border border-black/10 text-sm font-semibold"
            />
          </div>
          <p className="text-sm text-black/60">{helper}</p>
        </div>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title your post clearly"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black/25"
        />

        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Share your question or insight in a way other applicants can reuse."
          rows={5}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black/25"
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-black/50">Admissions-only. Keep it specific, useful, and respectful.</p>
          <Button size="sm" onClick={() => void handleSubmit()} disabled={saving || !title.trim() || !body.trim()}>
            {saving ? "Posting..." : "Post to group"}
          </Button>
        </div>
      </div>
    </div>
  );
}
