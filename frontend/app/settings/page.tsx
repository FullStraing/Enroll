"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken, clearTokens } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/loader";

type ProfileForm = {
  full_name: string;
  country: string;
  school_name: string;
  graduation_year: number | null;
  intended_major: string;
  budget_range: string;
  activities_level: string;
  target_country: string;
};

const initialForm: ProfileForm = {
  full_name: "",
  country: "",
  school_name: "",
  graduation_year: null,
  intended_major: "",
  budget_range: "",
  activities_level: "low",
  target_country: "USA",
};

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [statusText, setStatusText] = useState("");

  async function loadProfile() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const profile = await apiFetch<Partial<ProfileForm>>("/api/auth/profile/", { method: "GET" }, token);
      setForm({
        ...initialForm,
        ...profile,
        graduation_year: profile.graduation_year ?? null,
      });
      setStatusText("");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось загрузить профиль.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;
    setSavingProfile(true);
    try {
      await apiFetch("/api/auth/profile/", { method: "PUT", body: JSON.stringify(form) }, token);
      setStatusText("Профиль обновлен.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось сохранить профиль.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;
    if (!oldPassword || !newPassword) {
      setStatusText("Заполните текущий и новый пароль.");
      return;
    }
    setChangingPassword(true);
    try {
      await apiFetch("/api/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      }, token);
      setOldPassword("");
      setNewPassword("");
      setStatusText("Пароль изменен.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Не удалось изменить пароль.");
    } finally {
      setChangingPassword(false);
    }
  }

  function logout() {
    clearTokens();
    router.push("/");
  }

  return (
    <ProtectedPage>
      <AppShell title="Настройки" subtitle="Профиль, безопасность и управление сессией.">
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Профиль</h2>
            {loading ? (
              <div className="mt-4 flex justify-center py-6">
                <Loader size="md" label="Загружаем профиль..." />
              </div>
            ) : (
              <form onSubmit={saveProfile} className="mt-4 grid gap-3">
                <label className="text-sm text-white/70">
                  Полное имя
                  <input value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
                </label>
                <label className="text-sm text-white/70">
                  Страна
                  <input value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
                </label>
                <label className="text-sm text-white/70">
                  Школа
                  <input value={form.school_name} onChange={(event) => setForm((prev) => ({ ...prev, school_name: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
                </label>
                <label className="text-sm text-white/70">
                  Год выпуска
                  <input
                    type="number"
                    value={form.graduation_year ?? ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, graduation_year: event.target.value ? Number(event.target.value) : null }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-white/70">
                  Intended major
                  <input value={form.intended_major} onChange={(event) => setForm((prev) => ({ ...prev, intended_major: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
                </label>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-70"
                >
                  {savingProfile ? <Loader size="sm" /> : null}
                  <span>{savingProfile ? "Сохраняем..." : "Сохранить профиль"}</span>
                </button>
              </form>
            )}
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Безопасность</h2>
            <form onSubmit={changePassword} className="mt-4 grid gap-3">
              <label className="text-sm text-white/70">
                Текущий пароль
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                />
              </label>
              <label className="text-sm text-white/70">
                Новый пароль
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                />
              </label>
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-70"
              >
                {changingPassword ? <Loader size="sm" /> : null}
                <span>{changingPassword ? "Обновляем..." : "Сменить пароль"}</span>
              </button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/65">Сессия</h3>
              <p className="mt-2 text-sm text-white/70">Выход очищает локальные токены и cookie, затем возвращает на landing.</p>
              <button onClick={logout} className="mt-3 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                Выйти из аккаунта
              </button>
            </div>
          </section>

          {statusText ? <p className="xl:col-span-2 text-sm text-white/70">{statusText}</p> : null}
        </div>
      </AppShell>
    </ProtectedPage>
  );
}

