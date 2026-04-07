import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, DollarSign, FileText, FolderKanban, GraduationCap, LayoutGrid, PenSquare, Target, X } from "lucide-react";
import { cookies } from "next/headers";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getLandingContent, landingTheme } from "@/app/landing-content";
import { getServerLocale } from "@/lib/server-locale";
import { getMessages } from "@/lib/i18n";
import { INTRO_QUIZ_LINKED_COOKIE_KEY } from "@/lib/intro-quiz";
import { LandingPrimaryLink } from "@/components/landing/landing-auth-actions";
import {
  MarketingFooter,
  MarketingHeader,
  MarketingIconChip,
  MarketingSectionHeading,
  MarketingToneCard,
  marketingPrimaryButtonLgClass,
  marketingSecondaryButtonLgClass,
} from "@/components/landing/marketing-chrome";

const moduleIcons = {
  Shortlist: Target,
  "Дедлайны": GraduationCap,
  Deadlines: GraduationCap,
  "Essay workspace": PenSquare,
  Dashboard: LayoutGrid,
  "Document vault": FolderKanban,
  "Common App": FileText,
} as const;

const toneAccentMap = {
  yellow: "#FFDB58",
  cyan: "#DAF5F0",
  sand: "#F3EDE2",
  orange: "#F8D6B3",
} as const;

