"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { ProtectedPage } from "@/components/protected-page";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDateShort } from "@/lib/date-format";

type University = {
  id: number;
  name: string;
  country?: string;
  city?: string;
  state?: string;
  website_url?: string;
  source_url?: string;
  acceptance_rate?: number | null;
};

type UniversityMetric = {
  key: string;
  value_number: number | null;
  value_text: string;
  value_json: unknown;
};

type UniversitySnapshot = {
  raw_payload?: {
    standard_profile?: {
      gpa_value?: number | null;
      important_factors?: Array<{ factor_name?: string; importance_level?: string }>;
      campus_diversity?: {
        diversity_breakdown?: Array<{ group_name?: string; count?: number | null; source_text?: string }>;
      };
    };
  };
};

type UniversityDeadline = {
  id: number;
  deadline_type: string;
  deadline_date: string | null;
  deadline_text: string;
  notification_date?: string | null;
  is_rolling: boolean;
};

type GenderAdmissionsStats = {
  applied: number | null;
  accepted: number | null;
  rate: number | null;
};

type LocationContactInfo = {
  addressLines: string[];
  email: string | null;
  phone: string | null;
};

type LabeledRow = {
  label: string;
  value: string;
  value_2?: string;
  value_3?: string;
  raw?: string;
};

