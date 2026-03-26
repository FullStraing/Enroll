"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { Skeleton } from "@/components/ui/skeleton";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { CommunityHomePayload } from "@/app/community/types";
import { CommunityGroupCard } from "@/components/community/group-card";
import { CommunityPostCard } from "@/components/community/post-card";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-xl font-black text-black">{title}</h2>
        <p className="mt-1 text-sm text-black/60">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-black/10 bg-white p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
          <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((__, innerIndex) => (
              <div key={innerIndex} className="rounded-2xl border border-black/10 p-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-4 h-9 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const [payload, setPayload] = useState<CommunityHomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");

  async function loadCommunity() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiFetch<CommunityHomePayload>("/api/community/home/", { method: "GET" }, token);
      setPayload(data);
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Could not load Community.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCommunity();
  }, []);

  return (
    <ProtectedPage>
      <AppShell title="Community" subtitle="Learn from students on the same admissions path.">
        {loading ? (
          <LoadingState />
        ) : (
          <div className="grid gap-4">
            <Section title="For your country" subtitle="Start with advice from applicants who share your context.">
              <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {(payload?.recommendations.country || []).map((group) => (
                  <CommunityGroupCard key={group.slug} group={group} />
                ))}
              </div>
            </Section>

            <div className="grid gap-4 xl:grid-cols-2">
              <Section title="For your universities" subtitle="University-specific groups connected to your shortlist.">
                <div className="grid gap-3">
                  {(payload?.recommendations.universities || []).length ? (
                    payload?.recommendations.universities.map((group) => <CommunityGroupCard key={group.slug} group={group} />)
                  ) : (
                    <div className="rounded-2xl border border-dashed border-black/15 bg-[#FFF9E8] p-4 text-sm text-black/60">
                      Add more universities to your shortlist to unlock better university-specific groups.
                    </div>
                  )}
                </div>
              </Section>

              <Section title="For your intake" subtitle="Cycle-specific planning, pacing, and deadline context.">
                <div className="grid gap-3">
                  {(payload?.recommendations.intake || []).map((group) => (
                    <CommunityGroupCard key={group.slug} group={group} />
                  ))}
                </div>
              </Section>
            </div>

            <Section title="Essay / documents / visa topics" subtitle="Jump into the tactical groups most students need.">
              <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
                {(payload?.recommendations.topics || []).map((group) => (
                  <CommunityGroupCard key={group.slug} group={group} actionLabel="Open topic" />
                ))}
              </div>
            </Section>

            <div className="grid gap-4 xl:grid-cols-2">
              <Section title="Questions from your path" subtitle="Recent questions from the groups most relevant to you.">
                <div className="grid gap-3">
                  {(payload?.questions_from_path || []).length ? (
                    payload?.questions_from_path.map((post) => <CommunityPostCard key={post.id} post={post} />)
                  ) : (
                    <div className="rounded-2xl border border-dashed border-black/15 bg-[#DAF5F0]/20 p-4 text-sm text-black/60">
                      No questions yet. Join a group and be the first one to ask.
                    </div>
                  )}
                </div>
              </Section>

              <Section title="Accepted student insights" subtitle="Experience and guide posts worth reading before you copy anyone’s path blindly.">
                <div className="grid gap-3">
                  {(payload?.accepted_insights || []).length ? (
                    payload?.accepted_insights.map((post) => <CommunityPostCard key={post.id} post={post} />)
                  ) : (
                    <div className="rounded-2xl border border-dashed border-black/15 bg-[#FFF9E8] p-4 text-sm text-black/60">
                      No insight posts yet. This section will fill as students share what actually worked.
                    </div>
                  )}
                </div>
              </Section>
            </div>

            <Section title="Saved posts" subtitle="Keep the advice you want to revisit without turning Community into a noisy feed.">
              {(payload?.saved_posts || []).length ? (
                <div className="grid gap-3">
                  {payload?.saved_posts.map((post) => <CommunityPostCard key={post.id} post={post} />)}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/15 bg-white p-4 text-sm text-black/60">
                  You have not saved any posts yet. Use Save inside a group to keep useful threads here.
                </div>
              )}
            </Section>

            {statusText ? (
              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/60">{statusText}</div>
            ) : null}

            <div className="flex justify-end">
              <Link
                href="/community/groups/essay-help"
                className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-black bg-[#DAF5F0] px-4 text-sm font-semibold text-black transition hover:-translate-y-0.5"
              >
                Open Essay Help
              </Link>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedPage>
  );
}
