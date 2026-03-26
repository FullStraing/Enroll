import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
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
  return (
    <html lang="ru">
      <body className={manrope.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
