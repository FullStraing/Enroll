"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

function accountLabel(name?: string, username?: string) {
  return (name || username || "Account").trim();
}

export function LandingAuthActions({
  initialHasSession,
  primaryHref,
}: {
  initialHasSession: boolean;
  primaryHref: string;
}) {
  const { status, profile } = useAuth();
  const hasAccount = status === "authenticated" || (status === "loading" && initialHasSession);
  const label = accountLabel(profile?.full_name, profile?.username);
  const initial = label.charAt(0).toUpperCase() || "A";

  return (
    <div className="flex items-center gap-2">
      {hasAccount ? (
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-3 rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-black/15 bg-[#DAF5F0] text-xs font-black text-black">
            {initial}
          </span>
          <span className="max-w-[10rem] truncate">{label}</span>
        </Link>
      ) : (
        <Link href="/login" className="rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5">
          Войти
        </Link>
      )}
      <Link
        href={primaryHref}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-black px-5 py-2 text-sm font-black transition hover:-translate-y-0.5 hover:shadow-[0_4px_0_#000]"
        style={{ backgroundColor: "#FFDB58" }}
      >
        Начать
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
