"use client";

import { Pie, PieChart, Cell } from "recharts";
import type { AdmissionsScoreBreakdown } from "@/app/dashboard/utils";
import { cn } from "@/lib/utils";

type AdmissionsScoreDonutProps = {
  breakdown: AdmissionsScoreBreakdown;
  total: number;
  className?: string;
};

export function AdmissionsScoreDonut({ breakdown, total, className }: AdmissionsScoreDonutProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[280px]", className)}>
      <div className="relative mx-auto h-[196px] w-[196px]">
        <PieChart width={196} height={196}>
          <Pie
            data={[
              { key: "score", value: total, color: "#FFDB58" },
              { key: "remaining", value: Math.max(0, 100 - total), color: "#E6EAEE" },
            ]}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={64}
            outerRadius={88}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            stroke="none"
          >
            <Cell fill="#FFDB58" />
            <Cell fill="#E6EAEE" />
          </Pie>
        </PieChart>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-[128px] w-[128px] items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
            <div className="text-[44px] font-black leading-none tracking-tight text-black">{total}%</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5">
        {breakdown.segments.map((segment) => (
          <div key={segment.key} className="rounded-2xl bg-[#F7F7F7] px-3 py-3 ring-1 ring-black/8">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: segment.color }}
                    aria-hidden="true"
                  />
                  <p className="truncate text-sm font-black text-black">{segment.label}</p>
                </div>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/40">
                  {segment.contribution}/{segment.weight} pts
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-black text-black">{segment.score}%</p>
              </div>
            </div>

            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#E6EAEE]">
              <div
                className="h-full rounded-full transition-[width] duration-200"
                style={{
                  width: `${segment.score}%`,
                  backgroundColor: segment.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
