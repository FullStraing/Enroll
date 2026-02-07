"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearTokens, getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/applications", label: "Universities" },
  { href: "/tasks", label: "Tasks" },
  { href: "/documents", label: "Documents" },
  { href: "/common-app", label: "Common App" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("User");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    apiFetch<{ full_name?: string; username?: string; email?: string }>("/api/auth/profile/", { method: "GET" }, token)
      .then((profile) => {
        const resolved = profile.full_name || profile.username || profile.email || "User";
        setName(resolved);
      })
      .catch(() => setName("User"));
  }, []);

  return (
    <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 gap-6 p-6 lg:grid-cols-[260px_1fr]">
      <aside className="glass rounded-3xl p-5">
        <Link href="/" className="mb-5 block">
          <img src="/icons/logo.svg" alt="ENROLL" className="h-auto w-36" />
        </Link>
        <nav className="grid gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-sm transition ${pathname === item.href ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/" className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white">
            Landing
          </Link>
        </nav>
      </aside>

      <section className="glass rounded-3xl p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-white/65">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">2026</span>
            <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/30 text-xs">
                {name.charAt(0).toUpperCase()}
              </span>
              {name}
            </span>
            <button
              onClick={() => {
                clearTokens();
                router.push("/");
              }}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Выйти
            </button>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}
