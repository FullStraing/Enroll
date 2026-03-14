import type { DiscoverFilters, StudentUniversity, University } from "./types";

function asMoneyNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    if (!normalized) return null;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function money(value?: number | string | null): string {
  const numeric = asMoneyNumber(value);
  if (numeric == null) return "N/A";
  return `$${Math.round(numeric).toLocaleString()}`;
}

export function categoryLabel(category: StudentUniversity["category"]): string {
  if (category === "reach") return "Reach";
  if (category === "safety") return "Safety";
  return "Target";
}

export function formatUniversityLocation(university: University): string {
  const parts = [university.city, university.state, university.country || "USA"]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "USA";
}

export function buildQuery(paramsSource: DiscoverFilters, page: number, pageSize: number): string {
  const queryParts = [paramsSource.search.trim(), paramsSource.major.trim(), paramsSource.state.trim()].filter(Boolean);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  if (queryParts.length > 0) {
    params.set("q", queryParts.join(" "));
  }
  if (paramsSource.rankingBand) params.set("selectivity", paramsSource.rankingBand);
  if (paramsSource.acceptanceMin.trim()) params.set("acceptance_min", paramsSource.acceptanceMin.trim());
  if (paramsSource.acceptanceMax.trim()) params.set("acceptance_max", paramsSource.acceptanceMax.trim());
  if (paramsSource.tuitionMin.trim()) params.set("tuition_min", paramsSource.tuitionMin.trim());
  if (paramsSource.tuitionMax.trim()) params.set("tuition_max", paramsSource.tuitionMax.trim());
  if (paramsSource.satMin.trim()) params.set("avg_sat_min", paramsSource.satMin.trim());
  if (paramsSource.satMax.trim()) params.set("avg_sat_max", paramsSource.satMax.trim());
  if (paramsSource.actMin.trim()) params.set("avg_act_min", paramsSource.actMin.trim());
  if (paramsSource.actMax.trim()) params.set("avg_act_max", paramsSource.actMax.trim());
  if (paramsSource.gpaMin.trim()) params.set("avg_gpa_min", paramsSource.gpaMin.trim());
  if (paramsSource.gpaMax.trim()) params.set("avg_gpa_max", paramsSource.gpaMax.trim());
  if (paramsSource.netPriceMin.trim()) params.set("net_price_min", paramsSource.netPriceMin.trim());
  if (paramsSource.netPriceMax.trim()) params.set("net_price_max", paramsSource.netPriceMax.trim());
  if (paramsSource.housingMin.trim()) params.set("housing_min", paramsSource.housingMin.trim());
  if (paramsSource.housingMax.trim()) params.set("housing_max", paramsSource.housingMax.trim());

  return params.toString();
}

export function getNetCostValue(university: University): number | null {
  const tuition = typeof university.tuition_out_state === "number" ? university.tuition_out_state : null;
  const aid = typeof university.aid_package === "number" ? university.aid_package : null;
  if (tuition != null && aid != null) {
    return Math.max(0, tuition - aid);
  }
  if (typeof university.net_price === "number") return university.net_price;
  return tuition;
}

export function sumKnown(values: Array<number | string | null | undefined>): { total: number; known: number; missing: number } {
  let total = 0;
  let known = 0;
  let missing = 0;

  for (const value of values) {
    const numeric = asMoneyNumber(value);
    if (numeric != null) {
      total += numeric;
      known += 1;
    } else {
      missing += 1;
    }
  }

  return { total, known, missing };
}

export function rowStatusTone(status: StudentUniversity["status"]): string {
  if (status === "admitted") return "bg-emerald-50/70";
  if (status === "submitted") return "bg-[#FFF4CC]/80";
  if (status === "rejected") return "bg-rose-50/70";
  return "";
}

export function statusSelectTone(status: StudentUniversity["status"]): string {
  if (status === "admitted") return "bg-emerald-100 border-emerald-500";
  if (status === "submitted") return "bg-[#FFF4CC] border-[#E0A800]";
  if (status === "rejected") return "bg-rose-100 border-rose-500";
  return "bg-white border-black/25";
}

export function filtersHash(filters: DiscoverFilters): string {
  return JSON.stringify(filters);
}
