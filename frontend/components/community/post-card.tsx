"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Flag, MessageSquare } from "lucide-react";
import type { CommunityPost } from "@/app/community/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function badgeLabel(postType: CommunityPost["post_type"]) {
  if (postType === "accepted_profile") return "Accepted profile";
  if (postType === "deadline_update") return "Deadline update";
  return postType[0].toUpperCase() + postType.slice(1);
}

export function CommunityPostCard({
  post,
  showGroupLink = true,
  onToggleSave,
  onReportPost,
  onReportComment,
  onCreateComment,
  onModeratePost,
}: {
  post: CommunityPost;
  showGroupLink?: boolean;
  onToggleSave?: (post: CommunityPost) => Promise<void>;
  onReportPost?: (postId: number) => Promise<void>;
  onReportComment?: (commentId: number) => Promise<void>;
  onCreateComment?: (postId: number, body: string) => Promise<void>;
  onModeratePost?: (postId: number, patch: Partial<Pick<CommunityPost, "is_pinned" | "status">>) => Promise<void>;
}) {
  const [commentBody, setCommentBody] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  async function handleCommentSubmit() {
    if (!onCreateComment || !commentBody.trim()) return;
    setSavingComment(true);
    try {
      await onCreateComment(post.id, commentBody.trim());
      setCommentBody("");
    } finally {
      setSavingComment(false);
    }
  }

  return (
    <article className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={post.is_pinned ? "primary" : "default"}>{post.is_pinned ? "Pinned" : badgeLabel(post.post_type)}</Badge>
            <span className="text-xs text-black/45">{new Date(post.updated_at).toLocaleDateString()}</span>
            {showGroupLink ? (
              <Link href={`/community/groups/${post.group_slug}`} className="text-xs font-semibold text-black/55 underline-offset-2 hover:text-black hover:underline">
                {post.group_title}
              </Link>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-black text-black">{post.title}</h3>
          <p className="mt-1 text-sm text-black/60">
            {post.author.display_name}
            {post.author.country ? ` · ${post.author.country}` : ""}
            {post.author.status_badge ? ` · ${post.author.status_badge}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {post.can_moderate && onModeratePost ? (
            <>
              <Button size="sm" variant="outline" onClick={() => void onModeratePost(post.id, { is_pinned: !post.is_pinned })}>
                {post.is_pinned ? "Unpin" : "Pin"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void onModeratePost(post.id, { status: post.status === "locked" ? "active" : "locked" })}
              >
                {post.status === "locked" ? "Unlock" : "Lock"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => void onModeratePost(post.id, { status: "hidden" })}>
                Hide
              </Button>
            </>
          ) : null}
          {onToggleSave ? (
            <Button size="sm" variant={post.is_saved ? "secondary" : "outline"} onClick={() => void onToggleSave(post)}>
              <Bookmark className="h-4 w-4" />
              {post.is_saved ? "Saved" : "Save"}
            </Button>
          ) : null}
          {onReportPost ? (
            <Button size="sm" variant="outline" onClick={() => void onReportPost(post.id)}>
              <Flag className="h-4 w-4" />
              Report
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-black/80">{post.body}</p>

      <div className="mt-4 flex items-center gap-2 text-xs text-black/50">
        <MessageSquare className="h-4 w-4" />
        <span>{post.comment_count} comments</span>
      </div>

      {post.comments.length ? (
        <div className="mt-4 space-y-3">
          {post.comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl border border-black/10 bg-[#FFF9E8] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{comment.author.display_name}</p>
                {onReportComment ? (
                  <button
                    type="button"
                    onClick={() => void onReportComment(comment.id)}
                    className="text-xs font-semibold text-black/45 hover:text-black"
                  >
                    Report
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-black/75">{comment.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      {onCreateComment ? (
        <div className="mt-4 rounded-2xl border border-black/10 bg-[#DAF5F0]/20 p-3">
          <textarea
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            rows={3}
            placeholder="Add a useful comment"
            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black/25"
          />
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => void handleCommentSubmit()} disabled={savingComment || !commentBody.trim()}>
              {savingComment ? "Posting..." : "Comment"}
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
