import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, FileStack, GraduationCap, ListTodo } from "lucide-react";
import { landingTheme, painPoints, productShowcase, proofPoints, storySections } from "@/app/landing-content";
import { ProductShot } from "@/components/landing/product-shot";
import { SocialLottieButtons } from "@/components/landing/social-lottie-button";
import { INTRO_QUIZ_LINKED_COOKIE_KEY } from "@/lib/intro-quiz";

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black leading-[0.95] tracking-[-0.04em] text-black md:text-5xl">{title}</h2>
      <p className="mt-4 text-base text-black/65 md:text-lg">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  const token = cookies().get("enroll_token")?.value;
  const introQuizLinked = cookies().get(INTRO_QUIZ_LINKED_COOKIE_KEY)?.value === "1";
  const primaryHref = token ? "/dashboard" : introQuizLinked ? "/register" : "/intro-quiz";

  return (
    <main
      className="min-h-screen px-4 py-6 md:px-8"
      style={{
        backgroundColor: landingTheme.bg,
        color: landingTheme.black,
        backgroundImage: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)",
        backgroundSize: "6px 6px",
      }}
    >
      <div className="blob blob-cyan" />
      <div className="blob blob-orange" />

      <div className="relative mx-auto max-w-7xl rounded-[28px] border-2 border-black bg-white/90 shadow-[0_10px_0_#000]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black px-5 py-4 md:px-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-white">
              <Image src="/icons/logo.svg" alt="Enroll AI" width={28} height={28} className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">Enroll AI</p>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Admissions OS</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5">
              Войти
            </Link>
            <Link
              href={primaryHref}
              className="rounded-xl border-2 border-black px-5 py-2 text-sm font-black transition hover:-translate-y-0.5 hover:shadow-[0_4px_0_#000]"
              style={{ backgroundColor: landingTheme.primary }}
            >
              Начать
            </Link>
          </div>
        </header>

        <section className="grid gap-8 px-5 py-12 md:grid-cols-[1.08fr_0.92fr] md:px-8 md:py-16">
          <div>
            <span
              className="inline-flex rounded-full border-2 border-black px-4 py-1 text-xs font-black uppercase tracking-[0.16em]"
              style={{ backgroundColor: landingTheme.orange }}
            >
              От хаоса к контролю
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[0.92] tracking-[-0.06em] text-black md:text-7xl">
              Поступление в США не должно быть разбросано по таблицам, письмам и заметкам.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-black/70 md:text-xl">
              Enroll собирает shortlist, дедлайны, задачи, документы, essays и Common App в одну систему, чтобы студент всегда видел следующий правильный шаг.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-black px-8 py-3 text-lg font-black transition hover:-translate-y-0.5 hover:shadow-[0_5px_0_#000]"
                style={{ backgroundColor: landingTheme.primary }}
              >
                Начать
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/pilot"
                className="rounded-xl border-2 border-black px-8 py-3 text-lg font-bold transition hover:-translate-y-0.5"
                style={{ backgroundColor: landingTheme.cyan }}
              >
                В пилот
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border-2 border-black bg-white p-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <p className="text-sm font-black">Universities</p>
                </div>
                <p className="mt-2 text-sm text-black/65">Shortlist, categories, acceptance rate, deadlines.</p>
              </div>
              <div className="rounded-2xl border-2 border-black bg-white p-4">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  <p className="text-sm font-black">Tasks</p>
                </div>
                <p className="mt-2 text-sm text-black/65">Today-first planning instead of calendar overload.</p>
              </div>
              <div className="rounded-2xl border-2 border-black bg-white p-4">
                <div className="flex items-center gap-2">
                  <FileStack className="h-4 w-4" />
                  <p className="text-sm font-black">Documents</p>
                </div>
                <p className="mt-2 text-sm text-black/65">Transcript, resume, ID and letters in one flow.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <ProductShot
              tone="cyan"
              label="Hero product view"
              title="One workspace for the whole admissions process"
              rows={[
                { label: "Dashboard", value: "Next actions" },
                { label: "Universities", value: "6 tracked" },
                { label: "Tasks", value: "Today-first" },
                { label: "Documents", value: "3 uploaded" },
              ]}
            />
          </div>
        </section>

        <section className="border-t-2 border-black px-5 py-10 md:px-8">
          <SectionHeader
            eyebrow="Проблема"
            title="Пользователь должен сразу узнать свою ситуацию."
            description="Первый экран не должен просто рассказывать про функции. Он должен показать знакомую проблему, её цену и только потом раскрыть новый механизм решения."
          />

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {painPoints.map((item) => (
              <div key={item} className="rounded-2xl border-2 border-black bg-white p-4 text-sm font-semibold shadow-[0_4px_0_#000]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="border-t-2 border-black px-5 py-10 md:px-8">
          <div className="grid gap-8">
            {storySections.map((section, index) => (
              <div key={section.title} className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">{section.eyebrow}</p>
                  <h3 className="mt-2 text-3xl font-black leading-[0.98] tracking-[-0.04em] text-black">{section.title}</h3>
                  <p className="mt-4 text-base text-black/65">{section.body}</p>
                </div>
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <ProductShot
                    tone={section.tone}
                    label={section.preview.label}
                    title={section.preview.title}
                    rows={section.preview.rows}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t-2 border-black px-5 py-10 md:px-8">
          <SectionHeader
            eyebrow="Продукт"
            title="Покажи не абстрактный promise, а реальные части продукта."
            description="Landing page должна быть готова к замене placeholder-блоков на реальные screenshots. Поэтому showcase ниже собран как редактируемая структура, а не как жёсткий монолит."
          />

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {productShowcase.map((item, index) => (
              <div key={item.title} className="grid gap-3">
                <ProductShot
                  tone={index === 0 ? "orange" : index === 1 ? "cyan" : "yellow"}
                  label={item.preview.label}
                  title={item.preview.title}
                  rows={item.preview.rows}
                />
                <div className="rounded-2xl border-2 border-black bg-white p-4">
                  <p className="text-lg font-black tracking-[-0.03em] text-black">{item.title}</p>
                  <p className="mt-2 text-sm text-black/65">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t-2 border-black px-5 py-10 md:px-8">
          <SectionHeader
            eyebrow="Почему верят"
            title="После решения должен идти trust layer."
            description="Не обещания “поступишь гарантированно”, а честное объяснение, почему этот продукт стоит попробовать прямо сейчас."
          />

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {proofPoints.map((item) => (
              <div key={item} className="rounded-2xl border-2 border-black bg-white p-4 shadow-[0_4px_0_#000]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-black/65" />
                  <p className="text-sm font-semibold text-black">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t-2 border-black px-5 py-10 md:px-8">
          <div
            className="rounded-[28px] border-2 border-black px-6 py-8 text-center shadow-[0_8px_0_#000]"
            style={{ backgroundColor: landingTheme.yellowSoft }}
          >
            <div className="mx-auto max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">Призыв к действию</p>
              <h2 className="mt-3 text-3xl font-black leading-[0.95] tracking-[-0.04em] text-black md:text-5xl">
                Если поступление уже похоже на хаос, лучше собрать систему до того, как начнутся дедлайны.
              </h2>
              <p className="mt-4 text-base text-black/65 md:text-lg">
                Начни с shortlist, задач и документов в одном месте. Дальше Enroll поможет двигаться шаг за шагом.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={primaryHref}
                  className="rounded-xl border-2 border-black px-8 py-3 text-lg font-black transition hover:-translate-y-0.5 hover:shadow-[0_5px_0_#000]"
                  style={{ backgroundColor: landingTheme.primary }}
                >
                  Начать сейчас
                </Link>
                <Link href="/pilot" className="rounded-xl border-2 border-black bg-white px-8 py-3 text-lg font-bold transition hover:-translate-y-0.5">
                  Записаться в пилот
                </Link>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-black/55">
                <CircleAlert className="h-4 w-4" />
                <span>Это не гарантия поступления. Решение принимает университет.</span>
              </div>
              <div className="mt-3">
                <Link href="/privacy-policy" className="text-sm font-semibold underline underline-offset-2">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t-2 border-black px-5 py-10 md:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">Socials</p>
              <h2 className="mt-2 text-3xl font-black leading-[0.95] tracking-[-0.04em] text-black md:text-4xl">
                Stay close to Enroll outside the app.
              </h2>
              <p className="mt-4 max-w-2xl text-base text-black/65 md:text-lg">
                Follow product updates, ask questions, and see how students build a stronger admissions workflow step by step.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm text-black/55">
                <span className="rounded-full border-2 border-black bg-white px-3 py-1 font-semibold">Telegram</span>
                <span className="rounded-full border-2 border-black bg-white px-3 py-1 font-semibold">Instagram</span>
              </div>
            </div>

            <SocialLottieButtons />
          </div>
        </footer>
      </div>

      <style>{`
        .blob {
          position: fixed;
          z-index: 0;
          width: 280px;
          height: 280px;
          border-radius: 9999px;
          filter: blur(55px);
          opacity: 0.45;
          animation: floaty 7s ease-in-out infinite;
          pointer-events: none;
        }
        .blob-cyan {
          top: 12%;
          left: -40px;
          background: ${landingTheme.cyan};
        }
        .blob-orange {
          bottom: 5%;
          right: -60px;
          background: ${landingTheme.orange};
          animation-delay: 1.4s;
        }
        @media (prefers-reduced-motion: reduce) {
          .blob {
            animation: none;
          }
        }
        @keyframes floaty {
          0% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-14px) scale(1.04);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}
