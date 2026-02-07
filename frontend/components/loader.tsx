"use client";

type LoaderSize = "sm" | "md" | "lg";

const sizeClass: Record<LoaderSize, string> = {
  sm: "h-5 w-5",
  md: "h-9 w-9",
  lg: "h-14 w-14",
};

export function Loader({
  size = "md",
  label,
  className = "",
  ariaLabel = "Загружаем",
}: {
  size?: LoaderSize;
  label?: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`} role="status" aria-label={ariaLabel}>
      <img src="/loader/load.svg" alt="" className={sizeClass[size]} />
      {label ? <p className="text-sm text-white/65">{label}</p> : null}
    </div>
  );
}
