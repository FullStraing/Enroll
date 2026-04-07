"use client";

import { useMemo, useState } from "react";
import { Pie, PieChart, Cell } from "recharts";
import type { AdmissionsScoreBreakdown } from "@/app/dashboard/utils";
import { useLocale } from "@/components/locale-provider";
import { getDashboardCopy } from "@/lib/dashboard-copy";
import { cn } from "@/lib/utils";

type AdmissionsScoreDonutProps = {
  breakdown: AdmissionsScoreBreakdown;
  total: number;
  className?: string;
  mode?: "interactive" | "export";
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

function buildSlices(breakdown: AdmissionsScoreBreakdown, trackColor: string, copy: ReturnType<typeof getDashboardCopy>["donut"]): DonutSlice[] {
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
      label: copy.missingTitle,
      weight: remainingTotal,
      value: remainingTotal,
      score: 0,
      contribution: remainingTotal,
      missingPoints: remainingTotal,
      status: "Needs work",
      color: trackColor,
      description: copy.groupedDescription,
      missingHint: copy.groupedHint,
      sliceKey: "missing",
    });
  }

  return earnedSlices;
}

function buildExportGradient(slices: DonutSlice[], total: number) {
  if (!slices.length) {
    return "conic-gradient(from -90deg, #E6EAEE 0deg 360deg)";
  }

  const coloredSpan = total * 3.6;
  const startAngle = coloredSpan / 2 - 90;
  let cursor = 0;
  const stops = slices.map((slice) => {
    const nextCursor = cursor + slice.value * 3.6;
    const stop = `${slice.color} ${cursor}deg ${nextCursor}deg`;
    cursor = nextCursor;
    return stop;
  });

  return `conic-gradient(from ${startAngle}deg, ${stops.join(", ")})`;
}

function ExportScoreDonut({ slices, total }: { slices: DonutSlice[]; total: number }) {
  const gradient = useMemo(() => buildExportGradient(slices, total), [slices, total]);

  return (
    <div className="relative mx-auto h-[196px] w-[196px]">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundImage: gradient,
        }}
      />
      <div className="absolute inset-[20px] rounded-full bg-[var(--enroll-surface-elevated)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-[44px] font-black leading-none tracking-tight text-[var(--enroll-fg)]">{total}%</div>
      </div>
    </div>
  );
}

export function AdmissionsScoreDonut({
  breakdown,
  total,
  className,
  mode = "interactive",
}: AdmissionsScoreDonutProps) {
  const { locale } = useLocale();
  const copy = getDashboardCopy(locale).donut;
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const trackColor = "#E6EAEE";

  const slices = useMemo(() => buildSlices(breakdown, trackColor, copy), [breakdown, copy]);

  if (mode === "export") {
    return (
      <div className={cn("relative mx-auto w-full max-w-[280px]", className)}>
        <ExportScoreDonut slices={slices} total={total} />
      </div>
    );
  }

  const activeSegment =
    activeKey === "missing"
      ? null
      : activeKey
        ? breakdown.segments.find((segment) => segment.key === activeKey) || null
        : null;
  const hasTooltip = activeKey === "missing" || Boolean(activeSegment);
  const coloredSpan = total * 3.6;
  const startAngle = coloredSpan / 2;
  const missingSummary = breakdown.segments.filter((segment) => segment.missingPoints > 0);

  return (
    <div className={cn("relative mx-auto w-full max-w-[280px]", hasTooltip ? "pb-[108px] sm:pb-[104px]" : "pb-0", className)}>
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
          <div className="flex h-[128px] w-[128px] items-center justify-center rounded-full bg-[var(--enroll-surface-elevated)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <div className="text-[44px] font-black leading-none tracking-tight text-[var(--enroll-fg)]">{total}%</div>
          </div>
        </div>
      </div>

      {activeKey === "missing" ? (
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[280px] rounded-2xl bg-[var(--enroll-surface-elevated)] px-3 py-3 ring-1 ring-[var(--enroll-surface-border)]">
          <p className="text-sm font-black text-[var(--enroll-fg)]">{copy.missingSummaryIntro}</p>
          <div className="mt-2 grid gap-1.5">
            {missingSummary.map((segment) => (
              <p key={segment.key} className="text-sm text-[var(--enroll-fg)]/70">
                <span className="font-semibold text-[var(--enroll-fg)]">{segment.label}:</span> +{segment.missingPoints} pts
              </p>
            ))}
          </div>
        </div>
      ) : activeSegment ? (
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[280px] rounded-2xl bg-[var(--enroll-surface-elevated)] px-3 py-3 ring-1 ring-[var(--enroll-surface-border)]">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: activeSegment.color }}
              aria-hidden="true"
            />
            <p className="text-sm font-black text-[var(--enroll-fg)]">{activeSegment.label}</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-[var(--enroll-fg)]">
            {activeSegment.contribution} / {activeSegment.weight} pts
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--enroll-fg)]">{activeSegment.score}%</p>
          <p className="mt-1 text-sm font-semibold text-[var(--enroll-fg)]/80">
            {copy.contributionToTotal}: {activeSegment.contribution} pts
          </p>
          <p className="mt-1 text-sm text-[var(--enroll-fg)]/65">{activeSegment.status === "Complete" ? copy.complete : activeSegment.missingHint}</p>
        </div>
      ) : null}
    </div>
  );
}

