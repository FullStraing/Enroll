"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { landingTheme } from "@/app/landing-content";
import { EnrollWordmark } from "@/components/brand/enroll-wordmark";
import { LandingAuthActions } from "@/components/landing/landing-auth-actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useMessages } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

type MarketingHeaderProps = {
  initialHasSession: boolean;
  primaryHref: string;
  current?: "home" | "product" | "pricing";
  brandVariant?: "default" | "minimal";
  brandClassName?: string;
};

function navClass(active: boolean) {
  return active
    ? "text-[var(--enroll-fg)]"
    : "text-[var(--enroll-muted-strong)] transition hover:text-[var(--enroll-fg)]";
}

export const marketingPrimaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow)] text-[var(--enroll-strong-fg)] font-black shadow-[0_4px_0_var(--enroll-strong-shadow)] transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--enroll-yellow)_92%,white)] hover:shadow-[0_6px_0_var(--enroll-strong-shadow)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--enroll-strong-shadow)]";

export const marketingPrimaryButtonLgClass = `${marketingPrimaryButtonClass} h-14 w-full px-6 text-base sm:w-auto sm:px-8 sm:text-lg`;

export const marketingPrimaryButtonSmClass = `${marketingPrimaryButtonClass} h-12 px-5 text-sm`;

export const marketingSecondaryButtonLgClass =
  "inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-6 text-base font-black text-[var(--enroll-fg)] shadow-[0_4px_0_var(--enroll-strong-shadow)] transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--enroll-fg)_4%,var(--enroll-surface-elevated))] hover:shadow-[0_6px_0_var(--enroll-strong-shadow)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--enroll-strong-shadow)] sm:w-auto sm:px-8 sm:text-lg";

export function MarketingIconChip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
        "border-[var(--enroll-marketing-icon-chip-border)] bg-[var(--enroll-marketing-icon-chip)] text-[var(--enroll-marketing-icon-fg)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MarketingHeader({
  initialHasSession,
  primaryHref,
  current = "home",
  brandVariant = "default",
  brandClassName = "",
}: MarketingHeaderProps) {
  const messages = useMessages();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[var(--enroll-strong-border)] px-5 py-5 md:px-8">
      <Link href="/" className="inline-flex items-center gap-3">
        {brandVariant === "minimal" ? (
          <MinimalBrand className={brandClassName} />
        ) : (
          <DefaultBrand className={brandClassName} />
        )}
      </Link>

      <div className="flex flex-wrap items-center justify-end gap-3 md:gap-4">
        <nav className="hidden items-center gap-5 text-sm font-black lg:flex">
          <Link href="/" className={navClass(current === "home")}>
            {messages.common.home}
          </Link>
          <Link href="/product" className={navClass(current === "product")}>
            {messages.common.product}
          </Link>
          <Link href="/pricing" className={navClass(current === "pricing")}>
            {messages.common.pricing}
          </Link>
        </nav>

        <div className="flex items-center gap-2 rounded-2xl border border-[var(--enroll-surface-border)] bg-[color-mix(in_srgb,var(--enroll-surface-elevated)_92%,transparent)] p-1.5">
          <ThemeSwitcher compact />
          <LanguageSwitcher compact />
        </div>
        <LandingAuthActions initialHasSession={initialHasSession} primaryHref={primaryHref} />
      </div>
    </header>
  );
}

function DefaultBrand({ className = "" }: { className?: string }) {
  return (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-yellow-soft)]">
        <MinimalBrandMark className="h-7 w-7" />
      </div>
      <EnrollWordmark size="sm" className={className} />
    </>
  );
}

function MinimalBrand({ className = "" }: { className?: string }) {
  return <EnrollWordmark size="md" className={className} />;
}

function MinimalBrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M45 12H26.5C20.1487 12 15 17.1487 15 23.5V23.5C15 29.8513 20.1487 35 26.5 35H37.5C43.299 35 48 39.701 48 45.5V45.5C48 51.299 43.299 56 37.5 56H15"
        stroke="#F5A623"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 12H45" stroke="#F5A623" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

export function MarketingFooter() {
  const messages = useMessages();

  return (
    <footer className="border-t-2 border-[var(--enroll-strong-border)] px-5 py-6 md:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <EnrollWordmark size="sm" />
          <p className="mt-1 text-sm text-[var(--enroll-muted)]">{messages.marketing.footerTagline}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[var(--enroll-muted)]">
          <Link href="/product" className="transition hover:text-[var(--enroll-fg)]">
            {messages.common.product}
          </Link>
          <Link href="/pricing" className="transition hover:text-[var(--enroll-fg)]">
            {messages.common.pricing}
          </Link>
          <Link href="/pilot" className="transition hover:text-[var(--enroll-fg)]">
            {messages.common.pilot}
          </Link>
          <Link href="/terms" className="transition hover:text-[var(--enroll-fg)]">
            {messages.marketing.terms}
          </Link>
          <Link href="/privacy-policy" className="transition hover:text-[var(--enroll-fg)]">
            {messages.marketing.privacy}
          </Link>
          <Link href="/refund-policy" className="transition hover:text-[var(--enroll-fg)]">
            {messages.marketing.refunds}
          </Link>
          <span className="text-[var(--enroll-muted)]">© 2026 Enroll</span>
        </div>
      </div>
    </footer>
  );
}

export function MarketingSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--enroll-muted)]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black leading-[0.96] tracking-[-0.05em] text-[var(--enroll-fg)] sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-sm leading-7 text-[var(--enroll-muted)] sm:text-base md:text-lg">{description}</p>
      ) : null}
    </div>
  );
}

export function MarketingToneCard({
  tone,
  children,
  className = "",
}: {
  tone: "yellow" | "cyan" | "sand" | "orange";
  children: ReactNode;
  className?: string;
}) {
  const backgroundMap = {
    yellow: landingTheme.yellowSoft,
    cyan: landingTheme.cyan,
    sand: landingTheme.sand,
    orange: landingTheme.orange,
  };

  return (
    <div
      className={`rounded-[28px] border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] p-6 shadow-[0_8px_0_var(--enroll-strong-shadow)] ${className}`}
      style={{ backgroundColor: backgroundMap[tone] }}
    >
      {children}
    </div>
  );
}
