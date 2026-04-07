"use client";

import type { ReactNode, RefObject } from "react";
import { Download, Share2, Trophy } from "lucide-react";
import { statusSelectTone } from "@/app/universities/utils";
import type { AdmissionsScoreBreakdown } from "@/app/dashboard/utils";
import { EnrollWordmark } from "@/components/brand/enroll-wordmark";
import { AdmissionsScoreDonut } from "@/components/dashboard/admissions-score-donut";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardCopy } from "@/lib/dashboard-copy";

export type SnapshotUniversity = {
  id: number;
  name: string;
  statusKey?: string;
  status: string;
};

export type DashboardSnapshotSurfaceProps = {
  shareName: string;
  shareCountry: string;
  shareIntake: string;
  profileMajor: string;
  gpaLabel: string;
  academicStatLabel: string;
  primaryAcademicLabel: string;
  languageStatLabel: string;
  primaryLanguageLabel: string;
  allTestLabels: string[];
  apLabels: string[];
  profileClass: string;
  activities: string[];
  honors: string[];
  targetUniversityEntries: SnapshotUniversity[];
  loading: boolean;
  admissions: number;
  admissionsBreakdown: AdmissionsScoreBreakdown;
  actionsSlot?: ReactNode;
  donutMode?: "interactive" | "export";
};

type DashboardSnapshotCardProps = DashboardSnapshotSurfaceProps & {
  snapshotRef: RefObject<HTMLDivElement>;
  sharingDashboard: boolean;
  savingSnapshot: boolean;
  onShare: () => void;
  onSaveImage: () => void;
  onEdit: () => void;
};

