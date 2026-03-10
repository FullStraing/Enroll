"use client";

import { FormEvent, useCallback, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/loader";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { GoogleAuthButton } from "@/components/google-auth-button";

export default function LoginPage() {
  const { setSession } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

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
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  const handleGoogleTokens = useCallback(async (access: string, refresh: string) => {
    await setSession(access, refresh);
    window.location.assign("/dashboard");
  }, [setSession]);

  const handleGoogleError = useCallback((message: string) => {
    setError(message);
  }, []);

  return (
    <main className="theme-home mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <form onSubmit={onSubmit} className="glass w-full rounded-3xl p-6">
        <h1 className="text-2xl font-semibold">Вход</h1>
        <label className="mt-4 block text-sm text-black/70">Username</label>
        <input
          className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-black placeholder:text-black/45"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Введите username"
        />
        <label className="mt-4 block text-sm text-black/70">Password</label>
        <input
          type="password"
          className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-black placeholder:text-black/45"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Введите пароль"
        />
        <Button disabled={pending} className="mt-6 w-full">
          {pending ? <Loader size="sm" /> : "Войти"}
        </Button>
        <GoogleAuthButton
          disabled={pending}
          onTokens={handleGoogleTokens}
          onError={handleGoogleError}
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
