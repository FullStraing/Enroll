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

type DonutSlice = AdmissionsScoreBreakdown["segments"][number] & {
  sliceKey: string;
  value: number;
  isFilled: boolean;
};

export function AdmissionsScoreDonut({ breakdown, total, className }: AdmissionsScoreDonutProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const trackColor = "#E6EAEE";

  const slices = useMemo<DonutSlice[]>(
    () =>
      breakdown.segments.flatMap((segment) => {
        const remaining = Math.max(0, segment.weight - segment.contribution);
        const nextSlices: DonutSlice[] = [];

        if (segment.contribution > 0) {
          nextSlices.push({
            ...segment,
            sliceKey: `${segment.key}-filled`,
            value: segment.contribution,
            isFilled: true,
          });
        }

        if (remaining > 0) {
          nextSlices.push({
            ...segment,
            sliceKey: `${segment.key}-remaining`,
            value: remaining,
            isFilled: false,
          });
        }

        return nextSlices;
      }),
    [breakdown.segments],
  );

  const activeSegment = activeKey ? breakdown.segments.find((segment) => segment.key === activeKey) || null : null;

  return (
    <div className={cn("mx-auto w-full max-w-[280px]", className)}>
      <div className="relative mx-auto h-[196px] w-[196px]">
        <PieChart width={196} height={196}>
          <Pie
            data={slices}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={64}
            outerRadius={88}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            stroke="none"
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
                  fill={slice.isFilled ? slice.color : trackColor}
                  fillOpacity={slice.isFilled ? (isDimmed ? 0.4 : 1) : isDimmed ? 0.7 : 1}
                  stroke={activeKey === slice.key ? slice.color : "none"}
                  strokeWidth={activeKey === slice.key ? 3 : 0}
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
        <div className="mt-4 rounded-2xl bg-[#F7F7F7] px-3 py-3 ring-1 ring-black/8">
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
          <p className="mt-1 text-sm font-semibold text-black/80">{activeSegment.status}</p>
          <p className="mt-1 text-sm text-black/65">{activeSegment.missingHint}</p>
        </div>
      ) : null}
    </div>
  );
}
