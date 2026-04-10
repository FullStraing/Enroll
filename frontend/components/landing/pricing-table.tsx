"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/locale-provider";
import { LandingPrimaryLink } from "@/components/landing/landing-auth-actions";
import { marketingPrimaryButtonSmClass } from "@/components/landing/marketing-chrome";
import { cn } from "@/lib/utils";

type BillingMode = "monthly" | "annual";

type PricingTableProps = {
  initialHasSession: boolean;
  primaryHref: string;
};

type PlanPricing = {
  price: string;
  period: string;
  billed: string;
  save?: string;
};

type PlanFeature = {
  label: string;
  included: boolean;
};

function getPricingContent(locale: "ru" | "en") {
  if (locale === "ru") {
    return {
      intro: {
        badge: "Pricing",
        title: "Понятные цены без лишнего шума",
        description:
          "Один бесплатный старт и два платных варианта. Сразу видно, за что ты платишь и где выгоднее длинный цикл.",
        monthly: "Monthly",
        annually: "Annually",
        saveUpTo: "Экономия до $60",
        mostPopular: "Most popular",
      },
      plans: {
        free: {
          name: "Free",
          subtitle: "Чтобы начать",
          cta: "Начать бесплатно",
          monthly: { price: "$0", period: "", billed: "Без оплаты" },
          annual: { price: "$0", period: "", billed: "Без оплаты" },
          features: [
            { label: "До 3 университетов", included: true },
            { label: "Базовый dashboard", included: true },
            { label: "Дедлайны и задачи", included: true },
            { label: "Один admissions profile", included: true },
            { label: "Essay workspace без версий", included: false },
            { label: "AI-помощь и Common App workflow", included: false },
          ] satisfies PlanFeature[],
        },
        pro: {
          name: "Pro",
          subtitle: "Основной план",
          cta: "Выбрать Pro",
          monthly: { price: "$8.99", period: "/mo", billed: "Оплата помесячно" },
          annual: { price: "$5.99", period: "/mo", billed: "Списывается как $71.99 в год", save: "Экономия $36" },
          features: [
            { label: "Университеты без лимита", included: true },
            { label: "Essay workspace с версиями", included: true },
            { label: "AI-помощь по эссе", included: true },
            { label: "Document vault", included: true },
            { label: "Common App workflow", included: true },
            { label: "Priority support", included: true },
          ] satisfies PlanFeature[],
        },
        premium: {
          name: "Premium",
          subtitle: "Для более плотной работы",
          cta: "Выбрать Premium",
          monthly: { price: "$14.99", period: "/mo", billed: "Оплата помесячно" },
          annual: { price: "$9.99", period: "/mo", billed: "Списывается как $119.99 в год", save: "Экономия $60" },
          features: [
            { label: "Всё из Pro", included: true },
            { label: "Ранний доступ к новым функциям", included: true },
            { label: "Ручной onboarding", included: true },
            { label: "Прямой канал с командой", included: true },
            { label: "Быстрый фидбек по продукту", included: true },
            { label: "Приоритетный доступ к пилотам", included: true },
          ] satisfies PlanFeature[],
        },
      },
    };
  }

  return {
    intro: {
      badge: "Pricing",
      title: "Clear pricing without extra noise",
      description:
        "One free starting point and two paid options. You can immediately see what you get and why longer access costs less per month.",
      monthly: "Monthly",
      annually: "Annually",
      saveUpTo: "Save up to $60",
      mostPopular: "Most popular",
    },
    plans: {
      free: {
        name: "Free",
        subtitle: "To get started",
        cta: "Start free",
        monthly: { price: "$0", period: "", billed: "Never billed" },
        annual: { price: "$0", period: "", billed: "Never billed" },
        features: [
          { label: "Up to 3 universities", included: true },
          { label: "Basic dashboard", included: true },
          { label: "Deadlines and tasks", included: true },
          { label: "One admissions profile", included: true },
          { label: "Essay workspace without versions", included: false },
          { label: "AI help and Common App workflow", included: false },
        ] satisfies PlanFeature[],
      },
      pro: {
        name: "Pro",
        subtitle: "Main plan",
        cta: "Choose Pro",
        monthly: { price: "$8.99", period: "/mo", billed: "Billed monthly" },
        annual: { price: "$5.99", period: "/mo", billed: "Billed as $71.99 yearly", save: "Save $36" },
        features: [
          { label: "Unlimited universities", included: true },
          { label: "Essay workspace with versions", included: true },
          { label: "AI essay guidance", included: true },
          { label: "Document vault", included: true },
          { label: "Common App workflow", included: true },
          { label: "Priority support", included: true },
        ] satisfies PlanFeature[],
      },
      premium: {
        name: "Premium",
        subtitle: "For a more guided setup",
        cta: "Choose Premium",
        monthly: { price: "$14.99", period: "/mo", billed: "Billed monthly" },
        annual: { price: "$9.99", period: "/mo", billed: "Billed as $119.99 yearly", save: "Save $60" },
        features: [
          { label: "Everything in Pro", included: true },
          { label: "Early access to new features", included: true },
          { label: "Manual onboarding", included: true },
          { label: "Direct channel with the team", included: true },
          { label: "Fast product feedback loop", included: true },
          { label: "Priority access to pilots", included: true },
        ] satisfies PlanFeature[],
      },
    },
  };
}

function PlanFeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <div className="flex items-start gap-3 border-t border-[var(--enroll-surface-border)] py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
          included
            ? "border-[var(--enroll-surface-border-strong)] bg-[color-mix(in_srgb,var(--enroll-fg)_10%,var(--enroll-surface-elevated))] text-[var(--enroll-fg)]"
            : "border-[var(--enroll-surface-border)] bg-[color-mix(in_srgb,var(--enroll-fg)_4%,var(--enroll-surface-elevated))] text-[var(--enroll-muted)]",
        )}
      >
        {included ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : <X className="h-3.5 w-3.5 stroke-[2.3]" />}
      </div>
      <p className={cn("text-sm leading-6", included ? "text-[var(--enroll-fg-soft)]" : "text-[var(--enroll-muted)]")}>{label}</p>
    </div>
  );
}

function PlanCard({
  name,
  subtitle,
  pricing,
  features,
  cta,
  highlight = false,
  initialHasSession,
  primaryHref,
  popularLabel,
}: {
  name: string;
  subtitle: string;
  pricing: PlanPricing;
  features: PlanFeature[];
  cta: string;
  highlight?: boolean;
  initialHasSession: boolean;
  primaryHref: string;
  popularLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] shadow-[0_8px_0_var(--enroll-strong-shadow)]">
      {highlight ? <div className="h-3 w-full bg-[var(--enroll-yellow)]" /> : null}
      <div className={cn("p-7", highlight ? "pt-6" : "")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[2.3rem] font-black tracking-[-0.05em] text-[var(--enroll-fg)]">{name}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--enroll-muted)]">{subtitle}</p>
          </div>
          {highlight ? (
            <Badge
              variant="primary"
              className="border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow-soft)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--enroll-strong-fg)]"
            >
              {popularLabel}
            </Badge>
          ) : null}
        </div>

        <div className="mt-6">
          <div className="flex items-end gap-2">
            <span className="text-[3.4rem] font-black leading-none tracking-[-0.06em] text-[var(--enroll-fg)]">{pricing.price}</span>
            {pricing.period ? <span className="pb-1 text-xl font-semibold text-[var(--enroll-muted-strong)]">{pricing.period}</span> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--enroll-muted)]">{pricing.billed}</p>
          {pricing.save ? (
            <div className="mt-3">
              <Badge
                variant="default"
                className="border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--enroll-strong-fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
              >
                {pricing.save}
              </Badge>
            </div>
          ) : null}
        </div>

        <LandingPrimaryLink
          fallbackHref={primaryHref}
          initialHasSession={initialHasSession}
          className={cn(
            "mt-6 w-full text-base",
            highlight
              ? marketingPrimaryButtonSmClass
              : "inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-5 text-sm font-black text-[var(--enroll-fg)] shadow-[0_4px_0_var(--enroll-strong-shadow)] transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--enroll-fg)_4%,var(--enroll-surface-elevated))] hover:shadow-[0_6px_0_var(--enroll-strong-shadow)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--enroll-strong-shadow)]",
          )}
        >
          {cta}
          <ArrowRight className="h-4.5 w-4.5" />
        </LandingPrimaryLink>

        <div className="mt-6">
          {features.map((feature) => (
            <PlanFeatureRow key={feature.label} label={feature.label} included={feature.included} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PricingTable({ initialHasSession, primaryHref }: PricingTableProps) {
  const { locale } = useLocale();
  const content = getPricingContent(locale);
  const [billingMode, setBillingMode] = useState<BillingMode>("monthly");

  const plans = useMemo(
    () => [
      {
        ...content.plans.free,
        pricing: content.plans.free[billingMode],
      },
      {
        ...content.plans.pro,
        pricing: content.plans.pro[billingMode],
        highlight: true,
      },
      {
        ...content.plans.premium,
        pricing: content.plans.premium[billingMode],
      },
    ],
    [billingMode, content.plans.free, content.plans.premium, content.plans.pro],
  );

  return (
    <>
      <section className="border-b-2 border-black px-5 py-10 md:px-8 md:py-12">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="primary"
            className="border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow)] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[var(--enroll-strong-fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
          >
            {content.intro.badge}
          </Badge>
          <h1 className="mt-5 text-[clamp(2.2rem,5vw,4.4rem)] font-black leading-[0.96] tracking-[-0.06em] text-[var(--enroll-fg)]">
            {content.intro.title}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[var(--enroll-muted)] sm:text-lg sm:leading-8">
            {content.intro.description}
          </p>

          <div className="mx-auto mt-8 flex max-w-fit flex-col items-center gap-2">
            {billingMode === "annual" ? (
              <span className="rounded-full bg-[var(--enroll-yellow)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--enroll-strong-fg)]">
                {content.intro.saveUpTo}
              </span>
            ) : (
              <span className="h-6" />
            )}
            <div className="inline-flex rounded-full border-2 border-[var(--enroll-strong-border)] bg-[color-mix(in_srgb,var(--enroll-fg)_6%,var(--enroll-surface-elevated))] p-1 shadow-[0_4px_0_var(--enroll-strong-shadow)]">
              <button
                type="button"
                onClick={() => setBillingMode("monthly")}
                className={cn(
                  "rounded-full px-6 py-2.5 text-sm font-black transition",
                  billingMode === "monthly"
                    ? "bg-[var(--enroll-surface-elevated)] text-[var(--enroll-fg)] shadow-[0_2px_0_var(--enroll-strong-shadow)]"
                    : "text-[var(--enroll-muted)] hover:text-[var(--enroll-fg)]",
                )}
              >
                {content.intro.monthly}
              </button>
              <button
                type="button"
                onClick={() => setBillingMode("annual")}
                className={cn(
                  "rounded-full px-6 py-2.5 text-sm font-black transition",
                  billingMode === "annual"
                    ? "bg-[var(--enroll-surface-elevated)] text-[var(--enroll-fg)] shadow-[0_2px_0_var(--enroll-strong-shadow)]"
                    : "text-[var(--enroll-muted)] hover:text-[var(--enroll-fg)]",
                )}
              >
                {content.intro.annually}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-black px-5 py-8 md:px-8 md:py-10">
        <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.name}
              name={plan.name}
              subtitle={plan.subtitle}
              pricing={plan.pricing}
              features={plan.features}
              cta={plan.cta}
              highlight={Boolean("highlight" in plan && plan.highlight)}
              initialHasSession={initialHasSession}
              primaryHref={primaryHref}
              popularLabel={content.intro.mostPopular}
            />
          ))}
        </div>
      </section>
    </>
  );
}
