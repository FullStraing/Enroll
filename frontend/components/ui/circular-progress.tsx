import { cn } from "@/lib/utils";

export function CircularProgress({
  value,
  size = 140,
  thickness = 18,
  label,
  trackColor = "#E8E6E7",
  fillColor = "#FFDB58",
  centerColor = "#FFFFFF",
  textColor = "#111111",
  className,
}: {
  value: number;
  size?: number;
  thickness?: number;
  label?: string;
  trackColor?: string;
  fillColor?: string;
  centerColor?: string;
  textColor?: string;
  className?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  const innerSize = size - thickness * 2;
  const valueFontSize = Math.max(18, Math.floor(innerSize * 0.42));

  return (
    <div className={cn("relative inline-grid place-items-center overflow-hidden", className)} style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full border border-black/10"
        style={{
          background: `conic-gradient(${fillColor} ${safeValue * 3.6}deg, ${trackColor} 0deg)`,
        }}
      />
      <div
        className="relative grid place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] overflow-hidden"
        style={{ width: innerSize, height: innerSize, backgroundColor: centerColor, color: textColor }}
      >
        <div
          className="whitespace-nowrap font-black leading-none tracking-tight"
          style={{ fontSize: `${valueFontSize}px` }}
        >
          {safeValue}%
        </div>
        {label ? <p className="mt-2 text-xs text-black/65">{label}</p> : null}
      </div>
    </div>
  );
}
