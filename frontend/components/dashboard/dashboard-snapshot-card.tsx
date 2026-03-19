import type { RefObject } from "react";
import { Download, Share2, Trophy } from "lucide-react";
import { statusSelectTone } from "@/app/universities/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Skeleton } from "@/components/ui/skeleton";

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
  profileClass: string;
  activities: string[];
  honors: string[];
  targetUniversityEntries: SnapshotUniversity[];
  loading: boolean;
  admissions: number;
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
  profileClass,
  activities,
  honors,
  targetUniversityEntries,
  loading,
  admissions,
}: DashboardSnapshotSurfaceProps) {
  const showAllTests = allTestLabels.length > 0;

  return (
    <Card className="relative overflow-hidden bg-white">
      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full border-2 border-black/10 bg-[#FFDB58]/20" />
      <div className="relative">
        <div className="mb-3 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-1 text-sm font-semibold">
          Shareable Dashboard Snapshot
        </div>
        <CardTitle className="text-2xl">Profile snapshot worth sharing</CardTitle>
        <CardDescription className="mt-1">
          A clean admissions card with your profile, activities, and current university list.
        </CardDescription>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-black/15 bg-white p-5">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] text-black">{shareName}</h2>
              <p className="mt-2 text-base font-semibold text-black/70">{shareCountry}</p>
              <p className="mt-1 text-base font-semibold text-black/70">{shareIntake}</p>
              <p className="mt-4 text-lg font-bold text-black">Major: {profileMajor}</p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-black/12">
              <div className="grid grid-cols-2 md:grid-cols-4">
                <div className="border-r border-black/8 px-4 py-3 md:last:border-r">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">GPA</p>
                  <p className="mt-1 text-lg font-black text-black">{gpaLabel}</p>
                </div>
                <div className="border-r border-black/8 px-4 py-3 md:last:border-r">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">{academicStatLabel}</p>
                  <p className="mt-1 text-lg font-black text-black">{primaryAcademicLabel}</p>
                </div>
                <div className="border-r border-black/8 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">{languageStatLabel}</p>
                  <p className="mt-1 text-lg font-black text-black">{primaryLanguageLabel}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Level</p>
                  <p className="mt-1 text-lg font-black text-black">{profileClass}</p>
                </div>
              </div>

              {showAllTests ? (
                <div className="border-t border-black/8 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">All Tests</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {allTestLabels.map((label) => (
                      <span
                        key={label}
                        className="inline-flex rounded-full border border-black/12 bg-[#F5F8FC] px-3 py-1 text-xs font-black tracking-[0.08em] text-black/70"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.86fr]">
              <div className="rounded-2xl border border-black/10 bg-[#F5F8FC] p-4">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-black/45">Activities</p>
                {activities.length ? (
                  <ul className="mt-3 grid gap-3">
                    {activities.map((activity) => (
                      <li key={activity} className="flex gap-2 text-sm font-semibold leading-relaxed text-black/80">
                        <span className="mt-[1px] text-black">&bull;</span>
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-black/55">No activities added yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-black/10 bg-[#FFF9E8] p-4">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-black/45">Target Universities</p>
                {targetUniversityEntries.length ? (
                  <ul className="mt-3 grid gap-2.5">
                    {targetUniversityEntries.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                        <span className="min-w-0 flex-1 font-semibold leading-relaxed text-black">{item.name}</span>
                        <span
                          className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-black/70 ${statusSelectTone(
                            (item.statusKey || item.status) as never,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-black/55">No universities selected yet.</p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-black/45">Honors</p>
              {honors.length ? (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {honors.map((honor) => (
                    <div
                      key={honor}
                      className="rounded-xl border border-black/12 bg-[#FFF4CC] px-3 py-3 text-sm font-semibold leading-relaxed text-black/80"
                    >
                      {honor}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-black/55">No honors added yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-black/15 bg-white p-4">
            <div className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#FFDB58]/40 px-3 py-1 text-sm font-semibold">
              <Trophy className="h-4 w-4" />
              Admissions Score
            </div>
            <div className="mt-4 flex items-center justify-center">
              {loading ? (
                <Skeleton className="h-36 w-36 rounded-full" />
              ) : (
                <CircularProgress value={admissions} size={150} fillColor="#FFDB58" trackColor="#E6EAEE" />
              )}
            </div>
            <p className="mt-3 text-center text-sm text-black/65">
              Score improves when profile completeness, tests, and university planning improve.
            </p>
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
  return (
    <div ref={snapshotRef}>
      <DashboardSnapshotSurface {...surfaceProps} />
      <div className="mt-4 grid gap-2" data-share-ignore>
        <Button onClick={onShare} className="gap-2" disabled={sharingDashboard || savingSnapshot}>
          <Share2 className="h-4 w-4" />
          {sharingDashboard ? "Preparing image..." : "Share dashboard"}
        </Button>
        <Button variant="outline" onClick={onSaveImage} className="gap-2" disabled={savingSnapshot || sharingDashboard}>
          <Download className="h-4 w-4" />
          {savingSnapshot ? "Saving image..." : "Save image"}
        </Button>
        <Button variant="secondary" onClick={onEdit}>
          Edit profile
        </Button>
      </div>
    </div>
  );
}

export function DashboardExportCard({
  snapshotRef,
  ...surfaceProps
}: DashboardSnapshotSurfaceProps & { snapshotRef: RefObject<HTMLDivElement> }) {
  return (
    <div ref={snapshotRef} className="w-[1600px] bg-[#F9F5F6] p-10">
      <div className="mx-auto w-[1520px]">
        <DashboardSnapshotSurface {...surfaceProps} />
      </div>
    </div>
  );
}
