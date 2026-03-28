import { cn } from "@/lib/utils";

type CircularProgressSegmentKey = string;

type CircularProgressSegment = {
  key?: CircularProgressSegmentKey;
  value: number;
  weight: number;
  color: string;
  label?: string;
  description?: string;
};

function polarToCartesian(center: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: center + radius * Math.cos(angleInRadians),
    y: center + radius * Math.sin(angleInRadians),
  };
}

function describeArc(center: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(center, radius, endAngle);
  const end = polarToCartesian(center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

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
  segments,
  gapDegrees = 0,
  activeSegmentKey,
  onSegmentEnter,
  onSegmentLeave,
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
  segments?: CircularProgressSegment[];
  gapDegrees?: number;
  activeSegmentKey?: CircularProgressSegmentKey | null;
  onSegmentEnter?: (segment: CircularProgressSegment) => void;
  onSegmentLeave?: () => void;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  const innerSize = size - thickness * 2;
  const valueFontSize = Math.max(18, Math.floor(innerSize * 0.42));
  const radius = size / 2 - thickness / 2 - 1;
  const safeSegments = (segments || []).filter((segment) => segment.weight > 0);
  const totalWeight = safeSegments.reduce((sum, segment) => sum + segment.weight, 0);
  const totalGapDegrees = safeSegments.length > 0 ? safeSegments.length * gapDegrees : 0;
  const availableDegrees = Math.max(0, 360 - totalGapDegrees);
  let cursor = -90 + gapDegrees / 2;

  return (
    <div className={cn("relative inline-grid place-items-center overflow-hidden", className)} style={{ width: size, height: size }}>
      {safeSegments.length > 0 && totalWeight > 0 ? (
        <svg className="absolute inset-0" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          {safeSegments.map((segment) => {
            const segmentDegrees = (segment.weight / totalWeight) * availableDegrees;
            const startAngle = cursor;
            const endAngle = startAngle + segmentDegrees;
            const filledEndAngle = startAngle + segmentDegrees * (Math.max(0, Math.min(100, segment.value)) / 100);
            cursor = endAngle + gapDegrees;

            const isActive = Boolean(activeSegmentKey && segment.key === activeSegmentKey);

            return (
              <g key={segment.key || `${segment.color}-${segment.weight}-${segment.value}`}>
                <path
                  d={describeArc(size / 2, radius, startAngle, endAngle)}
                  fill="none"
                  stroke={trackColor}
                  strokeWidth={thickness}
                  strokeLinecap="butt"
                />
                {segment.value > 0 ? (
                  <path
                    d={describeArc(size / 2, radius, startAngle, filledEndAngle)}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={isActive ? thickness + 6 : thickness}
                    strokeLinecap="butt"
                    className="cursor-pointer transition-[opacity,stroke-width] duration-150"
                    style={{ opacity: activeSegmentKey && !isActive ? 0.55 : 1 }}
                    onMouseEnter={() => onSegmentEnter?.(segment)}
                    onMouseLeave={() => onSegmentLeave?.()}
                    onFocus={() => onSegmentEnter?.(segment)}
                    onBlur={() => onSegmentLeave?.()}
                    tabIndex={segment.key ? 0 : -1}
                    role={segment.key ? "img" : undefined}
                    aria-label={segment.label ? `${segment.label}: ${segment.value}%` : undefined}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
      ) : (
        <div
          className="absolute inset-0 rounded-full border border-black/10"
          style={{
            background: `conic-gradient(${fillColor} ${safeValue * 3.6}deg, ${trackColor} 0deg)`,
          }}
        />
      )}
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
