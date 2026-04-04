"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { locale, setLocale } = useLocale();

  const buttonClass = compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs";

  function handleSwitch(nextLocale: Locale) {
    if (nextLocale === locale) return;
    setLocale(nextLocale);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border-2 border-black bg-white p-1",
        isPending ? "opacity-80" : "",
        className,
      )}
    >
      {(["ru", "en"] as Locale[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => handleSwitch(option)}
          className={cn(
            "rounded-full font-black uppercase tracking-[0.12em] transition",
            buttonClass,
            locale === option ? "bg-[#FFDB58] text-black" : "text-black/55 hover:text-black",
          )}
          aria-pressed={locale === option}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
