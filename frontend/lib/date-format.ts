type DateInput = Date | string | null | undefined;

const FALLBACK_TEXT = "N/A";
const DEFAULT_DATE_LOCALE = process.env.NEXT_PUBLIC_DATE_LOCALE || "en-US";
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(key: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const cacheKey = `${DEFAULT_DATE_LOCALE}:${key}`;
  const cached = formatterCache.get(cacheKey);
  if (cached) return cached;
  const created = new Intl.DateTimeFormat(DEFAULT_DATE_LOCALE, options);
  formatterCache.set(cacheKey, created);
  return created;
}

export function parseDateInput(value?: DateInput): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const safe = value.includes("T") ? value : `${value}T00:00:00`;
  const parsed = new Date(safe);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function fallbackValue(value?: DateInput): string {
  if (typeof value === "string" && value.trim()) return value;
  return FALLBACK_TEXT;
}

export function formatDateShort(value?: DateInput): string {
  const parsed = parseDateInput(value);
  if (!parsed) return fallbackValue(value);
  return getFormatter("date-short", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function formatDateShortNoYear(value?: DateInput): string {
  const parsed = parseDateInput(value);
  if (!parsed) return fallbackValue(value);
  return getFormatter("date-short-no-year", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function formatDateTimeShort(value?: DateInput): string {
  const parsed = parseDateInput(value);
  if (!parsed) return fallbackValue(value);
  return getFormatter("date-time-short", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function formatMonthYear(value?: DateInput): string {
  const parsed = parseDateInput(value);
  if (!parsed) return FALLBACK_TEXT;
  return getFormatter("month-year", {
    month: "short",
    year: "numeric",
  }).format(parsed);
}
