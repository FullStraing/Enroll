"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/loader";

type GoogleAuthButtonProps = {
  onTokens: (access: string, refresh: string) => Promise<void>;
  onError: (message: string) => void;
  disabled?: boolean;
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

export function GoogleAuthButton({ onTokens, onError, disabled = false }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !containerRef.current) {
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
            onError("Google did not return a credential.");
            return;
          }
          setLoading(true);
          onError("");
          try {
            const data = await apiFetch<{ access: string; refresh: string }>("/api/auth/google/", {
              method: "POST",
              body: JSON.stringify({ id_token: credential }),
            });
            await onTokens(data.access, data.refresh);
          } catch (err) {
            onError(err instanceof Error ? err.message : "Google sign in failed");
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
        locale: "ru",
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
    script.onerror = () => onError("Failed to load Google Sign-In.");
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [clientId, onError, onTokens]);

  if (!clientId) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className={disabled || loading ? "pointer-events-none opacity-70" : ""} ref={containerRef} />
      {loading ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-black/70">
          <Loader size="sm" />
          <span>Проверяем Google аккаунт...</span>
        </div>
      ) : null}
    </div>
  );
}
