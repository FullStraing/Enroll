"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

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
  const [collapsed, setCollapsed] = useState(false);
  const sidebarStorageKey = "enroll_sidebar_collapsed";

  const name = profile?.full_name || profile?.username || profile?.email || "User";

  useEffect(() => {
    const saved = window.localStorage.getItem(sidebarStorageKey);
    setCollapsed(saved === "1");
  }, []);

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(sidebarStorageKey, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div
      className={`theme-home mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 items-start gap-6 p-6 ${
        collapsed ? "lg:grid-cols-[92px_1fr]" : "lg:grid-cols-[260px_1fr]"
      }`}
    >
      <aside className="glass sticky top-6 h-fit rounded-3xl p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link href="/" className="block">
            <img
              src="/icons/logo.svg"
              alt="ENROLL"
              className={`h-auto rounded-lg border-2 border-black bg-white p-1 ${
                collapsed ? "w-12" : "w-36"
              }`}
            />
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 px-0"
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="grid gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                pathname === item.href
                  ? "bg-[#FFDB58] text-black border-2 border-black"
                  : "text-black/75 hover:bg-black/5 hover:text-black"
              }`}
            >
              {collapsed ? item.label.slice(0, 1) : item.label}
            </Link>
          ))}
          <Link
            href="/"
            title="Landing"
            className="mt-3 rounded-xl border-2 border-black px-3 py-2 text-sm font-semibold text-black/75 hover:bg-black/5 hover:text-black"
          >
            {collapsed ? "L" : "Landing"}
          </Link>
        </nav>
      </aside>

      <section className="glass min-h-[calc(100vh-48px)] rounded-3xl p-6">
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
