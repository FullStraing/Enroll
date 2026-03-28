import { LegalPageShell } from "@/components/legal/legal-page-shell";

const effectiveDate = "March 26, 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      effectiveDate={effectiveDate}
      description="This policy explains what data Enroll collects, how we use it, and how we protect student information across planning, documents, essays, AI features, and admissions workflows."
    >
      <section>
        <h2 className="text-xl font-black">1. Who We Are</h2>
        <p>
          Enroll (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is an admissions planning platform for students applying to
          universities abroad. We provide workflow tools such as profile setup, deadlines, universities, documents,
          tasks, community spaces, and essay organization.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">2. Information We Collect</h2>
        <p>We may collect the following categories of information:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Account data: username, email, full name, and password hash.</li>
          <li>Profile data: academic details, intake, country, major, and other admissions planning fields.</li>
          <li>Application planning data: universities, deadlines, tasks, and dashboard-related progress data.</li>
          <li>Document data: uploaded files, file metadata, and optional university linkage.</li>
          <li>Essay data: drafts, versions, AI prompts, and related editing metadata.</li>
          <li>Community data: chat messages, posts, comments, and moderation reports you submit.</li>
          <li>Technical data: IP address, browser/device details, and operational logs used for security and debugging.</li>
          <li>Essential cookie/local storage data used for authentication and progress continuity.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black">3. How We Use Your Information</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>To create and manage your account.</li>
          <li>To provide core product features and save your progress.</li>
          <li>To power AI-assisted essay workflows when you request them.</li>
          <li>To secure the platform, prevent abuse, and moderate community features.</li>
          <li>To improve product quality, reliability, and support.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black">4. Cookies and Local Storage</h2>
        <p>We currently use essential storage items for core functionality, including:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>`enroll_session` for authenticated app bootstrap routing.</li>
          <li>`enroll_intro_quiz_done` and related local state to preserve onboarding continuity.</li>
          <li>session/local storage keys for temporary workflow continuity, such as essays, tasks, and dashboard state.</li>
        </ul>
        <p>
          These items are used to operate the service. If analytics, marketing cookies, or payment-related trackers are
          added later, this policy will be updated.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">5. AI Features</h2>
        <p>
          When you use AI-powered essay tools, the relevant essay prompt, draft context, and selected text may be sent
          to our configured AI provider to generate responses. We use that data only to provide the requested feature
          and to operate the platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">6. Data Sharing</h2>
        <p>We do not sell your personal data. We may share data only when necessary:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>With infrastructure and software providers that help run the platform.</li>
          <li>With AI providers when you explicitly use AI features.</li>
          <li>When required by law or to protect rights, safety, and platform integrity.</li>
          <li>In a business transfer scenario, subject to legal safeguards.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black">7. Data Retention</h2>
        <p>
          We keep your information for as long as your account is active or as needed to provide services, resolve
          disputes, enforce agreements, and comply with legal obligations.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">8. Security</h2>
        <p>
          We apply reasonable technical and organizational safeguards to protect account, document, and admissions
          workflow data. No system is fully secure, but we continuously improve our controls.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">9. Your Rights</h2>
        <p>Depending on your location, you may have rights to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>access your personal data,</li>
          <li>correct inaccurate information,</li>
          <li>request deletion,</li>
          <li>object to or restrict certain processing,</li>
          <li>request portability where applicable.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black">10. Admissions Disclaimer</h2>
        <p>
          Enroll supports preparation workflows only. We do not guarantee admission, scholarships, visas, or other
          academic outcomes. Final decisions are made by universities and other institutions.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. The latest version and effective date will always be
          posted on this page.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black">12. Contact</h2>
        <p>
          For privacy requests, contact us at{" "}
          <a href="mailto:privacy@enroll-ai.app" className="font-semibold underline">
            privacy@enroll-ai.app
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
