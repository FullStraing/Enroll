import { LegalPageShell } from "@/components/legal/legal-page-shell";

const effectiveDate = "March 26, 2026";

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      effectiveDate={effectiveDate}
      description="These terms govern access to Enroll, including planning tools, AI-assisted features, document storage, and community spaces used by students during the admissions process."
    >
      <section>
        <h2 className="text-xl font-black">1. Service Overview</h2>
        <p>
          Enroll is a software platform for admissions planning. The service may include profile management, university
          tracking, essays, documents, task workflows, AI-assisted guidance, and community features.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">2. Eligibility and Accounts</h2>
        <p>
          You are responsible for maintaining the security of your account and for the accuracy of the information you
          submit. You may not use Enroll for unlawful activity, fraud, abuse, or to impersonate another person.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">3. Acceptable Use</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Do not upload harmful, illegal, or infringing content.</li>
          <li>Do not misuse AI features for plagiarism, spam, or abusive conduct.</li>
          <li>Do not interfere with platform security, uptime, or other users.</li>
          <li>Do not use community spaces for harassment, scams, or off-topic promotion.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black">4. AI and Admissions Guidance</h2>
        <p>
          AI-assisted outputs are provided for support, drafting, explanation, and workflow guidance. They may be
          incomplete or imperfect and must be reviewed by the user. Enroll does not guarantee admission outcomes or the
          accuracy of external institutional requirements.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">5. User Content</h2>
        <p>
          You retain responsibility for the content you upload or create in Enroll, including essays, documents, and
          community messages. You grant us the limited rights necessary to host, process, store, and display that
          content to operate the service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">6. Paid Plans and Billing</h2>
        <p>
          Some Enroll features may become available through paid subscriptions. If paid access is enabled, billing,
          renewal, cancellation, and taxes will be described on the pricing page and checkout flow. Specific refund
          handling is described in the refund policy.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">7. Suspension and Termination</h2>
        <p>
          We may suspend or terminate accounts that violate these terms, create security risks, or misuse the platform.
          You may stop using the service at any time.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">8. Disclaimer</h2>
        <p>
          Enroll is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not guarantee uninterrupted availability,
          admission offers, financial aid outcomes, visa approval, or institutional acceptance of user-generated
          materials.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">9. Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of Enroll after updates means you accept the
          revised terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">10. Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href="mailto:support@enroll-ai.app" className="font-semibold underline">
            support@enroll-ai.app
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
