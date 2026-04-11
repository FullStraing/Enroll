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
        return key === "non_field_errors" ? message : `${key}: ${message}`;
      }
    }
  }

  return null;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = extractApiErrorMessage(data) || JSON.stringify(data);
    throw new ApiError(message || `Request failed: ${response.status}`, response.status, data);
  }

  return data as T;
}
