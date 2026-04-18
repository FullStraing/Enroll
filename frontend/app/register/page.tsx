"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Loader } from "@/components/loader";
import { RuntimeNotice } from "@/components/runtime-notice";
import { Button } from "@/components/ui/button";
import { FieldError, FormFeedback } from "@/components/ui/form-feedback";
import { RequiredMark } from "@/components/ui/required-mark";
import { useMessages } from "@/components/locale-provider";
import { apiFetch } from "@/lib/api";
import { parseFormErrors, resolveFormErrorMessage } from "@/lib/form-errors";
import { hasPendingStoredIntroQuiz, syncStoredIntroQuizToProfile } from "@/lib/intro-quiz";
import { isProfileReadyForDashboard, resolvePostAuthDestination } from "@/lib/onboarding-gate";
import { trackProductEvent } from "@/lib/product-analytics";
import { fetchRuntimeConfig, type RuntimeConfig } from "@/lib/runtime-config";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const messages = useMessages();
  const router = useRouter();
  const { setSession, status, profile } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchRuntimeConfig()
      .then((config) => {
        if (!cancelled) {
          setRuntimeConfig(config);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRuntimeConfig(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !profile) {
      return;
    }
    router.replace(isProfileReadyForDashboard(profile) ? "/dashboard" : "/onboarding");
  }, [profile, router, status]);

  const applyParsedErrors = useCallback((errorValue: unknown) => {
    const parsed = parseFormErrors(errorValue, ["username", "email", "password"]);
    setFieldErrors(parsed.fieldErrors);
    setError(resolveFormErrorMessage(parsed, errorValue instanceof Error ? errorValue.message : messages.auth.registerFailed));
  }, [messages.auth.registerFailed]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (runtimeConfig?.features.registration_enabled === false) {
      setError(messages.auth.registrationDisabled);
      return;
    }

    setPending(true);
    setError("");
    setFieldErrors({});

    try {
      void trackProductEvent("signup_started", { source: "password" });
      await apiFetch("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });

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
    } catch (errorValue) {
      applyParsedErrors(errorValue);
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

  const registrationDisabled = runtimeConfig?.features.registration_enabled === false;
  const googleUnavailableMessage = registrationDisabled
    ? messages.auth.googleCreationUnavailable
    : runtimeConfig?.features.google_auth_enabled === false
      ? messages.auth.googleUnavailable
      : undefined;

  const inputClassName = (hasError: boolean) =>
    cn(
      "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-black placeholder:text-black/45 disabled:cursor-not-allowed disabled:bg-black/[0.03]",
      hasError ? "border-[#d93025] focus:border-[#d93025]" : "border-black/20",
    );

  return (
    <main className="marketing-shell theme-home mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <form onSubmit={onSubmit} className="glass w-full rounded-3xl p-6">
        <div className="mb-4 flex justify-end">
          <Link
            href="/"
            className="text-sm font-semibold text-black/70 underline underline-offset-2 transition hover:text-black"
          >
            {messages.common.backHome}
          </Link>
        </div>

        <h1 className="text-2xl font-semibold">{messages.auth.registerTitle}</h1>

        {registrationDisabled ? (
          <div className="mt-4">
            <RuntimeNotice message={messages.auth.registrationDisabled} />
          </div>
        ) : runtimeConfig?.features.maintenance_mode ? (
          <div className="mt-4">
            <RuntimeNotice tone="info" message={messages.auth.maintenanceRegister} />
          </div>
        ) : null}

        <label className="mt-4 block text-sm text-black/70">
          {messages.auth.username}
          <RequiredMark />
        </label>
        <input
          className={inputClassName(Boolean(fieldErrors.username))}
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setFieldErrors((current) => ({ ...current, username: "" }));
          }}
          placeholder={messages.auth.usernamePlaceholder}
          required
          disabled={pending || registrationDisabled}
        />
        <FieldError message={fieldErrors.username} />

        <label className="mt-4 block text-sm text-black/70">
          {messages.auth.email}
          <RequiredMark />
        </label>
        <input
          type="email"
          className={inputClassName(Boolean(fieldErrors.email))}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => ({ ...current, email: "" }));
          }}
          placeholder={messages.auth.emailPlaceholder}
          required
          disabled={pending || registrationDisabled}
        />
        <FieldError message={fieldErrors.email} />

        <label className="mt-4 block text-sm text-black/70">
          {messages.auth.password}
          <RequiredMark />
        </label>
        <input
          type="password"
          className={inputClassName(Boolean(fieldErrors.password))}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: "" }));
          }}
          placeholder={messages.auth.passwordPlaceholder}
          required
          disabled={pending || registrationDisabled}
        />
        <FieldError message={fieldErrors.password} />

        <Button disabled={pending || registrationDisabled} className="mt-6 w-full">
          {pending ? <Loader size="sm" /> : messages.auth.createAccount}
        </Button>

        <GoogleAuthButton
          disabled={pending || registrationDisabled}
          onTokens={handleGoogleTokens}
          onError={handleGoogleError}
          unavailableMessage={googleUnavailableMessage}
          onBeforeExchange={() => trackProductEvent("signup_started", { source: "google" })}
        />

        <FormFeedback tone="error" message={error} />

        <p className="mt-4 text-sm text-black/70">
          {messages.auth.alreadyAccount}{" "}
          <Link href="/login" className="font-semibold text-black underline">
            {messages.common.login}
          </Link>
        </p>
      </form>
    </main>
  );
}
