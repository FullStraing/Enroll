"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { useAuth } from "@/components/auth-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { RequiredMark } from "@/components/ui/required-mark";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { useLocale } from "@/components/locale-provider";
import { getSettingsCopy } from "@/lib/settings-copy";

type PasswordStatusTone = "idle" | "success" | "error";

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-panel rounded-[28px] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="settings-card-icon inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-[-0.03em] text-[var(--enroll-fg)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--enroll-muted)]">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--enroll-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--enroll-fg)]">{value}</p>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = getSettingsCopy(locale);
  const { profile, logout: logoutSession, refreshSession } = useAuth();
  const { resolvedTheme } = useTheme();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordStatusTone, setPasswordStatusTone] = useState<PasswordStatusTone>("idle");

  const hasUsablePassword = Boolean(profile?.has_usable_password);
  const accountName = profile?.full_name || profile?.username || "N/A";
  const accountEmail = profile?.email || "N/A";
  const themeLabel = resolvedTheme === "dark" ? copy.themeDark : copy.themeLight;
  const localeLabel = locale === "ru" ? copy.languageRussian : copy.languageEnglish;

  const passwordStatusClass = useMemo(() => {
    if (passwordStatusTone === "success") {
      return "border-[var(--enroll-surface-border-strong)] bg-[color-mix(in_srgb,var(--enroll-cyan)_32%,var(--enroll-surface-inset))] text-[var(--enroll-fg)]";
    }
    if (passwordStatusTone === "error") {
      return "border-[var(--enroll-surface-border-strong)] bg-[color-mix(in_srgb,var(--enroll-orange)_26%,var(--enroll-surface-inset))] text-[var(--enroll-fg)]";
    }
    return "";
  }, [passwordStatusTone]);

  function resetPasswordStatus() {
    setPasswordStatus("");
    setPasswordStatusTone("idle");
  }

  async function handlePasswordChange(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setPasswordStatus(copy.passwordMismatch);
      setPasswordStatusTone("error");
      return;
    }

    setChangingPassword(true);
    resetPasswordStatus();
    try {
      const payload: Record<string, string> = {
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      };

      if (hasUsablePassword) {
        payload.current_password = currentPassword;
      }

      await apiFetch(
        "/api/auth/change-password/",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token,
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await refreshSession();
      setPasswordStatus(copy.passwordUpdated);
      setPasswordStatusTone("success");
    } catch (error) {
      setPasswordStatus(error instanceof Error ? error.message : copy.changePasswordFailed);
      setPasswordStatusTone("error");
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
        <div className="grid gap-5 lg:grid-cols-2">
          <SettingsCard icon={UserRound} title={copy.account} description={copy.accountHint}>
            <div className="grid gap-3">
              <InfoRow label={copy.displayName} value={accountName} />
              <InfoRow label={copy.email} value={accountEmail} />
              <div className="rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)] px-4 py-3">
                <p className="text-sm text-[var(--enroll-muted-strong)]">
                  {hasUsablePassword ? copy.emailLoginReady : copy.emailLoginMissing}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/onboarding"
                className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-4 text-sm font-semibold text-[var(--enroll-fg)] transition hover:bg-[color-mix(in_srgb,var(--enroll-fg)_5%,var(--enroll-surface-elevated))]"
              >
                {copy.editProfile}
              </Link>
            </div>
          </SettingsCard>

          <SettingsCard icon={SlidersHorizontal} title={copy.preferences} description={copy.preferencesHint}>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)] px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--enroll-fg)]">{copy.theme}</p>
                    <p className="mt-1 text-sm text-[var(--enroll-muted)]">{copy.themeHint}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--enroll-muted)]">{themeLabel}</span>
                    <ThemeSwitcher />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)] px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--enroll-fg)]">{copy.language}</p>
                    <p className="mt-1 text-sm text-[var(--enroll-muted)]">{copy.languageHint}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--enroll-muted)]">{localeLabel}</span>
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard icon={ShieldCheck} title={copy.security} description={copy.securityHint}>
            <form onSubmit={handlePasswordChange} className="grid gap-4">
              {hasUsablePassword ? (
                <label className="block text-sm text-[var(--enroll-muted-strong)]">
                  <span className="font-medium text-[var(--enroll-fg)]">
                    {copy.currentPassword}
                    <RequiredMark />
                  </span>
                  <span className="mt-1 block text-sm text-[var(--enroll-muted)]">{copy.currentPasswordHint}</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value);
                      resetPasswordStatus();
                    }}
                    className="mt-3 w-full rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-3 text-[var(--enroll-fg)] outline-none focus:border-[var(--enroll-surface-border-strong)]"
                    required
                  />
                </label>
              ) : (
                <div className="rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-inset)] px-4 py-3 text-sm text-[var(--enroll-muted-strong)]">
                  {copy.createPasswordHint}
                </div>
              )}

              <label className="block text-sm text-[var(--enroll-muted-strong)]">
                <span className="font-medium text-[var(--enroll-fg)]">
                  {copy.newPassword}
                  <RequiredMark />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    resetPasswordStatus();
                  }}
                  className="mt-3 w-full rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-3 text-[var(--enroll-fg)] outline-none focus:border-[var(--enroll-surface-border-strong)]"
                  required
                />
              </label>

              <label className="block text-sm text-[var(--enroll-muted-strong)]">
                <span className="font-medium text-[var(--enroll-fg)]">
                  {copy.confirmPassword}
                  <RequiredMark />
                </span>
                <span className="mt-1 block text-sm text-[var(--enroll-muted)]">{copy.confirmPasswordHint}</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    resetPasswordStatus();
                  }}
                  className="mt-3 w-full rounded-2xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-4 py-3 text-[var(--enroll-fg)] outline-none focus:border-[var(--enroll-surface-border-strong)]"
                  required
                />
              </label>

              {passwordStatus ? (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${passwordStatusClass}`}>
                  {passwordStatus}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? copy.changingPassword : copy.changePassword}
                </Button>
              </div>
            </form>
          </SettingsCard>

          <SettingsCard icon={LogOut} title={copy.session} description={copy.sessionHint}>
            <Button type="button" variant="outline" onClick={handleLogout}>
              {copy.logout}
            </Button>
          </SettingsCard>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
