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

type ScoreSegmentData = AdmissionsScoreBreakdown["segments"][number] & {
  value: number;
  isFilled: boolean;
};

export function AdmissionsScoreDonut({ breakdown, total, className }: AdmissionsScoreDonutProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const trackColor = "#E6EAEE";

  const segments = useMemo<ScoreSegmentData[]>(
    () =>
      breakdown.segments.flatMap((segment) => {
        const filledValue = Math.max(0, Math.min(segment.weight, segment.contribution));
        const remainderValue = Math.max(0, segment.weight - filledValue);
        const slices: ScoreSegmentData[] = [];

        if (filledValue > 0) {
          slices.push({
            ...segment,
            value: filledValue,
            isFilled: true,
          });
        }

        if (remainderValue > 0) {
          slices.push({
            ...segment,
            value: remainderValue,
            isFilled: false,
          });
        }

        return slices;
      }),
    [breakdown.segments],
  );

  const activeSegment = activeKey ? breakdown.segments.find((segment) => segment.key === activeKey) || null : null;

  return (
    <div className={cn("relative mx-auto w-full max-w-[260px]", className)}>
      <div className="relative mx-auto h-[196px] w-[196px]">
        <PieChart width={196} height={196}>
          <Pie
            data={segments}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={64}
            outerRadius={86}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            stroke="none"
            onMouseEnter={(_, index) => setActiveKey(segments[index]?.key || null)}
            onMouseLeave={() => setActiveKey(null)}
            onClick={(_, index) => {
              const nextKey = segments[index]?.key || null;
              setActiveKey((current) => (current === nextKey ? null : nextKey));
            }}
          >
            {segments.map((segment) => {
              const isDimmed = Boolean(activeKey && activeKey !== segment.key);
              return (
                <Cell
                  key={`${segment.key}-${segment.isFilled ? "filled" : "remainder"}-${segment.value}`}
                  fill={segment.isFilled ? segment.color : trackColor}
                  fillOpacity={segment.isFilled ? (isDimmed ? 0.35 : 1) : isDimmed ? 0.75 : 1}
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

      {activeSegment ? (
        <div className="mt-3 rounded-2xl bg-white px-3 py-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/10">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: activeSegment.color }}
              aria-hidden="true"
            />
            <p className="text-sm font-black text-black">{activeSegment.label}</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-black/65">{activeSegment.description}</p>
          <p className="mt-2 text-xs font-semibold text-black/55">
            {activeSegment.contribution}/{activeSegment.weight} pts · {activeSegment.status}
          </p>
        </div>
      ) : null}
    </div>
  );
}
