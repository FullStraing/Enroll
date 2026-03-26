"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-3xl rounded-[28px] border-2 border-black bg-white p-6 shadow-[0_10px_0_#000] md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-black md:text-4xl">
          We couldn&apos;t load this page correctly.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-black/70">
          Try refreshing the page or returning to the dashboard. If this keeps happening, contact support.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border-2 border-black bg-[#FFDB58] px-5 py-2 text-sm font-black transition hover:-translate-y-0.5"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border-2 border-black bg-white px-5 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
