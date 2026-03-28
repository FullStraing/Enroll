export const tokenKey = "enroll_token";
export const refreshKey = "enroll_refresh";
export const sessionKey = "enroll_session";

function buildCookieAttributes(maxAgeSeconds: number) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function saveTokens(access: string, _refresh?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(tokenKey, access);
  localStorage.removeItem(refreshKey);
  document.cookie = `${sessionKey}=1; ${buildCookieAttributes(60 * 60 * 12)}`;
  document.cookie = `${tokenKey}=; ${buildCookieAttributes(0)}`;
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(refreshKey);
  document.cookie = `${sessionKey}=; ${buildCookieAttributes(0)}`;
  document.cookie = `${tokenKey}=; ${buildCookieAttributes(0)}`;
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(tokenKey) || "";
}
