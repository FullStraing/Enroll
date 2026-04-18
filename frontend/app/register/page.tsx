"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { useLocale, useMessages } from "@/components/locale-provider";
import { Loader } from "@/components/loader";
import { RuntimeNotice } from "@/components/runtime-notice";
import { RequiredMark } from "@/components/ui/required-mark";
import { Button } from "@/components/ui/button";
import { FieldError, FormFeedback } from "@/components/ui/form-feedback";
import { ApiError, apiFetch } from "@/lib/api";
import { getAuthFlowCopy } from "@/lib/auth-copy";
import { parseFormErrors, resolveFormErrorMessage } from "@/lib/form-errors";
import { hasPendingStoredIntroQuiz, syncStoredIntroQuizToProfile } from "@/lib/intro-quiz";
import { isProfileReadyForDashboard, resolvePostAuthDestination } from "@/lib/onboarding-gate";
import { trackProductEvent } from "@/lib/product-analytics";
import { fetchRuntimeConfig, type RuntimeConfig } from "@/lib/runtime-config";
import { cn } from "@/lib/utils";

type RegisterStartResponse = {
  verification_required: boolean;
  resend_available_in_seconds: number;
  expires_in_seconds: number;
};

type RegisterVerifyResponse = {
  access: string;
  refresh: string;
};

type PendingVerificationState = {
  username: string;
  email: string;
  resendAvailableAt: number;
  expiresAt: number;
};

const PENDING_REGISTRATION_KEY = "enroll_pending_registration";

