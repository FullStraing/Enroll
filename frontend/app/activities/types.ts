export type OpportunityCategory = "research" | "competition" | "volunteering" | "summer_program" | "leadership";

export type OpportunityFormat = "remote" | "in_person" | "hybrid";

export type OpportunityCost = "free" | "paid" | "mixed" | "unknown";

export type OpportunityMajorTag = "cs" | "stem" | "research" | "leadership" | "service" | "entrepreneurship";

export type OpportunityRecord = {
  id: string;
  title: string;
  provider: string;
  category: OpportunityCategory;
  format: OpportunityFormat;
  cost: OpportunityCost;
  regionLabel: string;
  locationLabel: string;
  gradeLabel: string;
  internationalAccess: "yes" | "mixed" | "unclear";
  targetMajors: OpportunityMajorTag[];
  cisFriendly: boolean;
  summary: string;
  whyUseful: string;
  officialUrl: string;
  sourceLabel: string;
};

export type ActivitiesFilters = {
  search: string;
  category: OpportunityCategory | "all";
  format: OpportunityFormat | "all";
  cost: OpportunityCost | "all";
  major: OpportunityMajorTag | "all";
  cisOnly: boolean;
  internationalOnly: boolean;
};
