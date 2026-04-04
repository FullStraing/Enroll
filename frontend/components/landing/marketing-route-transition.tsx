"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function isMarketingPath(pathname: string) {
  return pathname === "/" || pathname.startsWith("/product") || pathname.startsWith("/pricing") || pathname.startsWith("/pilot");
}

export function MarketingRouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const marketingPath = useMemo(() => isMarketingPath(pathname), [pathname]);
  const [showOverlay, setShowOverlay] = useState(marketingPath);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!marketingPath || reduceMotion) {
      setShowOverlay(false);
      return;
    }

    setShowOverlay(true);
    const timeout = window.setTimeout(() => setShowOverlay(false), 420);
    return () => window.clearTimeout(timeout);
  }, [marketingPath, pathname, reduceMotion]);

  if (!marketingPath) {
    return <>{children}</>;
  }

  return (
    <div className={reduceMotion ? "" : "marketing-route-enter"}>
      {children}
      {showOverlay && !reduceMotion ? <div className="marketing-route-overlay pointer-events-none fixed inset-0 z-[120]" /> : null}
    </div>
  );
}
