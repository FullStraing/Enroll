"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/loader";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { hasPendingStoredIntroQuiz, syncStoredIntroQuizToProfile } from "@/lib/intro-quiz";
import { isProfileReadyForDashboard, resolvePostAuthDestination } from "@/lib/onboarding-gate";
import { RequiredMark } from "@/components/ui/required-mark";
import { RuntimeNotice } from "@/components/runtime-notice";
import { fetchRuntimeConfig, type RuntimeConfig } from "@/lib/runtime-config";

export default function LoginPage() {
  const router = useRouter();
  const { setSession, status, profile } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchRuntimeConfig()
      .then((config) => {
        if (!cancelled) setRuntimeConfig(config);
      })
      .catch(() => {
        if (!cancelled) setRuntimeConfig(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !profile) return;
    router.replace(isProfileReadyForDashboard(profile) ? "/dashboard" : "/onboarding");
  }, [profile, router, status]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const data = await apiFetch<{ access: string; refresh: string }>("/api/auth/token/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      await setSession(data.access, data.refresh);
      try {
        await syncStoredIntroQuizToProfile(data.access);
      } catch {
        if (hasPendingStoredIntroQuiz()) {
          window.location.assign("/intro-quiz?resume=1");
          return;
        }
      }
      window.location.assign(await resolvePostAuthDestination(data.access));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  const handleGoogleTokens = useCallback(async (access: string, refresh: string) => {
    await setSession(access, refresh);
    try {
      await syncStoredIntroQuizToProfile(access);
    } catch {
      if (hasPendingStoredIntroQuiz()) {
        window.location.assign("/intro-quiz?resume=1");
        return;
      }
    }
    window.location.assign(await resolvePostAuthDestination(access));
  }, [setSession]);

  const handleGoogleError = useCallback((message: string) => {
    setError(message);
  }, []);

  const googleUnavailableMessage =
    runtimeConfig?.features.google_auth_enabled === false
      ? "Google sign-in is temporarily unavailable."
      : undefined;

  return (
    <main className="theme-home mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <form onSubmit={onSubmit} className="glass w-full rounded-3xl p-6">
        <h1 className="text-2xl font-semibold">Вход</h1>
        {runtimeConfig?.features.maintenance_mode ? (
          <div className="mt-4">
            <RuntimeNotice tone="info" message="Maintenance mode is active. Core login is still available, but some features may be limited." />
          </div>
        ) : null}
        <label className="mt-4 block text-sm text-black/70">Username<RequiredMark /></label>
        <input
          className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-black placeholder:text-black/45"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Введите username"
          required
        />
        <label className="mt-4 block text-sm text-black/70">Password<RequiredMark /></label>
        <input
          type="password"
          className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-black placeholder:text-black/45"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Введите пароль"
          required
        />
        <Button disabled={pending} className="mt-6 w-full">
          {pending ? <Loader size="sm" /> : "Войти"}
        </Button>
        <GoogleAuthButton
          disabled={pending}
          onTokens={handleGoogleTokens}
          onError={handleGoogleError}
          unavailableMessage={googleUnavailableMessage}
        />
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <p className="mt-4 text-sm text-black/70">
          Нет аккаунта?{" "}
          <Link href="/register" className="font-semibold text-black underline">
            Создать
          </Link>
        </p>
      </form>
    </main>
  );
}
