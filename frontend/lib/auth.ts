export const tokenKey = "enroll_token";
export const refreshKey = "enroll_refresh";

export function saveTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(tokenKey, access);
  if (refresh) {
    localStorage.setItem(refreshKey, refresh);
  }
  document.cookie = `${tokenKey}=${access}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(refreshKey);
  document.cookie = `${tokenKey}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(tokenKey) || "";
}
