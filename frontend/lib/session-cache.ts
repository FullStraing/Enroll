"use client";

import { getToken } from "@/lib/auth";

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

function decodeBase64Url(value: string) {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return window.atob(padded);
  } catch {
    return "";
  }
}

function getTokenScope(token: string) {
  if (typeof window === "undefined" || !token) return "anonymous";

  const payload = token.split(".")[1];
  if (!payload) return "anonymous";

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as {
      sub?: string | number;
      user_id?: string | number;
      id?: string | number;
      username?: string;
      email?: string;
    };
    const rawScope = parsed.sub ?? parsed.user_id ?? parsed.id ?? parsed.username ?? parsed.email;
    return rawScope == null ? "anonymous" : String(rawScope);
  } catch {
    return "anonymous";
  }
}

export function getUserScopedSessionCacheKey(baseKey: string, token = getToken()) {
  return `${baseKey}::${getTokenScope(token)}`;
}

export function getEssayDetailCacheKey(essayId: number) {
  return `enroll_essay_detail_cache_v1_${essayId}`;
}

export function readSessionCache<T>(key: string, ttlMs: number, token = getToken()) {
  if (typeof window === "undefined") {
    return { payload: null as T | null, isFresh: false };
  }

  const scopedKey = getUserScopedSessionCacheKey(key, token);

  try {
    const raw = window.sessionStorage.getItem(scopedKey);
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
    window.sessionStorage.removeItem(scopedKey);
    return { payload: null as T | null, isFresh: false };
  }
}

export function writeSessionCache<T>(key: string, payload: T, token = getToken()) {
  if (typeof window === "undefined") return;

  const envelope: SessionCacheEnvelope<T> = {
    cachedAt: Date.now(),
    payload,
  };

  window.sessionStorage.setItem(getUserScopedSessionCacheKey(key, token), JSON.stringify(envelope));
}

export function clearSessionCache(key: string, token = getToken()) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(getUserScopedSessionCacheKey(key, token));
}

export function clearSessionCaches(keys: string[]) {
  if (typeof window === "undefined") return;

  const removals: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const existingKey = window.sessionStorage.key(index);
    if (!existingKey) continue;
    if (keys.some((baseKey) => existingKey === baseKey || existingKey.startsWith(`${baseKey}::`))) {
      removals.push(existingKey);
    }
  }

  for (const key of removals) {
    window.sessionStorage.removeItem(key);
  }
}
