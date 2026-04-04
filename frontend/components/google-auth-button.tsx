"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@/components/loader";
import { useLocale, useMessages } from "@/components/locale-provider";
import { apiFetch } from "@/lib/api";

type GoogleAuthButtonProps = {
  onTokens: (access: string, refresh: string) => Promise<void>;
  onError: (message: string) => void;
  disabled?: boolean;
  unavailableMessage?: string;
  onBeforeExchange?: () => void | Promise<void>;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "pill" | "rectangular";
              width?: string;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

export function GoogleAuthButton({
  onTokens,
  onError,
  disabled = false,
  unavailableMessage,
  onBeforeExchange,
}: GoogleAuthButtonProps) {
  const { locale } = useLocale();
  const messages = useMessages();
  const [loading, setLoading] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (unavailableMessage || !clientId || !containerRef.current) {
      return;
    }

    let cancelled = false;
    const scriptId = "google-identity-services";

    const initGoogle = () => {
      if (!window.google || !containerRef.current || cancelled) {
        return;
      }
      containerRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) {
            onError(messages.auth.googleNoCredential);
            return;
          }
          setLoading(true);
          onError("");
          try {
            if (onBeforeExchange) {
              await onBeforeExchange();
            }
            const data = await apiFetch<{ access: string; refresh: string }>("/api/auth/google/", {
              method: "POST",
              body: JSON.stringify({ id_token: credential }),
            });
            await onTokens(data.access, data.refresh);
          } catch (err) {
            onError(err instanceof Error ? err.message : messages.auth.googleUnavailable);
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: "320",
        locale,
      });
    };

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    script.onerror = () => {
      setScriptFailed(true);
      onError(messages.auth.googleLoadFailed);
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [clientId, locale, messages.auth.googleLoadFailed, messages.auth.googleNoCredential, messages.auth.googleUnavailable, onBeforeExchange, onError, onTokens, unavailableMessage]);

  return (
    <div className="mt-4">
      {unavailableMessage ? (
        <div className="rounded-xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-3 text-sm text-[var(--enroll-muted)]">{unavailableMessage}</div>
      ) : clientId ? (
        <div className={disabled || loading ? "pointer-events-none opacity-70" : ""} ref={containerRef} />
      ) : (
        <div className="rounded-xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-3 text-sm text-[var(--enroll-muted)]">{messages.auth.googleEnvMissing}</div>
      )}
      {scriptFailed ? <p className="mt-2 text-sm text-red-600">{messages.auth.googleLoadFailed}</p> : null}
      {loading ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-[var(--enroll-muted)]">
          <Loader size="sm" />
          <span>{messages.auth.checkingGoogle}</span>
        </div>
      ) : null}
    </div>
  );
}
