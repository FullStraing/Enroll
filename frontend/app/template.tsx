import { MarketingRouteTransition } from "@/components/landing/marketing-route-transition";

export default function Template({ children }: { children: React.ReactNode }) {
  return <MarketingRouteTransition>{children}</MarketingRouteTransition>;
}
