import Link from "next/link";
import { ArrowUpRight, Globe, MapPin, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CATEGORY_LABELS, COST_LABELS, FORMAT_LABELS, MAJOR_LABELS } from "@/app/activities/constants";
import type { OpportunityRecord } from "@/app/activities/types";

type Props = {
  item: OpportunityRecord;
};

function toneClass(item: OpportunityRecord) {
  if (item.category === "competition") return "bg-[#FFF4CC]";
  if (item.category === "research") return "bg-[#DAF5F0]";
  if (item.category === "volunteering") return "bg-[#F5F8FC]";
  if (item.category === "leadership") return "bg-[#F8D6B3]";
  return "bg-white";
}

export function OpportunityCard({ item }: Props) {
  return (
    <Card className="shadow-none">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border border-black/12 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black/70 ${toneClass(item)}`}>
              {CATEGORY_LABELS[item.category]}
            </span>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/65">{FORMAT_LABELS[item.format]}</span>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/65">{COST_LABELS[item.cost]}</span>
            {item.cisFriendly ? (
              <span className="rounded-full border border-black/10 bg-[#DAF5F0] px-3 py-1 text-xs font-semibold text-black/70">CA/CIS fit</span>
            ) : null}
          </div>

          <h3 className="mt-3 text-xl font-black text-black">{item.title}</h3>
          <p className="mt-1 text-sm font-semibold text-black/60">{item.provider}</p>
          <p className="mt-3 max-w-3xl text-sm text-black/75">{item.summary}</p>
        </div>

        <div className="md:pl-4">
          <Link href={item.officialUrl} target="_blank" rel="noreferrer" className="inline-flex">
            <Button className="gap-2 whitespace-nowrap">
              Official page
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Why it matters</p>
          <p className="mt-2 text-sm text-black/75">{item.whyUseful}</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
            <MapPin className="h-3.5 w-3.5" />
            Fit
          </div>
          <p className="mt-2 text-sm font-semibold text-black">{item.locationLabel}</p>
          <p className="mt-1 text-sm text-black/65">{item.regionLabel}</p>
          <p className="mt-1 text-sm text-black/65">{item.gradeLabel}</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
            <Globe className="h-3.5 w-3.5" />
            Access
          </div>
          <p className="mt-2 text-sm font-semibold text-black">
            {item.internationalAccess === "yes" ? "International-friendly" : item.internationalAccess === "mixed" ? "Check eligibility" : "N/A"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.targetMajors.map((tag) => (
              <span key={tag} className="rounded-full border border-black/10 bg-[#F5F8FC] px-3 py-1 text-xs font-semibold text-black/70">
                {MAJOR_LABELS[tag]}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-black/55">
            <Wallet className="h-3.5 w-3.5" />
            {item.sourceLabel}
          </div>
        </div>
      </div>
    </Card>
  );
}
