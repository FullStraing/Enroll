import Link from "next/link";
import { Share2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Skeleton } from "@/components/ui/skeleton";

type SnapshotTest = {
  type?: string;
  score: string;
};

type SnapshotAp = {
  exam: string;
  score: string;
};

type SnapshotUniversity = {
  id: number;
  name: string;
  status: string;
};

type Props = {
  shareName: string;
  shareCountry: string;
  shareIntake: string;
  profileMajor: string;
  gpaLabel: string;
  primaryAcademicLabel: string;
  primaryLanguageLabel: string;
  profileClass: string;
  shareAcademicTests: SnapshotTest[];
  shareLanguageTests: SnapshotTest[];
  shareApScores: SnapshotAp[];
  activities: string[];
  targetUniversityEntries: SnapshotUniversity[];
  loading: boolean;
  admissions: number;
  sharingDashboard: boolean;
  onShare: () => void;
  onEdit: () => void;
  formatTestDisplay: (type: string, score: string | number | null | undefined) => string;
};

export function DashboardSnapshotCard({
  shareName,
  shareCountry,
  shareIntake,
  profileMajor,
  gpaLabel,
  primaryAcademicLabel,
  primaryLanguageLabel,
  profileClass,
  shareAcademicTests,
  shareLanguageTests,
  shareApScores,
  activities,
  targetUniversityEntries,
  loading,
  admissions,
  sharingDashboard,
  onShare,
  onEdit,
  formatTestDisplay,
}: Props) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-[#DAF5F0]/35">
      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full border-2 border-black/10 bg-[#FFDB58]/20" />
      <div className="relative">
        <div className="mb-3 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-1 text-sm font-semibold">
          Shareable Dashboard Snapshot
        </div>
        <CardTitle className="text-2xl">Profile snapshot worth sharing</CardTitle>
        <CardDescription className="mt-1">A clean admissions card with your profile, activities, and current university list.</CardDescription>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-black/15 bg-white p-5">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] text-black">{shareName}</h2>
              <p className="mt-2 text-base font-semibold text-black/70">{shareCountry}</p>
              <p className="mt-1 text-base font-semibold text-black/70">{shareIntake}</p>
              <p className="mt-4 text-lg font-bold text-black">Major: {profileMajor}</p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-black/12">
              <div className="grid grid-cols-2 border-b border-black/8 md:grid-cols-4">
                <div className="border-r border-black/8 px-4 py-3 md:last:border-r">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">GPA</p>
                  <p className="mt-1 text-lg font-black text-black">{gpaLabel}</p>
                </div>
                <div className="border-r border-black/8 px-4 py-3 md:last:border-r">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Academic</p>
                  <p className="mt-1 text-lg font-black text-black">{primaryAcademicLabel}</p>
                </div>
                <div className="border-r border-black/8 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Language</p>
                  <p className="mt-1 text-lg font-black text-black">{primaryLanguageLabel}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Level</p>
                  <p className="mt-1 text-lg font-black text-black">{profileClass}</p>
                </div>
              </div>
            </div>

            {shareAcademicTests.length > 1 || shareLanguageTests.length > 1 || shareApScores.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-black/10 bg-[#FFFDF8] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Academic Tests</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {shareAcademicTests.length ? (
                      shareAcademicTests.map((item) => (
                        <span key={`${item.type}-${item.score}`} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-bold text-black/75">
                          {formatTestDisplay(item.type || "", item.score)}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-black/50">N/A</span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-[#FFFDF8] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">Language Tests</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {shareLanguageTests.length ? (
                      shareLanguageTests.map((item) => (
                        <span key={`${item.type}-${item.score}`} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-bold text-black/75">
                          {formatTestDisplay(item.type || "", item.score)}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-black/50">N/A</span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-[#FFFDF8] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-black/40">AP Exams</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {shareApScores.length ? (
                      shareApScores.slice(0, 4).map((item) => (
                        <span key={`${item.exam}-${item.score}`} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-bold text-black/75">
                          {item.exam.replace("AP ", "")}: {item.score}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-black/50">None</span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-[#F5F8FC] p-4">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-black/45">Activities</p>
                {activities.length ? (
                  <ul className="mt-3 grid gap-2">
                    {activities.map((activity) => (
                      <li key={activity} className="text-sm font-semibold text-black/80">
                        вЂў {activity}
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
                  <ul className="mt-3 grid gap-2">
                    {targetUniversityEntries.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-black">{item.name}</span>
                        <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-black/60">
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
          </div>

          <div className="rounded-2xl border border-black/15 bg-white p-4">
            <div className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#FFDB58]/40 px-3 py-1 text-sm font-semibold">
              <Trophy className="h-4 w-4" />
              Admissions Score
            </div>
            <div className="mt-4 flex items-center justify-center">
              {loading ? <Skeleton className="h-36 w-36 rounded-full" /> : <CircularProgress value={admissions} size={150} fillColor="#FFDB58" trackColor="#E6EAEE" />}
            </div>
            <p className="mt-3 text-center text-sm text-black/65">
              Score improves when profile completeness, tests, and university planning improve.
            </p>
            <div className="mt-5 grid gap-2">
              <Button onClick={onShare} className="gap-2" disabled={sharingDashboard}>
                <Share2 className="h-4 w-4" />
                {sharingDashboard ? "Preparing image..." : "Share dashboard"}
              </Button>
              <Button variant="secondary" onClick={onEdit}>
                Edit profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
