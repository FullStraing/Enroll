"use client";

import { Select } from "@/components/ui/select";
import { ProgressField } from "@/lib/common-app-progress";

type Props = {
  field: ProgressField;
  value: unknown;
  onChange: (next: unknown) => void;
  onClear?: () => void;
};

export function FieldInput({ field, value, onChange, onClear }: Props) {
  const stringValue = typeof value === "string" ? value : "";
  const numberValue = typeof value === "number" ? value : "";

  if (field.type === "boolean") {
    return (
      <Select
        value={typeof value === "boolean" ? String(value) : ""}
        disabled={field.readonly}
        onChange={(next) => onChange(next === "" ? "" : next === "true")}
        options={[
          { value: "", label: "Choose" },
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ]}
        className="mt-1 w-full border border-[var(--enroll-surface-border)] text-sm disabled:bg-black/[0.04]"
        ariaLabel={field.label}
      />
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        value={numberValue}
        disabled={field.readonly}
        onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))}
        className="mt-1 w-full rounded-xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-2 text-sm text-[var(--enroll-fg)] disabled:bg-black/[0.04]"
      />
    );
  }

  if (field.type === "date") {
    return (
      <input
        type="date"
        value={stringValue}
        disabled={field.readonly}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-2 text-sm text-[var(--enroll-fg)] disabled:bg-black/[0.04]"
      />
    );
  }

  if (field.type === "choice") {
    const options = field.options || [];
    const isYesNo = options.length === 2 && options.includes("Yes") && options.includes("No");
    const useRadio = isYesNo || field.ui === "radio";
    if (useRadio) {
      return (
        <div className="mt-2 space-y-3">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-3 text-sm text-[var(--enroll-fg)]">
              <input
                type="radio"
                name={`${field.path}-${field.id}`}
                checked={value === option}
                disabled={field.readonly}
                onChange={() => onChange(option)}
                className="h-4 w-4 border-[var(--enroll-surface-border)]"
              />
              <span>{isYesNo ? (option === "Yes" ? "Yes" : "No") : option}</span>
            </label>
          ))}
          {field.clearable && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border-2 border-[var(--enroll-surface-border-strong)] px-4 py-1.5 text-sm font-semibold text-[var(--enroll-muted)] transition hover:bg-black/[0.03]"
            >
              Clear answer
            </button>
          ) : null}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <Select
          value={stringValue}
          disabled={field.readonly}
          onChange={onChange}
          options={[
            { value: "", label: "- Choose an option -" },
            ...options.map((option) => ({ value: option, label: option })),
          ]}
          className="mt-1 w-full border border-[var(--enroll-surface-border)] text-sm disabled:bg-black/[0.04]"
          ariaLabel={field.label}
        />
        {field.clearable && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border-2 border-[var(--enroll-surface-border-strong)] px-4 py-1.5 text-sm font-semibold text-[var(--enroll-muted)] transition hover:bg-black/[0.03]"
          >
            Clear answer
          </button>
        ) : null}
      </div>
    );
  }

  if (field.type === "list") {
    if (field.ui === "checkbox" && (field.options || []).length) {
      const selected = Array.isArray(value) ? value : [];
      const toggle = (option: string) => {
        if (selected.includes(option)) onChange(selected.filter((item) => item !== option));
        else onChange([...selected, option]);
      };
      return (
        <div className="mt-2 space-y-2">
          {(field.options || []).map((option) => (
            <label key={option} className="flex items-center gap-3 text-sm text-[var(--enroll-fg)]">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                disabled={field.readonly}
                onChange={() => toggle(option)}
                className="h-5 w-5 rounded border border-[var(--enroll-surface-border)]"
              />
              <span>{option}</span>
            </label>
          ))}
          {field.clearable && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border-2 border-[var(--enroll-surface-border-strong)] px-4 py-1.5 text-sm font-semibold text-[var(--enroll-muted)] transition hover:bg-black/[0.03]"
            >
              Clear answer
            </button>
          ) : null}
        </div>
      );
    }
    const current = Array.isArray(value) ? value.join(", ") : "";
    return (
      <input
        value={current}
        disabled={field.readonly}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          )
        }
        className="mt-1 w-full rounded-xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-2 text-sm text-[var(--enroll-fg)] disabled:bg-black/[0.04]"
        placeholder="Values separated by commas"
      />
    );
  }

  if (field.ui === "textarea") {
    return (
      <textarea
        value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
        disabled={field.readonly}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-1 w-full resize-y rounded-xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-2 text-sm text-[var(--enroll-fg)] disabled:bg-black/[0.04]"
      />
    );
  }

  return (
    <input
      value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
      disabled={field.readonly}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-xl border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] px-3 py-2 text-sm text-[var(--enroll-fg)] disabled:bg-black/[0.04]"
    />
  );
}
