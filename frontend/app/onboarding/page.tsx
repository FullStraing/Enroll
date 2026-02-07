"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type ProfilePayload = {
  full_name: string;
  country: string;
  school_name: string;
  graduation_year: number | null;
  intended_major: string;
  budget_range: string;
  target_country: string;
  activities_level: string;
};

const emptyForm: ProfilePayload = {
  full_name: "",
  country: "",
  school_name: "",
  graduation_year: null,
  intended_major: "",
  budget_range: "",
  target_country: "USA",
  activities_level: "low",
};

export default function OnboardingPage() {
  const [form, setForm] = useState<ProfilePayload>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  async function loadProfile() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setStatus("Загружаем профиль...");
    try {
      const profile = await apiFetch<Partial<ProfilePayload>>("/api/auth/profile/", { method: "GET" }, token);
      setForm({
        ...emptyForm,
        ...profile,
        graduation_year: profile.graduation_year ?? null,
        target_country: profile.target_country || "USA",
        activities_level: profile.activities_level || "low",
      });
      setStatus("Профиль загружен.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setStatus("Сохраняем профиль...");
    try {
      await apiFetch("/api/auth/profile/", {
        method: "PUT",
        body: JSON.stringify(form),
      }, token);
      setStatus("Профиль сохранен.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Onboarding" subtitle="Capture the core profile needed for admissions planning.">
        <form onSubmit={saveProfile} className="grid gap-5">
          <div className="glass rounded-2xl p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name" value={form.full_name} onChange={(value) => setForm((prev) => ({ ...prev, full_name: value }))} />
              <Field label="Country" value={form.country} onChange={(value) => setForm((prev) => ({ ...prev, country: value }))} />
              <Field label="School name" value={form.school_name} onChange={(value) => setForm((prev) => ({ ...prev, school_name: value }))} />
              <Field
                label="Graduation year"
                value={form.graduation_year ? String(form.graduation_year) : ""}
                onChange={(value) => setForm((prev) => ({ ...prev, graduation_year: value ? Number(value) : null }))}
                type="number"
              />
              <Field label="Intended major" value={form.intended_major} onChange={(value) => setForm((prev) => ({ ...prev, intended_major: value }))} />
              <SelectField
                label="Budget range"
                value={form.budget_range}
                onChange={(value) => setForm((prev) => ({ ...prev, budget_range: value }))}
                options={["", "low", "medium", "high"]}
              />
              <Field label="Target country" value={form.target_country} onChange={(value) => setForm((prev) => ({ ...prev, target_country: value }))} />
              <SelectField
                label="Activities level"
                value={form.activities_level}
                onChange={(value) => setForm((prev) => ({ ...prev, activities_level: value }))}
                options={["low", "medium", "high"]}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={loadProfile} disabled={loading} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60">
                {loading ? "Loading..." : "Load profile"}
              </button>
              <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60">
                {saving ? "Saving..." : "Save profile"}
              </button>
            </div>
            {status ? <p className="mt-3 text-sm text-white/70">{status}</p> : null}
          </div>
        </form>
      </AppShell>
    </ProtectedPage>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="text-sm text-white/75">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="text-sm text-white/75">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
        {options.map((option) => (
          <option key={option || "empty"} value={option} className="bg-[#0b1020]">
            {option || "-"}
          </option>
        ))}
      </select>
    </label>
  );
}
