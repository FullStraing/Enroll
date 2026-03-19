import type { ActivitiesFilters, OpportunityRecord } from "@/app/activities/types";

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

export function applyActivitiesFilters(items: OpportunityRecord[], filters: ActivitiesFilters) {
  const query = normalizeText(filters.search);

  return items.filter((item) => {
    if (
      query &&
      ![
        item.title,
        item.provider,
        item.summary,
        item.whyUseful,
        item.regionLabel,
        item.locationLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (filters.category !== "all" && item.category !== filters.category) return false;
    if (filters.format !== "all" && item.format !== filters.format) return false;
    if (filters.cost !== "all" && item.cost !== filters.cost) return false;
    if (filters.major !== "all" && !item.targetMajors.includes(filters.major)) return false;
    if (filters.cisOnly && !item.cisFriendly) return false;
    if (filters.internationalOnly && item.internationalAccess === "unclear") return false;

    return true;
  });
}

export function countUsefulForCis(items: OpportunityRecord[]) {
  return items.filter((item) => item.cisFriendly).length;
}
