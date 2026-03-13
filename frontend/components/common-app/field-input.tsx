"use client";

import { ProgressField } from "@/lib/common-app-progress";

type Props = {
  field: ProgressField;
  value: unknown;
  onChange: (next: unknown) => void;
  onClear?: () => void;
};

export function FieldInput({ field, value, onChange, onClear }: Props) {
  if (field.type === "boolean") {
    return (
      <select
        value={typeof value === "boolean" ? String(value) : ""}
        disabled={field.readonly}
        onChange={(event) => onChange(event.target.value === "true")}
        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
      >
        <option value="">Выбери</option>
        <option value="true">Да</option>
        <option value="false">Нет</option>
      </select>
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        value={typeof value === "number" ? value : value || ""}
        disabled={field.readonly}
        onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))}
        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
      />
    );
  }

  if (field.type === "date") {
    return (
      <input
        type="date"
        value={typeof value === "string" ? value : ""}
        disabled={field.readonly}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
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
            <label key={option} className="flex items-center gap-3 text-sm text-black/80">
              <input
                type="radio"
                name={`${field.path}-${field.id}`}
                checked={value === option}
                disabled={field.readonly}
                onChange={() => onChange(option)}
                className="h-4 w-4 border-black/30"
              />
              <span>{isYesNo ? (option === "Yes" ? "Да" : "Нет") : option}</span>
            </label>
          ))}
          {field.clearable && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border-2 border-black/35 px-4 py-1.5 text-sm font-semibold text-black/60 transition hover:bg-black/[0.03]"
            >
              Clear answer
            </button>
          ) : null}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <select
          value={typeof value === "string" ? value : ""}
          disabled={field.readonly}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
        >
          <option value="">- Choose an option -</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {field.clearable && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border-2 border-black/35 px-4 py-1.5 text-sm font-semibold text-black/60 transition hover:bg-black/[0.03]"
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
            <label key={option} className="flex items-center gap-3 text-sm text-black/80">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                disabled={field.readonly}
                onChange={() => toggle(option)}
                className="h-5 w-5 rounded border border-black/30"
              />
              <span>{option}</span>
            </label>
          ))}
          {field.clearable && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border-2 border-black/35 px-4 py-1.5 text-sm font-semibold text-black/60 transition hover:bg-black/[0.03]"
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
        className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
        placeholder="Значения через запятую"
      />
    );
  }

  if (field.ui === "textarea") {
    return (
      <textarea
        value={typeof value === "string" ? value : value ?? ""}
        disabled={field.readonly}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-1 w-full resize-y rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
      />
    );
  }

  return (
    <input
      value={typeof value === "string" ? value : value ?? ""}
      disabled={field.readonly}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm disabled:bg-black/[0.04]"
    />
  );
}
