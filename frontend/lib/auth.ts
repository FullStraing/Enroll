export const tokenKey = "enroll_token";
export const refreshKey = "enroll_refresh";

function buildCookieAttributes(maxAgeSeconds: number) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function saveTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(tokenKey, access);
  if (refresh) {
    localStorage.setItem(refreshKey, refresh);
  }
  document.cookie = `${tokenKey}=${encodeURIComponent(access)}; ${buildCookieAttributes(60 * 60 * 24 * 30)}`;
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(refreshKey);
  document.cookie = `${tokenKey}=; ${buildCookieAttributes(0)}`;
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(tokenKey) || "";
}
