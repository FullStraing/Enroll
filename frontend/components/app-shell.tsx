"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  UserRoundCheck,
  GraduationCap,
  Medal,
  CalendarDays,
  FolderKanban,
  FileText,
  Settings,
  Home,
  Users2,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Onboarding", icon: UserRoundCheck },
  { href: "/universities", label: "Universities", icon: GraduationCap },
  { href: "/activities", label: "Activities", icon: Medal },
  { href: "/calendar", label: "Tasks", icon: CalendarDays },
  { href: "/community", label: "Community", icon: Users2 },
  { href: "/documents", label: "Documents", icon: FolderKanban },
  { href: "/essays", label: "Essays", icon: FileText },
  { href: "/common-app", label: "Common App", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];
const sidebarStorageKey = "enroll_sidebar_collapsed";
const landingItem = { href: "/", label: "Landing", icon: Home };

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveActiveHref(pathname: string) {
  const matched = nav.find((item) => isActivePath(pathname, item.href));
  if (matched) return matched.href;
  return isActivePath(pathname, landingItem.href) ? landingItem.href : null;
}

function buildLocalDateTime(now: Date) {
  const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);

  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(now);

  return { dateLabel, timeLabel, timeZone };
}

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
  const [localDateTime, setLocalDateTime] = useState(() => buildLocalDateTime(new Date()));
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const navTimerRef = useRef<number | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const navItemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const indicatorEnableFrameRef = useRef<number | null>(null);
  const [activeIndicator, setActiveIndicator] = useState<{ top: number; height: number; visible: boolean }>({
    top: 0,
    height: 0,
    visible: false,
  });
  const [indicatorTransitionEnabled, setIndicatorTransitionEnabled] = useState(false);

  const name = profile?.full_name || profile?.username || profile?.email || "User";
  const activeNavHref = navigatingTo ?? resolveActiveHref(pathname);

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(sidebarStorageKey, next ? "1" : "0");
      return next;
    });
  }

  useEffect(() => {
    setMobileMenuOpen(false);
    setNavigatingTo(null);
    setIndicatorTransitionEnabled(false);
    if (navTimerRef.current) {
      window.clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) {
        window.clearTimeout(navTimerRef.current);
      }
      if (indicatorEnableFrameRef.current) {
        window.cancelAnimationFrame(indicatorEnableFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      };
    }

    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, [mobileMenuOpen, pathname]);

  useEffect(() => {
    const update = () => setLocalDateTime(buildLocalDateTime(new Date()));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateIndicator = () => {
      if (!activeNavHref || !navRef.current) {
        setActiveIndicator((prev) =>
          prev.visible ? { top: prev.top, height: prev.height, visible: false } : prev,
        );
        return;
      }

      const activeItem = navItemRefs.current[activeNavHref];
      if (!activeItem) return;

      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const nextTop = activeItem.offsetTop;
      const nextHeight = itemRect.height;

      setActiveIndicator((prev) => {
        if (
          prev.visible &&
          Math.abs(prev.top - nextTop) < 1 &&
          Math.abs(prev.height - nextHeight) < 1
        ) {
          return prev;
        }

        return { top: nextTop, height: nextHeight, visible: true };
      });

      if (!indicatorTransitionEnabled) {
        if (indicatorEnableFrameRef.current) {
          window.cancelAnimationFrame(indicatorEnableFrameRef.current);
        }
        indicatorEnableFrameRef.current = window.requestAnimationFrame(() => {
          setIndicatorTransitionEnabled(true);
          indicatorEnableFrameRef.current = null;
        });
      }
    };

    const frame = window.requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", updateIndicator);
    return () => {
      window.cancelAnimationFrame(frame);
      if (indicatorEnableFrameRef.current) {
        window.cancelAnimationFrame(indicatorEnableFrameRef.current);
        indicatorEnableFrameRef.current = null;
      }
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeNavHref, collapsed, mobileMenuOpen, indicatorTransitionEnabled]);

  function navigateWithTransition(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (pathname === href) {
      setMobileMenuOpen(false);
      return;
    }

    if (navTimerRef.current) {
      window.clearTimeout(navTimerRef.current);
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMobileMenuOpen(false);

    if (prefersReducedMotion) {
      router.push(href);
      return;
    }

    setNavigatingTo(href);
    navTimerRef.current = window.setTimeout(() => {
      router.push(href);
    }, 150);
  }

  return (
    <div
      className={`theme-home mx-auto mb-24 grid max-w-[1500px] grid-cols-1 items-start gap-4 px-4 py-4 pb-12 sm:mb-28 sm:gap-6 sm:px-6 sm:py-6 sm:pb-14 ${
        collapsed ? "lg:grid-cols-[92px_1fr]" : "lg:grid-cols-[260px_1fr]"
      } lg:transition-[grid-template-columns] lg:duration-300 lg:ease-in-out`}
    >
      <button
        type="button"
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        className="fixed left-3 top-3 z-50 rounded-xl border-2 border-black bg-white p-2 shadow-[0_4px_0_rgba(0,0,0,0.08)] lg:hidden"
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
        className={`glass glass-soft z-50 rounded-3xl p-4 transition-all duration-300 ease-in-out ${
          mobileMenuOpen
            ? "fixed inset-y-3 left-3 w-[min(320px,calc(88vw))] overflow-y-auto overscroll-contain"
            : "hidden"
        } lg:sticky lg:top-6 lg:block lg:h-fit lg:w-auto`}
      >
          <div className="mb-4 grid gap-3 lg:hidden">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-3 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Image src="/brand/logo-mark.svg" alt="Enroll" width={20} height={20} className="h-6 w-6 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-black">Enroll</p>
                  <p className="truncate text-[11px] uppercase tracking-[0.16em] text-black/45">Admissions OS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl border-2 border-black bg-white p-2"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white px-3 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#DAF5F0] text-sm font-bold text-black">
                  {name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-black">{name}</p>
                  <p className="truncate text-xs text-black/45">{profile?.email || "Enroll workspace"}</p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-black/10 bg-[#FFF4CC] px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">{localDateTime.dateLabel}</p>
                <p className="mt-1 text-sm font-semibold text-black">{localDateTime.timeLabel}</p>
              </div>
            </div>
          </div>

          <div className={`mb-4 hidden items-center gap-2 lg:flex ${collapsed ? "justify-center" : "justify-between"}`}>
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
                    <Image src="/brand/logo-mark.svg" alt="Enroll" width={20} height={20} className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-bold">Enroll</span>
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

          <nav ref={navRef} className="relative grid gap-2">
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute left-0 right-0 rounded-xl border-2 border-black bg-[#FFDB58] shadow-[0_2px_0_rgba(0,0,0,0.08)] ${
                indicatorTransitionEnabled
                  ? "transition-[transform,height,opacity] duration-200 ease-out"
                  : "transition-none"
              } ${
                activeIndicator.visible ? "opacity-100" : "opacity-0"
              }`}
              style={{
                transform: `translateY(${activeIndicator.top}px)`,
                height: activeIndicator.height,
              }}
            />
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(event) => navigateWithTransition(event, item.href)}
                ref={(node) => {
                  navItemRefs.current[item.href] = node;
                }}
                title={item.label}
                className={`relative z-10 rounded-xl border-2 border-transparent px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                  activeNavHref === item.href
                    ? "text-black"
                    : navigatingTo === item.href
                      ? "text-black"
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
              onClick={(event) => navigateWithTransition(event, "/")}
              ref={(node) => {
                navItemRefs.current[landingItem.href] = node;
              }}
              title="Landing"
              className={`relative z-10 mt-3 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                activeNavHref === landingItem.href
                  ? "border-transparent text-black"
                  : "border-2 border-black text-black/75 hover:bg-black/5 hover:text-black"
              } ${
                collapsed ? "flex items-center justify-center px-0" : "flex items-center gap-2"
              }`}
            >
              <Home className="h-4 w-4 shrink-0" />
              {!collapsed ? "Landing" : null}
            </Link>
          </nav>

          <div className="mt-4 lg:hidden">
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="w-full rounded-xl border-2 border-black bg-[#FFDB58] px-3 py-2 text-sm font-semibold hover:-translate-y-0.5"
            >
              Выйти
            </button>
          </div>
      </aside>

      <section className="glass glass-soft rounded-3xl p-4 pt-14 sm:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-black/80 pb-4 pl-10 sm:pl-0">
          <div>
            <h1 className="text-2xl font-black">{title}</h1>
            <p className="text-sm text-black/65">{subtitle}</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span
              className="rounded-xl border-2 border-black bg-white px-3 py-1.5 text-sm font-semibold leading-tight"
              title={localDateTime.timeZone}
            >
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45">
                {localDateTime.dateLabel}
              </span>
              <span className="block text-sm font-semibold text-black">{localDateTime.timeLabel}</span>
            </span>
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
          <div className="flex items-center gap-2 sm:hidden">
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-black/10 bg-[#DAF5F0] px-3 text-sm font-bold text-black">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}
