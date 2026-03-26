"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Send, Users2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { Skeleton } from "@/components/ui/skeleton";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { CommunityGroupSummary, CommunityPost } from "@/app/community/types";
import { RuntimeNotice } from "@/components/runtime-notice";
import { fetchRuntimeConfig, type RuntimeConfig } from "@/lib/runtime-config";

const TAGS = [
  { value: "", label: "General" },
  { value: "essay", label: "Essay" },
  { value: "visa", label: "Visa" },
  { value: "financial_aid", label: "Financial Aid" },
  { value: "documents", label: "Documents" },
  { value: "deadlines", label: "Deadlines" },
] as const;

const TAG_STYLES: Record<string, string> = {
  "": "bg-white text-black/60 border-black/10",
  essay: "bg-[#FFF4CC] text-black border-black/10",
  visa: "bg-[#DAF5F0] text-black border-black/10",
  financial_aid: "bg-[#F8D6B3] text-black border-black/10",
  documents: "bg-[#FFF9E8] text-black border-black/10",
  deadlines: "bg-white text-black/70 border-black/10",
};

function formatMessageTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function RoomSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4 grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-black/10 p-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
        <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
        <div className="mt-4 grid gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-black/10 p-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const [rooms, setRooms] = useState<CommunityGroupSummary[]>([]);
  const [activeRoomSlug, setActiveRoomSlug] = useState<string>("");
  const [messages, setMessages] = useState<CommunityPost[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedTag, setSelectedTag] = useState<(typeof TAGS)[number]["value"]>("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | null>(null);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.slug === activeRoomSlug) ?? null,
    [rooms, activeRoomSlug],
  );

  async function loadRooms() {
    const token = getToken();
    if (!token) return;
    setLoadingRooms(true);
    try {
      const data = await apiFetch<CommunityGroupSummary[]>(
        "/api/community/groups/?group_type=country&chat_only=1",
        { method: "GET" },
        token,
      );
      setRooms(data);
      setActiveRoomSlug((current) => current || data.find((room) => room.slug === "central-asia-applicants")?.slug || data[0]?.slug || "");
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Could not load chat rooms.");
    } finally {
      setLoadingRooms(false);
    }
  }

  async function loadMessages(slug: string) {
    const token = getToken();
    if (!token || !slug) return;
    setLoadingMessages(true);
    try {
      const data = await apiFetch<CommunityPost[]>(`/api/community/groups/${slug}/posts/`, { method: "GET" }, token);
      setMessages([...data].reverse());
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Could not load room messages.");
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    void loadRooms();
  }, []);

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
    if (activeRoomSlug) {
      void loadMessages(activeRoomSlug);
    }
  }, [activeRoomSlug]);

  async function ensureMembership(slug: string) {
    const token = getToken();
    if (!token) return;
    const room = rooms.find((item) => item.slug === slug);
    if (!room || room.is_member) return;
    await apiFetch(`/api/community/groups/${slug}/join/`, { method: "POST" }, token);
    setRooms((current) =>
      current.map((item) =>
        item.slug === slug
          ? { ...item, is_member: true, member_count: item.member_count + 1 }
          : item,
      ),
    );
  }

  async function sendMessage() {
    if (runtimeConfig?.features.community_posting_enabled === false) {
      setStatusText("Community posting is temporarily unavailable.");
      return;
    }
    const token = getToken();
    if (!token || !activeRoomSlug) return;
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      await ensureMembership(activeRoomSlug);
      const created = await apiFetch<CommunityPost>(
        `/api/community/groups/${activeRoomSlug}/posts/`,
        {
          method: "POST",
          body: JSON.stringify({
            body,
            tag: selectedTag,
            post_type: "question",
          }),
        },
        token,
      );
      setMessages((current) => [...current, created]);
      setRooms((current) =>
        current.map((room) =>
          room.slug === activeRoomSlug ? { ...room, post_count: room.post_count + 1 } : room,
        ),
      );
      setDraft("");
      setSelectedTag("");
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Applicants Chat" subtitle="One live space to ask, update, and help each other.">
        {runtimeConfig?.features.community_posting_enabled === false ? (
          <div className="mb-4">
            <RuntimeNotice message="Community posting is temporarily unavailable. You can still read the room while we stabilize moderation or infrastructure." />
          </div>
        ) : null}
        {loadingRooms ? (
          <RoomSkeleton />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF4CC]">
                  <Users2 className="h-4 w-4 text-black" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-black">Rooms</h2>
                  <p className="text-sm text-black/55">Start simple. Keep it active.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {rooms.map((room) => {
                  const isActive = room.slug === activeRoomSlug;
                  return (
                    <button
                      key={room.slug}
                      type="button"
                      onClick={() => setActiveRoomSlug(room.slug)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-black bg-[#FFDB58] shadow-[0_4px_0_rgba(0,0,0,0.08)]"
                          : "border-black/10 bg-white hover:-translate-y-0.5 hover:border-black/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-black">{room.title}</p>
                          <p className="mt-1 text-xs text-black/60">{room.description}</p>
                        </div>
                        <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs font-semibold text-black/65">
                          {room.member_count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="rounded-2xl border border-black/10 bg-white p-4">
              {activeRoom ? (
                <div className="flex h-full min-h-[72vh] flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-black" />
                        <h2 className="text-2xl font-black text-black">{activeRoom.title}</h2>
                      </div>
                      <p className="mt-1 text-sm text-black/60">{activeRoom.member_count} participants</p>
                    </div>
                    <div className="rounded-full border border-black/10 bg-[#DAF5F0] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/70">
                      Applicants chat
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-black/10 bg-[#DAF5F0]/20 px-4 py-3 text-sm text-black/70">
                    <span className="font-semibold text-black">Pinned:</span>{" "}
                    {activeRoom.pinned_prompt || "Представьтесь и напишите, на какой вы стадии поступления."}
                  </div>

                  <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-black/10 bg-[#FFFDFC] p-3">
                    {loadingMessages ? (
                      <div className="grid gap-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <div key={index} className="rounded-2xl border border-black/10 bg-white p-4">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="mt-2 h-4 w-full" />
                            <Skeleton className="mt-2 h-4 w-3/4" />
                          </div>
                        ))}
                      </div>
                    ) : messages.length ? (
                      <div className="grid gap-3">
                        {messages.map((message) => (
                          <article key={message.id} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-black">{message.author.display_name}</span>
                              <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/55">
                                {message.author.status_badge}
                              </span>
                              {message.tag ? (
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TAG_STYLES[message.tag]}`}
                                >
                                  {TAGS.find((tag) => tag.value === message.tag)?.label || message.tag}
                                </span>
                              ) : null}
                              <span className="ml-auto text-[11px] text-black/45">{formatMessageTime(message.created_at)}</span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/80">{message.body}</p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-6 text-sm text-black/60">
                        No messages yet. Start the room with a quick intro or one real admissions question.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
                    <div className="flex flex-wrap gap-2">
                      {TAGS.map((tag) => {
                        const active = selectedTag === tag.value;
                        return (
                          <button
                            key={tag.value || "general"}
                            type="button"
                            onClick={() => setSelectedTag(tag.value)}
                            disabled={runtimeConfig?.features.community_posting_enabled === false}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                              active
                                ? "border-black bg-[#FFDB58] text-black"
                                : "border-black/10 bg-white text-black/65 hover:border-black/30 hover:text-black"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="Write one useful message. Ask, update, or help someone."
                        rows={3}
                        className="min-h-[104px] flex-1 rounded-2xl border border-black/10 bg-[#FFFDFC] px-4 py-3 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black/30 disabled:cursor-not-allowed disabled:bg-black/[0.03]"
                        disabled={runtimeConfig?.features.community_posting_enabled === false || sending}
                      />
                      <button
                        type="button"
                        onClick={() => void sendMessage()}
                        disabled={runtimeConfig?.features.community_posting_enabled === false || sending || !draft.trim()}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#FFDB58] px-5 text-sm font-semibold text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:self-end"
                      >
                        <Send className="h-4 w-4" />
                        {sending ? "Sending..." : "Send"}
                      </button>
                    </div>
                    {statusText ? (
                      <p className="mt-3 text-sm text-black/55">{statusText}</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/15 bg-white p-6 text-sm text-black/60">
                  No chat rooms available yet.
                </div>
              )}
            </section>
          </div>
        )}
      </AppShell>
    </ProtectedPage>
  );
}
