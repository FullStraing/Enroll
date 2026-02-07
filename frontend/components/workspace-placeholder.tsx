"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";

export function WorkspacePlaceholder({ title, subtitle, djangoPath }: { title: string; subtitle: string; djangoPath: string }) {
  return (
    <ProtectedPage>
      <AppShell title={title} subtitle={subtitle}>
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Next.js page scaffolded</h2>
          <p className="mt-2 text-sm text-white/70">This section is ready for step-by-step migration. Current production behavior remains available in Django.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={`http://127.0.0.1:8000${djangoPath}`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">
              Open Django page
            </a>
            <Link href="/dashboard" className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
              Back to dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
