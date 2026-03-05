"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  UserRoundCheck,
  GraduationCap,
  FlaskConical,
  CalendarDays,
  FolderKanban,
  FileText,
  Settings,
  Home,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Onboarding", icon: UserRoundCheck },
  { href: "/applications", label: "Universities", icon: GraduationCap },
  { href: "/ui-lab", label: "UI Lab", icon: FlaskConical },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/documents", label: "Documents", icon: FolderKanban },
  { href: "/essays", label: "Essays", icon: FileText },
  { href: "/common-app", label: "Common App", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];
const sidebarStorageKey = "enroll_sidebar_collapsed";

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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(sidebarStorageKey) === "1";
  });

  const name = profile?.full_name || profile?.username || profile?.email || "User";

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
      } lg:transition-[grid-template-columns] lg:duration-300 lg:ease-in-out`}
    >
      <aside className="glass sticky top-6 h-fit rounded-3xl p-4 transition-all duration-300 ease-in-out">
          <div className="mb-4 flex items-center justify-between gap-2">
            {collapsed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="h-12 w-12 px-0"
                aria-label="Expand menu"
                title="Expand menu"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </Button>
            ) : (
              <>
                <Link href="/" className="block">
                  <div className="flex h-12 w-36 items-center gap-2 rounded-lg border-2 border-black bg-white px-3 transition-all duration-300 ease-in-out">
                    <GraduationCap className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-bold">Enroll AI</span>
                  </div>
                </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="relative h-8 w-8 overflow-hidden px-0"
                aria-label="Collapse menu"
                title="Collapse menu"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
              </>
            )}
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
                } ${collapsed ? "flex items-center justify-center px-0" : "flex items-center gap-2"}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed ? (
                  <span className="inline-block transition-all duration-200 ease-out">{item.label}</span>
                ) : null}
              </Link>
            ))}
            <Link
              href="/"
              title="Landing"
              className={`mt-3 rounded-xl border-2 border-black px-3 py-2 text-sm font-semibold text-black/75 hover:bg-black/5 hover:text-black ${
                collapsed ? "flex items-center justify-center px-0" : "flex items-center gap-2"
              }`}
            >
              <Home className="h-4 w-4 shrink-0" />
              {!collapsed ? "Landing" : null}
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
