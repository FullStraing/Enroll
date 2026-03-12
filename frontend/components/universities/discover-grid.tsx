"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { money } from "@/app/universities/utils";
import type { University } from "@/app/universities/types";

type DiscoverGridProps = {
  loading: boolean;
  items: University[];
  pageSize: number;
  myUniversityIds: Set<number>;
  updatingItemId: number | null;
  onOpen: (id: number) => void;
  onAdd: (university: University) => void;
};

export function DiscoverGrid({
  loading,
  items,
  pageSize,
  myUniversityIds,
  updatingItemId,
  onOpen,
  onAdd,
}: DiscoverGridProps) {
  return (
    <div className="mt-4 grid gap-4 xl:grid-cols-2">
      {loading
        ? Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
            <Card key={`d-sk-${index}`} className="shadow-none">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/2" />
              <Skeleton className="mt-3 h-9 w-28" />
            </Card>
          ))
        : items.map((university) => (
            <Card
              key={university.id}
              role="button"
              tabIndex={0}
              className="cursor-pointer shadow-none transition hover:-translate-y-0.5"
              onClick={() => onOpen(university.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen(university.id);
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{university.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {university.city || "-"}, {university.state || "-"}, {university.country || "USA"}
                  </CardDescription>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>Acceptance: {university.acceptance_rate != null ? `${university.acceptance_rate}%` : "N/A"}</Badge>
                    <Badge variant="cyan">Tuition: {money(university.tuition_out_state)}</Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {myUniversityIds.has(university.id) ? (
                    <Badge variant="primary">Added</Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAdd(university);
                      }}
                      disabled={updatingItemId === university.id}
                    >
                      Add to my list
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
    </div>
  );
}
