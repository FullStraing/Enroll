import { apiUrl } from "@/lib/api";

export type RuntimeConfig = {
  status: string;
  environment?: string;
  database?: string;
  cache?: {
    backend?: string;
    status?: string;
  };
  storage?: {
    backend?: string;
    writes_enabled?: boolean;
    writes_reason?: string;
  };
  features: {
    ai_enabled: boolean;
    file_uploads_enabled: boolean;
    community_posting_enabled: boolean;
    registration_enabled: boolean;
    google_auth_enabled: boolean;
    maintenance_mode: boolean;
  };
};

let cachedConfig: RuntimeConfig | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

export async function fetchRuntimeConfig(force = false): Promise<RuntimeConfig> {
  const now = Date.now();
  if (!force && cachedConfig && now - cachedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }

  const response = await fetch(apiUrl("/api/ping/"), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load runtime config.");
  }
  const data = (await response.json()) as RuntimeConfig;
  cachedConfig = data;
  cachedAt = now;
  return data;
}
