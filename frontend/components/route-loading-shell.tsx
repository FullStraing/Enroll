"use client";

import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardLikeLoading() {
  return (
    <>
      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-[#DAF5F0]/35 shadow-none">
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-black/15 bg-white p-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-5 w-32" />
                <Skeleton className="mt-3 h-9 w-20 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-black/15 bg-white p-4">
            <Skeleton className="h-6 w-36 rounded-xl" />
            <div className="mt-4 flex justify-center">
              <Skeleton className="h-36 w-36 rounded-full" />
            </div>
            <Skeleton className="mx-auto mt-4 h-3 w-40" />
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-black/15 bg-white p-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-4 w-3/4" />
        </div>
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="shadow-none">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-2 h-3 w-48" />
            <Skeleton className="mt-4 h-3 w-full" />
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="flex h-full flex-col shadow-none">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-2/3" />
                <Skeleton className="mt-4 h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-14 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-3 w-full rounded-full" />
            <Skeleton className="mt-auto h-9 w-28 rounded-xl pt-4" />
          </Card>
        ))}
      </div>
    </>
  );
}

function GenericPageLoading() {
  return (
    <>
      <Card className="shadow-none">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-10 w-64" />
        <Skeleton className="mt-4 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-5/6" />
      </Card>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="shadow-none">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-5 h-28 w-full rounded-2xl" />
          </Card>
        ))}
      </div>
    </>
  );
}

export function RouteLoadingShell({
  title,
  subtitle,
  variant = "generic",
}: {
  title: string;
  subtitle: string;
  variant?: "generic" | "dashboard";
}) {
  return (
    <ProtectedPage>
      <AppShell title={title} subtitle={subtitle}>
        {variant === "dashboard" ? <DashboardLikeLoading /> : <GenericPageLoading />}
      </AppShell>
    </ProtectedPage>
  );
}
