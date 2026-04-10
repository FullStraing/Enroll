"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";

type ThemeMode = "light" | "dark";

const options: { value: ThemeMode; icon: typeof SunMedium }[] = [
  { value: "light", icon: SunMedium },
  { value: "dark", icon: MoonStar },
];

const labels = {
  ru: {
    light: "Светлая",
    dark: "Тёмная",
  },
  en: {
    light: "Light",
    dark: "Dark",
  },
} as const;

export function ThemeSwitcher({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const { locale } = useLocale();
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = useMemo<ThemeMode | null>(() => {
    if (!mounted) return null;
    if (theme === "dark") return "dark";
    if (theme === "light") return "light";
    return resolvedTheme === "dark" ? "dark" : "light";
  }, [mounted, resolvedTheme, theme]);

  const activeTone = mounted && resolvedTheme === "dark";
  const buttonClass = compact ? "h-8 min-w-8 px-2.5 text-[11px]" : "h-10 min-w-10 px-3 text-xs";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border-2 p-1 shadow-[0_3px_0_var(--enroll-strong-shadow)] transition-colors",
        "border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] text-[var(--enroll-fg)]",
        className,
      )}
      aria-label={locale === "ru" ? "Переключатель темы" : "Theme switcher"}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = currentTheme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1 rounded-full font-black uppercase tracking-[0.08em] transition-all",
              buttonClass,
              isActive
                ? "bg-[var(--enroll-yellow)] text-[var(--enroll-strong-fg)]"
                : "text-[var(--enroll-muted-strong)] hover:text-[var(--enroll-fg)]",
              activeTone && isActive ? "shadow-[0_2px_0_var(--enroll-strong-shadow)]" : "",
            )}
            aria-pressed={isActive}
            title={labels[locale][option.value]}
          >
            <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            {!compact ? <span>{labels[locale][option.value]}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
