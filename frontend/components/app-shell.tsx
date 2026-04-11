"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  FolderKanban,
  GraduationCap,
  Home,
  LayoutDashboard,
  Medal,
  Menu,
  Settings,
  UserRoundCheck,
  Users2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { EnrollWordmark } from "@/components/brand/enroll-wordmark";
import { useLocale, useMessages } from "@/components/locale-provider";
import { RuntimeNotice } from "@/components/runtime-notice";
import { Button } from "@/components/ui/button";
import { formatPlanLabel, getPlanBadgeClassName } from "@/lib/account-plan";
import { fetchRuntimeConfig, type RuntimeConfig } from "@/lib/runtime-config";
import { translateAppShellSubtitle, translateAppShellTitle } from "@/lib/i18n";

const nav = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/onboarding", key: "editProfile", icon: UserRoundCheck },
  { href: "/universities", key: "universities", icon: GraduationCap },
  { href: "/activities", key: "activities", icon: Medal },
  { href: "/calendar", key: "tasks", icon: CalendarDays },
  { href: "/community", key: "community", icon: Users2 },
  { href: "/documents", key: "documents", icon: FolderKanban },
  { href: "/essays", key: "essays", icon: FileText },
  { href: "/common-app", key: "commonApp", icon: FileText },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

const sidebarStorageKey = "enroll_sidebar_collapsed";

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
  subtitle?: string;
  children: React.ReactNode;
}) {
  const messages = useMessages();
  const { locale } = useLocale();
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
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | null>(null);
  const navTimerRef = useRef<number | null>(null);

  const translatedTitle = translateAppShellTitle(locale, title) ?? title;
  const translatedSubtitle = translateAppShellSubtitle(locale, subtitle);
  const name = profile?.full_name || profile?.username || profile?.email || messages.common.account;
  const planLabel = formatPlanLabel(profile?.account_plan);
  const planBadgeClassName = getPlanBadgeClassName(profile?.account_plan);
  const desktopDateTimeLabel = `${localDateTime.dateLabel} · ${localDateTime.timeLabel}`;
  const headerControlBaseClassName =
    "inline-flex h-11 shrink-0 items-center rounded-xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-3 text-sm font-semibold text-[var(--enroll-fg)]";

  const localizedNav = useMemo(
    () =>
      nav.map((item) => ({
        ...item,
        label: messages.shell.nav[item.key],
      })),
    [messages.shell.nav],
  );

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

  function navigateWithTransition(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
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
        className="fixed left-3 top-3 z-50 rounded-xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] p-2 shadow-[0_4px_0_var(--enroll-strong-shadow)] lg:hidden"
        aria-label={mobileMenuOpen ? messages.shell.closeMenu : messages.shell.openMenu}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label={messages.shell.closeOverlay}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
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
          <div className="flex items-center justify-between gap-3 px-2 py-1">
            <div className="min-w-0">
              <EnrollWordmark size="md" subtitle className="translate-y-[1px]" />
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] p-2"
              aria-label={messages.shell.closeMenu}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--enroll-cyan)] text-sm font-bold text-[var(--enroll-fg)]">
                {name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--enroll-fg)]">{name}</p>
                <p className="truncate text-xs text-[var(--enroll-muted)]">{profile?.email || messages.shell.workspaceFallback}</p>
              </div>
            </div>

            <div className="mt-3">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${planBadgeClassName}`}
              >
                {planLabel}
              </span>
            </div>

            <div className="mt-3 rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-yellow-soft)] px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--enroll-muted)]">{localDateTime.dateLabel}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--enroll-fg)]">{localDateTime.timeLabel}</p>
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
              aria-label={messages.shell.openMenu}
              title={messages.shell.openMenu}
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
                <div className="flex h-14 w-[172px] items-center px-1.5 transition-all duration-300 ease-in-out">
                  <EnrollWordmark size="md" className="translate-y-[1px]" />
                </div>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="relative h-9 w-9 overflow-hidden px-0"
                aria-label={messages.shell.closeMenu}
                title={messages.shell.closeMenu}
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
          {localizedNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => navigateWithTransition(event, item.href)}
              title={item.label}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                pathname === item.href
                  ? "border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow)] text-[var(--enroll-strong-fg)]"
                  : navigatingTo === item.href
                    ? "border-2 border-[var(--enroll-surface-border-strong)] bg-[var(--enroll-cyan)] text-[var(--enroll-fg)]"
                    : "text-[var(--enroll-muted-strong)] hover:bg-[color-mix(in_srgb,var(--enroll-fg)_5%,transparent)] hover:text-[var(--enroll-fg)]"
              } ${collapsed ? "flex items-center justify-center px-0" : "flex items-center gap-2"}`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span className="inline-block transition-all duration-200 ease-out">{item.label}</span> : null}
            </Link>
          ))}

          <Link
            href="/"
            onClick={(event) => navigateWithTransition(event, "/")}
            title={messages.common.home}
            className={`mt-4 rounded-2xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-sand)] px-4 py-3 text-sm text-[var(--enroll-fg)] transition hover:-translate-y-0.5 hover:shadow-[0_5px_0_var(--enroll-strong-shadow)] ${
              collapsed ? "flex items-center justify-center px-0" : "flex items-center gap-3"
            }`}
          >
            <Home className="h-4 w-4 shrink-0" />
            {!collapsed ? (
              <>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black leading-none">{messages.common.home}</div>
                  <div className="mt-1 text-[11px] leading-none text-[var(--enroll-muted)]">{messages.shell.marketingPage}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--enroll-muted)]" />
              </>
            ) : null}
          </Link>
        </nav>

        <div className="mt-4 lg:hidden">
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="w-full rounded-xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow)] px-3 py-2 text-sm font-semibold text-[var(--enroll-strong-fg)] hover:-translate-y-0.5"
          >
            {messages.common.logout}
          </button>
        </div>
      </aside>

      <section
        className={`glass glass-soft min-w-0 rounded-3xl p-4 pt-14 transition-[opacity,transform,filter] duration-200 ease-out sm:p-6 ${
          navigatingTo ? "translate-y-1 scale-[0.995] opacity-80 blur-[1px]" : "translate-y-0 scale-100 opacity-100 blur-0"
        }`}
      >
        <header className="mb-5 grid gap-4 border-b-2 border-[var(--enroll-strong-border)] pb-4 pl-10 sm:pl-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <h1 className="text-2xl font-black">{translatedTitle}</h1>
            {translatedSubtitle ? <p className="mt-1 max-w-2xl text-sm text-[var(--enroll-muted)]">{translatedSubtitle}</p> : null}
          </div>

          <div className="hidden min-w-0 max-w-full items-center justify-end gap-2 sm:flex sm:flex-wrap lg:flex-nowrap lg:justify-self-end">
            <span
              className={`${headerControlBaseClassName} justify-center px-3 text-[11px] font-black uppercase tracking-[0.14em] ${planBadgeClassName}`}
            >
              {planLabel}
            </span>
            <span
              className={`${headerControlBaseClassName} whitespace-nowrap`}
              title={localDateTime.timeZone}
            >
              {desktopDateTimeLabel}
            </span>
            <span className={`${headerControlBaseClassName} min-w-0 max-w-[18rem]`}>
              <span className="mr-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--enroll-cyan)] text-xs text-[var(--enroll-fg)]">
                {name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 truncate">{name}</span>
            </span>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="inline-flex h-11 shrink-0 items-center rounded-xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow)] px-3 text-sm font-semibold text-[var(--enroll-strong-fg)] hover:-translate-y-0.5"
            >
              {messages.common.logout}
            </button>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-cyan)] px-3 text-sm font-bold text-[var(--enroll-fg)]">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        {runtimeConfig?.features.maintenance_mode ? (
          <div className="mb-4">
            <RuntimeNotice
              tone="info"
              message={
                locale === "ru"
                  ? "Режим обслуживания включён. Часть функций может быть временно ограничена, пока мы стабилизируем запуск."
                  : "Maintenance mode is enabled. Some features may be temporarily limited while we stabilize the launch."
              }
            />
          </div>
        ) : null}

        {children}
      </section>
    </div>
  );
}