function readPendingVerificationState(): PendingVerificationState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(PENDING_REGISTRATION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PendingVerificationState;
    if (!parsed?.email || !parsed?.username || !parsed?.resendAvailableAt || !parsed?.expiresAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePendingVerificationState(value: PendingVerificationState | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!value) {
    window.sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
    return;
  }

  window.sessionStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(value));
}

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function RegisterPage() {
  const messages = useMessages();
  const { locale } = useLocale();
  const authCopy = useMemo(() => getAuthFlowCopy(locale), [locale]);
  const router = useRouter();
  const { setSession, status, profile } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingAction, setPendingAction] = useState<"start" | "verify" | "resend" | "google" | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | null>(null);
  const [verificationState, setVerificationState] = useState<PendingVerificationState | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);

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
    const restored = readPendingVerificationState();
    if (!restored) {
      return;
    }

    setUsername(restored.username);
    setEmail(restored.email);
    setVerificationState(restored);
    setRestoredFromStorage(true);
  }, []);

  useEffect(() => {
    if (!verificationState) {
      return;
    }

    const timer = window.setInterval(() => {
      setClock(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [verificationState]);

  useEffect(() => {
    if (status !== "authenticated" || !profile) {
      return;
    }
    router.replace(isProfileReadyForDashboard(profile) ? "/dashboard" : "/onboarding");
  }, [profile, router, status]);

  const registrationDisabled = runtimeConfig?.features.registration_enabled === false;
  const verificationStep = verificationState !== null;
  const registrationBlocked = registrationDisabled && !verificationStep;
  const resendCountdown = verificationState
    ? Math.max(0, Math.ceil((verificationState.resendAvailableAt - clock) / 1000))
    : 0;
  const expiryCountdown = verificationState
    ? Math.max(0, Math.ceil((verificationState.expiresAt - clock) / 1000))
    : 0;
  const googleUnavailableMessage = registrationBlocked
    ? messages.auth.googleCreationUnavailable
    : runtimeConfig?.features.google_auth_enabled === false
      ? messages.auth.googleUnavailable
      : undefined;

  const setPendingVerification = useCallback(
    (nextState: PendingVerificationState | null) => {
      setVerificationState(nextState);
      writePendingVerificationState(nextState);
    },
    [],
  );

  const applyParsedErrors = useCallback(
    (parsed: ReturnType<typeof parseFormErrors>, fallback: string) => {
      setFieldErrors(parsed.fieldErrors);
      setError(resolveFormErrorMessage(parsed, fallback));
    },
    [],
  );

  const finishAuthenticatedFlow = useCallback(async (access: string, refresh: string) => {
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

  async function onStartRegistration(event: FormEvent) {
    event.preventDefault();

    if (registrationBlocked) {
      setError(messages.auth.registrationDisabled);
      return;
    }

    setPendingAction("start");
    setError("");
    setInfo("");
    setFieldErrors({});

    try {
      void trackProductEvent("signup_started", { source: "password" });
      const response = await apiFetch<RegisterStartResponse>("/api/auth/register/start/", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });

      const nextState: PendingVerificationState = {
        username: username.trim(),
        email: email.trim(),
        resendAvailableAt: Date.now() + response.resend_available_in_seconds * 1000,
        expiresAt: Date.now() + response.expires_in_seconds * 1000,
      };
      setPendingVerification(nextState);
      setPassword("");
      setCode("");
      setRestoredFromStorage(false);
      setInfo(authCopy.verificationSent);
    } catch (err) {
      const parsed = parseFormErrors(err, ["username", "email", "password"]);
      applyParsedErrors(parsed, err instanceof Error ? err.message : messages.auth.registerFailed);
    } finally {
      setPendingAction(null);
    }
  }

  async function onVerifyCode(event: FormEvent) {
    event.preventDefault();
    if (!verificationState) {
      return;
    }

    setPendingAction("verify");
    setError("");
    setInfo("");
    setFieldErrors({});

    try {
      const data = await apiFetch<RegisterVerifyResponse>("/api/auth/register/verify/", {
        method: "POST",
        body: JSON.stringify({
          email: verificationState.email,
          code,
        }),
      });
      setPendingVerification(null);
      await finishAuthenticatedFlow(data.access, data.refresh);
    } catch (err) {
      const parsed = parseFormErrors(err, ["code", "email"]);
      applyParsedErrors(parsed, err instanceof Error ? err.message : authCopy.verifyFailed);
    } finally {
      setPendingAction(null);
    }
  }

  async function onResendCode() {
    if (!verificationState || resendCountdown > 0) {
      return;
    }

    setPendingAction("resend");
    setError("");
    setInfo("");
    setFieldErrors({});

    try {
      const response = await apiFetch<RegisterStartResponse & { detail?: string }>("/api/auth/register/resend-code/", {
        method: "POST",
        body: JSON.stringify({ email: verificationState.email }),
      });

      const nextState: PendingVerificationState = {
        ...verificationState,
        resendAvailableAt: Date.now() + response.resend_available_in_seconds * 1000,
        expiresAt: Date.now() + response.expires_in_seconds * 1000,
      };
      setPendingVerification(nextState);
      setInfo(response.detail || authCopy.verificationSent);
    } catch (err) {
      if (err instanceof ApiError) {
        const retryAfter = (err.data as { retry_after_seconds?: number } | null)?.retry_after_seconds;
        if (typeof retryAfter === "number" && retryAfter > 0) {
          setPendingVerification({
            ...verificationState,
            resendAvailableAt: Date.now() + retryAfter * 1000,
          });
        }
      }
      const parsed = parseFormErrors(err, ["email"]);
      applyParsedErrors(parsed, err instanceof Error ? err.message : authCopy.verifyFailed);
    } finally {
      setPendingAction(null);
    }
  }

  const handleGoogleTokens = useCallback(
    async (access: string, refresh: string) => {
      await finishAuthenticatedFlow(access, refresh);
    },
    [finishAuthenticatedFlow],
  );

  const handleGoogleError = useCallback((message: string) => {
    setFieldErrors({});
    setError(message);
  }, []);

  function resetToDetailsStep() {
    setPendingVerification(null);
    setCode("");
    setError("");
    setInfo("");
    setFieldErrors({});
    setRestoredFromStorage(false);
  }

  const inputClassName = (hasError: boolean) =>
    cn(
      "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-black placeholder:text-black/45 disabled:cursor-not-allowed disabled:bg-black/[0.03]",
      hasError ? "border-[#d93025] focus:border-[#d93025]" : "border-black/20",
    );

  const title = verificationStep ? authCopy.verifyTitle : messages.auth.registerTitle;

  return (
    <main className="marketing-shell theme-home mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <form
        onSubmit={verificationStep ? onVerifyCode : onStartRegistration}
        className="glass w-full rounded-3xl p-6"
      >
        <div className="mb-4 flex justify-end">
          <Link
            href="/"
            className="text-sm font-semibold text-black/70 underline underline-offset-2 transition hover:text-black"
          >
            {messages.common.backHome}
          </Link>
        </div>

        <h1 className="text-2xl font-semibold">{title}</h1>

        {registrationBlocked ? (
          <div className="mt-4">
            <RuntimeNotice message={messages.auth.registrationDisabled} />
          </div>
        ) : runtimeConfig?.features.maintenance_mode ? (
          <div className="mt-4">
            <RuntimeNotice tone="info" message={messages.auth.maintenanceRegister} />
          </div>
        ) : null}

        {verificationStep ? (
          <>
            <div className="mt-4 rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-3 text-sm text-[var(--enroll-fg-soft)]">
              <p className="font-semibold text-[var(--enroll-fg)]">{authCopy.verificationSent}</p>
              <p className="mt-1">
                {authCopy.emailSentTo} <span className="font-semibold text-[var(--enroll-fg)]">{verificationState.email}</span>
              </p>
              <p className="mt-2">
                {authCopy.verificationExpiresIn} <span className="font-semibold text-[var(--enroll-fg)]">{formatDuration(expiryCountdown)}</span>
              </p>
            </div>

            {restoredFromStorage ? (
              <div className="mt-4">
                <RuntimeNotice tone="info" message={authCopy.verificationRestore} />
              </div>
            ) : null}

            <label className="mt-4 block text-sm text-black/70">
              {authCopy.verificationCode}
              <RequiredMark />
            </label>
            <input
              className={inputClassName(Boolean(fieldErrors.code))}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setFieldErrors((current) => ({ ...current, code: "" }));
              }}
              placeholder={authCopy.verificationCodePlaceholder}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              disabled={pendingAction !== null}
            />
            <FieldError message={fieldErrors.code} />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                disabled={pendingAction !== null || code.length !== 6}
                className="w-full sm:flex-1"
              >
                {pendingAction === "verify" ? <Loader size="sm" /> : authCopy.verifyEmail}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetToDetailsStep}
                disabled={pendingAction !== null}
                className="w-full sm:w-auto"
              >
                {authCopy.editRegistrationDetails}
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-3 text-sm text-[var(--enroll-fg-soft)]">
              {resendCountdown > 0 ? (
                <p>
                  {authCopy.resendAvailableIn}{" "}
                  <span className="font-semibold text-[var(--enroll-fg)]">{formatDuration(resendCountdown)}</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={onResendCode}
                  disabled={pendingAction !== null}
                  className="font-semibold text-[var(--enroll-fg)] underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingAction === "resend" ? <Loader size="sm" /> : authCopy.resendCode}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
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
              disabled={pendingAction !== null || registrationBlocked}
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
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((current) => ({ ...current, email: "" }));
              }}
              placeholder={messages.auth.emailPlaceholder}
              required
              disabled={pendingAction !== null || registrationBlocked}
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
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((current) => ({ ...current, password: "" }));
              }}
              placeholder={messages.auth.passwordPlaceholder}
              required
              disabled={pendingAction !== null || registrationBlocked}
            />
            <FieldError message={fieldErrors.password} />

            <Button disabled={pendingAction !== null || registrationBlocked} className="mt-6 w-full">
              {pendingAction === "start" ? <Loader size="sm" /> : authCopy.sendVerificationCode}
            </Button>

            <GoogleAuthButton
              disabled={pendingAction !== null || registrationBlocked}
              onTokens={handleGoogleTokens}
              onError={handleGoogleError}
              unavailableMessage={googleUnavailableMessage}
              onBeforeExchange={() => trackProductEvent("signup_started", { source: "google" })}
            />
          </>
        )}

        <FormFeedback tone="success" message={info} />
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
