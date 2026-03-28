"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { getToken, hasStoredAccessToken } from "@/lib/auth";

function accountLabel(name?: string, username?: string) {
  return (name || username || "Account").trim();
}

function useLandingAccountState(initialHasSession: boolean) {
  const { status, profile } = useAuth();
  const [hasStoredToken] = useState(() => hasStoredAccessToken());

  useEffect(() => {
    if (!hasStoredToken) return;
    getToken();
  }, [hasStoredToken]);

  const hasAccount = status === "authenticated" || hasStoredToken || (status === "loading" && initialHasSession);

  return { hasAccount, profile };
}

function resolveAppHref(hasAccount: boolean, fallbackHref: string) {
  return hasAccount ? "/dashboard" : fallbackHref;
}

export function LandingPrimaryLink({
  fallbackHref,
  initialHasSession,
  className,
  style,
  children,
}: {
  fallbackHref: string;
  initialHasSession: boolean;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { hasAccount } = useLandingAccountState(initialHasSession);

  return (
    <Link href={resolveAppHref(hasAccount, fallbackHref)} className={className} style={style}>
      {children}
    </Link>
  );
}

export function LandingAuthActions({
  initialHasSession,
  primaryHref,
}: {
  initialHasSession: boolean;
  primaryHref: string;
}) {
  const { hasAccount, profile } = useLandingAccountState(initialHasSession);
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
      <LandingPrimaryLink
        fallbackHref={primaryHref}
        initialHasSession={initialHasSession}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-black px-5 py-2 text-sm font-black transition hover:-translate-y-0.5 hover:shadow-[0_4px_0_#000]"
        style={{ backgroundColor: "#FFDB58" }}
      >
        Начать
        <ArrowRight className="h-4 w-4" />
      </LandingPrimaryLink>
    </div>
  );
}
