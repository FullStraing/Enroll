"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/loader";

type AiStubResponse = {
  type: string;
  message: string;
  input: Record<string, unknown>;
};

export default function CommonAppPage() {
  const [prompt, setPrompt] = useState("Хочу сильное эссе про лидерство и исследовательский опыт.");
  const [contextType, setContextType] = useState("common_app");
  const [contextId, setContextId] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AiStubResponse | null>(null);
  const [statusText, setStatusText] = useState("");

  async function generate(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;
    setPending(true);
    setStatusText("");
    try {
      const payload: Record<string, unknown> = {
        prompt,
        context_type: contextType,
      };
      if (contextId.trim()) payload.context_id = contextId.trim();
      const response = await apiFetch<AiStubResponse>("/api/ai/commonapp-draft/", { method: "POST", body: JSON.stringify(payload) }, token);
      setResult(response);
      setStatusText("Черновик обновлен.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Ошибка генерации.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Common App" subtitle="Черновики и итерации для ручного переноса в Common App.">
        <div className="grid gap-5 xl:grid-cols-[440px_1fr]">
          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Генерация черновика</h2>
            <p className="mt-2 text-sm text-white/70">В MVP нет интеграции с Common App. Здесь ты готовишь структуру и текст.</p>
            <form onSubmit={generate} className="mt-4 grid gap-3">
              <label className="text-sm text-white/70">
                Context type
                <input
                  value={contextType}
                  onChange={(event) => setContextType(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                />
              </label>
              <label className="text-sm text-white/70">
                Context id (опционально)
                <input
                  value={contextId}
                  onChange={(event) => setContextId(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                />
              </label>
              <label className="text-sm text-white/70">
                Запрос
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={7}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-70"
              >
                {pending ? <Loader size="sm" /> : null}
                <span>{pending ? "Генерируем..." : "Сгенерировать"}</span>
              </button>
            </form>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Ответ AI (stub)</h2>
            {result ? (
              <div className="mt-4 grid gap-3 text-sm">
                <p><span className="text-white/60">Type:</span> {result.type}</p>
                <p><span className="text-white/60">Message:</span> {result.message}</p>
                <div>
                  <p className="text-white/60">Input:</p>
                  <pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/85">{JSON.stringify(result.input, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/70">Сгенерируй первый черновик, чтобы увидеть ответ и payload.</p>
            )}
          </section>

          {statusText ? <p className="xl:col-span-2 text-sm text-white/70">{statusText}</p> : null}
        </div>
      </AppShell>
    </ProtectedPage>
  );
}