function asNumber(v: UniversityMetric | undefined): number | null {
  if (!v) return null;
  if (typeof v.value_number === "number") return v.value_number;
  const raw = v.value_text || "";
  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function prettyMoney(v: number | null): string {
  if (v == null) return "-";
  return `$${Math.round(v).toLocaleString()}`;
}

function factorWeight(level?: string): number {
  const l = (level || "").toLowerCase();
  if (l.includes("very")) return 100;
  if (l.includes("important")) return 78;
  if (l.includes("considered")) return 52;
  return 24;
}

function extractNumbers(text: string): number[] {
  return (text.match(/\d[\d,]*/g) || [])
    .map((item) => Number(item.replace(/,/g, "")))
    .filter((item) => Number.isFinite(item));
}

function parseGenderAdmissions(metric?: UniversityMetric): GenderAdmissionsStats {
  if (!metric || typeof metric.value_json !== "object" || metric.value_json === null) {
    return { applied: null, accepted: null, rate: null };
  }

  const payload = metric.value_json as {
    text?: string;
    acceptance_percent?: number | null;
    applicants_or_admits?: number | null;
    applied?: number | null;
    accepted?: number | null;
    tables?: Array<{ rows?: string[][] }>;
  };

  let applied: number | null = typeof payload.applied === "number" ? payload.applied : null;
  let accepted: number | null = typeof payload.accepted === "number" ? payload.accepted : null;
  let rate: number | null = typeof payload.acceptance_percent === "number" ? payload.acceptance_percent : null;

  for (const table of payload.tables || []) {
    for (const row of table.rows || []) {
      const rowText = row.join(" ").toLowerCase();
      const numbers = extractNumbers(row.join(" "));
      if (!numbers.length) continue;
      if (rowText.includes("appl")) applied = numbers[0];
      if (rowText.includes("accept")) accepted = numbers[0];
      if (rowText.includes("rate") && rate == null) rate = numbers[0];
    }
  }

  if (payload.text) {
    const textNumbers = extractNumbers(payload.text);
    if (applied == null && textNumbers.length >= 1) applied = textNumbers[0];
    if (accepted == null && textNumbers.length >= 2) accepted = textNumbers[1];
    if (rate == null) {
      const pct = payload.text.match(/([0-9]{1,3})\s*%/);
      if (pct) rate = Number(pct[1]);
    }
  }

  if (applied == null && typeof payload.applicants_or_admits === "number") {
    applied = payload.applicants_or_admits;
  }
  if (accepted == null && applied != null && rate != null) {
    accepted = Math.round((applied * rate) / 100);
  }
  // Prefer computed rate from applied/accepted over raw text percent.
  if (applied != null && accepted != null && applied > 0) {
    rate = Math.round((accepted / applied) * 100);
  }

  return { applied, accepted, rate };
}

function formatInt(value: number | null): string {
  if (value == null) return "-";
  return Math.round(value).toLocaleString();
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const value = item.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function toExternalUrl(value?: string | null): string | null {
  const raw = (value || "").trim();
  if (!raw || raw === "#") return null;
  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function looksLikeNoisyAddressChunk(value: string): boolean {
  const lower = value.toLowerCase();
  if (value.length > 90) return true;
  if ((value.match(/×|\*/g) || []).length >= 2) return true;
  const noisyKeywords = [
    "majors",
    "degrees",
    "associate",
    "bachelor",
    "science",
    "operations",
    "support services",
    "larger map",
  ];
  return noisyKeywords.some((k) => lower.includes(k));
}

function parseLocationContact(metric: UniversityMetric | undefined, university: University | null): LocationContactInfo {
  const fallbackAddress = uniqueStrings([
    [university?.city, university?.state].filter(Boolean).join(", "),
    university?.country || "United States",
  ]);
  if (!metric || typeof metric.value_json !== "object" || metric.value_json === null) {
    return { addressLines: fallbackAddress, email: null, phone: null };
  }

  const payload = metric.value_json as {
    text?: string;
    tables?: Array<{ rows?: string[][] }>;
  };
  const text = payload.text || "";
  const lower = text.toLowerCase();
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/);

  let addressLines: string[] = [];
  let email = emailMatch ? emailMatch[0] : null;
  let phone = phoneMatch ? phoneMatch[0] : null;

  for (const table of payload.tables || []) {
    for (const row of table.rows || []) {
      if (!row.length) continue;
      const label = (row[0] || "").toLowerCase();
      const value = row.slice(1).join(" ").trim() || row[0].trim();
      if (!value) continue;
      if (!email && (label.includes("email") || value.includes("@"))) {
        const m = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
        if (m) email = m[0];
      }
      if (!phone && (label.includes("phone") || label.includes("tel"))) {
        const m = value.match(/(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/);
        if (m) phone = m[0];
      }
      if (label.includes("address") || label.includes("location")) {
        if (!looksLikeNoisyAddressChunk(value)) {
          addressLines.push(value);
        }
      }
    }
  }

  if (!addressLines.length && text) {
    // Keep only short address-like chunks; drop majors/long noisy text.
    const textAddress = text
      .split(/(?<=\d{5})\s+|(?<=United States)\s+|(?<=USA)\s+| \| /i)
      .map((chunk) => chunk.trim())
      .filter((chunk) => {
        const c = chunk.toLowerCase();
        if (!c) return false;
        if (c.includes("location") || c.includes("contact") || c.includes("email") || c.includes("phone")) return false;
        if (looksLikeNoisyAddressChunk(chunk)) return false;
        return c.length > 3;
      });

    addressLines = textAddress.slice(0, 3);
  }

  if (!addressLines.length && text) {
    const cityStateZip = text.match(/[A-Za-z .'-]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?/);
    const street = text.match(/address[^A-Za-z0-9]{0,6}([A-Za-z0-9 .,#'-]{4,70})/i);
    if (street?.[1] && !looksLikeNoisyAddressChunk(street[1])) {
      addressLines.push(street[1].trim());
    }
    if (cityStateZip?.[0]) {
      addressLines.push(cityStateZip[0].trim());
    }
    if (/united states|usa/i.test(text)) {
      addressLines.push("United States");
    }
  }

  if (!addressLines.length) {
    addressLines = fallbackAddress;
  }
  if (!email && lower.includes("email")) {
    const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (m) email = m[0];
  }
  if (!phone && lower.includes("phone")) {
    const m = text.match(/(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/);
    if (m) phone = m[0];
  }

  return {
    addressLines: uniqueStrings(addressLines).slice(0, 4),
    email,
    phone,
  };
}

function parseLabeledRows(metric: UniversityMetric | undefined): LabeledRow[] {
  if (!metric || !metric.value_json) return [];
  if (Array.isArray(metric.value_json)) {
    return metric.value_json
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        label: String(item.label || "").trim(),
        value: String(item.value || "").trim(),
        value_2: String(item.value_2 || "").trim() || undefined,
        value_3: String(item.value_3 || "").trim() || undefined,
        raw: String(item.raw || "").trim() || undefined,
      }))
      .filter((item) => item.label || item.value || item.raw);
  }
  return [];
}

export default function UniversityProfilePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [university, setUniversity] = useState<University | null>(null);
  const [metrics, setMetrics] = useState<UniversityMetric[]>([]);
  const [snapshot, setSnapshot] = useState<UniversitySnapshot | null>(null);
  const [deadlines, setDeadlines] = useState<UniversityDeadline[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token || !id) return;

    setLoading(true);
    setError("");

    Promise.all([
      apiFetch<University>(`/api/universities/${id}/`, { method: "GET" }, token),
      apiFetch<UniversityMetric[]>(`/api/universities/${id}/metrics/`, { method: "GET" }, token),
      apiFetch<UniversitySnapshot>(`/api/universities/${id}/source-snapshot/`, { method: "GET" }, token),
      apiFetch<UniversityDeadline[]>(`/api/universities/${id}/deadlines/`, { method: "GET" }, token),
    ])
      .then(([u, m, s, d]) => {
        setUniversity(u);
        setMetrics(m);
        setSnapshot(s);
        setDeadlines(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки карточки университета"))
      .finally(() => setLoading(false));
  }, [id]);

  const m = useMemo(() => new Map(metrics.map((x) => [x.key, x])), [metrics]);

  const acceptance = university?.acceptance_rate ?? asNumber(m.get("acceptance_rate")) ?? 0;
  const avgSat = asNumber(m.get("avg_sat"));
  const sat25 = asNumber(m.get("sat_25th_p"));
  const sat75 = asNumber(m.get("sat_75th_p"));
  const avgAct = asNumber(m.get("avg_act"));
  const act25 = asNumber(m.get("act_25th_p"));
  const act75 = asNumber(m.get("act_75th_p"));
  const snapshotGpa = snapshot?.raw_payload?.standard_profile?.gpa_value;
  const avgGpa = typeof snapshotGpa === "number" ? snapshotGpa : null;
  const inState = asNumber(m.get("net_price_in_state")) ?? asNumber(m.get("tuition_in_state"));
  const outState = asNumber(m.get("net_price_out_state")) ?? asNumber(m.get("tuition_out_state"));
  const factors = snapshot?.raw_payload?.standard_profile?.important_factors || [];
  const diversity = snapshot?.raw_payload?.standard_profile?.campus_diversity?.diversity_breakdown || [];
  const totalUndergrads = asNumber(m.get("total_undergraduates"));
  const femaleAdmissions = parseGenderAdmissions(m.get("female_admissions"));
  const maleAdmissions = parseGenderAdmissions(m.get("male_admissions"));
  const locationContact = parseLocationContact(m.get("location_contact"), university);
  const mapQuery = encodeURIComponent(locationContact.addressLines.join(", ") || `${university?.name || ""}, ${university?.state || ""}`);
  const officialWebsiteHref = toExternalUrl(university?.website_url);
  const applicationFeeNumber = asNumber(m.get("application_fee_usd"));
  const applicationFeeText = m.get("application_fee_text")?.value_text || "";
  const applyingRows = parseLabeledRows(m.get("applying_extended"));
  const financialAidRows = parseLabeledRows(m.get("financial_aid_items"));

  return (
    <ProtectedPage>
      <AppShell title="University Card" subtitle="Полная карточка университета в простом формате">
        {loading ? (
          <div className="grid gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        ) : error ? (
          <p className="text-rose-300">{error}</p>
        ) : university ? (
          <div className="grid gap-5">
            <Card className="rounded-3xl shadow-none">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black">{university.name}</h1>
                  <p className="mt-2 text-sm text-white/70">
                    {university.city || "-"}, {university.state || "-"}, {university.country || "USA"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {officialWebsiteHref ? (
                      <a href={officialWebsiteHref} target="_blank" rel="noreferrer" className="rounded-lg border border-white/20 px-2 py-1 hover:bg-white/10">
                        official site
                      </a>
                    ) : (
                      <span className="rounded-lg border border-white/15 px-2 py-1 text-white/50">official site: -</span>
                    )}
                  </div>
                </div>
                <Link href="/universities" className="rounded-xl border border-white/20 px-3 py-2 text-sm hover:bg-white/10">
                  Назад к списку
                </Link>
              </div>
            </Card>

            <section className="grid gap-4 md:grid-cols-2">
              <Card className="shadow-none">
                <CardTitle>Acceptance rate</CardTitle>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <CardDescription>Total undergraduates</CardDescription>
                    <p className="text-3xl font-bold">{totalUndergrads ? Math.round(totalUndergrads).toLocaleString() : "-"}</p>
                  </div>
                  <CircularProgress value={Math.round(acceptance)} size={116} thickness={16} fillColor="#FFDB58" />
                </div>
              </Card>

              <Card className="shadow-none">
                <CardTitle>Can I afford it?</CardTitle>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-sm text-white/60">In state</p>
                    <p className="text-3xl font-black">{prettyMoney(inState)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-sm text-white/60">Out of state</p>
                    <p className="text-3xl font-black">{prettyMoney(outState)}</p>
                  </div>
                </div>
              </Card>
            </section>

            <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h2 className="text-3xl font-light tracking-wide text-white/90">Location & Contact</h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-lg font-semibold">Address</h3>
                  <div className="mt-2 space-y-1 text-base text-white/80">
                    {locationContact.addressLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>

                  <h3 className="mt-6 text-lg font-semibold">Contact</h3>
                  <div className="mt-2 space-y-1 text-base text-white/80">
                    <p>Email: {locationContact.email || "-"}</p>
                    <p>Phone: {locationContact.phone || "-"}</p>
                    <p>
                      Official website:{" "}
                      {officialWebsiteHref ? (
                        <a href={officialWebsiteHref} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2">
                          {officialWebsiteHref}
                        </a>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                </article>

                <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-2">
                  <iframe
                    title="University map"
                    src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                    className="h-[320px] w-full rounded-xl"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-4 right-4 rounded-lg border border-white/20 bg-white/90 px-3 py-1.5 text-sm font-medium text-black hover:bg-white"
                  >
                    Larger Map
                  </a>
                </article>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-2xl border border-white/15 bg-white/5 p-5">
                <h2 className="text-xl font-semibold">Average SAT</h2>
                <p className="mt-2 text-sm text-white/70">25th-75th: {sat25 ?? "-"} - {sat75 ?? "-"}</p>
                <p className="mt-2 text-5xl font-black">{avgSat ? Math.round(avgSat) : "-"}</p>
              </article>
              <article className="rounded-2xl border border-white/15 bg-white/5 p-5">
                <h2 className="text-xl font-semibold">Average ACT</h2>
                <p className="mt-2 text-sm text-white/70">25th-75th: {act25 ?? "-"} - {act75 ?? "-"}</p>
                <p className="mt-2 text-5xl font-black">{avgAct ? Math.round(avgAct) : "-"}</p>
              </article>
              <article className="rounded-2xl border border-white/15 bg-white/5 p-5">
                <h2 className="text-xl font-semibold">Average GPA</h2>
                <p className="mt-2 text-sm text-white/70">Unweighted scale (0-4)</p>
                <p className="mt-2 text-5xl font-black">{avgGpa != null ? avgGpa.toFixed(2) : "N/A"}</p>
              </article>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <Card className="shadow-none">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <span aria-hidden>👩‍🎓</span>
                  Female Admissions
                </h2>
                <div className="mt-4 grid grid-cols-[1fr_1fr_88px] items-center gap-3">
                  <div>
                    <p className="text-3xl font-black">{formatInt(femaleAdmissions.applied)}</p>
                    <p className="text-xs text-white/60">Females Applied</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black">{formatInt(femaleAdmissions.accepted)}</p>
                    <p className="text-xs text-white/60">Females Accepted</p>
                  </div>
                  <CircularProgress value={Math.round(femaleAdmissions.rate || 0)} size={88} thickness={12} fillColor="#F4A6C8" />
                </div>
              </Card>

              <Card className="shadow-none">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <span aria-hidden>👨‍🎓</span>
                  Male Admissions
                </h2>
                <div className="mt-4 grid grid-cols-[1fr_1fr_88px] items-center gap-3">
                  <div>
                    <p className="text-3xl font-black">{formatInt(maleAdmissions.applied)}</p>
                    <p className="text-xs text-white/60">Males Applied</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black">{formatInt(maleAdmissions.accepted)}</p>
                    <p className="text-xs text-white/60">Males Accepted</p>
                  </div>
                  <CircularProgress value={Math.round(maleAdmissions.rate || 0)} size={88} thickness={12} fillColor="#7FB6FF" />
                </div>
              </Card>
            </section>

            <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">Important factors of admission</h2>
              <div className="mt-4 grid gap-2">
                {factors.length ? (
                  factors.map((f, idx) => (
                    <div key={`${f.factor_name || "factor"}-${idx}`} className="grid grid-cols-[1fr_140px] items-center gap-3">
                      <p className="truncate text-sm">{(f.factor_name || "-").replaceAll("_", " ")}</p>
                      <Progress value={factorWeight(f.importance_level)} variant="primary" className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/70">Нет данных.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">Campus diversity</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {diversity.length ? (
                  diversity.map((d, idx) => (
                    <div key={`${d.group_name || "group"}-${idx}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-sm text-white/70">{(d.group_name || "-").replaceAll("_", " ")}</p>
                      <p className="text-3xl font-black">{d.count ?? d.source_text ?? "-"}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/70">Нет данных.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">Deadlines</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {deadlines.length ? (
                  deadlines.map((d) => (
                    <div key={d.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                      <p className="font-semibold">{d.deadline_type}</p>
                      <p className="mt-1 text-white/70">
                        {d.is_rolling ? "Rolling" : d.deadline_date ? formatDateShort(d.deadline_date) : d.deadline_text || "-"}
                      </p>
                      {d.notification_date ? <p className="mt-1 text-xs text-violet-300">Notify: {formatDateShort(d.notification_date)}</p> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/70">No deadlines yet.</p>
                )}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Card className="shadow-none">
                <h2 className="text-xl font-semibold">Applying</h2>
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-white/60">Application fee</p>
                  <p className="mt-1 text-3xl font-black">{applicationFeeNumber != null ? prettyMoney(applicationFeeNumber) : "N/A"}</p>
                  {applicationFeeText ? <p className="mt-2 text-xs text-white/65">{applicationFeeText}</p> : null}
                </div>
                <div className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1">
                  {applyingRows.length ? (
                    applyingRows.map((row, idx) => (
                      <div key={`${row.label || "app"}-${idx}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <p className="text-sm font-semibold text-white">{row.label || "Field"}</p>
                        <p className="text-sm text-white/80">{row.value || "-"}</p>
                        {row.value_2 ? <p className="text-xs text-white/65">{row.value_2}</p> : null}
                        {row.value_3 ? <p className="text-xs text-white/65">{row.value_3}</p> : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/70">No applying values found.</p>
                  )}
                </div>
              </Card>

              <Card className="shadow-none">
                <h2 className="text-xl font-semibold">Financial Aid</h2>
                <div className="mt-4 max-h-[520px] space-y-2 overflow-auto pr-1">
                  {financialAidRows.length ? (
                    financialAidRows.map((row, idx) => (
                      <div key={`${row.label || "aid"}-${idx}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <p className="text-sm font-semibold text-white">{row.label || "Field"}</p>
                        <p className="text-sm text-white/80">{row.value || "-"}</p>
                        {row.value_2 ? <p className="text-xs text-white/65">{row.value_2}</p> : null}
                        {row.value_3 ? <p className="text-xs text-white/65">{row.value_3}</p> : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/70">No financial aid values found.</p>
                  )}
                </div>
              </Card>
            </section>
          </div>
        ) : null}
      </AppShell>
    </ProtectedPage>
  );
}
