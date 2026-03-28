"use client";

import { useMemo, useState } from "react";
import { Pie, PieChart, Cell } from "recharts";
import type { AdmissionsScoreBreakdown } from "@/app/dashboard/utils";
import { cn } from "@/lib/utils";

type AdmissionsScoreDonutProps = {
  breakdown: AdmissionsScoreBreakdown;
  total: number;
  className?: string;
};

type DonutSlice = {
  key: string;
  label: string;
  weight: number;
  score: number;
  contribution: number;
  missingPoints: number;
  status: "Complete" | "Needs work" | "Missing";
  color: string;
  description: string;
  missingHint: string;
  sliceKey: string;
  value: number;
};

export function AdmissionsScoreDonut({ breakdown, total, className }: AdmissionsScoreDonutProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const trackColor = "#E6EAEE";

  const slices = useMemo<DonutSlice[]>(
    () => {
      const earnedSlices: DonutSlice[] = breakdown.segments
        .filter((segment) => segment.contribution > 0)
        .map((segment) => ({
          key: segment.key,
          label: segment.label,
          weight: segment.weight,
          score: segment.score,
          contribution: segment.contribution,
          missingPoints: segment.missingPoints,
          status: segment.status,
          color: segment.color,
          description: segment.description,
          missingHint: segment.missingHint,
          sliceKey: segment.key,
          value: segment.contribution,
        }));

      const remainingTotal = Math.max(0, 100 - breakdown.total);

      if (remainingTotal > 0) {
        earnedSlices.push({
          key: "missing",
          label: "Missing to improve score",
          weight: remainingTotal,
          value: remainingTotal,
          score: 0,
          contribution: remainingTotal,
          missingPoints: remainingTotal,
          status: "Needs work",
          color: trackColor,
          description: "Grouped remaining score across all admissions categories.",
          missingHint: "Complete profile readiness, tests, and planning to increase your score.",
          sliceKey: "missing",
        });
      }

      return earnedSlices;
    },
    [breakdown.segments, breakdown.total],
  );

  const activeSegment =
    activeKey === "missing"
      ? null
      : activeKey
        ? breakdown.segments.find((segment) => segment.key === activeKey) || null
        : null;
  const coloredSpan = total * 3.6;
  const startAngle = coloredSpan / 2;
  const missingSummary = breakdown.segments.filter((segment) => segment.missingPoints > 0);

  return (
    <div className={cn("relative mx-auto w-full max-w-[280px] pb-[108px] sm:pb-[104px]", className)}>
      <div className="relative mx-auto h-[196px] w-[196px]">
        <PieChart width={196} height={196}>
          <Pie
            data={slices}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={64}
            outerRadius={88}
            startAngle={startAngle}
            endAngle={-270}
            paddingAngle={0}
            stroke="none"
            isAnimationActive={false}
            onMouseEnter={(_, index) => setActiveKey(slices[index]?.key || null)}
            onMouseLeave={() => setActiveKey(null)}
            onClick={(_, index) => {
              const nextKey = slices[index]?.key || null;
              setActiveKey((current) => (current === nextKey ? null : nextKey));
            }}
          >
            {slices.map((slice) => {
              const isDimmed = Boolean(activeKey && slice.key !== activeKey);
              return (
                <Cell
                  key={slice.sliceKey}
                  fill={slice.color}
                  fillOpacity={isDimmed ? 0.4 : 1}
                  stroke={activeKey === slice.key ? (slice.key === "missing" ? "#B8C0C8" : slice.color) : "none"}
                  strokeWidth={activeKey === slice.key ? 3 : 0}
                  style={{ outline: "none" }}
                  className="cursor-pointer outline-none transition-opacity duration-150"
                />
              );
            })}
          </Pie>
        </PieChart>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-[128px] w-[128px] items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
            <div className="text-[44px] font-black leading-none tracking-tight text-black">{total}%</div>
          </div>
        </div>
      </div>

      {activeKey === "missing" ? (
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[280px] rounded-2xl bg-[#F7F7F7] px-3 py-3 ring-1 ring-black/8">
          <p className="text-sm font-black text-black">Missing to improve score</p>
          <div className="mt-2 grid gap-1.5">
            {missingSummary.map((segment) => (
              <p key={segment.key} className="text-sm text-black/70">
                <span className="font-semibold text-black">{segment.label}:</span> +{segment.missingPoints} pts
              </p>
            ))}
          </div>
        </div>
      ) : activeSegment ? (
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[280px] rounded-2xl bg-[#F7F7F7] px-3 py-3 ring-1 ring-black/8">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: activeSegment.color }}
              aria-hidden="true"
            />
            <p className="text-sm font-black text-black">{activeSegment.label}</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-black">
            {activeSegment.contribution} / {activeSegment.weight} pts
          </p>
          <p className="mt-1 text-sm font-semibold text-black">{activeSegment.score}%</p>
          <p className="mt-1 text-sm font-semibold text-black/80">
            Contribution to total: {activeSegment.contribution} pts
          </p>
          <p className="mt-1 text-sm text-black/65">{activeSegment.status === "Complete" ? "Complete" : activeSegment.missingHint}</p>
        </div>
      ) : null}
    </div>
  );
}
