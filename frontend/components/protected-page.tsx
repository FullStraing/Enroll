"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/loader";
import { useAuth } from "@/components/auth-provider";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();
  const [showLoader, setShowLoader] = useState(false);

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

  if (status === "loading" && showLoader) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="lg" label="Проверяем сессию..." />
      </div>
    );
  }

  if (status === "unauthenticated" || status === "loading") {
    return null;
  }

  return <>{children}</>;
}
