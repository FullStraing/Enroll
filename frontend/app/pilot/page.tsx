"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useMessages } from "@/components/locale-provider";
import { RequiredMark } from "@/components/ui/required-mark";
import { Select } from "@/components/ui/select";

const TELEGRAM_HANDLE = "@enroll_ai";
const INSTAGRAM_HANDLE = "@enroll.ai";

export default function PilotPage() {
  const messages = useMessages();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [timeline, setTimeline] = useState<string>(messages.pilot.timelineOptions[1]);
  const [note, setNote] = useState("");

  const message = useMemo(() => {
    const lines = [
      messages.pilot.mailLabel,
      `${messages.pilot.name}: ${name || "-"}`,
      `${messages.pilot.contact}: ${contact || "-"}`,
      `${messages.pilot.timeline}: ${timeline}`,
      `${messages.pilot.note}: ${note || "-"}`,
    ];
    return lines.join("\n");
  }, [contact, messages.pilot.contact, messages.pilot.mailLabel, messages.pilot.name, messages.pilot.note, messages.pilot.timeline, name, note, timeline]);

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(messages.pilot.mailSubject);
    const body = encodeURIComponent(message);
    return `mailto:enroll.ai.team@gmail.com?subject=${subject}&body=${body}`;
  }, [message, messages.pilot.mailSubject]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    window.location.href = mailtoHref;
  }

  return (
    <main className="theme-home mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10 md:py-14">
      <header className="glass rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm font-semibold text-black/70 underline underline-offset-2 transition hover:text-black">
            {messages.pilot.backHome}
          </Link>
          <LanguageSwitcher compact />
        </div>

        <h1 className="mt-5 text-3xl font-semibold md:text-4xl">{messages.pilot.title}</h1>
        <p className="mt-3 text-sm text-black/70">{messages.pilot.subtitle}</p>
      </header>

      <section className="glass rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="text-sm text-black/80">
            {messages.pilot.name}
            <RequiredMark />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2"
              required
            />
          </label>

          <label className="text-sm text-black/80">
            {messages.pilot.contact}
            <RequiredMark />
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2"
              required
            />
          </label>

          <label className="text-sm text-black/80">
            {messages.pilot.timeline}
            <Select
              value={timeline}
              onChange={(value) => setTimeline(value)}
              options={messages.pilot.timelineOptions.map((option) => ({ value: option, label: option }))}
              className="mt-1 w-full border-black/15 bg-white text-black hover:border-black/35 focus-visible:border-black/50"
              ariaLabel={messages.pilot.timeline}
            />
          </label>

          <label className="text-sm text-black/80">
            {messages.pilot.note}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2"
            />
          </label>

          <button type="submit" className="rounded-2xl border-2 border-black bg-[#FFDB58] px-6 py-3 font-semibold text-black hover:-translate-y-0.5">
            {messages.pilot.submit}
          </button>
        </form>
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="text-xl font-semibold">{messages.pilot.quickContact}</h2>
        <p className="mt-2 text-sm text-black/70">{messages.pilot.quickContactBody}</p>
        <ul className="mt-3 grid gap-2 text-sm text-black/85">
          <li>Telegram: {TELEGRAM_HANDLE}</li>
          <li>Instagram: {INSTAGRAM_HANDLE}</li>
          <li>Email: enroll.ai.team@gmail.com</li>
        </ul>
      </section>

      <p className="text-xs text-black/55">{messages.pilot.disclaimer}</p>
    </main>
  );
}
