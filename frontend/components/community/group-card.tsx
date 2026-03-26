"use client";

import Link from "next/link";
import { Users, BookOpen, CalendarClock, GraduationCap } from "lucide-react";
import type { CommunityGroupSummary } from "@/app/community/types";
import { Badge } from "@/components/ui/badge";

function iconForGroupType(type: CommunityGroupSummary["group_type"]) {
  if (type === "country") return Users;
  if (type === "university") return GraduationCap;
  if (type === "intake") return CalendarClock;
  return BookOpen;
}

export function CommunityGroupCard({
  group,
  actionLabel = "Open group",
  actionHref,
}: {
  group: CommunityGroupSummary;
  actionLabel?: string;
  actionHref?: string;
}) {
  const Icon = iconForGroupType(group.group_type);

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#DAF5F0]">
            <Icon className="h-4 w-4 text-black/70" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-black">{group.title}</h3>
            <p className="mt-1 text-sm text-black/60">{group.description}</p>
          </div>
        </div>
        <Badge variant={group.is_member ? "cyan" : "default"}>{group.is_member ? "Joined" : "Suggested"}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-black/55">
        <span>{group.member_count} members</span>
        <span>•</span>
        <span>{group.post_count} posts</span>
      </div>

      {group.audience ? <p className="mt-3 text-sm text-black/70">{group.audience}</p> : null}

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={actionHref || `/community/groups/${group.slug}`}
          className="inline-flex h-9 items-center justify-center rounded-xl border-2 border-black bg-[#FFDB58] px-3 text-sm font-semibold text-black transition hover:-translate-y-0.5"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}
