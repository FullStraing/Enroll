"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ProgressBlock } from "@/app/dashboard/progress";

export function ProgressBlockCard({ block }: { block: ProgressBlock }) {
  return (
    <Card className="shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>{block.title}</CardTitle>
          <CardDescription className="mt-1">{block.summary}</CardDescription>
          <p className="mt-3 text-sm font-semibold">
            {block.completed}/{block.total} completed
          </p>
        </div>
        <Badge variant={block.percent >= 100 ? "primary" : "cyan"}>{block.percent}%</Badge>
      </div>
      <Progress value={block.percent} className="mt-4 h-3" variant="cyan" />
    </Card>
  );
}
