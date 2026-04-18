import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, SearchX } from "lucide-react";
import { normalizeLocale, LOCALE_COOKIE } from "@/lib/i18n";

export default function NotFoundPage() {
  const locale = normalizeLocale(cookies().get(LOCALE_COOKIE)?.value);
  const copy = locale === "ru"
    ? {
        badge: "404",
        title: "Ничего не найдено",
        body: "Похоже, этой страницы больше нет или адрес введён неверно.",
        home: "На главную",
        dashboard: "В Dashboard",
      }
    : {
        badge: "404",
        title: "Nothing was found",
        body: "This page does not exist anymore or the address is incorrect.",
        home: "Back home",
        dashboard: "Open Dashboard",
      };

  return (
    <main className="theme-home min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center">
        <div className="surface-card w-full rounded-[32px] p-6 md:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--enroll-surface-border-strong)] bg-[var(--enroll-yellow-soft)] px-4 py-2 text-sm font-semibold text-[var(--enroll-fg)]">
            <SearchX className="h-4 w-4" />
            {copy.badge}
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-[var(--enroll-fg)] md:text-5xl">{copy.title}</h1>
            <p className="max-w-xl text-base text-[var(--enroll-muted-strong)] md:text-lg">{copy.body}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow)] px-5 text-sm font-semibold text-[var(--enroll-strong-fg)] transition hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4" />
              {copy.home}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-5 text-sm font-semibold text-[var(--enroll-fg)] transition hover:-translate-y-0.5"
            >
              {copy.dashboard}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
