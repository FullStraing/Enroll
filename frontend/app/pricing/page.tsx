import { cookies } from "next/headers";
import { MarketingFooter, MarketingHeader } from "@/components/landing/marketing-chrome";
import { PricingTable } from "@/components/landing/pricing-table";
import { INTRO_QUIZ_LINKED_COOKIE_KEY } from "@/lib/intro-quiz";

export default function PricingPage() {
  const token = cookies().get("enroll_session")?.value;
  const introQuizLinked = cookies().get(INTRO_QUIZ_LINKED_COOKIE_KEY)?.value === "1";
  const primaryHref = token ? "/dashboard" : introQuizLinked ? "/register" : "/intro-quiz";

  return (
    <main className="marketing-shell min-h-screen bg-transparent text-black md:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border-2 border-black bg-white shadow-[0_10px_0_#000]">
        <MarketingHeader
          initialHasSession={Boolean(token)}
          primaryHref={primaryHref}
          current="pricing"
          brandVariant="minimal"
        />
        <PricingTable initialHasSession={Boolean(token)} primaryHref={primaryHref} />
        <MarketingFooter />
      </div>
    </main>
  );
}
