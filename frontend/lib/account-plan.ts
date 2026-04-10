export type AccountPlanSummary = {
  code?: string;
  name?: string;
  source?: string;
  is_public?: boolean;
  is_invite_only?: boolean;
};

export type UniversitiesEntitlementSummary = {
  max_count?: number;
  used?: number;
  remaining?: number;
  can_create?: boolean;
};

export type EssaysEntitlementSummary = {
  max_count?: number;
  used?: number;
  remaining?: number;
  can_create?: boolean;
};

export type EssayVersionsEntitlementSummary = {
  max_per_essay?: number;
};

export type AiRequestsEntitlementSummary = {
  monthly_limit?: number;
  used_this_month?: number;
  remaining_this_month?: number;
  period_start?: string;
  period_end?: string;
};

export type AccountEntitlementsSummary = {
  universities?: UniversitiesEntitlementSummary;
  essays?: EssaysEntitlementSummary;
  essay_versions?: EssayVersionsEntitlementSummary;
  ai_requests?: AiRequestsEntitlementSummary;
};

export type AccountScopedProfile = {
  account_plan?: AccountPlanSummary;
  entitlements?: AccountEntitlementsSummary;
};

export function formatPlanLabel(plan?: AccountPlanSummary | null) {
  if (!plan?.code) return "N/A";
  if (plan.name?.trim()) return plan.name.trim();
  const code = plan.code.trim().toLowerCase();
  if (!code) return "N/A";
  return code.charAt(0).toUpperCase() + code.slice(1);
}

export function getUniversityUsage(profile?: AccountScopedProfile | null) {
  const summary = profile?.entitlements?.universities;
  return {
    maxCount: summary?.max_count ?? 0,
    used: summary?.used ?? 0,
    remaining: summary?.remaining ?? 0,
    canCreate: Boolean(summary?.can_create),
  };
}

export function hasReachedUniversityLimit(profile?: AccountScopedProfile | null) {
  const usage = getUniversityUsage(profile);
  return usage.maxCount > 0 && !usage.canCreate;
}

export function getAiUsage(profile?: AccountScopedProfile | null) {
  const summary = profile?.entitlements?.ai_requests;
  return {
    monthlyLimit: summary?.monthly_limit ?? 0,
    usedThisMonth: summary?.used_this_month ?? 0,
    remainingThisMonth: summary?.remaining_this_month ?? 0,
  };
}
