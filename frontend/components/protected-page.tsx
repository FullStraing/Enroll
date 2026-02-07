"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/loader";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        await apiFetch("/api/me/", { method: "GET" }, token);
        if (mounted) setReady(true);
      } catch {
        router.replace("/login");
      }
    };

    void check();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="lg" label="Проверяем сессию..." />
      </div>
    );
  }

  return <>{children}</>;
}
