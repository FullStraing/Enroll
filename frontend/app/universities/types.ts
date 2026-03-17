export type University = {
  id: number;
  name: string;
  country?: string;
  city?: string;
  state?: string;
  selectivity?: "high" | "medium" | "low" | string;
  main_deadline?: string | null;
  acceptance_rate?: number | null;
  sat_range?: string | null;
  tuition_out_state?: number | null;
  net_price?: number | null;
  aid_package?: number | null;
  application_fee?: number | null;
};

export type ChanceBand = "" | "safety" | "likely" | "target" | "reach" | "high_reach";

export type StudentUniversity = {
  id: number;
  sort_order: number;
  category: "reach" | "target" | "safety";
  status: "planning" | "preparing" | "applying" | "submitted" | "admitted" | "rejected";
  university: University;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type DiscoverFilters = {
  search: string;
  chanceBand: ChanceBand;
  major: string;
  state: string;
  rankingBand: "" | "high" | "medium" | "low";
  acceptanceMin: string;
  acceptanceMax: string;
  tuitionMin: string;
  tuitionMax: string;
  satMin: string;
  satMax: string;
  actMin: string;
  actMax: string;
  gpaMin: string;
  gpaMax: string;
  netPriceMin: string;
  netPriceMax: string;
  housingMin: string;
  housingMax: string;
};

export type MyUniversitiesColumnId =
  | "category"
  | "status"
  | "acceptance"
  | "sat"
  | "tuition"
  | "scholarship"
  | "netCost"
  | "appFee"
  | "deadline";

export type MyUniversitiesSortId =
  | "university"
  | "category"
  | "status"
  | "acceptance"
  | "sat"
  | "tuition"
  | "scholarship"
  | "netCost"
  | "appFee"
  | "deadline";

export type ActionMenuState = {
  itemId: number;
  anchorRect: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};
