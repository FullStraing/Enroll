import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cookies } from "next/headers";
import { getLandingContent, landingTheme } from "@/app/landing-content";
import { LandingPrimaryLink } from "@/components/landing/landing-auth-actions";
import { MarketingFooter, MarketingHeader, MarketingSectionHeading, MarketingToneCard } from "@/components/landing/marketing-chrome";
import { ProductShot } from "@/components/landing/product-shot";
import { getServerLocale } from "@/lib/server-locale";
import { INTRO_QUIZ_LINKED_COOKIE_KEY } from "@/lib/intro-quiz";
import { getMessages } from "@/lib/i18n";

const toneClassMap = {
  yellow: "yellow" as const,
  cyan: "cyan" as const,
  sand: "orange" as const,
  orange: "orange" as const,
};

export default function ProductPage() {
  const locale = getServerLocale();
  const messages = getMessages(locale);
  const content = getLandingContent(locale);
  const token = cookies().get("enroll_session")?.value;
  const introQuizLinked = cookies().get(INTRO_QUIZ_LINKED_COOKIE_KEY)?.value === "1";
  const primaryHref = token ? "/dashboard" : introQuizLinked ? "/register" : "/intro-quiz";

  return (
    <main className="marketing-shell min-h-screen bg-transparent px-4 py-6 text-black md:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border-2 border-black bg-white shadow-[0_10px_0_#000]">
        <MarketingHeader initialHasSession={Boolean(token)} primaryHref={primaryHref} current="product" brandVariant="minimal" />

        <section className="border-b-2 border-black px-5 py-14 sm:px-6 md:px-8 md:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <span
              className="inline-flex rounded-full border-2 border-black px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] sm:px-5 sm:text-xs"
              style={{ backgroundColor: landingTheme.yellowSoft }}
            >
              {content.product.hero.badge}
            </span>

            <h1 className="mx-auto mt-6 max-w-4xl text-[clamp(2.3rem,7vw,4.9rem)] font-black leading-[0.94] tracking-[-0.06em]">
              {content.product.hero.title[0]}
              <br />
              {content.product.hero.title[1]}
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-black/65 sm:text-lg sm:leading-8 md:text-xl md:leading-9">
              {content.product.hero.description}
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
              <LandingPrimaryLink
                fallbackHref={primaryHref}
                initialHasSession={Boolean(token)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-black px-6 py-3.5 text-base font-black transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_#000] sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
                style={{ backgroundColor: landingTheme.primary }}
              >
                {messages.common.startFree}
                <ArrowRight className="h-5 w-5" />
              </LandingPrimaryLink>
              <Link
                href="/pricing"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-black bg-white px-6 py-3.5 text-base font-black transition hover:-translate-y-0.5 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                {messages.common.pricing}
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-black px-5 py-16 md:px-8 md:py-20">
          <MarketingSectionHeading
            eyebrow={content.product.workflow.eyebrow}
            title={content.product.workflow.title}
            description={content.product.workflow.description}
          />

          <div className="mx-auto mt-10 grid max-w-5xl gap-4">
            {content.product.workflowList.map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-4 rounded-[28px] border-2 border-black bg-white px-5 py-5 shadow-[0_8px_0_#000] sm:px-6"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-black text-sm font-black"
                  style={{ backgroundColor: index % 2 === 0 ? landingTheme.yellowSoft : landingTheme.cyan }}
                >
                  0{index + 1}
                </span>
                <p className="pt-1 text-base leading-7 text-black/75 sm:text-lg sm:leading-8">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b-2 border-black px-5 py-16 md:px-8 md:py-20">
          <div className="grid gap-12">
            {content.product.sections.map((section, index) => (
              <div
                key={section.title}
                className={`grid items-center gap-8 ${index % 2 === 0 ? "lg:grid-cols-[1.05fr_0.95fr]" : "lg:grid-cols-[0.95fr_1.05fr]"}`}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">{section.eyebrow}</p>
                  <h2 className="mt-3 text-3xl font-black leading-[0.96] tracking-[-0.05em] md:text-5xl">{section.title}</h2>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-black/65 md:text-lg">{section.body}</p>
                </div>

                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <ProductShot
                    label={section.preview.label}
                    title={section.preview.title}
                    rows={section.preview.rows}
                    tone={toneClassMap[section.tone]}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b-2 border-black px-5 py-16 md:px-8 md:py-20">
          <MarketingSectionHeading
            eyebrow={content.product.modules.eyebrow}
            title={content.product.modules.title}
            description={content.product.modules.description}
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {content.home.modulesList.map((module) => (
              <MarketingToneCard key={module.title} tone={module.tone}>
                <h3 className="text-3xl font-black tracking-[-0.04em]">{module.title}</h3>
                <p className="mt-4 text-base leading-8 text-black/70 md:text-lg">{module.body}</p>
              </MarketingToneCard>
            ))}
          </div>
        </section>

        <section className="px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-5xl rounded-[32px] border-2 border-black bg-white px-6 py-12 text-center shadow-[0_10px_0_#000] md:px-10 md:py-16">
            <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.05em] md:text-6xl">
              {content.product.final.title[0]}
              <br />
              {content.product.final.title[1]}
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-black/65 sm:text-lg sm:leading-8 md:text-xl md:leading-9">
              {content.product.final.description}
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
              <LandingPrimaryLink
                fallbackHref={primaryHref}
                initialHasSession={Boolean(token)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-black px-6 py-3.5 text-base font-black transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_#000] sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
                style={{ backgroundColor: landingTheme.primary }}
              >
                {messages.common.startFree}
                <ArrowRight className="h-5 w-5" />
              </LandingPrimaryLink>
              <Link
                href="/pricing"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-black bg-white px-6 py-3.5 text-base font-black transition hover:-translate-y-0.5 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                {content.product.final.secondaryCta}
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-black/45">
              <CheckCircle2 className="h-4 w-4" />
              <span>{content.product.final.note}</span>
            </div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </main>
  );
}
