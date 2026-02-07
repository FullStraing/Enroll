import { cookies } from "next/headers";
import Link from "next/link";

export default function LandingPage() {
  const token = cookies().get("enroll_token")?.value;
  const primaryHref = token ? "/dashboard" : "/register";
  const primaryText = token ? "Перейти в Dashboard" : "Создать аккаунт";

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-16">
      <header className="glass rounded-3xl p-8">
        <img src="/icons/logo.svg" alt="ENROLL" className="h-auto w-44" />
        <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">Поступление в США - по шагам.</h1>
        <p className="mt-4 max-w-2xl text-white/70">Профиль -> дедлайны -> документы -> черновики для Common App (без интеграции в MVP).</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={primaryHref} className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500">
            {primaryText}
          </Link>
          <Link href="/login" className="rounded-2xl border border-white/15 px-6 py-3 text-white/80 hover:text-white">
            Войти
          </Link>
        </div>
      </header>
    </main>
  );
}
