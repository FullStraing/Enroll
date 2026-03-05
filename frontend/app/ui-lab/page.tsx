"use client";

import { useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export default function UiLabPage() {
  const [progress, setProgress] = useState(42);
  const [menuPreviewCollapsed, setMenuPreviewCollapsed] = useState(false);

  return (
    <ProtectedPage>
      <AppShell title="UI Lab" subtitle="Песочница для выбора базовых компонентов из shadcn/ui подхода">
        <div className="grid gap-5">
          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Buttons</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary" size="lg">
                Large
              </Button>
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Burger Menu</h2>
            <p className="mt-2 text-sm text-black/65">Preview and choose one style for sidebar toggle.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Card className="shadow-none">
                <CardTitle className="text-base">Classic</CardTitle>
                <CardDescription className="mt-1">Simple menu icon.</CardDescription>
                <Button variant="outline" size="sm" className="mt-3 h-9 w-9 px-0">
                  <Menu className="h-4 w-4" />
                </Button>
              </Card>
              <Card className="shadow-none">
                <CardTitle className="text-base">Panel (recommended)</CardTitle>
                <CardDescription className="mt-1">Matches sidebar expand/collapse logic.</CardDescription>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-9 w-9 px-0"
                  onClick={() => setMenuPreviewCollapsed((prev) => !prev)}
                >
                  {menuPreviewCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
              </Card>
              <Card className="shadow-none">
                <CardTitle className="text-base">Primary accent</CardTitle>
                <CardDescription className="mt-1">Same icon with primary color button.</CardDescription>
                <Button variant="primary" size="sm" className="mt-3 h-9 w-9 px-0">
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </Card>
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Badges</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="cyan">Cyan</Badge>
              <Badge variant="orange">Orange</Badge>
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Spinners</h2>
            <div className="mt-3 flex flex-wrap items-center gap-5">
              <Spinner size="sm" label="sm" />
              <Spinner size="md" label="md" />
              <Spinner size="lg" label="lg" />
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Progress</h2>
            <div className="mt-3 space-y-4">
              <div>
                <p className="mb-2 text-sm text-black/65">Primary</p>
                <Progress value={progress} className="h-3" variant="primary" />
              </div>
              <div>
                <p className="mb-2 text-sm text-black/65">Cyan</p>
                <Progress value={progress} className="h-3" variant="cyan" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setProgress((p) => Math.max(0, p - 10))}>
                  -10%
                </Button>
                <Button variant="outline" size="sm" onClick={() => setProgress((p) => Math.min(100, p + 10))}>
                  +10%
                </Button>
                <span className="self-center text-sm text-black/65">{progress}%</span>
              </div>
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Skeletons</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-black/10 bg-white p-4">
                <p className="mb-3 text-sm text-black/65">Soft (default)</p>
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-7 w-full" variant="soft" />
                  <Skeleton className="h-7 w-full" variant="soft" />
                  <Skeleton className="h-7 w-full" variant="soft" />
                </div>
                <Skeleton className="mt-3 h-20 w-full" variant="soft" />
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-4">
                <p className="mb-3 text-sm text-black/65">Shimmer alternative</p>
                <Skeleton className="h-5 w-40" variant="shimmer" />
                <Skeleton className="mt-3 h-4 w-full" variant="shimmer" />
                <Skeleton className="mt-2 h-4 w-10/12" variant="shimmer" />
                <Skeleton className="mt-4 h-9 w-28" variant="shimmer" />
              </div>
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Cards</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Card>
                <CardTitle>Compact card</CardTitle>
                <CardDescription className="mt-2">This style matches the current Enroll light theme.</CardDescription>
              </Card>
              <Card className="bg-[#DAF5F0]">
                <CardTitle>Accent card</CardTitle>
                <CardDescription className="mt-2">Can be used for highlights and status summaries.</CardDescription>
              </Card>
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Circular Progress (like screenshot)</h2>
            <div className="mt-3 flex flex-wrap gap-6">
              <CircularProgress value={90} fillColor="#FFDB58" />
              <CircularProgress value={68} fillColor="#84DCCB" />
              <CircularProgress value={42} fillColor="#F8D6B3" />
            </div>
          </section>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
