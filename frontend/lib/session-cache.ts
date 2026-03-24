"use client";

type SessionCacheEnvelope<T> = {
  cachedAt: number;
  payload: T;
};

export const SESSION_CACHE_KEYS = {
  dashboard: "enroll_dashboard_cache_v2",
  calendar: "enroll_calendar_cache_v1",
  documents: "enroll_documents_cache_v1",
  essays: "enroll_essays_cache_v1",
  commonApp: "enroll_common_app_cache_v1",
  activities: "enroll_activities_cache_v1",
  settings: "enroll_settings_cache_v1",
  onboarding: "enroll_onboarding_cache_v1",
} as const;

export const SESSION_CACHE_TTLS = {
  dashboard: 60_000,
  calendar: 60_000,
  documents: 60_000,
  essays: 60_000,
  commonApp: 30_000,
  activities: 60_000,
  settings: 120_000,
  onboarding: 120_000,
} as const;

export function getEssayDetailCacheKey(essayId: number) {
  return `enroll_essay_detail_cache_v1_${essayId}`;
}

export function readSessionCache<T>(key: string, ttlMs: number) {
  if (typeof window === "undefined") {
    return { payload: null as T | null, isFresh: false };
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return { payload: null as T | null, isFresh: false };
    }

    const parsed = JSON.parse(raw) as SessionCacheEnvelope<T>;
    const cacheAge = Date.now() - parsed.cachedAt;
    return {
      payload: parsed.payload,
      isFresh: cacheAge < ttlMs,
    };
  } catch {
    window.sessionStorage.removeItem(key);
    return { payload: null as T | null, isFresh: false };
  }
}

export function writeSessionCache<T>(key: string, payload: T) {
  if (typeof window === "undefined") return;
  const envelope: SessionCacheEnvelope<T> = {
    cachedAt: Date.now(),
    payload,
  };
  window.sessionStorage.setItem(key, JSON.stringify(envelope));
}

export function clearSessionCache(key: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
}

export function clearSessionCaches(keys: string[]) {
  if (typeof window === "undefined") return;
  for (const key of keys) {
    window.sessionStorage.removeItem(key);
  }
}
