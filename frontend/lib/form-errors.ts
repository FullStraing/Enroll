import { ApiError } from "@/lib/api";

export type FormErrors = {
  formError: string;
  fieldErrors: Record<string, string>;
};

function normalizeMessage(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function extractFirstMessage(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = extractFirstMessage(item);
      if (message) {
        return message;
      }
    }
    return "";
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const candidate of Object.values(record)) {
      const message = extractFirstMessage(candidate);
      if (message) {
        return message;
      }
    }
  }

  return "";
}

export function parseFormErrors(error: unknown, knownFields: string[] = []): FormErrors {
  const empty: FormErrors = { formError: "", fieldErrors: {} };

  if (!(error instanceof ApiError) || !error.data || typeof error.data !== "object" || Array.isArray(error.data)) {
    return {
      formError: error instanceof Error ? error.message : "",
      fieldErrors: {},
    };
  }

  const payload = error.data as Record<string, unknown>;
  const fieldSet = new Set(knownFields);
  const fieldErrors: Record<string, string> = {};
  let formError = "";

  for (const [key, value] of Object.entries(payload)) {
    const message = extractFirstMessage(value);
    if (!message) {
      continue;
    }

    if (key === "detail" || key === "non_field_errors") {
      if (!formError) {
        formError = message;
      }
      continue;
    }

    if (key === "code" || key === "retry_after_seconds") {
      continue;
    }

    if (fieldSet.has(key)) {
      fieldErrors[key] = message;
      continue;
    }

    if (!formError) {
      formError = message;
    }
  }

  if (!formError && Object.keys(fieldErrors).length === 0) {
    return {
      formError: error.message,
      fieldErrors: {},
    };
  }

  return {
    formError,
    fieldErrors,
  };
}

export function resolveFormErrorMessage(errors: FormErrors, fallback = ""): string {
  const fieldMessages = new Set(
    Object.values(errors.fieldErrors)
      .filter(Boolean)
      .map((message) => normalizeMessage(message)),
  );

  if (errors.formError) {
    const normalizedFormError = normalizeMessage(errors.formError);
    if (!fieldMessages.has(normalizedFormError)) {
      return errors.formError;
    }
  }

  if (!fallback) {
    return "";
  }

  const normalizedFallback = normalizeMessage(fallback);
  if (fieldMessages.has(normalizedFallback)) {
    return "";
  }

  return fallback;
}
