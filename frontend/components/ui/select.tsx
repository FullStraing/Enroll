"use client";

import { type ReactNode, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  menuClassName?: string;
  optionClassName?: string;
  renderValue?: (option: SelectOption | undefined) => ReactNode;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select option",
  disabled = false,
  ariaLabel,
  className,
  menuClassName,
  optionClassName,
  renderValue,
}: SelectProps) {
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const gutter = 12;
      const preferredWidth = Math.max(rect.width, 220);
      const width = Math.min(preferredWidth, window.innerWidth - gutter * 2);
      const left = Math.min(Math.max(gutter, rect.left), window.innerWidth - width - gutter);
      const spaceBelow = window.innerHeight - rect.bottom - gutter;
      const spaceAbove = rect.top - gutter;
      const showAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(140, showAbove ? spaceAbove - 8 : spaceBelow - 8);
      const top = showAbove ? Math.max(gutter, rect.top - maxHeight - 8) : rect.bottom + 8;

      setMenuPosition({ top, left, width, maxHeight });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const triggerClasses = cn(
    "flex h-12 w-full items-center justify-between gap-3 rounded-2xl border-2 border-black/15 bg-white px-4 text-left text-sm font-semibold text-black outline-none transition hover:border-black/30 focus-visible:border-black focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-55",
    className,
  );

  const dropdown = open && mounted && menuPosition
    ? createPortal(
        <div
          ref={menuRef}
          role="listbox"
          id={listboxId}
          className={cn(
            "z-[80] overflow-hidden rounded-[22px] border-2 border-black bg-white p-1 shadow-[0_8px_0_rgba(0,0,0,0.14)]",
            menuClassName,
          )}
          style={{
            position: "fixed",
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
          }}
        >
          <div className="max-h-[inherit] overflow-y-auto pr-1" style={{ maxHeight: menuPosition.maxHeight }}>
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={option.disabled}
                  onClick={() => {
                    if (option.disabled) return;
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-black transition",
                    option.disabled
                      ? "cursor-not-allowed opacity-40"
                      : selected
                        ? "bg-[#DAF5F0]"
                        : "hover:bg-[#FFF9E8]",
                    optionClassName,
                  )}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {selected ? <Check className="h-4 w-4 shrink-0 text-black/75" /> : null}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={triggerClasses}
      >
        <span className="min-w-0 truncate">
          {renderValue ? renderValue(selectedOption) : selectedOption?.label || <span className="opacity-35">{placeholder}</span>}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-55 transition", open && "rotate-180")} />
      </button>
      {dropdown}
    </>
  );
}
