"use client";

export const tokenKey = "enroll_token";
export const refreshKey = "enroll_refresh";
export const sessionKey = "enroll_session";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60;

let refreshRequest: Promise<string> | null = null;

function buildApiUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

function buildCookieAttributes(maxAgeSeconds: number) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function readCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

function readStorageValue(key: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) || "";
}

function writeSessionMarkerCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${sessionKey}=1; ${buildCookieAttributes(REFRESH_TOKEN_MAX_AGE_SECONDS)}`;
}

function clearSessionMarkerCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${sessionKey}=; ${buildCookieAttributes(0)}`;
}

function ensureSessionMarkerCookie() {
  if (typeof document === "undefined") return;
  if ((readStorageValue(tokenKey) || readStorageValue(refreshKey)) && !readCookieValue(sessionKey)) {
    writeSessionMarkerCookie();
  }
}

function extractRefreshError(data: unknown, status: number) {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const detail = record.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }

  return `Session refresh failed with status ${status}.`;
}

export function saveTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(tokenKey, access);
  if (refresh) {
    localStorage.setItem(refreshKey, refresh);
  }
  writeSessionMarkerCookie();
  document.cookie = `${tokenKey}=; ${buildCookieAttributes(0)}`;
}

export function updateAccessToken(access: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(tokenKey, access);
  ensureSessionMarkerCookie();
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(refreshKey);
  clearSessionMarkerCookie();
  document.cookie = `${tokenKey}=; ${buildCookieAttributes(0)}`;
}

export function hasStoredAccessToken() {
  return Boolean(readStorageValue(tokenKey));
}

export function hasStoredRefreshToken() {
  return Boolean(readStorageValue(refreshKey));
}

export function hasStoredSession() {
  return hasStoredAccessToken() || hasStoredRefreshToken();
}

export function getToken() {
  ensureSessionMarkerCookie();
  const token = readStorageValue(tokenKey);
  return token;
}

export function getRefreshToken() {
  const refreshToken = readStorageValue(refreshKey);
  if (refreshToken) {
    ensureSessionMarkerCookie();
  }
  return refreshToken;
}

export async function refreshAccessToken() {
  if (typeof window === "undefined") {
    throw new Error("Session refresh is only available in the browser.");
  }

  if (refreshRequest) {
    return refreshRequest;
  }

  const refresh = getRefreshToken();
  if (!refresh) {
    clearTokens();
    throw new Error("No refresh token is available.");
  }

  refreshRequest = (async () => {
    let response: Response;

    try {
      response = await fetch(buildApiUrl("/api/auth/token/refresh/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh }),
        cache: "no-store",
      });
    } catch (error) {
      throw error instanceof Error ? error : new Error("Session refresh request failed.");
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      clearTokens();
      throw new Error(extractRefreshError(data, response.status));
    }

    const payload = data as { access?: string; refresh?: string };
    if (!payload.access) {
      clearTokens();
      throw new Error("Session refresh did not return a new access token.");
    }

    saveTokens(payload.access, payload.refresh ?? refresh);
    return payload.access;
  })();

  try {
    return await refreshRequest;
  } finally {
    refreshRequest = null;
  }
}
