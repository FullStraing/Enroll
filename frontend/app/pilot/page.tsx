"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

const TELEGRAM_HANDLE = "@enroll_ai";
const INSTAGRAM_HANDLE = "@enroll.ai";

export default function PilotPage() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [timeline, setTimeline] = useState("3-9 месяцев");
  const [note, setNote] = useState("");

  const message = useMemo(() => {
    const lines = [
      "Заявка на 7-дневный trial Enroll",
      `Имя: ${name || "-"}`,
      `Контакт: ${contact || "-"}`,
      `Горизонт подачи: ${timeline}`,
      `Комментарий: ${note || "-"}`,
    ];
    return lines.join("\n");
  }, [name, contact, timeline, note]);

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent("Заявка на trial Enroll");
    const body = encodeURIComponent(message);
    return `mailto:enroll.ai.team@gmail.com?subject=${subject}&body=${body}`;
  }, [message]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    window.location.href = mailtoHref;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10 md:py-14">
      <header className="glass rounded-3xl p-6 md:p-8">
        <h1 className="text-3xl font-semibold md:text-4xl">Заявка на пилот Enroll</h1>
        <p className="mt-3 text-sm text-white/75">7-дневный trial + onboarding call 20-30 минут. После trial подписка 1490-1990 RUB/мес.</p>
      </header>

      <section className="glass rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="text-sm text-white/80">
            Имя
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" required />
          </label>
          <label className="text-sm text-white/80">
            Контакт (Telegram / Instagram / Email)
            <input value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" required />
          </label>
          <label className="text-sm text-white/80">
            Горизонт подачи
            <select value={timeline} onChange={(e) => setTimeline(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <option className="bg-[#0b1020]" value="0-3 месяца">0-3 месяца</option>
              <option className="bg-[#0b1020]" value="3-9 месяцев">3-9 месяцев</option>
              <option className="bg-[#0b1020]" value="9+ месяцев">9+ месяцев</option>
            </select>
          </label>
          <label className="text-sm text-white/80">
            Комментарий
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          </label>

          <button type="submit" className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500">
            Отправить заявку
          </button>
        </form>
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="text-xl font-semibold">Быстрый контакт</h2>
        <p className="mt-2 text-sm text-white/75">Если удобнее, напиши напрямую и отправь пометку: &quot;Хочу trial Enroll&quot;.</p>
        <ul className="mt-3 grid gap-2 text-sm text-white/85">
          <li>Telegram: {TELEGRAM_HANDLE}</li>
          <li>Instagram: {INSTAGRAM_HANDLE}</li>
          <li>Email: enroll.ai.team@gmail.com</li>
        </ul>
        <Link href="/" className="mt-4 inline-block rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white">
          Вернуться на landing
        </Link>
      </section>

      <p className="text-xs text-white/55">Не гарантия поступления. Решение принимает университет.</p>
    </main>
  );
}
