import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";

export function getServerLocale() {
  return normalizeLocale(cookies().get(LOCALE_COOKIE)?.value);
}
