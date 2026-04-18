"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/loader";
import { useAuth } from "@/components/auth-provider";
import { useMessages } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { hasPendingStoredIntroQuiz, syncStoredIntroQuizToProfile } from "@/lib/intro-quiz";
import { isProfileReadyForDashboard, resolvePostAuthDestination } from "@/lib/onboarding-gate";
import { RequiredMark } from "@/components/ui/required-mark";
import { RuntimeNotice } from "@/components/runtime-notice";
import { FieldError, FormFeedback } from "@/components/ui/form-feedback";
import { fetchRuntimeConfig, type RuntimeConfig } from "@/lib/runtime-config";
import { parseFormErrors, resolveFormErrorMessage } from "@/lib/form-errors";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const messages = useMessages();
  const router = useRouter();
  const { setSession, status, profile } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | null>(null);

  const applyParsedErrors = useCallback(
    (parsed: ReturnType<typeof parseFormErrors>, fallback: string) => {
      setFieldErrors(parsed.fieldErrors);
      setError(resolveFormErrorMessage(parsed, fallback));
    },
    [],
  );

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
    setFieldErrors({});
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
      const parsed = parseFormErrors(err, ["username", "password"]);
      applyParsedErrors(parsed, err instanceof Error ? err.message : messages.auth.loginFailed);
    } finally {
      setPending(false);
    }
  }

  const handleGoogleTokens = useCallback(
    async (access: string, refresh: string) => {
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
    },
    [setSession],
  );

  const handleGoogleError = useCallback((message: string) => {
    setFieldErrors({});
    setError(message);
  }, []);

  const inputClassName = (hasError: boolean) =>
    cn(
      "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-black placeholder:text-black/45",
      hasError ? "border-[#d93025] focus:border-[#d93025]" : "border-black/20",
    );

  const googleUnavailableMessage =
    runtimeConfig?.features.google_auth_enabled === false ? messages.auth.googleUnavailable : undefined;

  return (
    <main className="marketing-shell theme-home mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <form onSubmit={onSubmit} className="glass w-full rounded-3xl p-6">
        <div className="mb-4 flex justify-end">
          <Link href="/" className="text-sm font-semibold text-black/70 underline underline-offset-2 transition hover:text-black">
            {messages.common.backHome}
          </Link>
        </div>

        <h1 className="text-2xl font-semibold">{messages.auth.loginTitle}</h1>

        {runtimeConfig?.features.maintenance_mode ? (
          <div className="mt-4">
            <RuntimeNotice tone="info" message={messages.auth.maintenanceLogin} />
          </div>
        ) : null}

        <label className="mt-4 block text-sm text-black/70">
          {messages.auth.username}
          <RequiredMark />
        </label>
        <input
          className={inputClassName(Boolean(fieldErrors.username))}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setFieldErrors((current) => ({ ...current, username: "" }));
          }}
          placeholder={messages.auth.usernamePlaceholder}
          required
        />
        <FieldError message={fieldErrors.username} />

        <label className="mt-4 block text-sm text-black/70">
          {messages.auth.password}
          <RequiredMark />
        </label>
        <input
          type="password"
          className={inputClassName(Boolean(fieldErrors.password))}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((current) => ({ ...current, password: "" }));
          }}
          placeholder={messages.auth.passwordPlaceholder}
          required
        />
        <FieldError message={fieldErrors.password} />

        <Button disabled={pending} className="mt-6 w-full">
          {pending ? <Loader size="sm" /> : messages.common.login}
        </Button>

        <GoogleAuthButton
          disabled={pending}
          onTokens={handleGoogleTokens}
          onError={handleGoogleError}
          unavailableMessage={googleUnavailableMessage}
        />

        <FormFeedback tone="error" message={error} />

        <p className="mt-4 text-sm text-black/70">
          {messages.auth.noAccount}{" "}
          <Link href="/register" className="font-semibold text-black underline">
            {messages.auth.createAccount}
          </Link>
        </p>
      </form>
    </main>
  );
}
