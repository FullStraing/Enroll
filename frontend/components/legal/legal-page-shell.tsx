import Link from "next/link";

type LegalPageShellProps = {
  title: string;
  effectiveDate: string;
  description?: string;
  children: React.ReactNode;
};

const footerLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/refund-policy", label: "Refunds" },
];

export function LegalPageShell({ title, effectiveDate, description, children }: LegalPageShellProps) {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="glass glass-soft rounded-3xl p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-black/80 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Legal</p>
              <h1 className="text-3xl font-black md:text-4xl">{title}</h1>
              <p className="mt-1 text-sm text-black/65">Effective date: {effectiveDate}</p>
              {description ? <p className="mt-3 max-w-2xl text-sm text-black/70 md:text-base">{description}</p> : null}
            </div>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-black bg-white px-4 text-sm font-semibold transition hover:bg-black/5"
            >
              Back to Home
            </Link>
          </div>

          <div className="space-y-7 text-sm leading-7 text-black/85 md:text-base">{children}</div>

          <div className="mt-8 flex flex-wrap gap-2 border-t border-black/10 pt-5">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-black/15 bg-white/80 px-3 py-1 text-sm font-semibold transition hover:border-black/35"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
