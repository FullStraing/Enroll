import { clearTokens, getRefreshToken, refreshAccessToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

function extractApiErrorMessage(data: unknown): string | null {
  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    const joined = data
      .map((item) => extractApiErrorMessage(item))
      .filter((item): item is string => Boolean(item))
      .join(" ");
    return joined || null;
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const detail = extractApiErrorMessage(record.detail);
    if (detail) {
      return detail;
    }

    for (const [key, value] of Object.entries(record)) {
      const message = extractApiErrorMessage(value);
      if (message) {
        return message;
      }
    }
  }

  return null;
}

type ApiResponse = {
  response: Response;
  data: unknown;
};

function buildHeaders(options: RequestInit, token?: string) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  return {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
}

async function executeRequest(path: string, options: RequestInit, token?: string): Promise<ApiResponse> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: buildHeaders(options, token),
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return { response, data };
}

function isRefreshEndpoint(path: string) {
  return path.includes("/api/auth/token/refresh/");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const activeToken = token;
  let result = await executeRequest(path, options, activeToken);

  if (
    result.response.status === 401 &&
    activeToken &&
    !isRefreshEndpoint(path) &&
    getRefreshToken()
  ) {
    try {
      const refreshedToken = await refreshAccessToken();
      result = await executeRequest(path, options, refreshedToken);
    } catch (error) {
      clearTokens();
      throw error instanceof Error ? error : new Error("Session refresh failed.");
    }
  }

  if (!result.response.ok) {
    if (result.response.status === 401) {
      clearTokens();
    }
    const message = extractApiErrorMessage(result.data) || JSON.stringify(result.data);
    throw new ApiError(message || `Request failed: ${result.response.status}`, result.response.status, result.data);
  }

  return result.data as T;
}
