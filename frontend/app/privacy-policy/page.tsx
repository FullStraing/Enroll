import Link from "next/link";

const effectiveDate = "March 7, 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="glass glass-soft rounded-3xl p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-black/80 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Legal</p>
              <h1 className="text-3xl font-black md:text-4xl">Privacy Policy</h1>
              <p className="mt-1 text-sm text-black/65">Effective date: {effectiveDate}</p>
            </div>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-black bg-white px-4 text-sm font-semibold transition hover:bg-black/5"
            >
              Back to Home
            </Link>
          </div>

          <div className="space-y-7 text-sm leading-7 text-black/85 md:text-base">
            <section>
              <h2 className="text-xl font-black">1. Who We Are</h2>
              <p>
                Enroll AI (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is an admissions planning platform for students applying to U.S.
                universities. We provide workflow tools such as profile setup, deadlines, universities, documents, and
                essay organization.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black">2. Information We Collect</h2>
              <p>We may collect the following categories of information:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Account data: username, email, full name, password hash.</li>
                <li>Profile data: onboarding/Common App-style form answers you provide.</li>
                <li>Application planning data: universities, deadlines, tasks, calendar items, documents metadata.</li>
                <li>Essay data: drafts, versions, and related editing metadata.</li>
                <li>Technical data: IP address, device/browser information, basic logs for security and debugging.</li>
                <li>Cookie/local storage data needed for authentication and product continuity.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black">3. How We Use Your Information</h2>
              <ul className="list-disc space-y-1 pl-6">
                <li>To create and manage your account.</li>
                <li>To provide product features and save your progress.</li>
                <li>To secure the platform and prevent abuse.</li>
                <li>To improve product quality, performance, and reliability.</li>
                <li>To respond to support requests.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black">4. Cookies and Local Storage</h2>
              <p>We currently use essential storage items for core functionality, including:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>`enroll_token` for authenticated sessions.</li>
                <li>`enroll_intro_quiz_done` to avoid repeating the onboarding quiz.</li>
                <li>localStorage keys for temporary progress continuity.</li>
              </ul>
              <p>
                These items are used to operate the service. If we add analytics or marketing cookies later, we will
                update this policy and implement consent handling where required.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black">5. Data Sharing</h2>
              <p>We do not sell your personal data. We may share data only when necessary:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>With infrastructure/service providers that help us run the platform.</li>
                <li>When required by law, legal process, or to protect rights and safety.</li>
                <li>In a business transfer scenario (e.g., merger/acquisition), with legal safeguards.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black">6. Data Retention</h2>
              <p>
                We keep your information for as long as your account is active or as needed to provide services,
                resolve disputes, enforce agreements, and comply with legal obligations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black">7. Security</h2>
              <p>
                We apply reasonable technical and organizational measures to protect data. No system is fully secure,
                but we continuously improve our safeguards.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black">8. Your Rights</h2>
              <p>Depending on your location, you may have rights to:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>access your data,</li>
                <li>correct inaccurate data,</li>
                <li>request deletion,</li>
                <li>object to or restrict certain processing,</li>
                <li>request data portability where applicable.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black">9. Students and Admissions Disclaimer</h2>
              <p>
                Enroll AI supports preparation workflows. We do not guarantee admissions outcomes. Final decisions are
                made by universities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will post the revised version with a new
                effective date on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black">11. Contact</h2>
              <p>
                For privacy requests, contact us at:{" "}
                <a href="mailto:privacy@enroll-ai.app" className="font-semibold underline">
                  privacy@enroll-ai.app
                </a>
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
