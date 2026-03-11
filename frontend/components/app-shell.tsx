"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UserRoundCheck,
  GraduationCap,
  FlaskConical,
  CalendarDays,
  FolderKanban,
  FileText,
  Settings,
  Home,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Onboarding", icon: UserRoundCheck },
  { href: "/universities", label: "Universities", icon: GraduationCap },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const name = profile?.full_name || profile?.username || profile?.email || "User";

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(sidebarStorageKey, next ? "1" : "0");
      return next;
    });
  }

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div
      className={`theme-home mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 items-start gap-4 p-3 sm:gap-6 sm:p-6 ${
        collapsed ? "lg:grid-cols-[92px_1fr]" : "lg:grid-cols-[260px_1fr]"
      } lg:transition-[grid-template-columns] lg:duration-300 lg:ease-in-out`}
    >
      <button
        type="button"
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        className="fixed left-3 top-3 z-50 rounded-xl border-2 border-black bg-white p-2 lg:hidden"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`glass glass-soft z-50 h-fit rounded-3xl p-4 transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "fixed inset-y-3 left-3 w-[280px] overflow-auto" : "hidden"
        } lg:sticky lg:top-6 lg:block lg:w-auto`}
      >
          <div className={`mb-4 flex items-center gap-2 ${collapsed ? "justify-center" : "justify-between"}`}>
            {collapsed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="relative h-9 w-9 overflow-hidden px-0"
                aria-label="Expand menu"
                title="Expand menu"
              >
                <Menu
                  className={`absolute h-4 w-4 transition-all duration-200 ${
                    collapsed ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
                  }`}
                />
                <X
                  className={`absolute h-4 w-4 transition-all duration-200 ${
                    collapsed ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                  }`}
                />
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
                className="relative h-9 w-9 overflow-hidden px-0"
                aria-label="Collapse menu"
                title="Collapse menu"
              >
                <Menu
                  className={`absolute h-4 w-4 transition-all duration-200 ${
                    collapsed ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
                  }`}
                />
                <X
                  className={`absolute h-4 w-4 transition-all duration-200 ${
                    collapsed ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                  }`}
                />
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

      <section className="glass glass-soft min-h-[calc(100vh-24px)] rounded-3xl p-4 sm:min-h-[calc(100vh-48px)] sm:p-6">
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
