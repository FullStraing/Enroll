"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Loader } from "@/components/loader";
import { useAuth } from "@/components/auth-provider";
import { RequiredMark } from "@/components/ui/required-mark";
import { clearSessionCaches, readSessionCache, SESSION_CACHE_KEYS, SESSION_CACHE_TTLS, writeSessionCache } from "@/lib/session-cache";
import { getProductCopy } from "@/lib/product-copy";
import { useLocale } from "@/components/locale-provider";

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

type AnalyticsSummary = {
  totals: {
    registered_users: number;
    signup_started: number;
    signup_completed: number;
    onboarding_completed: number;
    first_task_created: number;
    first_university_added: number;
    first_essay_started: number;
  };
  recent_events: Array<{
    name: string;
    source: string;
    client_id: string;
    created_at: string;
    user__username?: string;
    user__email?: string;
  }>;
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
  const { locale } = useLocale();
  const copy = getProductCopy(locale).settings;
  const { logout: logoutSession, profile } = useAuth();
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  const loadProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const { payload: cached, isFresh } = readSessionCache<ProfileForm>(
      SESSION_CACHE_KEYS.settings,
      SESSION_CACHE_TTLS.settings,
    );

    if (cached) {
      setForm({ ...initialForm, ...cached });
      setLoading(false);
    } else {
      setLoading(true);
    }

    if (isFresh) {
      setStatusText("");
      return;
    }

    try {
      const profilePayload = await apiFetch<Partial<ProfileForm>>("/api/auth/profile/", { method: "GET" }, token);
      const nextForm = {
        ...initialForm,
        ...profilePayload,
        graduation_year: profilePayload.graduation_year ?? null,
      };
      setForm(nextForm);
      writeSessionCache(SESSION_CACHE_KEYS.settings, nextForm);
      setStatusText("");
    } catch (error) {
      if (!cached) {
        setStatusText(error instanceof Error ? error.message : copy.loadProfileFailed);
      }
    } finally {
      setLoading(false);
    }
  }, [copy.loadProfileFailed]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const token = getToken();
    if (!token || !profile?.is_staff) return;

    setAnalyticsLoading(true);
    void apiFetch<AnalyticsSummary>("/api/analytics/summary/", { method: "GET" }, token)
      .then((payload) => {
        setAnalytics(payload);
      })
      .catch(() => {
        setAnalytics(null);
      })
      .finally(() => {
        setAnalyticsLoading(false);
      });
  }, [profile?.is_staff]);

  useEffect(() => {
    if (loading) return;
    writeSessionCache(SESSION_CACHE_KEYS.settings, form);
  }, [form, loading]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;

    setSavingProfile(true);
    try {
      await apiFetch("/api/auth/profile/", { method: "PUT", body: JSON.stringify(form) }, token);
      writeSessionCache(SESSION_CACHE_KEYS.settings, form);
      clearSessionCaches([SESSION_CACHE_KEYS.dashboard, SESSION_CACHE_KEYS.activities, SESSION_CACHE_KEYS.onboarding]);
      setStatusText(copy.profileUpdated);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : copy.saveProfileFailed);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;

    if (!oldPassword || !newPassword) {
      setStatusText(copy.fillPasswords);
      return;
    }

    setChangingPassword(true);
    try {
      await apiFetch(
        "/api/auth/change-password/",
        {
          method: "POST",
          body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
        },
        token,
      );
      setOldPassword("");
      setNewPassword("");
      setStatusText(copy.passwordUpdated);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : copy.changePasswordFailed);
    } finally {
      setChangingPassword(false);
    }
  }

  function handleLogout() {
    logoutSession();
    router.push("/");
  }

  return (
    <ProtectedPage>
      <AppShell title={copy.title} subtitle={copy.subtitle}>
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">{copy.profile}</h2>
            {loading ? (
              <div className="mt-4 flex justify-center py-6">
                <Loader size="md" label={copy.loadingProfile} />
              </div>
            ) : (
              <form onSubmit={saveProfile} className="mt-4 grid gap-3">
                <label className="text-sm text-white/70">
                  {copy.fullName}
                  <input
                    value={form.full_name}
                    onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-white/70">
                  {copy.country}
                  <input
                    value={form.country}
                    onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-white/70">
                  {copy.school}
                  <input
                    value={form.school_name}
                    onChange={(event) => setForm((prev) => ({ ...prev, school_name: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-white/70">
                  {copy.graduationYear}
                  <input
                    type="number"
                    value={form.graduation_year ?? ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        graduation_year: event.target.value ? Number(event.target.value) : null,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  />
                </label>
                <label className="text-sm text-white/70">
                  {copy.intendedMajor}
                  <input
                    value={form.intended_major}
                    onChange={(event) => setForm((prev) => ({ ...prev, intended_major: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  />
                </label>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-70"
                >
                  {savingProfile ? <Loader size="sm" /> : null}
                  <span>{savingProfile ? copy.savingProfile : copy.saveProfile}</span>
                </button>
              </form>
            )}
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">{copy.security}</h2>
            <form onSubmit={changePassword} className="mt-4 grid gap-3">
              <label className="text-sm text-white/70">
                {copy.currentPassword}
                <RequiredMark />
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm text-white/70">
                {copy.newPassword}
                <RequiredMark />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-70"
              >
                {changingPassword ? <Loader size="sm" /> : null}
                <span>{changingPassword ? copy.changingPassword : copy.changePassword}</span>
              </button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/65">{copy.session}</h3>
              <p className="mt-2 text-sm text-white/70">{copy.logoutHint}</p>
              <button onClick={handleLogout} className="mt-3 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                {copy.logout}
              </button>
            </div>

            <div className="mt-8 border-t border-white/10 pt-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/65">{copy.legal}</h3>
              <p className="mt-2 text-sm text-white/70">{copy.legalHint}</p>
              <a
                href="/privacy-policy"
                className="mt-3 inline-flex rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                {copy.privacyPolicy}
              </a>
            </div>
          </section>

          {profile?.is_staff ? (
            <section className="glass rounded-2xl p-5 xl:col-span-2">
              <h2 className="text-lg font-semibold">{copy.betaAnalytics}</h2>
              {analyticsLoading ? (
                <div className="mt-4 flex justify-center py-6">
                  <Loader size="md" label={copy.loadingAnalytics} />
                </div>
              ) : analytics ? (
                <div className="mt-4 grid gap-4">
                  <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">{locale === "ru" ? "Пользователи" : "Users"}</p><p className="mt-1 text-2xl font-semibold">{analytics.totals.registered_users}</p></div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">{locale === "ru" ? "Начали регистрацию" : "Signup started"}</p><p className="mt-1 text-2xl font-semibold">{analytics.totals.signup_started}</p></div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">{locale === "ru" ? "Завершили регистрацию" : "Signup completed"}</p><p className="mt-1 text-2xl font-semibold">{analytics.totals.signup_completed}</p></div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">{locale === "ru" ? "Онбординг" : "Onboarding"}</p><p className="mt-1 text-2xl font-semibold">{analytics.totals.onboarding_completed}</p></div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">{locale === "ru" ? "Первая задача" : "First task"}</p><p className="mt-1 text-2xl font-semibold">{analytics.totals.first_task_created}</p></div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">{locale === "ru" ? "Первый университет" : "First university"}</p><p className="mt-1 text-2xl font-semibold">{analytics.totals.first_university_added}</p></div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">{locale === "ru" ? "Первое эссе" : "First essay"}</p><p className="mt-1 text-2xl font-semibold">{analytics.totals.first_essay_started}</p></div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-white/65">{copy.recentEvents}</h3>
                    <div className="mt-3 space-y-2">
                      {analytics.recent_events.length ? (
                        analytics.recent_events.map((event, index) => (
                          <div key={`${event.name}-${event.created_at}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm text-white/80">
                            <span className="font-medium">{event.name}</span>
                            <span>{event.user__username || event.user__email || event.client_id || (locale === "ru" ? "анонимно" : "anonymous")}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-white/65">{copy.noEvents}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/70">{copy.analyticsUnavailable}</p>
              )}
            </section>
          ) : null}

          {statusText ? <p className="xl:col-span-2 text-sm text-white/70">{statusText}</p> : null}
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
