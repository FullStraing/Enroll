import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enroll Frontend",
  description: "Next.js frontend for Enroll",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
