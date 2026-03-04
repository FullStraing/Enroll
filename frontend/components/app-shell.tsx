"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/applications", label: "Universities" },
  { href: "/ui-lab", label: "UI Lab" },
  { href: "/calendar", label: "Calendar" },
  { href: "/documents", label: "Documents" },
  { href: "/essays", label: "Essays" },
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
  const { profile, logout } = useAuth();

  const name = profile?.full_name || profile?.username || profile?.email || "User";

  return (
    <div className="theme-home mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 gap-6 p-6 lg:grid-cols-[260px_1fr]">
      <aside className="glass rounded-3xl p-5">
        <Link href="/" className="mb-5 block">
          <img src="/icons/logo.svg" alt="ENROLL" className="h-auto w-36 rounded-lg border-2 border-black bg-white p-1" />
        </Link>
        <nav className="grid gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${pathname === item.href ? "bg-[#FFDB58] text-black border-2 border-black" : "text-black/75 hover:bg-black/5 hover:text-black"}`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/" className="mt-3 rounded-xl border-2 border-black px-3 py-2 text-sm font-semibold text-black/75 hover:bg-black/5 hover:text-black">
            Landing
          </Link>
        </nav>
      </aside>

      <section className="glass rounded-3xl p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-black/80 pb-4">
          <div>
            <h1 className="text-2xl font-black">{title}</h1>
            <p className="text-sm text-black/65">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border-2 border-black bg-white px-3 py-1.5 text-sm font-semibold">2026</span>
            <span className="rounded-xl border-2 border-black bg-white px-3 py-1.5 text-sm font-semibold">
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#DAF5F0] text-xs">
                {name.charAt(0).toUpperCase()}
              </span>
              {name}
            </span>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="rounded-xl border-2 border-black bg-[#FFDB58] px-3 py-1.5 text-sm font-semibold hover:-translate-y-0.5"
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