export default function LandingPage() {
  const locale = getServerLocale();
  const messages = getMessages(locale);
  const content = getLandingContent(locale);
  const token = cookies().get("enroll_session")?.value;
  const introQuizLinked = cookies().get(INTRO_QUIZ_LINKED_COOKIE_KEY)?.value === "1";
  const primaryHref = token ? "/dashboard" : introQuizLinked ? "/register" : "/intro-quiz";

  return (
    <main className="marketing-shell min-h-screen bg-transparent px-4 py-6 text-[var(--enroll-fg)] md:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border-2 border-black bg-white shadow-[0_10px_0_#000]">
        <MarketingHeader initialHasSession={Boolean(token)} primaryHref={primaryHref} current="home" brandVariant="minimal" />

        <section className="border-b-2 border-black px-5 py-12 sm:px-6 sm:py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <span
              className="inline-flex rounded-full border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--enroll-strong-fg)] sm:px-5 sm:text-xs sm:tracking-[0.2em]"
            >
              {content.home.hero.badge}
            </span>

            <h1 className="mx-auto mt-6 max-w-3xl text-[clamp(2.4rem,8vw,5rem)] font-black leading-[0.94] tracking-[-0.06em] text-[var(--enroll-fg)] sm:mt-8">
              {content.home.hero.title[0]}
              <br />
              {content.home.hero.title[1]}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--enroll-muted-strong)] sm:text-lg md:mt-6 md:text-xl md:leading-9">
              {content.home.hero.description}
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
              <LandingPrimaryLink
                fallbackHref={primaryHref}
                initialHasSession={Boolean(token)}
                className={marketingPrimaryButtonLgClass}
              >
                {messages.common.startFree}
                <ArrowRight className="h-5 w-5" />
              </LandingPrimaryLink>

              <Link
                href="/product"
                className={marketingSecondaryButtonLgClass}
              >
                {content.home.hero.secondaryCta}
              </Link>
            </div>

            <p className="mt-5 text-xs font-semibold text-[var(--enroll-muted)] sm:mt-6 sm:text-sm md:text-base">{content.home.hero.footer}</p>
          </div>
        </section>

        <section className="border-b-2 border-black px-5 py-16 md:px-8 md:py-20">
          <MarketingSectionHeading
            eyebrow={content.home.problem.eyebrow}
            title={content.home.problem.title}
            description={content.home.problem.description}
          />

          <div className="mt-10 grid gap-4">
            {content.home.comparisons.map((item) => (
              <div
                key={item.pain}
                className="grid overflow-hidden rounded-[28px] border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] shadow-[0_8px_0_var(--enroll-strong-shadow)] md:grid-cols-[1fr_1fr]"
              >
                <div className="flex items-center gap-4 px-6 py-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--enroll-surface-border)] bg-[color-mix(in_srgb,var(--enroll-surface-elevated)_88%,transparent)] text-[var(--enroll-muted-strong)]">
                    <X className="h-5 w-5" />
                  </span>
                  <p className="max-w-xl text-base font-medium leading-7 text-[var(--enroll-fg-soft)] sm:text-lg">{item.pain}</p>
                </div>
                <div className="border-t-2 border-[var(--enroll-strong-border)] md:border-l-2 md:border-t-0" style={{ backgroundColor: toneAccentMap[item.tone] }}>
                  <div className="flex items-center gap-4 px-6 py-6">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[var(--enroll-yellow)] text-[var(--enroll-strong-fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                      <Check className="h-5 w-5" />
                    </span>
                    <p className="max-w-xl text-base font-black leading-7 text-[var(--enroll-strong-fg)] sm:text-lg">{item.relief}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b-2 border-black px-5 py-16 md:px-8 md:py-20">
          <MarketingSectionHeading
            eyebrow={content.home.modules.eyebrow}
            title={content.home.modules.title}
            description={content.home.modules.description}
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {content.home.modulesList.map((module) => {
              const Icon = moduleIcons[module.title as keyof typeof moduleIcons];

              return (
                <MarketingToneCard key={module.title} tone={module.tone}>
                  <MarketingIconChip>
                    <Icon className="h-6 w-6" strokeWidth={2.1} />
                  </MarketingIconChip>
                  <h3 className="mt-8 text-3xl font-black tracking-[-0.04em] text-[var(--enroll-strong-fg)]">{module.title}</h3>
                  <p className="mt-4 text-base leading-7 text-[color:color-mix(in_srgb,var(--enroll-strong-fg)_72%,transparent)] sm:text-lg sm:leading-8">{module.body}</p>
                </MarketingToneCard>
              );
            })}
          </div>
        </section>

        <section id="process" className="border-b-2 border-black px-5 py-16 md:px-8 md:py-20">
          <MarketingSectionHeading
            eyebrow={content.home.process.eyebrow}
            title={content.home.process.title}
            description={content.home.process.description}
          />

          <div className="relative mx-auto mt-12 max-w-6xl">
            <div className="absolute left-[2.5rem] top-0 hidden h-full w-px bg-black/15 md:block" />
            <div className="grid gap-6">
              {content.home.steps.map((step) => (
                <div key={step.number} className="relative rounded-[32px] border-2 border-black bg-white px-6 py-8 shadow-[0_8px_0_#000] md:px-10">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    <div
                      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border-2 border-black text-2xl font-black text-[var(--enroll-strong-fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                      style={{ backgroundColor: toneAccentMap[step.tone] }}
                    >
                      {step.number}
                    </div>
                    <div className="pt-1">
                      <h3 className="text-3xl font-black tracking-[-0.04em]">{step.title}</h3>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--enroll-muted)] sm:text-lg sm:leading-8">{step.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b-2 border-black px-5 py-16 md:px-8 md:py-20">
          <MarketingSectionHeading
            eyebrow={content.home.trust.eyebrow}
            title={content.home.trust.title}
            description={content.home.trust.description}
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {content.home.trustReasons.map((reason, index) => (
              <div key={reason} className="rounded-[28px] border-2 border-black bg-white p-6 shadow-[0_8px_0_#000]">
                <span
                  className="mb-6 block h-2 w-16 rounded-full"
                  style={{
                    backgroundColor:
                      index === 0 ? landingTheme.primary : index === 1 ? landingTheme.cyan : landingTheme.sand,
                  }}
                />
                <p className="text-xl font-medium leading-9 text-[var(--enroll-fg)]">{reason}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b-2 border-black px-5 py-16 md:px-8 md:py-20">
          <MarketingSectionHeading
            eyebrow={content.home.faq.eyebrow}
            title={content.home.faq.title}
            description={content.home.faq.description}
          />

          <div className="mx-auto mt-10 max-w-4xl rounded-[32px] border-2 border-black bg-white px-6 py-3 shadow-[0_10px_0_#000] md:px-10">
            <Accordion type="single" collapsible>
              {content.home.faqItems.map((item, index) => (
                <AccordionItem key={item.question} value={`faq-${index}`} className={index === content.home.faqItems.length - 1 ? "border-b-0" : ""}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-5xl rounded-[32px] border-2 border-black bg-white px-6 py-12 text-center shadow-[0_10px_0_#000] md:px-10 md:py-16">
            <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.05em] md:text-7xl">
              {content.home.final.title[0]}
              <br />
              {content.home.final.title[1]}
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[var(--enroll-muted)] sm:text-lg sm:leading-8 md:text-xl md:leading-9">
              {content.home.final.description}
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <LandingPrimaryLink
                fallbackHref={primaryHref}
                initialHasSession={Boolean(token)}
                className={marketingPrimaryButtonLgClass}
              >
                {messages.common.startFree}
                <ArrowRight className="h-5 w-5" />
              </LandingPrimaryLink>
              <Link
                href="/pricing"
                className={marketingSecondaryButtonLgClass}
              >
                <DollarSign className="h-5 w-5" />
                {content.home.final.secondaryCta}
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-[var(--enroll-muted)]">
              <CheckCircle2 className="h-4 w-4" />
              <span>{content.home.final.note}</span>
            </div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </main>
  );
}
