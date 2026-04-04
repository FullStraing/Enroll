import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Manrope } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enroll",
  description: "Admissions planning workspace for students applying abroad.",
};

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = normalizeLocale(cookies().get(LOCALE_COOKIE)?.value);

  return (
    <html lang={locale}>
      <body className={manrope.className}>
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
