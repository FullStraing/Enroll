"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { saveTokens } from "@/lib/auth";
import { Loader } from "@/components/loader";

export default function LoginPage() {
  const router = useRouter();
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
      saveTokens(data.access, data.refresh);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <form onSubmit={onSubmit} className="glass w-full rounded-3xl p-6">
        <h1 className="text-2xl font-semibold">Вход</h1>
        <label className="mt-4 block text-sm text-white/70">Username</label>
        <input className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} />
        <label className="mt-4 block text-sm text-white/70">Password</label>
        <input type="password" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={pending} className="mt-6 flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 font-semibold disabled:opacity-70">
          {pending ? <Loader size="sm" /> : "Войти"}
        </button>
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        <p className="mt-4 text-sm text-white/70">Нет аккаунта? <Link href="/register" className="text-blue-300">Создать</Link></p>
      </form>
    </main>
  );
}
