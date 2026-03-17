import type { DiscoverFilters, MyUniversitiesColumnId, StudentUniversity } from "./types";

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 40];
export const PAGE_SIZE_STORAGE_KEY = "enroll_universities_page_size";
export const PAGE_UI_STATE_KEY = "enroll_universities_ui_state";
export const PAGE_SCROLL_Y_KEY = "enroll_universities_scroll_y";
export const MY_UNIVERSITIES_CACHE_KEY = "enroll_universities_my_cache_v2";
export const DISCOVER_CACHE_KEY = "enroll_universities_discover_cache";
export const ACTION_MENU_GAP = 8;
export const MY_UNIVERSITIES_VISIBLE_COLUMNS_KEY = "enroll_universities_visible_columns_v2";
export const MY_UNIVERSITIES_SORT_KEY = "enroll_universities_sort_v1";
export const MY_UNIVERSITIES_DEFAULT_COLUMNS: MyUniversitiesColumnId[] = [
  "category",
  "status",
  "acceptance",
  "tuition",
  "scholarship",
  "netCost",
  "appFee",
  "deadline",
];

export const EMPTY_FILTERS: DiscoverFilters = {
  search: "",
  chanceBand: "",
  major: "",
  state: "",
  rankingBand: "",
  acceptanceMin: "",
  acceptanceMax: "",
  tuitionMin: "",
  tuitionMax: "",
  satMin: "",
  satMax: "",
  actMin: "",
  actMax: "",
  gpaMin: "",
  gpaMax: "",
  netPriceMin: "",
  netPriceMax: "",
  housingMin: "",
  housingMax: "",
};

export const STATUS_OPTIONS: Array<{ value: StudentUniversity["status"]; label: string }> = [
  { value: "planning", label: "Planning" },
  { value: "preparing", label: "Preparing" },
  { value: "applying", label: "Applying" },
  { value: "submitted", label: "Submitted" },
  { value: "admitted", label: "Admitted" },
  { value: "rejected", label: "Rejected" },
];
