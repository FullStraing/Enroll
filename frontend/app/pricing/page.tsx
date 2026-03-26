import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const planFeatures = [
  "University list and application planning",
  "Tasks and deadline workflow",
  "Documents vault",
  "Essay workspace with versions",
  "AI-assisted essay support",
  "Community chat access",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="glass glass-soft rounded-3xl p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-black/80 pb-5">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Pricing</p>
              <h1 className="text-3xl font-black md:text-4xl">Enroll pricing is being finalized for public launch.</h1>
              <p className="mt-3 text-sm text-black/70 md:text-base">
                We are currently onboarding first users through a soft launch. Public checkout is not enabled yet, but
                the core paid plan structure below reflects what Enroll is preparing to ship.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-black bg-white px-4 text-sm font-semibold transition hover:bg-black/5"
            >
              Back to Home
            </Link>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">Planned core offer</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-black">Enroll Pro</h2>
                </div>
                <div className="rounded-full border border-black/10 bg-[#FFF4CC] px-3 py-1 text-sm font-semibold text-black/80">
                  Checkout launching soon
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-black/10 bg-[#F8FAFB] p-5">
                <p className="text-sm text-black/65">Initial launch plan</p>
                <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-black">Subscription access</p>
                <p className="mt-3 text-sm text-black/70">
                  Final public pricing will be published before checkout is enabled. Early users are currently admitted
                  manually while billing and onboarding are finalized.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {planFeatures.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-black/70" />
                    <p className="text-sm font-semibold text-black">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-black/10 bg-[#DAF5F0]/40 p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">Soft launch</p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-black">First users are being onboarded manually.</h3>
                <p className="mt-3 text-sm text-black/70">
                  This lets us stabilize core workflows, improve onboarding, and verify billing before public checkout
                  goes live.
                </p>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-[#FFF4CC] p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">Questions</p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-black">Need pricing or early access details?</h3>
                <p className="mt-3 text-sm text-black/70">
                  Contact the Enroll team before public billing launches. Final checkout, renewal terms, and self-serve
                  upgrades will be published here when available.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href="/pilot" className="rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-semibold transition hover:bg-black/5">
                    Join pilot
                  </Link>
                  <Link href="/terms" className="rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-semibold transition hover:bg-black/5">
                    Terms
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-white p-6">
                <p className="text-sm text-black/70">
                  Legal and billing policies:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/terms" className="rounded-full border border-black/15 px-3 py-1 text-sm font-semibold">Terms</Link>
                  <Link href="/privacy-policy" className="rounded-full border border-black/15 px-3 py-1 text-sm font-semibold">Privacy</Link>
                  <Link href="/refund-policy" className="rounded-full border border-black/15 px-3 py-1 text-sm font-semibold">Refunds</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
