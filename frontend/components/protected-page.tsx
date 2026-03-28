"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader } from "@/components/loader";
import { useAuth } from "@/components/auth-provider";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, profile } = useAuth();
  const [showLoader, setShowLoader] = useState(false);
  const onboardingIncomplete =
    status === "authenticated" &&
    profile?.onboarding_completed === false &&
    pathname !== "/onboarding";

  useEffect(() => {
    if (status !== "loading") {
      setShowLoader(false);
      return;
    }
    const timer = setTimeout(() => setShowLoader(true), 250);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (onboardingIncomplete) {
      router.replace("/onboarding");
    }
  }, [onboardingIncomplete, router]);

  if ((status === "loading" && showLoader) || onboardingIncomplete) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="lg" label={onboardingIncomplete ? "Redirecting to Edit Profile..." : "Проверяем сессию..."} />
      </div>
    );
  }

  if (status === "unauthenticated" || status === "loading") {
    return null;
  }

  return <>{children}</>;
}
