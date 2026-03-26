import { LegalPageShell } from "@/components/legal/legal-page-shell";

const effectiveDate = "March 26, 2026";

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      title="Refund Policy"
      effectiveDate={effectiveDate}
      description="This policy explains how refunds will be handled for Enroll subscriptions and other paid access if billing is enabled."
    >
      <section>
        <h2 className="text-xl font-black">1. Soft Launch Status</h2>
        <p>
          Enroll is currently preparing for public launch. During the soft-launch period, paid access may be limited,
          manual, or unavailable while the product is stabilized for first users.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">2. Subscription Refunds</h2>
        <p>
          If recurring subscriptions are activated, refunds are generally reviewed case by case. Duplicate charges,
          accidental renewals reported promptly, or verified billing errors will be prioritized for review.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">3. Non-Refundable Situations</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Partial use of a billing period after meaningful access has already been provided.</li>
          <li>Dissatisfaction with admissions outcomes, AI suggestions, or university decisions.</li>
          <li>Refund requests based solely on a change of plans after the subscription has started.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black">4. How to Request a Refund</h2>
        <p>
          Send the account email, payment date, and a short explanation to{" "}
          <a href="mailto:billing@enroll-ai.app" className="font-semibold underline">
            billing@enroll-ai.app
          </a>
          . We aim to review requests within a reasonable time.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">5. Chargebacks</h2>
        <p>
          If you believe a payment is unauthorized, contact us first when possible so we can investigate. Fraud and
          abuse reviews may result in account restrictions.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">6. Policy Updates</h2>
        <p>
          We may update this refund policy as Enroll moves from soft launch to paid plans and recurring billing.
          Updated terms will be posted on this page.
        </p>
      </section>
    </LegalPageShell>
  );
}
