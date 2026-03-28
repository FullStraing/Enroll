"use client";

import { apiUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";

export type ProductEventName =
  | "signup_started"
  | "signup_completed"
  | "onboarding_completed"
  | "first_task_created"
  | "first_university_added"
  | "first_essay_started";

const ANALYTICS_CLIENT_ID_KEY = "enroll_analytics_client_id";

function fallbackUuid() {
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnalyticsClientId() {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(ANALYTICS_CLIENT_ID_KEY);
  if (existing) return existing;
  const next = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : fallbackUuid();
  window.localStorage.setItem(ANALYTICS_CLIENT_ID_KEY, next);
  return next;
}

export async function trackProductEvent(
  name: ProductEventName,
  options?: { source?: string; metadata?: Record<string, unknown> },
) {
  if (typeof window === "undefined") return;

  const token = getToken();
  await fetch(apiUrl("/api/analytics/events/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      name,
      client_id: getAnalyticsClientId(),
      source: options?.source || "",
      metadata: options?.metadata || {},
    }),
    keepalive: true,
  });
}