function DashboardSnapshotSurface({
  shareName,
  shareCountry,
  shareIntake,
  profileMajor,
  gpaLabel,
  academicStatLabel,
  primaryAcademicLabel,
  languageStatLabel,
  primaryLanguageLabel,
  allTestLabels,
  apLabels,
  profileClass,
  activities,
  honors,
  targetUniversityEntries,
  loading,
  admissions,
  admissionsBreakdown,
  actionsSlot,
  donutMode = "interactive",
}: DashboardSnapshotSurfaceProps) {
  const { locale } = useLocale();
  const copy = getDashboardCopy(locale).snapshot;
  const showAllTests = allTestLabels.length > 0;
  const visibleHonors = honors.slice(0, 4);
  const hiddenHonorsCount = Math.max(0, honors.length - visibleHonors.length);

  return (
    <Card className="relative overflow-hidden border border-[var(--enroll-surface-border)] bg-[var(--enroll-surface-elevated)] text-[var(--enroll-fg)] shadow-none">
      <div className="relative">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-surface-elevated)] px-3 py-1 text-sm font-semibold text-[var(--enroll-fg)]">
              {copy.badge}
            </div>
            <CardTitle className="mt-3 text-2xl">{copy.title}</CardTitle>
            <CardDescription className="mt-1">
              {copy.description}
            </CardDescription>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 self-start text-[var(--enroll-fg)] sm:ml-auto">
            <div className="leading-none">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--enroll-muted)]">{copy.poweredBy}</p>
              <div className="mt-1">
                <EnrollWordmark size="md" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl bg-[var(--enroll-surface-elevated)] p-5 text-[var(--enroll-fg)] ring-1 ring-[var(--enroll-surface-border)]">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] text-[var(--enroll-fg)]">{shareName}</h2>
              <p className="mt-2 text-base font-semibold text-[var(--enroll-muted)]">{shareCountry}</p>
              <p className="mt-1 text-base font-semibold text-[var(--enroll-muted-strong)]">{shareIntake}</p>
              <p className="mt-4 text-lg font-bold text-[var(--enroll-fg)]">{copy.major}: {profileMajor}</p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl bg-[var(--enroll-surface-elevated)] ring-1 ring-[var(--enroll-surface-border)]">
              <div className="grid grid-cols-2 md:grid-cols-4">
                <div className="border-r border-[var(--enroll-surface-border)] px-4 py-3 md:last:border-r">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--enroll-muted)]">GPA</p>
                  <p className="mt-1 text-lg font-black text-[var(--enroll-fg)]">{gpaLabel}</p>
                </div>
                <div className="border-r border-[var(--enroll-surface-border)] px-4 py-3 md:last:border-r">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--enroll-muted)]">{academicStatLabel}</p>
                  <p className="mt-1 text-lg font-black text-[var(--enroll-fg)]">{primaryAcademicLabel}</p>
                </div>
                <div className="border-r border-[var(--enroll-surface-border)] px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--enroll-muted)]">{languageStatLabel}</p>
                  <p className="mt-1 text-lg font-black text-[var(--enroll-fg)]">{primaryLanguageLabel}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--enroll-muted)]">{copy.level}</p>
                  <p className="mt-1 text-lg font-black text-[var(--enroll-fg)]">{profileClass}</p>
                </div>
              </div>

              {showAllTests ? (
                <div className="border-t border-[var(--enroll-surface-border)] px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--enroll-muted)]">{copy.allTests}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {allTestLabels.map((label, index) => (
                      <span
                        key={`test-${index}-${label}`}
                        className="inline-flex shrink-0 items-center rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-cyan)]/55 px-3 py-1 text-xs font-black leading-none tracking-[0.03em] text-[var(--enroll-fg)] whitespace-nowrap"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {apLabels.length ? (
                <div className="border-t border-[var(--enroll-surface-border)] px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--enroll-muted)]">{copy.apExams}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {apLabels.map((label, index) => (
                      <span
                        key={`ap-${index}-${label}`}
                        className="inline-flex shrink-0 items-center rounded-full border border-[var(--enroll-surface-border)] bg-[var(--enroll-yellow-soft)] px-3 py-1 text-xs font-black leading-none tracking-[0.03em] text-[var(--enroll-fg)] whitespace-nowrap"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.86fr]">
              <div className="rounded-2xl bg-[var(--enroll-cyan)]/25 p-4 ring-1 ring-[var(--enroll-surface-border)]">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--enroll-muted)]">{copy.activities}</p>
                {activities.length ? (
                  <ul className="mt-3 grid gap-3">
                    {activities.map((activity, index) => (
                      <li key={`activity-${index}-${activity}`} className="flex gap-2 text-sm font-semibold leading-relaxed text-[var(--enroll-fg)]">
                        <span className="mt-[1px] text-[var(--enroll-fg)]">&bull;</span>
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[var(--enroll-muted)]">{copy.noActivities}</p>
                )}
              </div>

              <div className="rounded-2xl bg-[color-mix(in_srgb,var(--enroll-yellow)_24%,var(--enroll-surface-elevated))] p-4 ring-1 ring-[var(--enroll-surface-border)]">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--enroll-muted)]">{copy.targetUniversities}</p>
                {targetUniversityEntries.length ? (
                  <ul className="mt-3 grid gap-2.5">
                    {targetUniversityEntries.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                        <span className="min-w-0 flex-1 font-semibold leading-relaxed text-[var(--enroll-fg)]">{item.name}</span>
                        <span
                          className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--enroll-muted-strong)] ${statusSelectTone(
                            (item.statusKey || item.status) as never,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[var(--enroll-muted)]">{copy.noUniversities}</p>
                )}
              </div>
            </div>

          </div>

            <div className="flex h-full flex-col gap-4">
            <div className="rounded-2xl bg-[var(--enroll-surface-elevated)] p-4 ring-1 ring-[var(--enroll-surface-border)]">
              <div className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--enroll-strong-border)] bg-[var(--enroll-yellow)] px-3 py-1 text-sm font-semibold text-[var(--enroll-strong-fg)]">
                <Trophy className="h-4 w-4" />
                {copy.admissionsScore}
              </div>
              <div className="mt-4 flex items-center justify-center">
                {loading ? (
                  <Skeleton className="h-36 w-36 rounded-full" />
                ) : (
                  <AdmissionsScoreDonut breakdown={admissionsBreakdown} total={admissions} mode={donutMode} />
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-[color-mix(in_srgb,var(--enroll-yellow)_24%,var(--enroll-surface-elevated))] p-4 ring-1 ring-[var(--enroll-surface-border)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--enroll-muted)]">{copy.honors}</p>
                {hiddenHonorsCount > 0 ? (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--enroll-yellow)_38%,var(--enroll-surface-elevated))] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--enroll-fg)]">
                    +{hiddenHonorsCount} {copy.more}
                  </span>
                ) : null}
              </div>
              {visibleHonors.length ? (
                <div className="mt-3 grid gap-2">
                  {visibleHonors.map((honor, index) => (
                    <div
                      key={`honor-${index}-${honor}`}
                      className="rounded-xl border border-[var(--enroll-surface-border)] bg-[color-mix(in_srgb,var(--enroll-yellow)_18%,var(--enroll-surface-elevated))] px-3 py-3 text-sm font-semibold leading-relaxed text-[var(--enroll-fg)]"
                    >
                      {honor}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--enroll-muted)]">{copy.noHonors}</p>
              )}
            </div>

            {actionsSlot ? <div data-share-ignore>{actionsSlot}</div> : null}
          </div>
        </div>

      </div>
    </Card>
  );
}

export function DashboardSnapshotCard({
  snapshotRef,
  sharingDashboard,
  savingSnapshot,
  onShare,
  onSaveImage,
  onEdit,
  ...surfaceProps
}: DashboardSnapshotCardProps) {
  const { locale } = useLocale();
  const copy = getDashboardCopy(locale).snapshot;

  return (
    <div ref={snapshotRef}>
      <DashboardSnapshotSurface
        {...surfaceProps}
        donutMode="interactive"
        actionsSlot={
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              onClick={onShare}
              className="w-full gap-2 sm:min-w-[150px] sm:w-auto"
              disabled={sharingDashboard || savingSnapshot}
            >
              <Share2 className="h-4 w-4" />
              {sharingDashboard ? copy.preparingImage : copy.copyImage}
            </Button>
            <Button
              variant="outline"
              onClick={onSaveImage}
              className="w-full gap-2 sm:min-w-[136px] sm:w-auto"
              disabled={savingSnapshot || sharingDashboard}
            >
              <Download className="h-4 w-4" />
              {savingSnapshot ? copy.savingImage : copy.saveImage}
            </Button>
            <Button variant="secondary" onClick={onEdit} className="w-full sm:min-w-[132px] sm:w-auto">
              {copy.editProfile}
            </Button>
          </div>
        }
      />
    </div>
  );
}

export function DashboardExportCard({
  snapshotRef,
  ...surfaceProps
}: DashboardSnapshotSurfaceProps & { snapshotRef: RefObject<HTMLDivElement> }) {
  return (
    <div ref={snapshotRef} className="w-[1600px] bg-[var(--enroll-surface-elevated)] p-10">
      <div className="mx-auto w-[1520px]">
        <DashboardSnapshotSurface {...surfaceProps} donutMode="export" />
      </div>
    </div>
  );
}


