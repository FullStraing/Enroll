"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { CommunityGroupPayload, CommunityPost, CommunityGroupDetail } from "@/app/community/types";
import { CommunityPostComposer } from "@/components/community/post-composer";
import { CommunityPostCard } from "@/components/community/post-card";
import { CommunityGroupCard } from "@/components/community/group-card";

function LoadingState() {
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-black/10 bg-white p-5">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-3 h-28 w-full rounded-2xl" />
          </div>
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-black/10 bg-white p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-3 h-16 w-full rounded-2xl" />
            </div>
          ))}
        </div>
        <div className="grid gap-4">
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-3 h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommunityGroupPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [payload, setPayload] = useState<CommunityGroupPayload | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");

  const loadGroup = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [groupData, postData] = await Promise.all([
        apiFetch<CommunityGroupPayload>(`/api/community/groups/${slug}/`, { method: "GET" }, token),
        apiFetch<CommunityPost[]>(`/api/community/groups/${slug}/posts/`, { method: "GET" }, token),
      ]);
      setPayload(groupData);
      setPosts(postData);
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Could not load group.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    void loadGroup();
  }, [slug, loadGroup]);

  async function joinOrLeave(join: boolean) {
    const token = getToken();
    if (!token || !payload) return;
    setSaving(true);
    try {
      await apiFetch<{ detail: string }>(
        `/api/community/groups/${slug}/${join ? "join" : "leave"}/`,
        { method: "POST" },
        token,
      );
      setPayload((prev) =>
        prev
          ? {
              ...prev,
              group: {
                ...prev.group,
                is_member: join,
                can_post: join,
                member_count: Math.max(0, prev.group.member_count + (join ? 1 : -1)),
              },
            }
          : prev,
      );
      setStatusText(join ? "Joined group." : "Left group.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Could not update membership.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreatePost(input: { post_type: string; title: string; body: string }) {
    const token = getToken();
    if (!token) return;
    const created = await apiFetch<CommunityPost>(
      `/api/community/groups/${slug}/posts/`,
      { method: "POST", body: JSON.stringify(input) },
      token,
    );
    setPosts((prev) => [created, ...prev]);
    setStatusText("Posted to group.");
  }

  async function handleToggleSave(post: CommunityPost) {
    const token = getToken();
    if (!token) return;
    if (post.is_saved) {
      await apiFetch(`/api/community/posts/${post.id}/save/`, { method: "DELETE" }, token);
    } else {
      await apiFetch(`/api/community/posts/${post.id}/save/`, { method: "POST" }, token);
    }
    setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, is_saved: !item.is_saved } : item)));
  }

  async function handleCreateComment(postId: number, body: string) {
    const token = getToken();
    if (!token) return;
    const created = await apiFetch<{ id: number; body: string; status: string; created_at: string; updated_at: string; author: CommunityPost["author"]; can_edit: boolean; can_moderate: boolean }>(
      `/api/community/posts/${postId}/comments/`,
      { method: "POST", body: JSON.stringify({ body }) },
      token,
    );
    setPosts((prev) =>
      prev.map((item) =>
        item.id === postId
          ? { ...item, comments: [...item.comments, created], comment_count: item.comment_count + 1 }
          : item,
      ),
    );
  }

  async function handleReport(targetType: "post" | "comment", targetId: number) {
    const token = getToken();
    if (!token) return;
    await apiFetch(
      "/api/community/reports/",
      { method: "POST", body: JSON.stringify({ target_type: targetType, target_id: targetId, reason: "other", notes: "" }) },
      token,
    );
    setStatusText("Report submitted.");
  }

  async function handleModeratePost(postId: number, patch: Partial<Pick<CommunityPost, "is_pinned" | "status">>) {
    const token = getToken();
    if (!token) return;
    const updated = await apiFetch<CommunityPost>(`/api/community/posts/${postId}/`, { method: "PATCH", body: JSON.stringify(patch) }, token);
    setPosts((prev) => prev.map((item) => (item.id === postId ? updated : item)).filter((item) => item.status !== "hidden"));
    setStatusText("Post updated.");
  }

  const group: CommunityGroupDetail | null = payload?.group || null;
  const pinnedIds = new Set((payload?.pinned_posts || []).map((post) => post.id));

  return (
    <ProtectedPage>
      <AppShell title="Community" subtitle="Groups, questions, and trusted admissions context.">
        {loading || !group ? (
          <LoadingState />
        ) : (
          <div className="grid gap-4">
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="cyan">{group.group_type}</Badge>
                    <Badge>{group.member_count} members</Badge>
                    <Badge>{group.post_count} posts</Badge>
                  </div>
                  <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-black">{group.title}</h1>
                  <p className="mt-2 text-sm text-black/65 sm:text-[15px]">{group.description}</p>
                  {group.audience ? <p className="mt-3 text-sm text-black/55">{group.audience}</p> : null}
                </div>
                <div className="flex gap-2">
                  <Button variant={group.is_member ? "outline" : "primary"} onClick={() => void joinOrLeave(!group.is_member)} disabled={saving}>
                    {saving ? "Working..." : group.is_member ? "Leave group" : "Join group"}
                  </Button>
                  <Link
                    href="/community"
                    className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-black bg-[#DAF5F0] px-4 text-sm font-semibold text-black transition hover:-translate-y-0.5"
                  >
                    Back to hub
                  </Link>
                </div>
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid gap-4">
                <section className="rounded-2xl border border-black/10 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-black">Pinned guidance</h2>
                      <p className="mt-1 text-sm text-black/60">Rules, resources, and useful posts for this group.</p>
                    </div>
                  </div>

                  {group.rules.length || group.resources.length ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-black/10 bg-[#DAF5F0]/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Rules</p>
                        <ul className="mt-3 space-y-2 text-sm text-black/70">
                          {group.rules.map((rule) => (
                            <li key={rule}>• {rule}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-black/10 bg-[#FFF9E8] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Resources</p>
                        <ul className="mt-3 space-y-2 text-sm text-black/70">
                          {group.resources.map((resource) => (
                            <li key={resource}>• {resource}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}

                  {payload?.pinned_posts.length ? (
                    <div className="mt-4 grid gap-3">
                      {payload.pinned_posts.map((post) => (
                        <CommunityPostCard
                          key={post.id}
                          post={post}
                          showGroupLink={false}
                          onToggleSave={handleToggleSave}
                          onReportPost={(postId) => handleReport("post", postId)}
                          onReportComment={(commentId) => handleReport("comment", commentId)}
                          onCreateComment={group.can_post ? handleCreateComment : undefined}
                          onModeratePost={handleModeratePost}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className="rounded-2xl border border-black/10 bg-white p-5">
                  <h2 className="text-xl font-black text-black">Post to this group</h2>
                  <p className="mt-1 text-sm text-black/60">Ask a question, share an experience, or leave a reusable guide.</p>
                  <div className="mt-4">
                    {group.can_post ? (
                      <CommunityPostComposer saving={saving} onSubmit={handleCreatePost} />
                    ) : (
                      <div className="rounded-2xl border border-dashed border-black/15 bg-[#FFF9E8] p-4 text-sm text-black/60">
                        Join this group first to create posts and comments.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-black/10 bg-white p-5">
                  <h2 className="text-xl font-black text-black">Recent discussions</h2>
                  <p className="mt-1 text-sm text-black/60">Structured questions and useful answers without a noisy global feed.</p>
                  <div className="mt-4 grid gap-3">
                    {posts.filter((post) => !pinnedIds.has(post.id)).length ? (
                      posts.filter((post) => !pinnedIds.has(post.id)).map((post) => (
                        <CommunityPostCard
                          key={post.id}
                          post={post}
                          showGroupLink={false}
                          onToggleSave={handleToggleSave}
                          onReportPost={(postId) => handleReport("post", postId)}
                          onReportComment={(commentId) => handleReport("comment", commentId)}
                          onCreateComment={group.can_post ? handleCreateComment : undefined}
                          onModeratePost={handleModeratePost}
                        />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-4 text-sm text-black/60">
                        No posts yet. The first high-quality question sets the tone for the whole group.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <aside className="grid gap-4">
                <section className="rounded-2xl border border-black/10 bg-white p-5">
                  <h3 className="text-lg font-black text-black">Top contributors</h3>
                  <div className="mt-4 grid gap-3">
                    {payload?.top_contributors.length ? (
                      payload.top_contributors.map((item) => (
                        <div key={`${item.profile.display_name}-${item.role}`} className="rounded-2xl border border-black/10 bg-[#DAF5F0]/15 p-4">
                          <p className="font-semibold text-black">{item.profile.display_name}</p>
                          <p className="mt-1 text-sm text-black/60">
                            {item.profile.country || "Admissions community"} · {item.profile.status_badge}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-black/45">
                            {item.role} · {item.posts_count} posts
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-black/55">Contributors will appear once people start posting here.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-black/10 bg-white p-5">
                  <h3 className="text-lg font-black text-black">Related groups</h3>
                  <div className="mt-4 grid gap-3">
                    {payload?.related_groups.map((item) => (
                      <CommunityGroupCard key={item.slug} group={item} actionLabel="Open" />
                    ))}
                  </div>
                </section>
              </aside>
            </div>

            {statusText ? (
              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/60">{statusText}</div>
            ) : null}
          </div>
        )}
      </AppShell>
    </ProtectedPage>
  );
}
