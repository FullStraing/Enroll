"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/loader";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const { setSession } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await apiFetch("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });
      const data = await apiFetch<{ access: string; refresh: string }>("/api/auth/token/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      await setSession(data.access, data.refresh);
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="theme-home mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <form onSubmit={onSubmit} className="glass w-full rounded-3xl p-6">
        <h1 className="text-2xl font-semibold">Регистрация</h1>
        <label className="mt-4 block text-sm text-black/70">Username</label>
        <input
          className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-black placeholder:text-black/45"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Введите username"
        />
        <label className="mt-4 block text-sm text-black/70">Email</label>
        <input
          type="email"
          className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-black placeholder:text-black/45"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Введите email"
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
          {pending ? <Loader size="sm" /> : "Создать аккаунт"}
        </Button>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <p className="mt-4 text-sm text-black/70">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-semibold text-black underline">
            Войти
          </Link>
        </p>
      </form>
    </main>
  );
}
